export const NASA_TARGETS = [
  {
    name: "WISE 0855-0714",
    shortName: "WISE 0855",
    ra: 133.79513,
    dec: -7.24515,
    type: "Sub-Brown Dwarf",
    spectralType: "Y1",
    description: "Planetary-mass object ~7.3 ly away. Extreme proper motion ~8.1 arcsec/yr. Strong CH₄/H₂O absorption at 3.3-5.0 µm. Invisible in optical bands.",
    properMotion: { ra: -8.1, dec: 0.7, total: 8.13 },
    color: "#3B82F6",
    icon: "❄️",
    expectedSignature: "dipole",
  },
  {
    name: "Barnard's Star",
    shortName: "Barnard's",
    ra: 269.45208,
    dec: 4.69339,
    type: "Red Dwarf (M4Ve)",
    spectralType: "M4Ve",
    description: "Highest known proper motion ~10.3 arcsec/yr. Clear northward positional shift across epochs.",
    properMotion: { ra: -0.8, dec: 10.3, total: 10.33 },
    color: "#EF4444",
    icon: "🔴",
    expectedSignature: "dipole",
  },
  {
    name: "Epsilon Indi B",
    shortName: "ε Indi B",
    ra: 331.04375,
    dec: -56.78278,
    type: "Binary Brown Dwarf (T1+T6)",
    spectralType: "T1+T6",
    description: "Binary T-dwarf system ~12 ly away. Distinct NIR spectral peaks at 1.05, 1.25, 1.6, 2.1 µm.",
    properMotion: { ra: 3.96, dec: -2.54, total: 4.70 },
    color: "#F97316",
    icon: "🟠",
    expectedSignature: "dipole",
  },
  {
    name: "RW Aurigae",
    shortName: "RW Aur",
    ra: 76.95625,
    dec: 30.40139,
    type: "T Tauri Variable",
    spectralType: "K1Ve",
    description: "Young variable star. Position fixed but flux drops/flares significantly between epochs.",
    properMotion: { ra: 0.0, dec: 0.0, total: 0.0 },
    color: "#FBBF24",
    icon: "⭐",
    expectedSignature: "monopole",
  },
  {
    name: "R Draconis",
    shortName: "R Dra",
    ra: 248.17042,
    dec: 66.75639,
    type: "Mira Variable (Red Giant)",
    spectralType: "M6IIIe",
    description: "Dramatic infrared brightness variation over 6-month SPHEREx cadence.",
    properMotion: { ra: 0.0, dec: 0.0, total: 0.0 },
    color: "#A855F7",
    icon: "💫",
    expectedSignature: "monopole",
  },
];

// SPHEREx detector band definitions
export const SPHEREX_BANDS = [
  { id: 1, name: "Band 1", startWl: 0.75, endWl: 1.11, startCh: 1, endCh: 17, color: "#3B82F6" },
  { id: 2, name: "Band 2", startWl: 1.11, endWl: 1.64, startCh: 18, endCh: 34, color: "#8B5CF6" },
  { id: 3, name: "Band 3", startWl: 1.64, endWl: 2.42, startCh: 35, endCh: 51, color: "#10B981" },
  { id: 4, name: "Band 4", startWl: 2.42, endWl: 3.82, startCh: 52, endCh: 68, color: "#F59E0B" },
  { id: 5, name: "Band 5", startWl: 3.82, endWl: 4.42, startCh: 69, endCh: 85, color: "#EF4444" },
  { id: 6, name: "Band 6", startWl: 4.42, endWl: 5.00, startCh: 86, endCh: 102, color: "#EC4899" },
];

// Contamination flag definitions
export const CONTAMINATION_FLAGS = {
  CLEAN: { color: "#10B981", symbol: "circle", label: "Clean" },
  SOURCE_CONFUSION: { color: "#F97316", symbol: "triangle-up", label: "Source Confusion" },
  DIFFRACTION_SPIKE: { color: "#EF4444", symbol: "diamond", label: "Diffraction Spike" },
  COSMIC_RAY: { color: "#EC4899", symbol: "star", label: "Cosmic Ray" },
  SATURATED: { color: "#FBBF24", symbol: "square", label: "Saturated" },
};

// Helper: convert band number (1-102) to wavelength in µm
export function bandToWavelength(band) {
  return 0.75 + (band - 1) * (5.0 - 0.75) / 101;
}

// Helper: find which detector a band belongs to
export function bandToDetector(band) {
  return SPHEREX_BANDS.find(b => band >= b.startCh && band <= b.endCh) || SPHEREX_BANDS[0];
}

// Helper: convert decimal degrees to sexagesimal string
export function raToHMS(raDeg) {
  const totalHours = raDeg / 15.0;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  const s = ((totalHours - h) * 60 - m) * 60;
  return h.toString().padStart(2,'0') + 'h' + m.toString().padStart(2,'0') + 'm' + s.toFixed(2).padStart(5,'0') + 's';
}

export function decToDMS(decDeg) {
  const sign = decDeg >= 0 ? '+' : '-';
  const absDec = Math.abs(decDeg);
  const d = Math.floor(absDec);
  const m = Math.floor((absDec - d) * 60);
  const s = ((absDec - d) * 60 - m) * 60;
  return sign + d.toString().padStart(2,'0') + '°' + m.toString().padStart(2,'0') + "'" + s.toFixed(1).padStart(4,'0') + '"';
}
