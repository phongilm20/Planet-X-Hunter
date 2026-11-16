/**
 * NASA/IPAC IRSA SPHEREx SIA2 & TAP Data Client
 *
 * Implements the normalized contract:
 * { id, timeUTC, dateStr, year, ra, dec, bandMicron, url, footprint }
 */

// Cache responses in sessionStorage by query key as mandated by Section 6
const CACHE_PREFIX = 'spherex_obs_';

export async function fetchSpherexObservations(ra, dec, radiusDeg = 0.08) {
  const cacheKey = `${CACHE_PREFIX}${ra.toFixed(4)}_${dec.toFixed(4)}_${radiusDeg}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, fromCache: true };
    }
  } catch {
    // sessionStorage not available
  }

  const directUrl = `https://irsa.ipac.caltech.edu/SIA?COLLECTION=spherex_qr2&POS=CIRCLE+${ra.toFixed(5)}+${dec.toFixed(5)}+${radiusDeg}&RESPONSEFORMAT=CSV`;
  
  let rawText = null;
  let usedProxy = false;
  let fetchError = null;

  // 1. Attempt direct browser fetch
  try {
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      rawText = await res.text();
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    // 2. Direct fetch failed (CORS or network timeout) -> attempt transparent CORS proxy
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`;
      const res2 = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (res2.ok) {
        rawText = await res2.text();
        usedProxy = true;
      } else {
        throw new Error(`Proxy HTTP ${res2.status}`);
      }
    } catch (err2) {
      fetchError = err2.message || 'Network unreachable';
    }
  }

  const timestamp = new Date().toISOString();

  // If network failed completely
  if (!rawText) {
    return {
      status: 'error',
      observations: [],
      error: `IRSA unreachable (${fetchError})`,
      fetchedAtUTC: timestamp,
      dataSource: usedProxy ? 'IRSA via CORS proxy' : 'Direct IRSA'
    };
  }

  // Parse CSV response
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const observations = [];

  // Check if response is empty or HTML error
  if (lines.length > 1 && !lines[0].toLowerCase().includes('<html')) {
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (row.length < 3) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx];
      });

      // Extract time / date
      const obsTimeStr = obj['obs_time'] || obj['time'] || obj['date_obs'] || obj['t_min'] || '';
      let dateObj = new Date(obsTimeStr);
      if (isNaN(dateObj.getTime())) {
        // Fallback to MJD if numeric
        const mjd = parseFloat(obsTimeStr);
        if (!isNaN(mjd) && mjd > 50000) {
          dateObj = new Date((mjd - 40587) * 86400000);
        } else {
          dateObj = new Date();
        }
      }

      const obsRa = parseFloat(obj['s_ra'] || obj['ra'] || ra);
      const obsDec = parseFloat(obj['s_dec'] || obj['dec'] || dec);
      const bandVal = parseFloat(obj['em_min'] || obj['wavelength'] || '2.5');
      const obsId = obj['obs_id'] || obj['obs_publisher_did'] || `SPX-OBS-${i}`;
      const accessUrl = obj['access_url'] || 
        `https://irsa.ipac.caltech.edu/applications/finderchart/#ra=${ra}&dec=${dec}&survey=SPHEREx`;

      observations.push({
        id: obsId,
        timeUTC: dateObj.toISOString(),
        dateStr: dateObj.toISOString().slice(0, 10),
        year: dateObj.getUTCFullYear() + (dateObj.getUTCMonth() / 12.0) + (dateObj.getUTCDate() / 365.25),
        ra: isNaN(obsRa) ? ra : obsRa,
        dec: isNaN(obsDec) ? dec : obsDec,
        bandMicron: isNaN(bandVal) ? 2.5 : (bandVal > 10 ? bandVal / 10000.0 : bandVal),
        url: accessUrl,
        collection: 'spherex_qr2'
      });
    }
  }

  // Sort chronologically
  observations.sort((a, b) => a.year - b.year);

  const result = {
    status: observations.length > 0 ? 'success' : 'empty',
    observations,
    message: observations.length === 0 ? 'SPHEREx has not (yet) released public data covering this position.' : null,
    fetchedAtUTC: timestamp,
    dataSource: usedProxy ? 'IRSA (via CORS proxy)' : 'Live NASA/IPAC IRSA'
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // Ignore cache write error
  }

  return result;
}
