/**
 * NASA Challenge Official Presets
 * Each preset has a one-line source-backed caption.
 */

export const PRESETS = [
  {
    id: 'wise-0855',
    name: 'WISE 0855−0714',
    shortName: 'WISE 0855',
    category: 'Sub-Brown Dwarf',
    ra: 133.79513,
    dec: -7.24515,
    pmra: -8100.0, // mas/yr (includes cos(dec))
    pmdec: 700.0,  // mas/yr
    parallax: 448.0, // mas (~7.28 ly)
    isSolarSystem: false,
    caption: 'Fast-moving sub-brown dwarf ~7.3 ly away, ~8.1″/yr proper motion. Coldest known object outside solar system (~250 K).',
    source: 'CatWISE2020 / Luhman 2014'
  },
  {
    id: 'barnards-star',
    name: "Barnard's Star",
    shortName: "Barnard's",
    category: 'M-Dwarf Star',
    ra: 269.45208,
    dec: 4.69339,
    pmra: -801.55,
    pmdec: 10362.39,
    parallax: 546.98, // mas (~5.96 ly)
    isSolarSystem: false,
    caption: "Highest known stellar proper motion (~10.3″/yr), shifting northward by ~1 SPHEREx pixel every 7 months.",
    source: 'Gaia DR3 (I/355/gaiadr3)'
  },
  {
    id: 'comet-3i-atlas',
    name: 'Comet 3I/ATLAS',
    shortName: '3I/ATLAS',
    category: 'Comet',
    ra: 182.415,
    dec: 14.852,
    pmra: 0,
    pmdec: 0,
    parallax: 0,
    isSolarSystem: true,
    solarSystemKey: '3I/ATLAS',
    caption: 'Solar system comet; observed by SPHEREx in Aug and Dec 2025 during nominal all-sky sweeps.',
    source: 'JPL Horizons (DES=3I)'
  },
  {
    id: 'makemake',
    name: 'Makemake',
    shortName: 'Makemake',
    category: 'Trans-Neptunian Object',
    ra: 195.421,
    dec: 28.140,
    pmra: 0,
    pmdec: 0,
    parallax: 0,
    isSolarSystem: true,
    solarSystemKey: 'Makemake',
    caption: 'Distant Kuiper Belt dwarf planet at ~52 AU; exhibits Planet-X-like slow orbital motion (~3″/yr).',
    source: 'JPL Horizons (DES=136472)'
  },
  {
    id: 'random-patch',
    name: 'Random Sky Patch',
    shortName: 'Random Patch',
    category: 'High-Latitude Field',
    ra: 165.250,
    dec: 38.450,
    pmra: 0,
    pmdec: 0,
    parallax: 0,
    isSolarSystem: false,
    caption: 'Random high-galactic-latitude pointing (|b| > 30°) displaying standard SPHEREx survey cadence and background stars.',
    source: 'SPHEREx Nominal Grid'
  }
];

export function getRandomSkyPatch() {
  // Generate random pointing with |b| > 30 deg
  const ra = parseFloat((Math.random() * 360).toFixed(4));
  const dec = parseFloat(((Math.random() * 120) - 60).toFixed(4));
  return {
    id: 'random-patch',
    name: `Field (${ra}°, ${dec}°)`,
    shortName: 'Random Patch',
    category: 'Sample Sky Field',
    ra,
    dec,
    pmra: 0,
    pmdec: 0,
    parallax: 0,
    isSolarSystem: false,
    caption: `Random high-latitude pointing at RA ${ra}°, Dec ${dec}°.`,
    source: 'SPHEREx Pointing Grid'
  };
}
