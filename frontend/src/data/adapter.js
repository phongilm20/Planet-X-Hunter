/**
 * SPHEREx Astronomical Data Adapter
 *
 * Implements the contract specified in Section 6:
 * - getEpochs(ra, dec)
 * - getCutout(epoch, ra, dec, sizeArcsec, band)
 * - getCatalogSources(ra, dec, radius)
 * - resolveName(name)
 * - getEphemeris(target, epochs)
 *
 * Provenance tracking: 'IRSA-live' | 'cached' | 'simulated'
 */

import TARGETS_CATALOG from './targets.json';

const API_BASE = '';

// Discrete SPHEREx & Historical Survey Epochs
export const OBSERVATIONAL_EPOCHS = [
  {
    id: 'epoch-2014',
    surveyId: 'WISE/NEOWISE-2014',
    label: '2014.5 · NEOWISE Baseline',
    shortLabel: '2014.5 (NEOWISE)',
    year: 2014.5,
    bandName: 'W2 (4.6 µm)',
    wavelengthUm: 4.60,
    isBaseline: true,
    isFuture: false,
    provenance: 'cached',
  },
  {
    id: 'epoch-2025-m0',
    surveyId: 'SPHEREx-Survey-1',
    label: '2025.0 · SPHEREx Survey 1 (DR1 M0)',
    shortLabel: '2025.0 (Survey 1)',
    year: 2025.0,
    bandName: 'Band 5 (3.82–4.42 µm)',
    wavelengthUm: 4.12,
    isBaseline: false,
    isFuture: false,
    provenance: 'simulated', // // TODO(VERIFY): Switch to IRSA-live when public DR1 API is released
  },
  {
    id: 'epoch-2025-m6',
    surveyId: 'SPHEREx-Survey-2',
    label: '2025.5 · SPHEREx Survey 2 (DR1 M6)',
    shortLabel: '2025.5 (Survey 2)',
    year: 2025.5,
    bandName: 'Band 5 (3.82–4.42 µm)',
    wavelengthUm: 4.12,
    isBaseline: false,
    isFuture: false,
    provenance: 'simulated',
  },
  {
    id: 'epoch-2026-m12',
    surveyId: 'SPHEREx-Survey-3',
    label: '2026.0 · SPHEREx Survey 3 (QR2 M12)',
    shortLabel: '2026.0 (Survey 3)',
    year: 2026.0,
    bandName: 'Band 5 (3.82–4.42 µm)',
    wavelengthUm: 4.12,
    isBaseline: false,
    isFuture: false,
    provenance: 'simulated',
  },
  {
    id: 'epoch-2026-m18',
    surveyId: 'SPHEREx-Survey-4',
    label: '2026.5 · SPHEREx Survey 4 (QR3 M18)',
    shortLabel: '2026.5 (Survey 4)',
    year: 2026.5,
    bandName: 'Band 5 (3.82–4.42 µm)',
    wavelengthUm: 4.12,
    isBaseline: false,
    isFuture: false,
    provenance: 'simulated',
  },
  {
    id: 'epoch-2027-m24',
    surveyId: 'SPHEREx-Survey-5',
    label: '2027.0 · SPHEREx Survey 5 (DR2 Final)',
    shortLabel: '2027.0 (Survey 5)',
    year: 2027.0,
    bandName: 'Band 5 (3.82–4.42 µm)',
    wavelengthUm: 4.12,
    isBaseline: false,
    isFuture: true,
    provenance: 'simulated',
  },
];

/**
 * Get available discrete observation epochs for a given sky coordinate
 */
export async function getEpochs(ra, dec) {
  // In real SPHEREx mission, all-sky coverage produces all 4-5 survey passes
  return OBSERVATIONAL_EPOCHS;
}

/**
 * Fetch Image Cutout for a specific epoch and coordinate
 * Returns: { image (base64 or URL), pixels (2D float), wcs, provenance, wavelengthUm, bandName, stats }
 */
export async function getCutout(epochId, ra, dec, sizeArcsec = 300, band = 50) {
  const epochObj = OBSERVATIONAL_EPOCHS.find((e) => e.id === epochId) || OBSERVATIONAL_EPOCHS[1];
  const epochIndex = OBSERVATIONAL_EPOCHS.indexOf(epochObj) + 1;
  const fovArcmin = sizeArcsec / 60.0;

  try {
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      fov: fovArcmin.toFixed(2),
      epoch: String(epochIndex),
      band: String(band),
      stretch: 'linear',
      palette: 'daylight',
    });

    const res = await fetch(`${API_BASE}/api/cutout?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return {
      image: data.image,
      pixels: data.pixels || null,
      width: data.width || 256,
      height: data.height || 256,
      wcs: data.wcs,
      provenance: epochObj.provenance || 'simulated',
      wavelengthUm: epochObj.wavelengthUm,
      bandName: epochObj.bandName,
      surveyId: epochObj.surveyId,
      year: epochObj.year,
      stats: data.stats,
      anomalies: data.anomalies || [],
    };
  } catch (err) {
    console.warn(`Backend cutout fetch failed for epoch ${epochId}, generating client fallback`, err);
    return generateClientFallbackCutout(epochObj, ra, dec, fovArcmin, band);
  }
}

/**
 * Fetch Differential Cutout between Epoch B and Epoch A (B - A)
 */
export async function getDifferenceCutout(epochAId, epochBId, ra, dec, sizeArcsec = 300, band = 50) {
  const epochA = OBSERVATIONAL_EPOCHS.find((e) => e.id === epochAId) || OBSERVATIONAL_EPOCHS[0];
  const epochB = OBSERVATIONAL_EPOCHS.find((e) => e.id === epochBId) || OBSERVATIONAL_EPOCHS[3];
  const idxA = OBSERVATIONAL_EPOCHS.indexOf(epochA) + 1;
  const idxB = OBSERVATIONAL_EPOCHS.indexOf(epochB) + 1;
  const fovArcmin = sizeArcsec / 60.0;

  try {
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      fov: fovArcmin.toFixed(2),
      epoch: 'diff',
      diff_a: String(idxA),
      diff_b: String(idxB),
      band: String(band),
      stretch: 'linear',
      palette: 'daylight',
    });

    const res = await fetch(`${API_BASE}/api/cutout?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return {
      image: data.image,
      pixels: data.pixels || null,
      width: data.width || 256,
      height: data.height || 256,
      wcs: data.wcs,
      provenance: 'simulated',
      wavelengthUm: epochB.wavelengthUm,
      bandName: `${epochB.bandName} - ${epochA.bandName}`,
      isDifference: true,
      stats: data.stats,
      anomalies: data.anomalies || [],
      epochA,
      epochB,
    };
  } catch (err) {
    console.warn('Backend difference fetch failed, using fallback', err);
    return null;
  }
}

/**
 * Fetch reference catalog sources (Gaia DR3 / SIMBAD) surrounding coordinate
 */
export async function getCatalogSources(ra, dec, radiusDeg = 0.1) {
  try {
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      radius: radiusDeg.toFixed(3),
    });
    const res = await fetch(`${API_BASE}/api/gaia?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.sources || [];
  } catch (err) {
    return [];
  }
}

/**
 * Resolve target name via local catalog first, then CDS Sesame
 */
export async function resolveName(nameQuery) {
  if (!nameQuery) return null;
  const q = nameQuery.toLowerCase().trim();

  // Local canonical catalog search
  const found = TARGETS_CATALOG.find(
    (t) =>
      t.commonName.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
  );

  if (found) {
    return {
      target: found,
      ra: found.ra.value,
      dec: found.dec.value,
      name: found.commonName,
      provenance: 'catalog',
    };
  }

  // Fallback to CDS Sesame Name Resolver
  try {
    const url = `https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?${encodeURIComponent(nameQuery)}`;
    const res = await fetch(url);
    const xmlText = await res.text();
    const matchRa = xmlText.match(/<jradeg>([0-9.]+)<\/jradeg>/);
    const matchDec = xmlText.match(/<jdedeg>([+-]?[0-9.]+)<\/jdedeg>/);
    if (matchRa && matchDec) {
      return {
        name: nameQuery,
        ra: parseFloat(matchRa[1]),
        dec: parseFloat(matchDec[1]),
        provenance: 'SIMBAD-Sesame',
      };
    }
  } catch {
    // Ignore network error
  }

  return null;
}

/**
 * Fetch 102-band SPHEREx spectrum
 */
export async function getSpectrum(targetName, ra, dec) {
  try {
    const res = await fetch(
      `${API_BASE}/api/spectrum?target_name=${encodeURIComponent(targetName || '')}&ra=${ra}&dec=${dec}`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to client-generated 102-band spectrum
  }

  // Procedural 102-channel NIR spectrum (0.75 - 5.0 um)
  const wavelengths = [];
  const flux_epoch1 = [];
  const flux_epoch2 = [];
  for (let i = 0; i < 102; i++) {
    const w = 0.75 + (i / 101.0) * (5.0 - 0.75);
    wavelengths.push(parseFloat(w.toFixed(3)));

    // Base continuum (Rayleigh-Jeans / blackbody approximation)
    let f1 = Math.pow(w, -1.8) * 10.0;
    // Absorption features (CH4 at 1.6 and 3.3 um, H2O at 1.4 and 1.9 um, CO at 4.67 um)
    if (Math.abs(w - 1.4) < 0.1) f1 *= 0.4;
    if (Math.abs(w - 1.9) < 0.12) f1 *= 0.35;
    if (Math.abs(w - 3.3) < 0.15) f1 *= 0.25;
    if (Math.abs(w - 4.67) < 0.1) f1 *= 0.5;

    // Small noise
    f1 += (Math.sin(i * 13) * 0.5 + 0.5) * 0.1;
    let f2 = f1 * (1.0 + (Math.cos(i * 7) * 0.03));

    flux_epoch1.push(parseFloat(Math.max(0.01, f1).toFixed(3)));
    flux_epoch2.push(parseFloat(Math.max(0.01, f2).toFixed(3)));
  }

  return {
    target_name: targetName || 'Custom Target',
    ra,
    dec,
    bands_count: 102,
    wavelength_range_um: [0.75, 5.0],
    wavelengths,
    flux_epoch1,
    flux_epoch2,
    features: [
      { name: 'H2O', wavelength_um: 1.4, type: 'absorption' },
      { name: 'CH4', wavelength_um: 1.66, type: 'absorption' },
      { name: 'H2O Ice', wavelength_um: 3.05, type: 'ice band' },
      { name: 'CH4', wavelength_um: 3.3, type: 'absorption' },
      { name: 'CO2 Ice', wavelength_um: 4.26, type: 'ice band' },
      { name: 'CO', wavelength_um: 4.67, type: 'absorption' },
    ],
  };
}

/**
 * Client procedural fallback cutout (never crashes if backend is down)
 */
function generateClientFallbackCutout(epoch, ra, dec, fovArcmin, band) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background sky noise (astronomical negative print: clean light gray)
  ctx.fillStyle = '#E5E7EB';
  ctx.fillRect(0, 0, size, size);

  // Synthetic background stars
  ctx.fillStyle = '#111827';
  const rngSeed = Math.floor(ra * 100 + dec * 50);
  for (let i = 0; i < 35; i++) {
    const sx = (Math.sin(rngSeed + i * 17) * 0.5 + 0.5) * (size - 20) + 10;
    const sy = (Math.cos(rngSeed + i * 31) * 0.5 + 0.5) * (size - 20) + 10;
    const rad = (Math.sin(i) * 0.5 + 0.5) * 2.5 + 1.0;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Target object with proper motion displacement
  const dt = (epoch.year || 2025.0) - 2014.5;
  const shiftX = dt * 1.5;
  const shiftY = dt * -0.5;

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(size / 2 + shiftX, size / 2 + shiftY, 4.0, 0, Math.PI * 2);
  ctx.fill();

  const dataUrl = canvas.toDataURL('image/png');

  const wcs = {
    CRPIX1: size / 2,
    CRPIX2: size / 2,
    CRVAL1: ra,
    CRVAL2: dec,
    CDELT1: -(fovArcmin / 60.0) / size,
    CDELT2: (fovArcmin / 60.0) / size,
  };

  return {
    image: dataUrl,
    pixels: null,
    width: size,
    height: size,
    wcs,
    provenance: 'simulated',
    wavelengthUm: epoch.wavelengthUm,
    bandName: epoch.bandName,
    surveyId: epoch.surveyId,
    year: epoch.year,
    stats: { min: 0.1, max: 25.4, mean: 1.2, std: 2.1 },
    anomalies: [],
  };
}
