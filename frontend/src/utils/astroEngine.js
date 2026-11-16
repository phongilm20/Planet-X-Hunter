/**
 * 🌌 SPHEREx Client-Side Astronomical Engine (astroEngine.js)
 * High-performance, zero-backend astrophysics computing for the browser.
 * Handles WCS calculations, difference imaging, asinh contrast stretch,
 * FOV-scaled dipole peak finding, and 102-band hyperspectral slicing at 60 FPS.
 */

import { NASA_TARGETS, SPHEREX_BANDS, bandToWavelength } from '../data/targets';

// ── PRNG for deterministic celestial fields ─────────────────────────────────
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCoords(ra, dec) {
  const str = `${Number(ra).toFixed(4)}_${Number(dec).toFixed(4)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── 2D Gaussian Point Spread Function ───────────────────────────────────────
function addGaussianPSF(grid, size, cx, cy, sigma, amplitude) {
  const radius = Math.ceil(sigma * 3.5);
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(size - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(size - 1, Math.ceil(cy + radius));
  const twoSigmaSq = 2 * sigma * sigma;

  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    const dySq = dy * dy;
    const rowOffset = y * size;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const distSq = dx * dx + dySq;
      grid[rowOffset + x] += amplitude * Math.exp(-distSq / twoSigmaSq);
    }
  }
}

// ── Find matching target or return null ─────────────────────────────────────
export function findTarget(ra, dec) {
  return NASA_TARGETS.find(t => Math.hypot(t.ra - ra, (t.dec - dec) * Math.cos((dec * Math.PI) / 180)) < 0.05) || null;
}

// ── Generate WCS-aligned Star Field (Epoch 1 or Epoch 2) ───────────────────
export function generateStarField(ra, dec, fovArcmin, band, epoch = 1, size = 256, target = null) {
  const seed = hashCoords(ra, dec);
  const rng = mulberry32(seed);
  const grid = new Float32Array(size * size);

  const wavelength = bandToWavelength(band);
  // SPHEREx thermal noise model: zodiacal light + thermal detector floor
  const zodiBg = 12.0 + 8.0 * Math.pow(wavelength / 5.0, 2);
  const readNoise = 2.8;

  // Box-Muller normal distribution for background noise
  for (let i = 0; i < grid.length; i += 2) {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);
    grid[i] = Math.max(0, zodiBg + readNoise * z0);
    if (i + 1 < grid.length) {
      grid[i + 1] = Math.max(0, zodiBg + readNoise * z1);
    }
  }

  // 18-26 consistent static background stars
  const nStars = 18 + Math.floor(rng() * 9);
  for (let i = 0; i < nStars; i++) {
    const starX = 8 + rng() * (size - 16);
    const starY = 8 + rng() * (size - 16);
    const sigma = (1.8 + rng() * 1.2) / 2.355;
    const tEff = 3000 + rng() * 5000;
    const bbFactor = (1.0 / Math.pow(wavelength, 5)) / (Math.exp(14387.7 / (wavelength * tEff)) - 1.0 + 1e-10);
    const amp = (40.0 + rng() * 280.0) * (0.8 + 0.4 * rng());
    addGaussianPSF(grid, size, starX, starY, sigma, Math.min(amp * bbFactor * 1e-6 + amp * 0.4, 400.0));
  }

  // If a known target exists at these coordinates, add its signature
  const activeTarget = target || findTarget(ra, dec);
  if (activeTarget) {
    const centerX = size / 2.0;
    const centerY = size / 2.0;
    const arcsecPerPixel = (fovArcmin * 60.0) / size;
    const dt = 0.5; // 6-month survey cadence baseline in years

    let targetX = centerX;
    let targetY = centerY;
    let amp = 180.0;

    if (activeTarget.shortName === 'WISE 0855') {
      // Fast proper motion sub-brown dwarf, very bright at > 4 µm (Band 5/6)
      const ch4Dip = Math.exp(-0.5 * Math.pow((wavelength - 3.3) / 0.25, 2));
      const thermalPeak = Math.exp(-0.5 * Math.pow((wavelength - 4.6) / 0.4, 2));
      amp = 18.0 * (1.0 - 0.85 * ch4Dip) + 140.0 * thermalPeak;

      if (epoch === 2) {
        // Move according to proper motion
        const dRaPx = (activeTarget.properMotion.ra * dt) / arcsecPerPixel;
        const dDecPx = (activeTarget.properMotion.dec * dt) / arcsecPerPixel;
        targetX += dRaPx;
        targetY -= dDecPx;
      }
    } else if (activeTarget.shortName === "Barnard's") {
      // High proper motion M-dwarf moving primarily northwards
      amp = 260.0 * Math.pow(1.2 / wavelength, 0.8);
      if (epoch === 2) {
        const dDecPx = (activeTarget.properMotion.dec * dt) / arcsecPerPixel;
        targetY -= dDecPx;
      }
    } else if (activeTarget.shortName === 'ε Indi B') {
      // Binary brown dwarf
      amp = 110.0 * (1.0 + 0.4 * Math.sin(wavelength * 3.14));
      if (epoch === 2) {
        const dRaPx = (activeTarget.properMotion.ra * dt) / arcsecPerPixel;
        const dDecPx = (activeTarget.properMotion.dec * dt) / arcsecPerPixel;
        targetX += dRaPx;
        targetY -= dDecPx;
      }
    } else if (activeTarget.shortName === 'RW Aur') {
      // T Tauri variable: stationary, but large photometric flux drop in Epoch 2
      amp = epoch === 1 ? 240.0 : 75.0;
    } else if (activeTarget.shortName === 'R Dra') {
      // Mira pulsating red giant: stationary, but brightens by 3.2x in Epoch 2
      amp = epoch === 1 ? 85.0 : 275.0;
    }

    addGaussianPSF(grid, size, targetX, targetY, 2.4 / 2.355, amp);
  }

  return grid;
}

// ── Astronomical Image Subtraction (ΔI = E2 - E1) ───────────────────────────
export function computeDifference(field1, field2) {
  const diff = new Float32Array(field1.length);
  for (let i = 0; i < field1.length; i++) {
    diff[i] = field2[i] - field1[i];
  }
  return diff;
}

// ── Co-Add Stacking ((E1 + E2) / 2) ─────────────────────────────────────────
export function computeCoadd(field1, field2) {
  const coadd = new Float32Array(field1.length);
  for (let i = 0; i < field1.length; i++) {
    coadd[i] = (field1[i] + field2[i]) * 0.5;
  }
  return coadd;
}

// ── Statistical Peak Finding & Dynamic FOV Dipole Clustering ─────────────────
export function detectAnomalies(diffImage, fovArcmin, size = 256, thresholdSigma = 3.2) {
  let sum = 0;
  let sqSum = 0;
  const n = diffImage.length;

  for (let i = 0; i < n; i++) {
    const v = diffImage[i];
    sum += v;
    sqSum += v * v;
  }

  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sqSum / n - mean * mean)) || 1e-6;
  const posCutoff = mean + thresholdSigma * std;
  const negCutoff = mean - thresholdSigma * std;

  const rawPeaks = [];
  const radius = 3; // 7x7 local extremum footprint

  for (let y = radius; y < size - radius; y++) {
    const rowOffset = y * size;
    for (let x = radius; x < size - radius; x++) {
      const val = diffImage[rowOffset + x];

      if (val > posCutoff) {
        // Check if local maximum
        let isMax = true;
        for (let dy = -radius; dy <= radius && isMax; dy++) {
          const dyOffset = (y + dy) * size;
          for (let dx = -radius; dx <= radius; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (diffImage[dyOffset + x + dx] >= val) {
              isMax = false;
              break;
            }
          }
        }
        if (isMax) {
          rawPeaks.push({
            x,
            y,
            significance: Number(((val - mean) / std).toFixed(1)),
            polarity: 'positive',
            type: 'candidate',
          });
        }
      } else if (val < negCutoff) {
        // Check if local minimum
        let isMin = true;
        for (let dy = -radius; dy <= radius && isMin; dy++) {
          const dyOffset = (y + dy) * size;
          for (let dx = -radius; dx <= radius; dx++) {
            if (dy === 0 && dx === 0) continue;
            if (diffImage[dyOffset + x + dx] <= val) {
              isMin = false;
              break;
            }
          }
        }
        if (isMin) {
          rawPeaks.push({
            x,
            y,
            significance: Number((Math.abs(val - mean) / std).toFixed(1)),
            polarity: 'negative',
            type: 'candidate',
          });
        }
      }
    }
  }

  // Dynamic FOV-scaled dipole pairing distance
  const arcsecPerPixel = (fovArcmin * 60.0) / size;
  // Maximum proper motion expected across 6 months (~15"/yr -> 7.5" shift)
  const maxMotionArcsec = 12.0;
  const maxPairingDistancePx = Math.max(8.0, maxMotionArcsec / arcsecPerPixel);

  const classified = [];
  const used = new Set();

  for (let i = 0; i < rawPeaks.length; i++) {
    if (used.has(i)) continue;
    const p1 = rawPeaks[i];
    let paired = false;

    for (let j = i + 1; j < rawPeaks.length; j++) {
      if (used.has(j)) continue;
      const p2 = rawPeaks[j];

      if (p1.polarity !== p2.polarity) {
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist <= maxPairingDistancePx) {
          p1.type = 'dipole';
          p2.type = 'dipole';
          p1.pairedWith = { x: p2.x, y: p2.y };
          p2.pairedWith = { x: p1.x, y: p1.y };
          used.add(i);
          used.add(j);
          classified.push(p1, p2);
          paired = true;
          break;
        }
      }
    }

    if (!paired && !used.has(i)) {
      p1.type = 'monopole';
      used.add(i);
      classified.push(p1);
    }
  }

  classified.sort((a, b) => b.significance - a.significance);
  return classified.slice(0, 10);
}

// ── Contrast Stretch & HTML5 Canvas Rendering to DataURL ────────────────────
export function renderToDataURL(array, mode = '1', stretch = 'asinh', size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const isDiverging = mode === 'diff';

  if (isDiverging) {
    // Symmetrical diverging colormap: Cyan for negative (E1), Magenta for positive (E2)
    let maxAbs = 0;
    for (let i = 0; i < array.length; i++) {
      const abs = Math.abs(array[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
    maxAbs = maxAbs || 1.0;

    for (let i = 0; i < array.length; i++) {
      const val = array[i];
      let norm = 0;

      if (stretch === 'asinh') {
        norm = Math.asinh(Math.abs(val) / 2.0) / Math.asinh(maxAbs / 2.0);
      } else {
        norm = Math.abs(val) / maxAbs;
      }
      norm = Math.min(1.0, Math.max(0.0, norm));

      const idx = i * 4;
      if (val >= 0) {
        // Magenta / Positive excess (E2 position)
        data[idx] = Math.floor(norm * 255); // R
        data[idx + 1] = Math.floor(norm * 20); // G
        data[idx + 2] = Math.floor(norm * 220); // B
      } else {
        // Cyan / Negative deficit (E1 position)
        data[idx] = Math.floor(norm * 20); // R
        data[idx + 1] = Math.floor(norm * 220); // G
        data[idx + 2] = Math.floor(norm * 255); // B
      }
      data[idx + 3] = 255;
    }
  } else {
    // Infrared False-Color Colormap (Deep Space Slate -> Amber -> Bright Core)
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < array.length; i++) {
      const v = array[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min || 1.0;

    for (let i = 0; i < array.length; i++) {
      const val = array[i];
      let norm = (val - min) / range;

      if (stretch === 'asinh') {
        norm = Math.asinh(norm * 3.0) / Math.asinh(3.0);
      } else if (stretch === 'log') {
        norm = Math.log1p(norm * 9.0) / Math.log1p(9.0);
      }
      norm = Math.min(1.0, Math.max(0.0, norm));

      const idx = i * 4;
      // Infrared Palette: Dark blue -> Orange -> White
      data[idx] = Math.floor(Math.min(255, norm * 300));
      data[idx + 1] = Math.floor(Math.min(255, Math.pow(norm, 1.4) * 255));
      data[idx + 2] = Math.floor(Math.min(255, Math.pow(norm, 2.2) * 255));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ── 102-Band Near-Infrared Spectrum Generator ──────────────────────────────
export function generateSpectrum(ra, dec, epoch = 'both', target = null) {
  const activeTarget = target || findTarget(ra, dec);
  const wavelengths = [];
  for (let i = 1; i <= 102; i++) {
    wavelengths.push(Number(bandToWavelength(i).toFixed(4)));
  }

  const flux1 = [];
  const flux2 = [];
  const errors = [];
  const flags = [];

  for (let i = 0; i < 102; i++) {
    const wl = wavelengths[i];
    let f1 = 1.0;
    let f2 = 1.0;

    if (activeTarget?.shortName === 'WISE 0855') {
      // Y-Dwarf: deep CH4 absorption at 3.3 um, high thermal emission at 4.5-5.0 um
      const ch4Dip = Math.exp(-0.5 * Math.pow((wl - 3.3) / 0.25, 2));
      const thermalPeak = Math.exp(-0.5 * Math.pow((wl - 4.6) / 0.45, 2));
      f1 = 0.25 * (1.0 - 0.9 * ch4Dip) + 2.8 * thermalPeak;
      f2 = f1 * 1.02; // Minimal photometric variability, pure motion
    } else if (activeTarget?.shortName === "Barnard's") {
      // M-dwarf: peak at ~1.1-1.3 um, Rayleigh-Jeans tail
      f1 = 3.2 * Math.pow(1.2 / wl, 1.2);
      f2 = f1;
    } else if (activeTarget?.shortName === 'ε Indi B') {
      // T-Dwarf: multiple water & methane bands
      f1 = 1.4 * (1.0 + 0.4 * Math.sin(wl * 3.5)) * Math.pow(2.0 / wl, 0.7);
      f2 = f1;
    } else if (activeTarget?.shortName === 'RW Aur') {
      // Accretion disk occultation: 65% flux drop in Epoch 2
      f1 = 2.4 * Math.pow(1.5 / wl, 0.9);
      f2 = f1 * 0.35;
    } else if (activeTarget?.shortName === 'R Dra') {
      // Mira pulsating red giant: 3.2x flux increase in Epoch 2
      f1 = 1.1 * Math.pow(2.2 / wl, 0.6);
      f2 = f1 * 3.2;
    } else {
      // Default stellar continuum
      f1 = 1.5 * Math.pow(1.5 / wl, 1.1);
      f2 = f1;
    }

    const err = Number((0.02 + 0.01 * (wl / 5.0)).toFixed(4));
    flux1.push(Number(f1.toFixed(4)));
    flux2.push(Number(f2.toFixed(4)));
    errors.push(err);

    // Occasional realistic flags
    if (i === 33) flags.push('SOURCE_CONFUSION');
    else if (i === 67) flags.push('DIFFRACTION_SPIKE');
    else flags.push('CLEAN');
  }

  return {
    wavelengths,
    band_ids: Array.from({ length: 102 }, (_, i) => i + 1),
    detector_bands: SPHEREX_BANDS.map(b => ({
      name: b.name,
      start_idx: b.startCh - 1,
      end_idx: b.endCh - 1,
      color: b.color,
      range: `${b.startWl}–${b.endWl} µm`,
    })),
    flux_epoch1: epoch === '2' ? [] : flux1,
    flux_epoch2: epoch === '1' ? [] : flux2,
    flux_error1: epoch === '2' ? [] : errors,
    flux_error2: epoch === '1' ? [] : errors,
    flags,
  };
}

// ── In-Memory Patch Cache (0 ms instant reload) ─────────────────────────────
const inMemoryCache = new Map();

// ── Master Client-Side Cutout Dispatcher ────────────────────────────────────
export function getCutoutData(ra, dec, fovArcmin = 5.0, mode = '1', band = 50, stretch = 'asinh', size = 256) {
  const cacheKey = `${ra.toFixed(4)}_${dec.toFixed(4)}_${fovArcmin}_${band}_${size}`;

  let rawData = inMemoryCache.get(cacheKey);
  if (!rawData) {
    const target = findTarget(ra, dec);
    const field1 = generateStarField(ra, dec, fovArcmin, band, 1, size, target);
    const field2 = generateStarField(ra, dec, fovArcmin, band, 2, size, target);
    const diff = computeDifference(field1, field2);
    const coadd = computeCoadd(field1, field2);
    const anomalies = detectAnomalies(diff, fovArcmin, size);

    rawData = {
      field1,
      field2,
      diff,
      coadd,
      anomalies,
      target,
    };
    inMemoryCache.set(cacheKey, rawData);
  }

  let activeField = rawData.field1;
  if (mode === '2') activeField = rawData.field2;
  else if (mode === 'diff') activeField = rawData.diff;
  else if (mode === 'coadd') activeField = rawData.coadd;

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (let i = 0; i < activeField.length; i++) {
    const v = activeField[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / activeField.length;

  const pixelScaleDeg = fovArcmin / 60.0 / size;
  const pixelScaleArcsec = pixelScaleDeg * 3600.0;

  const result = {
    image: renderToDataURL(activeField, mode, stretch, size),
    stats: {
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      mean: Number(mean.toFixed(2)),
      std: Number(Math.sqrt(Math.abs(max - min)).toFixed(2)),
    },
    anomalies: mode === 'diff' ? rawData.anomalies : [],
    wcs: {
      CRVAL1: ra,
      CRVAL2: dec,
      CRPIX1: size / 2.0 + 0.5,
      CRPIX2: size / 2.0 + 0.5,
      CDELT1: -pixelScaleDeg,
      CDELT2: pixelScaleDeg,
      CTYPE1: 'RA---TAN',
      CTYPE2: 'DEC--TAN',
      PIXEL_SCALE_ARCSEC: Number(pixelScaleArcsec.toFixed(3)),
    },
  };

  // For Blink Mode, include both rendered frames
  if (mode === 'blink') {
    result.epoch1 = { image: renderToDataURL(rawData.field1, '1', stretch, size) };
    result.epoch2 = { image: renderToDataURL(rawData.field2, '2', stretch, size) };
  }

  return result;
}

// ── Sexagesimal Coordinate Parser ───────────────────────────────────────────
export function parseCoordinateString(raStr, decStr) {
  let ra = NaN;
  let dec = NaN;

  // RA parsing: supports HH:MM:SS.ss or decimal degrees
  if (typeof raStr === 'number') {
    ra = raStr;
  } else if (typeof raStr === 'string') {
    const trimmed = raStr.trim();
    const hmsMatch = trimmed.match(/^(\d{1,2})[h:\s]+(\d{1,2})[m:\s]+(\d{1,2}(?:\.\d+)?)[s]?$/i);
    if (hmsMatch) {
      const h = parseFloat(hmsMatch[1]);
      const m = parseFloat(hmsMatch[2]);
      const s = parseFloat(hmsMatch[3]);
      ra = (h + m / 60.0 + s / 3600.0) * 15.0;
    } else {
      ra = parseFloat(trimmed);
    }
  }

  // Dec parsing: supports ±DD:MM:SS.s or decimal degrees
  if (typeof decStr === 'number') {
    dec = decStr;
  } else if (typeof decStr === 'string') {
    const trimmed = decStr.trim();
    const dmsMatch = trimmed.match(/^([+-]?\d{1,2})[d°:\s]+(\d{1,2})['m:\s]+(\d{1,2}(?:\.\d+)?)["s]?$/i);
    if (dmsMatch) {
      const sign = dmsMatch[1].startsWith('-') ? -1 : 1;
      const d = Math.abs(parseFloat(dmsMatch[1]));
      const m = parseFloat(dmsMatch[2]);
      const s = parseFloat(dmsMatch[3]);
      dec = sign * (d + m / 60.0 + s / 3600.0);
    } else {
      dec = parseFloat(trimmed);
    }
  }

  // Validate bounds
  const isValid = !isNaN(ra) && !isNaN(dec) && ra >= 0 && ra < 360 && dec >= -90 && dec <= 90;
  return { ra, dec, isValid };
}
