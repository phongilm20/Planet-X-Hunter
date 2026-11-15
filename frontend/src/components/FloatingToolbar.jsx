import React from 'react';
import { 
  Layers, 
  Film, 
  Sparkles, 
  Eye, 
  Activity, 
  Radar, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function FloatingToolbar({
  mode,
  setMode,
  showAnomalies,
  setShowAnomalies,
  showSpectrum,
  setShowSpectrum,
  onOpenSettings,
  band,
  wavelength,
}) {
  const MODES = [
    { id: 'epoch1', label: 'Epoch 1', badge: 'DR1', icon: Layers, activeColor: 'text-blue-400 border-blue-400 bg-blue-950/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
    { id: 'epoch2', label: 'Epoch 2', badge: 'QR3', icon: Layers, activeColor: 'text-emerald-400 border-emerald-400 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]' },
    { id: 'blink', label: 'Auto Blink', badge: 'Motion', icon: Film, activeColor: 'text-amber-400 border-amber-400 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]' },
    { id: 'diff', label: 'Difference', badge: 'Dipoles', icon: Sparkles, activeColor: 'text-fuchsia-400 border-fuchsia-400 bg-fuchsia-950/60 shadow-[0_0_12px_rgba(217,70,239,0.3)]' },
    { id: 'coadd', label: 'Co-Add', badge: 'SNR Boost', icon: Eye, activeColor: 'text-cyan-400 border-cyan-400 bg-cyan-950/60 shadow-[0_0_12px_rgba(56,189,248,0.3)]' },
  ];

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-full bg-gray-950/85 backdrop-blur-xl border border-gray-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-xs text-gray-200">
      {/* ── Mode selector buttons ── */}
      <div className="flex items-center gap-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                isActive
                  ? m.activeColor
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
              {isActive && (
                <span className="text-[9px] font-mono opacity-80 uppercase px-1 py-0.2 rounded bg-white/10">
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-5 w-[1px] bg-gray-800 mx-0.5" />

      {/* ── Quick Anomaly Toggle ── */}
      <button
        onClick={() => setShowAnomalies(!showAnomalies)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
          showAnomalies
            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
        }`}
        title="Toggle >3.2σ Dipole / Anomaly Highlighting"
      >
        <Radar className={`w-3.5 h-3.5 ${showAnomalies ? 'text-cyan-400 animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
        <span>Dipole Finder</span>
        {showAnomalies && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </button>

      {/* ── Spectrum Panel Toggle ── */}
      <button
        onClick={() => setShowSpectrum(!showSpectrum)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
          showSpectrum
            ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
            : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
        }`}
        title="Toggle 102-Band Near-IR Spectrograph Panel"
      >
        <Activity className="w-3.5 h-3.5 text-amber-400" />
        <span>102-Band Spectrum</span>
        {showSpectrum ? (
          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      <div className="h-5 w-[1px] bg-gray-800 mx-0.5" />

      {/* ── Advanced Settings Button ── */}
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-800 hover:border-gray-700 bg-gray-900/60 hover:bg-gray-800/60 text-gray-300 hover:text-white transition-all duration-200 font-medium"
        title="Open Filters & Advanced Settings Drawer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Settings</span>
        <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
          Band #{band}
        </span>
      </button>
    </div>
  );
}
