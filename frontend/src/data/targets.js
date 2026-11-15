export const NASA_TARGETS = [
  {
    name: "WISE 0855-0714",
    shortName: "WISE 0855",
    ra: 133.79513,
    dec: -7.24515,
    type: "Sub-Brown Dwarf",
    spectralType: "Y1",
    description: "Planetary-mass object ~7.3 ly away. Extreme proper motion (~8.1″/yr). Strong CH₄/H₂O absorption at 3.3-5.0 µm. Invisible in optical.",
    properMotion: { ra: -8.1, dec: 0.7, total: 8.13 },
    parallax: 448.0,
    distanceLy: 7.3,
    color: "#0284C7",
    icon: "❄️",
    expectedSignature: "dipole",
    position3D: [-32, 12, 15],
  },
  {
    name: "Barnard's Star",
    shortName: "Barnard's",
    ra: 269.45208,
    dec: 4.69339,
    type: "Red Dwarf (M4Ve)",
    spectralType: "M4Ve",
    description: "Highest known proper motion ~10.3″/yr. Clear northward positional shift across epochs.",
    properMotion: { ra: -0.8, dec: 10.3, total: 10.33 },
    parallax: 547.4,
    distanceLy: 5.96,
    color: "#EF4444",
    icon: "🔴",
    expectedSignature: "dipole",
    position3D: [18, 28, -22],
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
    parallax: 275.8,
    distanceLy: 11.9,
    color: "#F97316",
    icon: "🟠",
    expectedSignature: "dipole",
    position3D: [24, -32, 16],
  },
  {
    name: "RW Aurigae",
    shortName: "RW Aur",
    ra: 76.95625,
    dec: 30.40139,
    type: "T Tauri Variable",
    spectralType: "K1Ve",
    description: "Young variable star with circumstellar disk. Position stays fixed, but flux drops/flares significantly between epochs.",
    properMotion: { ra: 0.0, dec: 0.0, total: 0.0 },
    parallax: 6.1,
    distanceLy: 530.0,
    color: "#FBBF24",
    icon: "⭐",
    expectedSignature: "monopole",
    position3D: [-20, 26, 28],
  },
  {
    name: "R Draconis",
    shortName: "R Dra",
    ra: 248.17042,
    dec: 66.75639,
    type: "Mira Variable (Red Giant)",
    spectralType: "M6IIIe",
    description: "Dramatic infrared brightness variation over 6-month SPHEREx cadence (~245-day pulsation cycle).",
    properMotion: { ra: 0.0, dec: 0.0, total: 0.0 },
    parallax: 1.5,
    distanceLy: 2100.0,
    color: "#A855F7",
    icon: "💫",
    expectedSignature: "monopole",
    position3D: [12, 38, 14],
  },
  {
    name: "Planet X Candidate (Sedna-Zone)",
    shortName: "Planet X Search",
    ra: 62.45000,
    dec: -12.35000,
    type: "Extreme TNO / Planet X Candidate",
    spectralType: "Cold Ice Body (42K)",
    description: "Hypothetical outer Solar System planet (~450 AU). Extreme cold thermal peak at 4.7 µm; very slow motion (~0.16″/yr).",
    properMotion: { ra: -0.15, dec: -0.05, total: 0.16 },
    parallax: 2.2,
    distanceLy: 0.0071,
    color: "#06B6D4",
    icon: "🪐",
    expectedSignature: "dipole",
    position3D: [-35, -15, -25],
  },
];

// 8 Observational Epochs Specification (2014.5 to 2027.0)
export const OBSERVATIONAL_EPOCHS = [
  { id: 1, label: "2014.5", fullLabel: "Epoch 1 (2014.5 - WISE/NEOWISE)", survey: "WISE/NEOWISE", year: 2014.5, deltaYears: 0.0, mission: "All-Sky Baseline" },
  { id: 2, label: "2018.0", fullLabel: "Epoch 2 (2018.0 - NEOWISE-R)", survey: "NEOWISE-R", year: 2018.0, deltaYears: 3.5, mission: "Time-Domain Recon" },
  { id: 3, label: "2022.0", fullLabel: "Epoch 3 (2022.0 - NEOWISE-R QR)", survey: "NEOWISE-R QR", year: 2022.0, deltaYears: 7.5, mission: "Pre-Launch Baseline" },
  { id: 4, label: "2025.0", fullLabel: "Epoch 4 (2025.0 - SPHEREx DR1)", survey: "SPHEREx DR1 (M0)", year: 2025.0, deltaYears: 10.5, mission: "First All-Sky Pass" },
  { id: 5, label: "2025.5", fullLabel: "Epoch 5 (2025.5 - SPHEREx DR1)", survey: "SPHEREx DR1 (M6)", year: 2025.5, deltaYears: 11.0, mission: "Second Sky Pass" },
  { id: 6, label: "2026.0", fullLabel: "Epoch 6 (2026.0 - SPHEREx QR2)", survey: "SPHEREx QR2 (M12)", year: 2026.0, deltaYears: 11.5, mission: "Third Sky Pass" },
  { id: 7, label: "2026.5", fullLabel: "Epoch 7 (2026.5 - SPHEREx QR3)", survey: "SPHEREx QR3 (M18)", year: 2026.5, deltaYears: 12.0, mission: "Fourth Sky Pass" },
  { id: 8, label: "2027.0", fullLabel: "Epoch 8 (2027.0 - SPHEREx DR2)", survey: "SPHEREx DR2 (M24)", year: 2027.0, deltaYears: 12.5, mission: "Complete Survey Stack" },
];

// SPHEREx detector band definitions (0.75 - 5.0 µm)
export const SPHEREX_BANDS = [
  { id: 1, name: "Band 1", startWl: 0.75, endWl: 1.11, startCh: 1, endCh: 17, color: "#3B82F6" },
  { id: 2, name: "Band 2", startWl: 1.11, endWl: 1.64, startCh: 18, endCh: 34, color: "#8B5CF6" },
  { id: 3, name: "Band 3", startWl: 1.64, endWl: 2.42, startCh: 35, endCh: 51, color: "#10B981" },
  { id: 4, name: "Band 4", startWl: 2.42, endWl: 3.82, startCh: 52, endCh: 68, color: "#F59E0B" },
  { id: 5, name: "Band 5", startWl: 3.82, endWl: 4.42, startCh: 69, endCh: 85, color: "#EF4444" },
  { id: 6, name: "Band 6", startWl: 4.42, endWl: 5.00, startCh: 86, endCh: 102, color: "#EC4899" },
];

// Color Palettes
export const SKY_PALETTES = [
  { id: "daylight", label: "Daylight Print", desc: "Negative High-Contrast Print (Bright)", icon: "☀️", bg: "#F8FAFC", text: "#0F172A" },
  { id: "infrared", label: "Thermal IR", desc: "False-Color Infrared (Gold & Magenta)", icon: "🔥", bg: "#1E1B4B", text: "#FDE047" },
  { id: "deepspace", label: "Deep Space", desc: "NASA Dark Space Optical", icon: "🌌", bg: "#070A12", text: "#38BDF8" },
];

export const CONTAMINATION_FLAGS = {
  CLEAN: { color: "#10B981", symbol: "circle", label: "Clean" },
  SOURCE_CONFUSION: { color: "#F97316", symbol: "triangle-up", label: "Source Confusion" },
  DIFFRACTION_SPIKE: { color: "#EF4444", symbol: "diamond", label: "Diffraction Spike" },
  COSMIC_RAY: { color: "#EC4899", symbol: "star", label: "Cosmic Ray" },
  SATURATED: { color: "#FBBF24", symbol: "square", label: "Saturated" },
};

export function bandToWavelength(band) {
  return 0.75 + (band - 1) * (5.0 - 0.75) / 101;
}

export function bandToDetector(band) {
  return SPHEREX_BANDS.find(b => band >= b.startCh && band <= b.endCh) || SPHEREX_BANDS[0];
}

export function raToHMS(raDeg) {
  const totalHours = (raDeg % 360) / 15.0;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  const s = ((totalHours - h) * 60 - m) * 60;
  return h.toString().padStart(2, '0') + 'h' + m.toString().padStart(2, '0') + 'm' + s.toFixed(2).padStart(5, '0') + 's';
}

export function decToDMS(decDeg) {
  const sign = decDeg >= 0 ? '+' : '-';
  const absDec = Math.abs(decDeg);
  const d = Math.floor(absDec);
  const m = Math.floor((absDec - d) * 60);
  const s = ((absDec - d) * 60 - m) * 60;
  return sign + d.toString().padStart(2, '0') + '°' + m.toString().padStart(2, '0') + "'" + s.toFixed(1).padStart(4, '0') + '"';
}
