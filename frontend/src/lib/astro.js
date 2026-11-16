/**
 * Astronomy Math & Coordinate Utilities
 * Sourced proper-motion calculations, sexagesimal formatting, coordinate parsing,
 * and local tangent-plane projections.
 */

// SPHEREx nominal detector pixel scale
export const SPHEREX_PIXEL_SCALE_ARCSEC = 6.15; // 6.15 arcseconds per pixel
export const SPHEREx_PIXEL_SCALE_ARCSEC = 6.15; // Alias to prevent casing typos

// Gaia DR3 reference epoch
export const GAIA_EPOCH = 2016.0;

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
 * Propagate celestial position with proper motion
 * @param {number} ra - Right Ascension in degrees
 * @param {number} dec - Declination in degrees
 * @param {number} pmra - Proper motion in RA*cos(dec) in mas/yr
 * @param {number} pmdec - Proper motion in Dec in mas/yr
 * @param {number} targetEpoch - Target epoch in fractional years (e.g. 2026.5)
 * @param {number} baseEpoch - Base epoch (default GAIA_EPOCH = 2016.0)
 * @returns {{ ra: number, dec: number }}
 */
export function propagateProperMotion(ra, dec, pmra, pmdec, targetEpoch, baseEpoch = GAIA_EPOCH) {
  const dt = targetEpoch - baseEpoch;
  const cosDec = Math.max(0.0001, Math.cos((dec * Math.PI) / 180));
  
  // pmra and pmdec are in mas/year. Convert to degrees:
  // 1 degree = 3600 arcsec = 3,600,000 mas
  const deltaRaDeg = ((pmra || 0) * dt) / (3.6e6 * cosDec);
  const deltaDecDeg = ((pmdec || 0) * dt) / 3.6e6;

  let newRa = (ra + deltaRaDeg) % 360;
  if (newRa < 0) newRa += 360;
  const newDec = Math.max(-90, Math.min(90, dec + deltaDecDeg));

  return { ra: newRa, dec: newDec };
}

/**
 * Angular separation between two sky coordinates in arcseconds (Haversine formula)
 * @returns {number} separation in arcseconds
 */
export function angularSeparation(ra1, dec1, ra2, dec2) {
  const dToR = Math.PI / 180;
  const r1 = ra1 * dToR;
  const d1 = dec1 * dToR;
  const r2 = ra2 * dToR;
  const d2 = dec2 * dToR;

  const dRa = r2 - r1;
  const dDec = d2 - d1;

  const a = Math.sin(dDec / 2) ** 2 + Math.cos(d1) * Math.cos(d2) * Math.sin(dRa / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Radians to arcseconds
  return c * (180 / Math.PI) * 3600;
}

/**
 * Local tangent-plane (GNOMONIC) projection centered at (centerRa, centerDec)
 * Returns { xArcsec, yArcsec } where:
 * xArcsec points East (towards increasing RA, so left on standard astronomy sky chart)
 * yArcsec points North (towards increasing Dec, so up)
 */
export function tangentPlaneProject(ra, dec, centerRa, centerDec) {
  const dToR = Math.PI / 180;
  const a = ra * dToR;
  const d = dec * dToR;
  const a0 = centerRa * dToR;
  const d0 = centerDec * dToR;

  const cosD = Math.cos(d);
  const sinD = Math.sin(d);
  const cosD0 = Math.cos(d0);
  const sinD0 = Math.sin(d0);
  const da = a - a0;

  const cosC = sinD0 * sinD + cosD0 * cosD * Math.cos(da);
  if (cosC <= 0.0001) {
    // Avoid singularity behind tangent plane
    return { xArcsec: 0, yArcsec: 0 };
  }

  // Standard gnomonic coordinates in radians:
  // x = cos(d)*sin(da) / cosC
  // y = (cos(d0)*sin(d) - sin(d0)*cos(d)*cos(da)) / cosC
  const xRad = (cosD * Math.sin(da)) / cosC;
  const yRad = (cosD0 * sinD - sinD0 * cosD * Math.cos(da)) / cosC;

  // Convert radians to arcseconds
  const radToArcsec = (180 / Math.PI) * 3600;
  return {
    xArcsec: xRad * radToArcsec,
    yArcsec: yRad * radToArcsec,
  };
}
