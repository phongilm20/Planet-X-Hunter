import { PRESETS } from './presets';
import { parseCoordinates } from '../lib/astro';

/**
 * Resolve celestial object name or coordinates
 * 1. Checks curated presets
 * 2. Checks coordinate syntax
 * 3. Fetches live CDS Sesame resolver (with CORS)
 */
export async function resolveTarget(query) {
  if (!query || !query.trim()) return null;
  const q = query.trim();

  // 1. Direct coordinate check
  const coords = parseCoordinates(q);
  if (coords) {
    return {
      id: 'custom-coords',
      name: `Position (${coords.ra.toFixed(4)}°, ${coords.dec.toFixed(4)}°)`,
      shortName: 'Custom Field',
      category: 'User Coordinates',
      ra: coords.ra,
      dec: coords.dec,
      pmra: 0,
      pmdec: 0,
      parallax: 0,
      isSolarSystem: false,
      source: 'User Input'
    };
  }

  // 2. Preset match
  const qLower = q.toLowerCase();
  const presetMatch = PRESETS.find(
    p => p.name.toLowerCase().includes(qLower) ||
         p.shortName.toLowerCase().includes(qLower) ||
         p.id.toLowerCase() === qLower
  );
  if (presetMatch) {
    return presetMatch;
  }

  // 3. Live CDS Sesame lookup
  try {
    const url = `https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?${encodeURIComponent(q)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error(`Sesame HTTP ${res.status}`);
    const xml = await res.text();

    const jradeg = xml.match(/<jradeg>([0-9.]+)<\/jradeg>/);
    const jdedeg = xml.match(/<jdedeg>([+-]?[0-9.]+)<\/jdedeg>/);

    if (jradeg && jdedeg) {
      const ra = parseFloat(jradeg[1]);
      const dec = parseFloat(jdedeg[1]);
      const oname = xml.match(/<oname>([^<]+)<\/oname>/)?.[1] || q;
      const otype = xml.match(/<otype>([^<]+)<\/otype>/)?.[1] || 'Astronomical Object';
      const pmra = parseFloat(xml.match(/<pmRA>([+-]?[0-9.]+)<\/pmRA>/)?.[1] || '0');
      const pmdec = parseFloat(xml.match(/<pmDE>([+-]?[0-9.]+)<\/pmDE>/)?.[1] || '0');
      const plx = parseFloat(xml.match(/<plx><v>([0-9.]+)<\/v>/)?.[1] || '0');
      const spType = xml.match(/<spType>([^<]+)<\/spType>/)?.[1] || '—';

      return {
        id: `sesame-${encodeURIComponent(q)}`,
        name: oname.replace(/^NAME\s+/, ''),
        shortName: q,
        category: otype,
        ra,
        dec,
        pmra,
        pmdec,
        parallax: plx,
        spectralType: spType,
        isSolarSystem: false,
        source: 'CDS Sesame / SIMBAD'
      };
    }
  } catch (err) {
    console.warn('CDS Sesame resolution failed or timed out:', err);
  }

  return null;
}
