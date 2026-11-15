from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
from spherex_engine import (
    generate_star_field, compute_difference, compute_coadd,
    detect_anomalies, generate_spectrum, array_to_base64_png, get_wcs,
    NASA_TARGETS
)

app = FastAPI(title="SPHEREx Time-Domain Sky Explorer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# IRSA availability flag
irsa_available = False
try:
    from astroquery.ipac.irsa import Irsa
    import astropy.units as u
    from astropy.coordinates import SkyCoord
    irsa_available = True
except ImportError:
    pass


# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok", "irsa_available": irsa_available}


# ---------------------------------------------------------------------------
# 2. Targets list
# ---------------------------------------------------------------------------
@app.get("/api/targets")
async def targets():
    result = []
    for t in NASA_TARGETS:
        pm_ra = t.get("proper_motion_ra", 0.0)
        pm_dec = t.get("proper_motion_dec", 0.0)
        proper_motion_arcsec_yr = float(np.sqrt(pm_ra ** 2 + pm_dec ** 2))
        result.append({
            "name": t["name"],
            "ra": t["ra"],
            "dec": t["dec"],
            "type": t["type"],
            "description": t["description"],
            "proper_motion_arcsec_yr": round(proper_motion_arcsec_yr, 4),
            "spectral_type": t.get("spectral_type", ""),
        })
    return result


# ---------------------------------------------------------------------------
# 3. Cutout image
# ---------------------------------------------------------------------------
@app.get("/api/cutout")
async def cutout(
    ra: float = Query(..., description="Right ascension in degrees"),
    dec: float = Query(..., description="Declination in degrees"),
    fov: float = Query(5.0, description="Field of view in arcminutes"),
    epoch: str = Query("1", description="Epoch: 1, 2, coadd, or diff"),
    band: int = Query(50, ge=1, le=102, description="Band index 1-102"),
    stretch: str = Query("linear", description="Stretch: linear, log, or asinh"),
):
    size = 256  # pixel size of the generated image

    # Find matching target for proper‑motion / variability metadata
    target = None
    for t in NASA_TARGETS:
        if abs(t["ra"] - ra) < 0.01 and abs(t["dec"] - dec) < 0.01:
            target = t
            break

    # ------------------------------------------------------------------
    # Generate the requested data
    # ------------------------------------------------------------------
    if epoch == "coadd":
        field1 = generate_star_field(ra, dec, fov, band, epoch=1, size=size, target=target)
        field2 = generate_star_field(ra, dec, fov, band, epoch=2, size=size, target=target)
        data = compute_coadd(field1, field2)
    elif epoch == "diff":
        field1 = generate_star_field(ra, dec, fov, band, epoch=1, size=size, target=target)
        field2 = generate_star_field(ra, dec, fov, band, epoch=2, size=size, target=target)
        data = compute_difference(field1, field2)
    else:
        epoch_int = int(epoch) if epoch in ("1", "2") else 1
        data = generate_star_field(ra, dec, fov, band, epoch=epoch_int, size=size, target=target)

    # ------------------------------------------------------------------
    # Anomaly detection (always run on difference frame)
    # ------------------------------------------------------------------
    if epoch == "diff":
        anomalies_raw = detect_anomalies(data)
    else:
        diff_field = compute_difference(
            generate_star_field(ra, dec, fov, band, epoch=1, size=size, target=target),
            generate_star_field(ra, dec, fov, band, epoch=2, size=size, target=target),
        )
        anomalies_raw = detect_anomalies(diff_field)

    anomalies = [
        {"x": int(a["x"]), "y": int(a["y"]), "significance": round(float(a["significance"]), 2)}
        for a in anomalies_raw
    ]

    # ------------------------------------------------------------------
    # Apply stretch
    # ------------------------------------------------------------------
    display = data.copy().astype(np.float64)
    if stretch == "log":
        display = np.log1p(np.clip(display, 0, None))
    elif stretch == "asinh":
        display = np.arcsinh(display)

    # ------------------------------------------------------------------
    # Encode to PNG
    # ------------------------------------------------------------------
    use_diverging = epoch == "diff"
    image_b64 = array_to_base64_png(display, diverging=use_diverging)

    # ------------------------------------------------------------------
    # WCS and stats
    # ------------------------------------------------------------------
    wcs = get_wcs(ra, dec, fov, size)

    stats = {
        "min": round(float(np.nanmin(data)), 4),
        "max": round(float(np.nanmax(data)), 4),
        "mean": round(float(np.nanmean(data)), 4),
        "std": round(float(np.nanstd(data)), 4),
    }

    return {
        "image": image_b64,
        "wcs": wcs,
        "width": size,
        "height": size,
        "stats": stats,
        "anomalies": anomalies,
    }


# ---------------------------------------------------------------------------
# 4. Spectrum
# ---------------------------------------------------------------------------
@app.get("/api/spectrum")
async def spectrum(
    ra: float = Query(..., description="Right ascension in degrees"),
    dec: float = Query(..., description="Declination in degrees"),
    epoch: str = Query("both", description="Epoch: 1, 2, or both"),
):
    # Find matching target
    target = None
    for t in NASA_TARGETS:
        if abs(t["ra"] - ra) < 0.01 and abs(t["dec"] - dec) < 0.01:
            target = t
            break

    # Generate spectra
    spec1 = generate_spectrum(ra, dec, epoch=1, target=target)
    spec2 = generate_spectrum(ra, dec, epoch=2, target=target)

    wavelengths = spec1["wavelengths"]
    band_ids = list(range(1, len(wavelengths) + 1))

    # Detector band definitions (SPHEREx-like)
    detector_bands = [
        {"name": "NIR-Short", "start_idx": 0, "end_idx": 19, "color": "#4fc3f7"},
        {"name": "NIR-Mid",   "start_idx": 20, "end_idx": 39, "color": "#81c784"},
        {"name": "NIR-Long",  "start_idx": 40, "end_idx": 59, "color": "#fff176"},
        {"name": "SWIR-1",    "start_idx": 60, "end_idx": 79, "color": "#ffb74d"},
        {"name": "SWIR-2",    "start_idx": 80, "end_idx": 101, "color": "#e57373"},
    ]

    result = {
        "wavelengths": [round(float(w), 6) for w in wavelengths],
        "band_ids": band_ids,
        "detector_bands": detector_bands,
        "flags": spec1["flags"],
    }

    if epoch == "1":
        result["flux_epoch1"] = [round(float(f), 6) for f in spec1["flux"]]
        result["flux_error1"] = [round(float(e), 6) for e in spec1["error"]]
        result["flux_epoch2"] = []
        result["flux_error2"] = []
    elif epoch == "2":
        result["flux_epoch1"] = []
        result["flux_error1"] = []
        result["flux_epoch2"] = [round(float(f), 6) for f in spec2["flux"]]
        result["flux_error2"] = [round(float(e), 6) for e in spec2["error"]]
    else:  # both
        result["flux_epoch1"] = [round(float(f), 6) for f in spec1["flux"]]
        result["flux_error1"] = [round(float(e), 6) for e in spec1["error"]]
        result["flux_epoch2"] = [round(float(f), 6) for f in spec2["flux"]]
        result["flux_error2"] = [round(float(e), 6) for e in spec2["error"]]

    return result


# ---------------------------------------------------------------------------
# 5. IRSA catalog query
# ---------------------------------------------------------------------------
@app.get("/api/irsa_query")
async def irsa_query(
    ra: float = Query(..., description="Right ascension in degrees"),
    dec: float = Query(..., description="Declination in degrees"),
    radius: float = Query(5.0, description="Search radius in arcminutes"),
    catalog: str = Query("allwise", description="Catalog name"),
):
    # Try real IRSA query first
    if irsa_available:
        try:
            coord = SkyCoord(ra=ra, dec=dec, unit="deg", frame="icrs")
            table = Irsa.query_region(
                coord,
                catalog=catalog,
                spatial="Cone",
                radius=radius * u.arcmin,
            )
            sources = []
            for row in table:
                source = {}
                for col in table.colnames:
                    val = row[col]
                    if hasattr(val, "item"):
                        val = val.item()
                    source[col] = val
                # Ensure standard fields
                source.setdefault("ra", ra)
                source.setdefault("dec", dec)
                sources.append(source)
            return {"sources": sources, "catalog": catalog, "count": len(sources)}
        except Exception:
            pass  # fall through to synthetic data

    # Synthetic fallback
    rng = np.random.default_rng(seed=int(abs(ra * 1000 + dec * 100)) % (2**31))
    n_sources = rng.integers(5, 11)
    sources = []
    for i in range(n_sources):
        offset_ra = (rng.random() - 0.5) * 2 * (radius / 60.0)
        offset_dec = (rng.random() - 0.5) * 2 * (radius / 60.0)
        s_ra = ra + offset_ra / np.cos(np.radians(dec))
        s_dec = dec + offset_dec
        w1_mag = round(float(rng.uniform(8, 16)), 2)
        w2_mag = round(float(w1_mag + rng.uniform(-0.5, 0.5)), 2)
        sources.append({
            "ra": round(float(s_ra), 6),
            "dec": round(float(s_dec), 6),
            "name": f"{catalog.upper()}-J{int(s_ra*100):05d}{'+' if s_dec >= 0 else '-'}{abs(int(s_dec*100)):04d}",
            "mag": w1_mag,
            "w1mpro": w1_mag,
            "w2mpro": w2_mag,
            "w3mpro": round(float(w1_mag + rng.uniform(-1, 1)), 2),
            "w4mpro": round(float(w1_mag + rng.uniform(-1.5, 1.5)), 2),
            "dist_arcsec": round(float(rng.uniform(0.5, radius * 60)), 2),
        })

    return {"sources": sources, "catalog": catalog, "count": len(sources)}
