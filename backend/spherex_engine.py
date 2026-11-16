"""
SPHEREx Engine - Core Computational Astrophysics Engine
NASA Space Apps Challenge 2026: Planet X and SPHEREx
Simulates multi-epoch time-domain spectrophotometric observations across 102 bands (0.75 - 5.00 µm)
"""

import numpy as np
import io
import base64
import hashlib
from PIL import Image
from scipy.ndimage import maximum_filter, minimum_filter

# ---------------------------------------------------------------------------
# 5 Official NASA Challenge Targets
# ---------------------------------------------------------------------------
NASA_TARGETS = [
    {
        "name": "WISE 0855-0714",
        "short_name": "WISE 0855",
        "ra": 133.79513,
        "dec": -7.24515,
        "type": "Sub-Brown Dwarf",
        "spectral_type": "Y1",
        "description": "Planetary-mass object ~7.3 ly away. Extreme high proper motion (~8.1 arcsec/yr). Strong CH4/H2O absorption at 3.3-5.0 µm. Invisible in optical bands.",
        "proper_motion_ra": -8.1,
        "proper_motion_dec": 0.7,
        "distance_ly": 7.3,
        "color": "#38BDF8",
        "variable": False,
        "optical_faint": True,
    },
    {
        "name": "Barnard's Star",
        "short_name": "Barnard's",
        "ra": 269.45208,
        "dec": 4.69339,
        "type": "Red Dwarf (M4Ve)",
        "spectral_type": "M4Ve",
        "description": "Highest known proper motion star (~10.3 arcsec/yr). Clear northward positional shift across epochs.",
        "proper_motion_ra": -0.8,
        "proper_motion_dec": 10.3,
        "distance_ly": 5.96,
        "color": "#EF4444",
        "variable": False,
        "optical_faint": False,
    },
    {
        "name": "Epsilon Indi B",
        "short_name": "ε Indi B",
        "ra": 331.04375,
        "dec": -56.78278,
        "type": "Binary Brown Dwarf (T1+T6)",
        "spectral_type": "T1+T6",
        "description": "Binary T-dwarf system ~12 ly away. Clear proper motion and distinct T-dwarf near-IR spectral peaks at 1.05, 1.25, 1.6, and 2.1 µm.",
        "proper_motion_ra": 3.96,
        "proper_motion_dec": -2.54,
        "distance_ly": 11.9,
        "color": "#F97316",
        "variable": False,
        "optical_faint": False,
    },
    {
        "name": "RW Aurigae",
        "short_name": "RW Aur",
        "ra": 76.95625,
        "dec": 30.40139,
        "type": "T Tauri Variable",
        "spectral_type": "K1Ve",
        "description": "Young variable star with circumstellar disk. Position stays fixed, but flux drops/flares significantly between epochs.",
        "proper_motion_ra": 0.0,
        "proper_motion_dec": 0.0,
        "distance_ly": 530.0,
        "color": "#FBBF24",
        "variable": True,
        "variable_factor": 0.35,  # Flux dims dramatically in Epoch 2
        "optical_faint": False,
    },
    {
        "name": "R Draconis",
        "short_name": "R Dra",
        "ra": 248.17042,
        "dec": 66.75639,
        "type": "Mira Variable (Red Giant)",
        "spectral_type": "M6IIIe",
        "description": "Mira-type pulsating red giant variable. Dramatic infrared brightness variation over 6-month SPHEREx cadence.",
        "proper_motion_ra": 0.0,
        "proper_motion_dec": 0.0,
        "distance_ly": 2100.0,
        "color": "#A855F7",
        "variable": True,
        "variable_factor": 3.2,  # Major brightening in Epoch 2
        "optical_faint": False,
    },
]

# SPHEREx 6 spectrophotometer bands (0.75 - 5.0 µm)
SPHEREX_DETECTORS = [
    {"name": "Band 1", "min_wl": 0.75, "max_wl": 1.11, "channels": (1, 17), "color": "#3B82F6"},
    {"name": "Band 2", "min_wl": 1.11, "max_wl": 1.64, "channels": (18, 34), "color": "#8B5CF6"},
    {"name": "Band 3", "min_wl": 1.64, "max_wl": 2.42, "channels": (35, 51), "color": "#10B981"},
    {"name": "Band 4", "min_wl": 2.42, "max_wl": 3.82, "channels": (52, 68), "color": "#F59E0B"},
    {"name": "Band 5", "min_wl": 3.82, "max_wl": 4.42, "channels": (69, 85), "color": "#EF4444"},
    {"name": "Band 6", "min_wl": 4.42, "max_wl": 5.00, "channels": (86, 102), "color": "#EC4899"},
]


def band_to_wavelength(band_idx: int) -> float:
    """Convert SPHEREx band index (1 to 102) to wavelength in microns."""
    return 0.75 + (band_idx - 1) * (5.0 - 0.75) / 101.0


def make_gaussian_psf(size: int, center_x: float, center_y: float, sigma: float = 2.2, amplitude: float = 100.0) -> np.ndarray:
    """Generate a 2D Gaussian point-spread function."""
    y, x = np.ogrid[:size, :size]
    dist_sq = (x - center_x) ** 2 + (y - center_y) ** 2
    psf = amplitude * np.exp(-0.5 * dist_sq / (sigma ** 2))
    return psf


def generate_star_field(ra: float, dec: float, fov_arcmin: float, band: int, epoch: int = 1, size: int = 256, target: dict = None) -> np.ndarray:
    """
    Generate a realistic WCS-aligned star field for SPHEREx observations.
    Static background stars remain invariant across epochs.
    Targets exhibit realistic proper motion shifts or temporal flux variability.
    """
    # Deterministic seed based on celestial coordinates
    coord_key = f"{round(ra, 4)}_{round(dec, 4)}"
    seed = int(hashlib.md5(coord_key.encode()).hexdigest()[:8], 16)
    rng = np.random.default_rng(seed)

    # Base background noise: zodiacal light + detector dark current/read noise
    # SPHEREx noise model: thermal background increases at > 3 µm (Band 4, 5, 6)
    wavelength = band_to_wavelength(band)
    zodi_bg = 12.0 + 8.0 * (wavelength / 5.0) ** 2
    read_noise_std = 2.8

    data = rng.normal(zodi_bg, read_noise_std, (size, size))
    data = np.clip(data, 0.0, None)

    # Generate 18-26 consistent static background stars
    n_bg_stars = rng.integers(18, 27)
    for _ in range(n_bg_stars):
        star_x = rng.uniform(8, size - 8)
        star_y = rng.uniform(8, size - 8)
        star_fwhm = rng.uniform(1.8, 3.0)
        star_sigma = star_fwhm / 2.355

        # Background star spectral temperature (3000K to 8000K)
        t_eff = rng.uniform(3000, 8000)
        # Approximate blackbody wavelength dependence
        bb_factor = (1.0 / (wavelength ** 5)) / (np.exp(14387.7 / (wavelength * t_eff)) - 1.0 + 1e-10)
        amp = rng.uniform(40.0, 320.0) * (0.8 + 0.4 * rng.random())

        # Render static star
        psf = make_gaussian_psf(size, star_x, star_y, star_sigma, amp)
        data += psf

    # Find target if not provided
    if target is None:
        for t in NASA_TARGETS:
            if abs(t["ra"] - ra) < 0.01 and abs(t["dec"] - dec) < 0.01:
                target = t
                break

    # If target is present, render target at center with multi-epoch physical characteristics
    if target is not None:
        center_x = size / 2.0
        center_y = size / 2.0

        # Proper motion: baseline between SPHEREx DR1 (Epoch 1) and QR3 (Epoch 2) is ~0.5 year (6 months)
        dt_years = 0.5 if epoch == 2 else 0.0
        pm_ra = target.get("proper_motion_ra", 0.0)
        pm_dec = target.get("proper_motion_dec", 0.0)

        # Shift in arcseconds
        shift_ra_arcsec = pm_ra * dt_years
        shift_dec_arcsec = pm_dec * dt_years

        # Conversion: fov_arcmin * 60 / size = arcsec per pixel
        arcsec_per_pixel = (fov_arcmin * 60.0) / float(size)
        
        # RA increases leftwards in standard astronomical WCS (-x)
        target_x = center_x - (shift_ra_arcsec / arcsec_per_pixel)
        # Dec increases upwards (+y, inverted for array coordinates where row 0 is top)
        target_y = center_y - (shift_dec_arcsec / arcsec_per_pixel)

        # Target spectral flux calculation for current band
        target_name = target.get("name", "")
        if "0855" in target_name:
            # Cold Sub-Brown Dwarf (250 K)
            # Virtually invisible in Band 1-2 (0.75 - 1.6 µm), faint in Band 3, bright in 4.5-5.0 µm
            if wavelength < 2.0:
                target_amp = 4.0 * (wavelength / 2.0) ** 3
            elif wavelength < 3.2:
                target_amp = 18.0 + 10.0 * np.sin(wavelength * 3.0)
            elif 3.2 <= wavelength <= 3.6:
                # Strong CH4 absorption depression
                target_amp = 6.0
            else:
                # 4.0 - 5.0 µm atmospheric window (WISE W2 peak)
                target_amp = 180.0 * (1.0 - 0.25 * np.abs(wavelength - 4.6))
        elif "Barnard" in target_name:
            # M4Ve Red Dwarf - very bright optical & near-IR, peaks around 1.1 - 1.4 µm
            target_amp = 450.0 * (1.2 / wavelength) ** 0.8
        elif "Indi" in target_name:
            # T-dwarf binary - characteristic methane and water absorption peaks at 1.05, 1.25, 1.6, 2.1 µm
            near_peaks = [1.05, 1.25, 1.6, 2.1]
            dist_to_peak = min(abs(wavelength - p) for p in near_peaks)
            if dist_to_peak < 0.15:
                target_amp = 260.0 * (1.0 - dist_to_peak / 0.15)
            elif 3.0 <= wavelength <= 3.5:
                target_amp = 25.0  # Methane trough
            else:
                target_amp = 75.0
        elif "RW Aur" in target_name:
            # T Tauri variable - base amplitude ~350, drops to 35% in epoch 2
            base_amp = 360.0 / (wavelength ** 0.5)
            factor = target.get("variable_factor", 0.35) if epoch == 2 else 1.0
            target_amp = base_amp * factor
        elif "R Dra" in target_name:
            # Mira pulsating red giant variable - massive IR flux, flares in epoch 2
            base_amp = 500.0 * (wavelength / 2.5) ** 1.2
            factor = target.get("variable_factor", 3.2) if epoch == 2 else 1.0
            target_amp = base_amp * factor
        else:
            target_amp = 200.0

        target_psf = make_gaussian_psf(size, target_x, target_y, sigma=2.2, amplitude=target_amp)
        data += target_psf

    # Add realistic Poisson photon noise
    data = np.random.poisson(np.clip(data, 0, None)).astype(np.float64)
    return data


def compute_difference(field1: np.ndarray, field2: np.ndarray) -> np.ndarray:
    """
    Compute WCS-aligned difference image: Epoch 2 - Epoch 1.
    Static stars cancel to near-zero.
    Moving objects create positive/negative dipole pairs.
    Variable stars create monopoles.
    """
    return field2.astype(np.float64) - field1.astype(np.float64)


def compute_coadd(field1: np.ndarray, field2: np.ndarray) -> np.ndarray:
    """
    Multi-detector / multi-epoch co-addition.
    Increases SNR of faint objects by ~sqrt(2) over single-epoch exposures.
    """
    return (field1.astype(np.float64) + field2.astype(np.float64)) / 2.0


def detect_anomalies(diff_image: np.ndarray, fov_arcmin: float = 5.0, sigma_threshold: float = 3.2) -> list:
    """
    Automated Time-Domain Anomaly / Dipole Finder.
    Identifies statistically significant residuals (|E2 - E1| > 3.2σ).
    Classifies detections into Dipoles (moving targets / Planet X) or Monopoles (variable stars).
    """
    mean = np.mean(diff_image)
    std = np.std(diff_image)
    if std < 1e-6:
        return []

    # Significant positive (Epoch 2 excess) and negative (Epoch 1 excess) pixels
    z_score = (diff_image - mean) / std

    anomalies = []
    h, w = diff_image.shape

    # Find local extreme peaks
    pos_mask = z_score > sigma_threshold
    neg_mask = z_score < -sigma_threshold

    # Positive peaks (Epoch 2 position or brightening variable)
    if np.any(pos_mask):
        pos_max = maximum_filter(diff_image, size=7) == diff_image
        pos_peaks = np.argwhere(pos_mask & pos_max)
        for py, px in pos_peaks:
            sig = float(z_score[py, px])
            anomalies.append({
                "x": int(px),
                "y": int(py),
                "significance": round(sig, 2),
                "polarity": "positive",
                "type": "candidate",
            })

    # Negative peaks (Epoch 1 position or fading variable)
    if np.any(neg_mask):
        neg_min = minimum_filter(diff_image, size=7) == diff_image
        neg_peaks = np.argwhere(neg_mask & neg_min)
        for py, px in neg_peaks:
            sig = float(abs(z_score[py, px]))
            anomalies.append({
                "x": int(px),
                "y": int(py),
                "significance": round(sig, 2),
                "polarity": "negative",
                "type": "candidate",
            })

    # Classify pairs within 25 pixels as DIPOLE (proper motion signature)
    # Monopoles remain isolated (variable star signature)
    classified = []
    used_indices = set()

    arcsec_per_pixel = (fov_arcmin * 60.0) / float(w)
    max_motion_arcsec = 12.0
    max_dist_px = max(8.0, max_motion_arcsec / arcsec_per_pixel)

    for i in range(len(anomalies)):
        if i in used_indices:
            continue
        a1 = anomalies[i]
        matched_dipole = False
        for j in range(i + 1, len(anomalies)):
            if j in used_indices:
                continue
            a2 = anomalies[j]
            # Opposite polarity within spatial window
            if a1["polarity"] != a2["polarity"]:
                dist = np.hypot(a1["x"] - a2["x"], a1["y"] - a2["y"])
                if dist <= max_dist_px:
                    a1["type"] = "dipole"
                    a2["type"] = "dipole"
                    a1["paired_with"] = {"x": a2["x"], "y": a2["y"]}
                    a2["paired_with"] = {"x": a1["x"], "y": a1["y"]}
                    used_indices.add(i)
                    used_indices.add(j)
                    classified.extend([a1, a2])
                    matched_dipole = True
                    break
        if not matched_dipole and i not in used_indices:
            a1["type"] = "monopole"
            classified.append(a1)
            used_indices.add(i)

    # Sort by significance descending
    classified.sort(key=lambda item: item["significance"], reverse=True)
    return classified[:10]


def generate_spectrum(ra: float, dec: float, epoch: int = 1, target: dict = None) -> dict:
    """
    Real-time 102-band Near-Infrared (0.75 - 5.0 µm) spectral extraction.
    Computes flux, photometric errors, and SPHEREx quality/contamination bitmasks.
    """
    if target is None:
        for t in NASA_TARGETS:
            if abs(t["ra"] - ra) < 0.01 and abs(t["dec"] - dec) < 0.01:
                target = t
                break

    wavelengths = np.linspace(0.75, 5.00, 102)
    target_name = target.get("name", "") if target else ""

    rng = np.random.default_rng(int(abs(ra * 1000 + dec * 100)) % 100000)

    # Base spectrum model (flux in MJy/sr)
    if "0855" in target_name:
        # WISE 0855: Cold planetary-mass brown dwarf (~250 K)
        # Deep CH4 absorption at 3.3 µm, H2O at 1.4 & 1.9 µm, 4.5 µm emission peak
        flux = 0.02 * np.exp((wavelengths - 0.75) * 1.5)
        # Absorption bands
        ch4_dip = 0.85 * np.exp(-0.5 * ((wavelengths - 3.3) / 0.18) ** 2)
        h2o_14 = 0.7 * np.exp(-0.5 * ((wavelengths - 1.4) / 0.12) ** 2)
        h2o_19 = 0.7 * np.exp(-0.5 * ((wavelengths - 1.9) / 0.14) ** 2)
        flux = flux * (1.0 - ch4_dip) * (1.0 - h2o_14) * (1.0 - h2o_19)
        # 4.5 - 5.0 µm thermal window peak
        w2_peak = 1.85 * np.exp(-0.5 * ((wavelengths - 4.65) / 0.28) ** 2)
        flux = flux + w2_peak
        # Slight epoch variation (rotational modulation ~3%)
        if epoch == 2:
            flux *= 1.03

    elif "Barnard" in target_name:
        # M4Ve Red Dwarf: Peak at 1.05 - 1.25 µm, TiO & VO absorption
        flux = 14.5 * (1.15 / wavelengths) ** 1.4
        tio_band = 0.22 * np.exp(-0.5 * ((wavelengths - 0.88) / 0.06) ** 2)
        co_band = 0.18 * np.exp(-0.5 * ((wavelengths - 2.3) / 0.15) ** 2)
        flux = flux * (1.0 - tio_band) * (1.0 - co_band)

    elif "Indi" in target_name:
        # Epsilon Indi B: T-Dwarf Binary
        # Distinct peaks at 1.05, 1.25, 1.6, 2.1 µm with deep methane/water valleys
        flux = np.zeros_like(wavelengths)
        peaks = [(1.05, 3.2, 0.08), (1.25, 5.1, 0.09), (1.60, 4.8, 0.11), (2.10, 3.6, 0.13), (4.7, 2.2, 0.25)]
        for center, height, width in peaks:
            flux += height * np.exp(-0.5 * ((wavelengths - center) / width) ** 2)
        flux = np.clip(flux, 0.15, None)

    elif "RW Aur" in target_name:
        # RW Aurigae: T Tauri variable star
        base_flux = 8.5 * (wavelengths / 1.5) ** (-0.6) + 1.2 * np.sin(wavelengths * 4.0)
        # Epoch 2 dust occultation event dims flux by 65%
        flux = base_flux * (0.35 if epoch == 2 else 1.0)

    elif "R Dra" in target_name:
        # R Draconis: Mira Pulsating Variable Red Giant
        base_flux = 22.0 * (wavelengths / 2.0) ** 1.1 + 4.0 * np.cos(wavelengths * 2.5)
        # 6-month cadence captures massive pulsation amplitude swing
        flux = base_flux * (3.1 if epoch == 2 else 1.0)

    else:
        # Generic background star: 5200K Planckian curve
        flux = 5.0 * (1.2 / wavelengths) ** 1.2

    # Photometric error (~3-6% depending on SNR)
    error = np.clip(0.04 * flux + 0.02 * rng.normal(0, 1, 102), 0.01, None)
    flux = np.clip(flux + rng.normal(0, error, 102), 0.005, None)

    # Realistic SPHEREx contamination bitmask flags
    flags = []
    for i, w in enumerate(wavelengths):
        r = rng.random()
        if r < 0.02:
            flags.append("DIFFRACTION_SPIKE")
        elif r < 0.035:
            flags.append("COSMIC_RAY")
        elif r < 0.065:
            flags.append("SOURCE_CONFUSION")
        elif "R Dra" in target_name and epoch == 2 and w > 4.2 and r < 0.15:
            flags.append("SATURATED")
        else:
            flags.append("CLEAN")

    return {
        "wavelengths": wavelengths.tolist(),
        "flux": flux.tolist(),
        "error": error.tolist(),
        "flags": flags,
    }


def array_to_base64_png(array: np.ndarray, diverging: bool = False) -> str:
    """
    Render 2D numpy matrix to high-contrast astronomical PNG and encode to base64.
    Supports single-epoch infrared colormap and diverging dipole colormap for differences.
    """
    h, w = array.shape

    if diverging:
        # Diverging colormap for difference imaging:
        # Epoch 1 position (negative residual) -> Bright Cyan (#38BDF8)
        # Neutral zero background -> Space dark slate (#0B0F19 / #1E293B)
        # Epoch 2 position (positive residual) -> Bright Pink/Magenta (#EC4899)
        max_abs = np.percentile(np.abs(array), 99.5)
        if max_abs < 1e-4:
            max_abs = 1.0

        norm = np.clip(array / max_abs, -1.0, 1.0)

        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        # Dark space background base: RGB(11, 15, 25)
        rgb[:, :, 0] = 11
        rgb[:, :, 1] = 15
        rgb[:, :, 2] = 25

        # Negative mask (Epoch 1 target position): Cyan gradient
        neg_mask = norm < 0
        neg_val = -norm[neg_mask]
        rgb[neg_mask, 0] = (11 + neg_val * (56 - 11)).astype(np.uint8)
        rgb[neg_mask, 1] = (15 + neg_val * (189 - 15)).astype(np.uint8)
        rgb[neg_mask, 2] = (25 + neg_val * (248 - 25)).astype(np.uint8)

        # Positive mask (Epoch 2 target position): Magenta/Rose gradient
        pos_mask = norm > 0
        pos_val = norm[pos_mask]
        rgb[pos_mask, 0] = (11 + pos_val * (236 - 11)).astype(np.uint8)
        rgb[pos_mask, 1] = (15 + pos_val * (72 - 15)).astype(np.uint8)
        rgb[pos_mask, 2] = (25 + pos_val * (153 - 25)).astype(np.uint8)

    else:
        # Astronomical Infrared Colormap (Deep Space Blue -> Purple -> Orange -> Bright Yellow)
        p_min = np.percentile(array, 1.0)
        p_max = np.percentile(array, 99.5)
        if p_max <= p_min:
            p_max = p_min + 1.0

        norm = np.clip((array - p_min) / (p_max - p_min), 0.0, 1.0)

        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        # High dynamic range infrared colormap
        rgb[:, :, 0] = (np.clip(2.0 * norm - 0.2, 0, 1) * 255).astype(np.uint8)
        rgb[:, :, 1] = (np.clip(1.8 * (norm ** 2), 0, 1) * 230).astype(np.uint8)
        rgb[:, :, 2] = (np.clip(np.sin(norm * np.pi) * 0.8 + norm * 0.4, 0, 1) * 255).astype(np.uint8)

    img = Image.fromarray(rgb, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"


def get_wcs(ra: float, dec: float, fov_arcmin: float, size: int) -> dict:
    """Generate World Coordinate System (WCS) metadata header."""
    pixel_scale_deg = (fov_arcmin / 60.0) / float(size)
    return {
        "CRPIX1": (size + 1) / 2.0,
        "CRPIX2": (size + 1) / 2.0,
        "CRVAL1": float(ra),
        "CRVAL2": float(dec),
        "CDELT1": -pixel_scale_deg,
        "CDELT2": pixel_scale_deg,
        "CTYPE1": "RA---TAN",
        "CTYPE2": "DEC--TAN",
        "FOV_ARCMIN": float(fov_arcmin),
        "PIXEL_SCALE_ARCSEC": round(pixel_scale_deg * 3600.0, 3),
    }
