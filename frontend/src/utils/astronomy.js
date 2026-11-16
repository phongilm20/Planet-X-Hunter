/**
 * Astronomy Math & Coordinate Utilities
 * Sourced proper-motion calculations, sexagesimal formatting, and WCS conversions.
 */

// SPHEREx nominal detector pixel scale
export const SPHEREX_PIXEL_SCALE_ARCSEC = 6.15; // 6.15 arcseconds per pixel
export const SPHEREx_PIXEL_SCALE_ARCSEC = 6.15; // Alias to prevent casing typos

/**
 * Compute proper-motion displacement between two epochs
 * Applies cos(dec) projection accurately.
 *
 * @param {number} pmRaArcsec - Proper motion in RA * cos(dec), in arcsec/yr
 * @param {number} pmDecArcsec - Proper motion in Dec, in arcsec/yr
 * @param {number} deltaYears - Elapsed time in years (epochB - epochA)
 * @returns {{ draArcsec: number, ddecArcsec: number, totalArcsec: number, totalPixels: number }}
 */
export function computeDisplacement(pmRaArcsec, pmDecArcsec, deltaYears) {
  const draArcsec = (pmRaArcsec || 0) * deltaYears;
  const ddecArcsec = (pmDecArcsec || 0) * deltaYears;
  const totalArcsec = Math.sqrt(draArcsec * draArcsec + ddecArcsec * ddecArcsec);
  const totalPixels = totalArcsec / SPHEREX_PIXEL_SCALE_ARCSEC;

  return {
    draArcsec,
    ddecArcsec,
    totalArcsec,
    totalPixels,
  };
}

/**
 * Format degrees to Right Ascension sexagesimal (hh:mm:ss.ss)
 */
export function degToHMS(deg) {
  if (deg == null || isNaN(deg)) return '—';
  let norm = deg % 360;
  if (norm < 0) norm += 360;
  const totalHours = norm / 15.0;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  const s = ((totalHours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(2).padStart(5, '0')}s`;
}

/**
 * Format degrees to Declination sexagesimal (±dd° mm' ss.s")
 */
export function degToDMS(deg) {
  if (deg == null || isNaN(deg)) return '—';
  const sign = deg >= 0 ? '+' : '-';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

/**
 * Parse arbitrary user coordinate string into { ra, dec } in degrees
 * Supports:
 * - "133.795, -7.245"
 * - "133.795 -7.245"
 * - "08h 55m 10.83s, -07d 14m 42.5s"
 * - "08:55:10.8 -07:14:42.5"
 */
export function parseCoordinates(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // 1. Decimal degrees: e.g. "133.795, -7.245" or "133.795 -7.245"
  const decPattern = /^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/;
  const matchDec = trimmed.match(decPattern);
  if (matchDec) {
    const ra = parseFloat(matchDec[1]);
    const dec = parseFloat(matchDec[2]);
    if (!isNaN(ra) && !isNaN(dec) && ra >= 0 && ra <= 360 && dec >= -90 && dec <= 90) {
      return { ra, dec };
    }
  }

  // 2. Sexagesimal: "08:55:10.8 -07:14:42.5" or "08h55m10.8s -07d14m42.5s"
  const sexPattern = /(\d{1,2})[h:\s]+(\d{1,2})[m:\s]+(\d{1,2}(?:\.\d+)?)[s\s]*,?\s*([+-]?\d{1,2})[d°:\s]+(\d{1,2})['m:\s]+(\d{1,2}(?:\.\d+)?)/i;
  const matchSex = trimmed.match(sexPattern);
  if (matchSex) {
    const rh = parseFloat(matchSex[1]);
    const rm = parseFloat(matchSex[2]);
    const rs = parseFloat(matchSex[3]);
    const dSign = matchSex[4].startsWith('-') ? -1 : 1;
    const dd = Math.abs(parseFloat(matchSex[4]));
    const dm = parseFloat(matchSex[5]);
    const ds = parseFloat(matchSex[6]);

    const ra = (rh + rm / 60 + rs / 3600) * 15;
    const dec = dSign * (dd + dm / 60 + ds / 3600);

    if (!isNaN(ra) && !isNaN(dec)) {
      return { ra, dec };
    }
  }

  return null;
}

/**
 * Pixel coordinates (0,0 top-left) to Sky RA/Dec (degrees)
 */
export function pixelToSky(x, y, wcs) {
  if (!wcs) return { ra: 0, dec: 0 };
  const crpix1 = wcs.CRPIX1 || 128;
  const crpix2 = wcs.CRPIX2 || 128;
  const crval1 = wcs.CRVAL1 || 0;
  const crval2 = wcs.CRVAL2 || 0;
  const cdelt1 = wcs.CDELT1 || -0.000325;
  const cdelt2 = wcs.CDELT2 || 0.000325;

  const ra = crval1 + (x - crpix1) * cdelt1;
  const dec = crval2 + (y - crpix2) * cdelt2;
  return { ra, dec };
}

/**
 * Sky RA/Dec (degrees) to Pixel coordinates
 */
export function skyToPixel(ra, dec, wcs) {
  if (!wcs) return { x: 128, y: 128 };
  const crpix1 = wcs.CRPIX1 || 128;
  const crpix2 = wcs.CRPIX2 || 128;
  const crval1 = wcs.CRVAL1 || 0;
  const crval2 = wcs.CRVAL2 || 0;
  const cdelt1 = wcs.CDELT1 || -0.000325;
  const cdelt2 = wcs.CDELT2 || 0.000325;

  const x = (ra - crval1) / cdelt1 + crpix1;
  const y = (dec - crval2) / cdelt2 + crpix2;
  return { x, y };
}
