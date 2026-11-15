import React, { useState } from 'react';
import { 
  Rocket, 
  Search, 
  BookOpen, 
  Sun, 
  Flame, 
  Moon, 
  Compass, 
  Sparkles,
  Navigation
} from 'lucide-react';
import { NASA_TARGETS } from '../data/targets';

export default function TopBarAero({
  selectedTarget,
  onSelectTarget,
  palette,
  setPalette,
  onOpenGuide,
  onCustomCoords,
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
    <header className="fixed top-3 inset-x-3 z-40 flex items-center justify-between gap-3 px-4 py-2.5 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] text-slate-900 select-none transition-all duration-300">
      
      {/* ── Left: NASA Badge + App Title ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black tracking-widest text-white shadow-md border border-white/80">
            NASA
          </div>
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-slate-900 leading-tight">
              SPHEREx 3D Explorer
            </div>
            <div className="text-[9px] font-mono font-bold text-sky-600">
              Photorealistic Time-Domain
            </div>
          </div>
        </div>
      </div>

      {/* ── Center: NASA Target Pills Bar ── */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-2">
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
                  : 'bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/90 shadow-sm font-medium'
              }`}
            >
              <span className="text-sm">{t.icon || '✨'}</span>
              <span>{t.shortName || t.name}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                  isSelected
                    ? 'bg-sky-700 text-sky-100 border-sky-500'
                    : isDipole
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isDipole ? `${t.properMotion?.total?.toFixed(1) || '8.1'}″/yr` : 'Var'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Right: Custom Coordinate Warp, Palette, Guide ── */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* Custom Coordinate Search Button / Modal Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all"
            title="Warp to custom RA/Dec coordinates"
          >
            <Search className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden xl:inline">Warp to Coords</span>
          </button>

          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="absolute top-10 right-0 w-64 p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl space-y-2 text-xs"
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
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs focus:outline-sky-500"
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
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 font-mono text-xs focus:outline-sky-500"
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
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setPalette('daylight')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'daylight' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Daylight Sky Palette (Bright)"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-bold transition-all shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Guide</span>
        </button>

      </div>

    </header>
  );
}
