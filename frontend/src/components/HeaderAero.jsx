import React from 'react';
import TargetBar from './TargetBar';
import { 
  Globe, 
  Telescope, 
  Sun, 
  Flame, 
  Moon, 
  BookOpen, 
  SlidersHorizontal,
  FlaskConical,
  Compass,
  Sparkles
} from 'lucide-react';
import { SKY_PALETTES } from '../data/targets';

export default function HeaderAero({
  viewMode, // 'orbit' | 'telescope'
  setViewMode,
  personaMode, // 'explorer' | 'scientist'
  setPersonaMode,
  palette,
  setPalette,
  selectedTarget,
  onSelectTarget,
  onOpenSettings,
  onOpenGuide,
  onOpenScientistDrawer,
  band,
}) {
  return (
    <header className="fixed top-3 inset-x-3 z-40 flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.15)] text-slate-900 transition-all duration-300">
      {/* ── Left: NASA Logo + View Mode Switch (3D Orbit vs Telescope) ── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black tracking-widest text-white shadow-md border border-white/80">
            NASA
          </div>
          <div>
            <div className="text-xs font-black tracking-wider uppercase text-slate-900 leading-tight">
              SPHEREx Explorer
            </div>
            <div className="text-[9px] font-mono font-bold text-sky-600">
              Time-Domain Near-IR
            </div>
          </div>
        </div>

        {/* 3D Orbit vs Telescope View Switcher */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setViewMode('orbit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 ${
              viewMode === 'orbit'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D Earth Orbit</span>
          </button>
          <button
            onClick={() => setViewMode('telescope')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-200 ${
              viewMode === 'telescope'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Telescope className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telescope View</span>
          </button>
        </div>
      </div>

      {/* ── Center: NASA Targets Bar ── */}
      <div className="flex-1 max-w-xl hidden xl:block">
        <TargetBar
          selectedTarget={selectedTarget}
          onSelect={onSelectTarget}
        />
      </div>

      {/* ── Right: Persona Mode Toggle + Palette + Actions ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Persona Mode Switch: Explorer vs Scientist */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setPersonaMode('explorer')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 ${
              personaMode === 'explorer'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Explorer Mode: Simple, visual, time-scrubbing for citizen scientists"
          >
            <span>🌍</span>
            <span className="hidden md:inline">Explorer</span>
          </button>
          <button
            onClick={() => setPersonaMode('scientist')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-200 ${
              personaMode === 'scientist'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Scientist Mode: Full 102-band spectrophotometer, raw Gaia & IRSA data"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Scientist</span>
          </button>
        </div>

        {/* Daylight / Negative Print vs Thermal IR Palette Toggle */}
        <div className="flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setPalette('daylight')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'daylight' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Daylight / Negative Astronomical Print (Bright & High Contrast)"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPalette('infrared')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'infrared' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="False-Color Thermal Infrared Palette"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPalette('deepspace')}
            className={`p-1.5 rounded-full transition-all ${
              palette === 'deepspace' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Deep Space Dark Palette"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scientist Console Drawer Toggle (Visible in Scientist Mode) */}
        {personaMode === 'scientist' && (
          <button
            onClick={onOpenScientistDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
            title="Open Scientist Data & 102-Band Spectrogram Drawer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telemetry & Spectrum</span>
          </button>
        )}

        {/* Advanced Filters & Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="Open Advanced Settings & Band Scrubber"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Citizen Science Tutorial Button */}
        <button
          onClick={onOpenGuide}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          title="How to Hunt for Planet X Citizen Tutorial"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
