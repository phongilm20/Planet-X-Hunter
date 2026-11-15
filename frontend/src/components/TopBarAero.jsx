import React, { useState } from 'react';
import { 
  Rocket, 
  Search, 
  BookOpen, 
  Sun, 
  Flame, 
  Moon, 
  Orbit,
  Telescope,
  Play,
  Target as TargetIcon
} from 'lucide-react';
import { NASA_TARGETS } from '../data/targets';

export default function TopBarAero({
  selectedTarget,
  onSelectTarget,
  palette,
  setPalette,
  viewMode = 'deepspace', // 'deepspace' | 'solarsystem'
  onViewModeChange,
  onOpenGuide,
  onCustomCoords,
  onStartHunt,
  onStartGuidedMission,
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [inputRa, setInputRa] = useState('');
  const [inputDec, setInputDec] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const pRa = parseFloat(inputRa);
    const pDec = parseFloat(inputDec);
    if (!isNaN(pRa) && !isNaN(pDec)) {
      onCustomCoords?.(pRa, pDec);
      setShowSearch(false);
    }
  };

  return (
    <header className="fixed top-3 inset-x-3 z-40 flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-3xl bg-white/92 backdrop-blur-2xl border border-white/70 shadow-[0_10px_35px_rgba(0,0,0,0.14)] text-slate-900 select-none transition-all duration-300">
      
      {/* ── Left: NASA Badge + View Mode Switcher (Deep Space vs Solar System) ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black tracking-widest text-white shadow-md border border-white/80">
            NASA
          </div>
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-slate-900 leading-tight">
              Planet X Hunter
            </div>
            <div className="text-[9px] font-mono font-bold text-sky-600">
              SPHEREx Time-Domain
            </div>
          </div>
        </div>

        {/* View Mode Switcher: Deep Space vs Solar System */}
        <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => onViewModeChange?.('deepspace')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              viewMode === 'deepspace'
                ? 'bg-sky-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Photorealistic Deep-Space Target View"
          >
            <Telescope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deep Space</span>
          </button>
          <button
            onClick={() => onViewModeChange?.('solarsystem')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              viewMode === 'solarsystem'
                ? 'bg-cyan-600 text-white shadow-sm font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Outer Solar System & Planet X Orbit Scale"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Solar System</span>
          </button>
        </div>
      </div>

      {/* ── Center: Target Quick-Select Bar ── */}
      <div className="flex-1 max-w-xl hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
        {NASA_TARGETS.map((t) => {
          const isSelected = selectedTarget?.name === t.name;
          const isDipole = t.expectedSignature === 'dipole';

          return (
            <button
              key={t.name}
              onClick={() => onSelectTarget(t)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md font-bold scale-105'
                  : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200 shadow-sm font-medium'
              }`}
            >
              <span className="text-sm">{t.icon || '✨'}</span>
              <span>{t.shortName || t.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Right: Gamified Challenge, Guided Tour, Search & Settings ── */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* 🎯 Hunt Planet X Live Challenge Button */}
        <button
          onClick={onStartHunt}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black shadow-md transition-all duration-200 hover:scale-105 active:scale-95 border border-cyan-300"
          title="Start Live Citizen Scientist Anomaly Challenge"
        >
          <TargetIcon className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Hunt Planet X</span>
        </button>

        {/* ▶ 1-Click Cinematic Guided Mission Button */}
        <button
          onClick={onStartGuidedMission}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all duration-200 hover:scale-105 active:scale-95 border border-slate-700"
          title="Start 45-Second Planetarium Guided Mission with AI Voiceover"
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span className="hidden sm:inline">Guided Mission</span>
        </button>

        {/* Custom Coordinate Search */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Warp to custom RA/Dec coordinates"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="absolute top-10 right-0 w-64 p-3 rounded-2xl bg-white border border-slate-300 shadow-2xl space-y-2 text-xs z-50"
            >
              <div className="font-bold text-slate-900">Warp to Celestial Coordinate</div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">Right Ascension (RA°)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 133.795"
                  value={inputRa}
                  onChange={(e) => setInputRa(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs focus:outline-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">Declination (Dec°)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. -7.245"
                  value={inputDec}
                  onChange={(e) => setInputDec(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-300 font-mono text-xs focus:outline-sky-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all"
              >
                Engage Warp Flight
              </button>
            </form>
          )}
        </div>

        {/* Color Palette Switcher */}
        <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setPalette('daylight')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'daylight' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Daylight Sky Palette (Bright Negative Print)"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPalette('infrared')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'infrared' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Thermal Infrared False-Color"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPalette('deepspace')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'deepspace' ? 'bg-slate-900 text-sky-400 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Deep Space Optical"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Citizen Guide Modal Launcher */}
        <button
          onClick={onOpenGuide}
          className="p-2 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 transition-colors"
          title="Open Citizen Science How-To Guide"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>

      </div>

    </header>
  );
}
