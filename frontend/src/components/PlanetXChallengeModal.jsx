import React from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Share2, 
  X, 
  Compass, 
  Thermometer, 
  Orbit, 
  Layers, 
  Award,
  Globe
} from 'lucide-react';

export default function PlanetXChallengeModal({
  isOpen,
  onClose,
  onExploreIn3D,
}) {
  if (!isOpen) return null;

  const handleDownloadBadge = () => {
    // Generate text discovery log certificate
    const certText = `=====================================================
OFFICIAL NASA SPACE APPS CHALLENGE 2026 DISCOVERY LOG
SPHEREx TIME-DOMAIN SKY EXPLORER: CITIZEN SCIENCE VERIFICATION
=====================================================

Designation: SPHEREx-TNO-2026-X1 (Planet X Candidate)
Status: CONFIRMED ANOMALOUS DIPOLE DETECTION
Discovery Epoch: 2026.5 (SPHEREx QR3 Multi-Epoch Stack)

ASTROMETRIC & PHYSICAL PARAMETERS:
- J2000 Coordinates: RA 62.45000°, Dec -12.35000°
- Semimajor Axis (a): 450 ± 28 AU
- Orbital Period: ~12,850 Earth Years
- Orbital Inclination: 30.2° (Sedna/TNO aligned)
- Estimated Mass: 6.2 ± 1.4 M_Earth (Sub-Neptune)
- Surface Temperature: 42.4 K (-230.8°C)
- Spectral Signature: SPHEREx Band 5/6 (4.2-4.7 µm) CH4/N2 Thermal Peak
- Annual Drift: 0.16″/year (Reflective Parallax Baseline)

VERIFIED CITIZEN ASTRONOMER: NASA Space Apps Explorer
Validated by SPHEREx Time-Domain Detection Pipeline
=====================================================`;

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SPHEREx_Planet_X_Discovery_Report.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.5)] border select-none transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          borderColor: 'rgba(255, 255, 255, 0.9)',
          color: '#0F172A',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target Signal Locked • 100% Anomaly Match</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2 mt-1">
          <span>🪐 Planet X Candidate Detected!</span>
        </h2>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Official NASA Citizen Science Verification · SPHEREx Time-Domain Pipeline
        </p>

        {/* Discovery Certificate Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 border border-sky-200 shadow-inner space-y-3">
          <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">Object Designation</span>
              <span className="text-sm font-black font-mono text-slate-900">SPHEREx-TNO-2026-X1</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-600 text-white font-mono text-xs font-black shadow-sm">
              450 AU • Extreme TNO
            </span>
          </div>

          {/* Astrophysical Parameters Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/80 border border-sky-100">
              <span className="text-[10px] text-slate-500 font-bold block">Estimated Distance</span>
              <span className="text-xs font-extrabold text-slate-900">~450 AU (67 Billion km)</span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-sky-100">
              <span className="text-[10px] text-slate-500 font-bold block">Orbital Period</span>
              <span className="text-xs font-extrabold text-slate-900">~12,850 Years</span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-sky-100">
              <span className="text-[10px] text-slate-500 font-bold block">Surface Temperature</span>
              <span className="text-xs font-extrabold text-cyan-700">42.4 K (-230.8°C)</span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-sky-100">
              <span className="text-[10px] text-slate-500 font-bold block">Spectral Peak</span>
              <span className="text-xs font-extrabold text-indigo-700">4.7 µm (Band 6 Methane)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-700 leading-relaxed font-sans font-medium">
            By scrubbing through multi-epoch SPHEREx observations and detecting the subtle <strong className="text-sky-800">0.16″/year retrograde drift</strong>, you separated this frozen rogue planet candidate from 200 static background Gaia stars!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-5">
          <button
            onClick={handleDownloadBadge}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Discovery Certificate</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onExploreIn3D?.();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md transition-all active:scale-95"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>View in Solar System Scale</span>
          </button>
        </div>
      </div>
    </div>
  );
}
