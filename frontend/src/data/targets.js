// Astronomical coordinate conversion helper: (RA, Dec in degrees) -> 3D Cartesian Vector
export function raDecToCartesian(raDeg, decDeg, radius = 80) {
  const raRad = (raDeg * Math.PI) / 180.0;
  const decRad = (decDeg * Math.PI) / 180.0;
  return [
    radius * Math.cos(decRad) * Math.cos(raRad),
    radius * Math.sin(decRad),
    -radius * Math.cos(decRad) * Math.sin(raRad),
  ];
}

export const NASA_TARGETS = [
  {
    name: "WISE 0855-0714",
    shortName: "WISE 0855",
    ra: 133.79513,
    dec: -7.24515,
    type: "Sub-Brown Dwarf",
    spectralType: "Y1 (Coldest Known)",
    description: "Planetary-mass object ~7.3 ly away. Extreme proper motion (~8.13″/yr). Strong CH₄ & H₂O ice absorption at 3.3–5.0 µm. Invisible in optical light.",
    properMotion: { ra: -8.1, dec: 0.7, total: 8.13 },
    parallax: 448.0,
    distanceLy: 7.3,
    tempK: 250,
    color: "#38BDF8", // Ice Blue
    emissiveColor: "#0284C7",
    haloColor: "#0EA5E9",
    starRadius: 1.3,
    icon: "❄️",
    expectedSignature: "dipole",
    lightCurveType: "motion",
    position3D: raDecToCartesian(133.79513, -7.24515, 65),
    discoveryYear: 2014,
    notes: "Prime benchmark for outer Solar System rogue planets and Planet X analogues.",
  },
  {
    name: "Barnard's Star",
    shortName: "Barnard's",
    ra: 269.45208,
    dec: 4.69339,
    type: "Red Dwarf (M4Ve)",
    spectralType: "M4Ve Flare Star",
    description: "Highest known proper motion (~10.33″/yr). Clear northward positional leap across SPHEREx epochs. Second-closest stellar system to Earth.",
    properMotion: { ra: -0.8, dec: 10.3, total: 10.33 },
    parallax: 547.4,
    distanceLy: 5.96,
    tempK: 3100,
    color: "#EF4444", // Fiery Crimson
    emissiveColor: "#DC2626",
    haloColor: "#F87171",
    starRadius: 1.8,
    icon: "🔴",
    expectedSignature: "dipole",
    lightCurveType: "motion",
    position3D: raDecToCartesian(269.45208, 4.69339, 65),
    discoveryYear: 1916,
    notes: "High proper motion benchmark for time-domain astrometric calibration.",
  },
  {
    name: "Epsilon Indi B",
    shortName: "ε Indi B",
    ra: 331.04375,
    dec: -56.78278,
    type: "Binary Brown Dwarf (T1+T6)",
    spectralType: "T1 + T6 Binary",
    description: "Binary T-dwarf system ~12 ly away. Distinct NIR spectral peaks at 1.05, 1.25, 1.6, and 2.1 µm with methane absorption bands.",
    properMotion: { ra: 3.96, dec: -2.54, total: 4.70 },
    parallax: 275.8,
    distanceLy: 11.9,
    tempK: 1100,
    color: "#F97316", // Warm Amber
    emissiveColor: "#EA580C",
    haloColor: "#FB923C",
    starRadius: 1.5,
    icon: "🟠",
    expectedSignature: "dipole",
    lightCurveType: "motion",
    position3D: raDecToCartesian(331.04375, -56.78278, 65),
    discoveryYear: 2003,
    notes: "Spectrophotometric standard for cool substellar atmospheres.",
  },
  {
    name: "RW Aurigae",
    shortName: "RW Aur",
    ra: 76.95625,
    dec: 30.40139,
    type: "T Tauri Variable Star",
    spectralType: "K1Ve + Circumstellar Disk",
    description: "Young pre-main-sequence star with active circumstellar accretion disk. Position stays fixed, but infrared flux fluctuates up to 3 magnitudes.",
    properMotion: { ra: 0.001, dec: -0.015, total: 0.015 },
    parallax: 6.1,
    distanceLy: 530.0,
    tempK: 4500,
    color: "#FBBF24", // Golden Yellow
    emissiveColor: "#D97706",
    haloColor: "#FDE68A",
    starRadius: 2.1,
    hasDisk: true,
    icon: "⭐",
    expectedSignature: "monopole",
    lightCurveType: "ttauri",
    position3D: raDecToCartesian(76.95625, 30.40139, 65),
    discoveryYear: 1906,
    notes: "Circumstellar disk occultation tests time-domain infrared flux variability.",
  },
  {
    name: "R Draconis",
    shortName: "R Dra",
    ra: 248.17042,
    dec: 66.75639,
    type: "Mira Variable (Red Giant)",
    spectralType: "M6IIIe Pulsating Giant",
    description: "Dramatic infrared brightness variation over 6-month SPHEREx cadence (~245-day pulsation cycle). Expands and contracts with massive luminosity swings.",
    properMotion: { ra: 0.005, dec: -0.008, total: 0.009 },
    parallax: 1.5,
    distanceLy: 2100.0,
    tempK: 2800,
    color: "#C084FC", // Violet / Rose Giant
    emissiveColor: "#9333EA",
    haloColor: "#E9D5FF",
    starRadius: 3.2,
    icon: "💫",
    expectedSignature: "monopole",
    lightCurveType: "mira",
    periodYears: 0.67,
    position3D: raDecToCartesian(248.17042, 66.75639, 65),
    discoveryYear: 1876,
    notes: "Pulsating asymptotic giant branch standard with silicate dust shell.",
  },
  {
    name: "Planet X Candidate (Sedna-Zone)",
    shortName: "Planet X Search",
    ra: 62.45000,
    dec: -12.35000,
    type: "Extreme TNO / Planet X Candidate",
    spectralType: "Sub-Neptune Ice Giant (42 K)",
    description: "Hypothetical outer Solar System planet (~450 AU). Thermal peak at 4.7 µm; very slow motion (~0.16″/yr). SPHEREx 102 bands isolate it from background stars.",
    properMotion: { ra: -0.15, dec: -0.05, total: 0.16 },
    parallax: 2.2,
    distanceLy: 0.0071,
    tempK: 42,
    color: "#06B6D4", // Deep Luminescent Cyan
    emissiveColor: "#0891B2",
    haloColor: "#67E8F9",
    starRadius: 1.4,
    icon: "🪐",
    expectedSignature: "dipole",
    lightCurveType: "motion",
    position3D: raDecToCartesian(62.45000, -12.35000, 65),
    discoveryYear: 2026,
    notes: "Key objective of the SPHEREx Outer Solar System Planet Search initiative.",
  },
];

// Timeline Milestones from 2010.0 to 2035.0
export const TIMELINE_MILESTONES = [
  { year: 2010.0, label: "2010 WISE", desc: "NASA WISE All-Sky 4-Band Cryogenic Survey" },
  { year: 2014.5, label: "2014.5 NEOWISE", desc: "NEOWISE Reactivation Baseline (Epoch 1)" },
  { year: 2018.0, label: "2018 NEOWISE-R", desc: "NEOWISE Multi-Epoch Astrometry Check (Epoch 2)" },
  { year: 2022.0, label: "2022 Pre-Launch", desc: "SPHEREx Pre-Launch Astrometric Baseline" },
  { year: 2025.0, label: "2025 SPHEREx DR1", desc: "SPHEREx First 102-Band All-Sky Pass (M0)" },
  { year: 2025.5, label: "2025.5 DR1 M6", desc: "Second Sky Pass — 6-Month Baseline Difference" },
  { year: 2026.0, label: "2026 QR2", desc: "Third Sky Pass — Dipole Confirmation" },
  { year: 2026.5, label: "2026.5 QR3", desc: "High-Precision 18-Month Multi-Epoch Stack" },
  { year: 2027.0, label: "2027 DR2", desc: "SPHEREx Final 2-Year Full Data Release" },
  { year: 2035.0, label: "2035 Projection", desc: "10-Year Proper Motion Extrapolation" },
];

// SPHEREx 102 detector band definitions (0.75 - 5.0 µm)
export const SPHEREX_BANDS = [
  { id: 1, name: "Band 1", startWl: 0.75, endWl: 1.11, startCh: 1, endCh: 17, color: "#3B82F6" },
  { id: 2, name: "Band 2", startWl: 1.11, endWl: 1.64, startCh: 18, endCh: 34, color: "#8B5CF6" },
  { id: 3, name: "Band 3", startWl: 1.64, endWl: 2.42, startCh: 35, endCh: 51, color: "#10B981" },
  { id: 4, name: "Band 4", startWl: 2.42, endWl: 3.82, startCh: 52, endCh: 68, color: "#F59E0B" },
  { id: 5, name: "Band 5", startWl: 3.82, endWl: 4.42, startCh: 69, endCh: 85, color: "#EF4444" },
  { id: 6, name: "Band 6", startWl: 4.42, endWl: 5.00, startCh: 86, endCh: 102, color: "#EC4899" },
];

export function bandToWavelength(band) {
  return 0.75 + ((band - 1) * (5.0 - 0.75)) / 101;
}

export function bandToDetector(band) {
  return SPHEREX_BANDS.find((b) => band >= b.startCh && band <= b.endCh) || SPHEREX_BANDS[0];
}

export function raToHMS(raDeg) {
  const totalHours = (raDeg % 360) / 15.0;
  const h = Math.floor(totalHours);
  const m = Math.floor((totalHours - h) * 60);
  const s = ((totalHours - h) * 60 - m) * 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(2).padStart(5, '0')}s`;
}

export function decToDMS(decDeg) {
  const sign = decDeg >= 0 ? '+' : '-';
  const absDec = Math.abs(decDeg);
  const d = Math.floor(absDec);
  const m = Math.floor((absDec - d) * 60);
  const s = ((absDec - d) * 60 - m) * 60;
  return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}
