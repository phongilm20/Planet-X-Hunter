import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Maximize2, 
  Sliders, 
  Gauge, 
  Search, 
  RotateCcw,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { SPHEREX_BANDS, bandToWavelength, bandToDetector, raToHMS, decToDMS } from '../data/targets';

export default function SettingsDrawer({
  isOpen,
  onClose,
  fov,
  onFovChange,
  band,
  onBandChange,
  stretch,
  onStretchChange,
  blinkSpeed,
  onBlinkSpeedChange,
  mode,
  ra,
  dec,
  onCoordsChange,
}) {
  const [inputRa, setInputRa] = useState('');
  const [inputDec, setInputDec] = useState('');

  const wavelength = bandToWavelength(band);
  const currentDetector = bandToDetector(band);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualCoords = (e) => {
    e.preventDefault();
    const parsedRa = parseFloat(inputRa);
    const parsedDec = parseFloat(inputDec);
    if (!isNaN(parsedRa) && !isNaN(parsedDec) && onCoordsChange) {
      onCoordsChange(parsedRa, parsedDec);
      setInputRa('');
      setInputDec('');
    }
  };

  const handleResetDefaults = () => {
    onFovChange?.(5.0);
    onBandChange?.(50);
    onStretchChange?.('linear');
    onBlinkSpeedChange?.(2.0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm h-full bg-[#0E131F]/95 backdrop-blur-2xl border-l border-gray-800/90 shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-gray-100 tracking-wide">
              Advanced Settings & Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 space-y-6 text-xs text-gray-300">
          {/* Current Target Coordinates HUD */}
          <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800/80">
            <div className="flex items-center gap-1.5 text-gray-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Current Celestial Pointing</span>
            </div>
            <div className="font-mono text-gray-200 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">RA (J2000):</span>
                <span>{ra?.toFixed(5)}° ({raToHMS(ra || 0)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dec (J2000):</span>
                <span>{dec?.toFixed(5)}° ({decToDMS(dec || 0)})</span>
              </div>
            </div>
          </div>

          {/* ── 1. SPHEREx Wavelength Band Scrubber (1-102) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                SPHEREx Band ({band}/102)
              </span>
              <span className="font-mono font-bold text-cyan-400 text-xs bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                λ = {wavelength.toFixed(3)} µm
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="102"
              value={band}
              onChange={(e) => onBandChange?.(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-gray-500">0.75 µm</span>
              <span
                className="px-2 py-0.5 rounded text-[9px] font-bold"
                style={{
                  backgroundColor: `${currentDetector.color}20`,
                  color: currentDetector.color,
                  border: `1px solid ${currentDetector.color}60`,
                }}
              >
                {currentDetector.name} ({currentDetector.startWl}–{currentDetector.endWl} µm)
              </span>
              <span className="text-gray-500">5.00 µm</span>
            </div>
          </div>

          {/* ── 2. Field of View (FoV) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-gray-300">
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                Field of View (FoV)
              </span>
              <span className="font-mono text-cyan-400 font-bold bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                {fov?.toFixed(1)} arcmin
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={fov}
              onChange={(e) => onFovChange?.(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>1.0′ (Deep Zoom)</span>
              <span>15.0′ (Wide Survey)</span>
            </div>
          </div>

          {/* ── 3. Pixel Contrast Stretch ── */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 font-semibold text-gray-300">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Dynamic Contrast Stretch
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'linear', label: 'Linear', desc: 'Direct ADU' },
                { id: 'log', label: 'Log', desc: 'Faint structures' },
                { id: 'asinh', label: 'Asinh', desc: 'ZScale / HDR' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onStretchChange?.(s.id)}
                  className={`py-2 px-1 rounded-lg text-center font-mono text-[10px] border transition-all ${
                    stretch === s.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                      : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 text-gray-400'
                  }`}
                >
                  <div className="uppercase">{s.label}</div>
                  <div className="text-[8px] text-gray-500 font-sans mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 4. Blink Rate ── */}
          <div className="space-y-2 p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Gauge className="w-3.5 h-3.5" />
                Blink Comparator Rate
              </span>
              <span className="font-mono text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                {blinkSpeed} Hz
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={blinkSpeed}
              onChange={(e) => onBlinkSpeedChange?.(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[9px] text-gray-500 font-mono">
              <span>0.5 Hz (Slow)</span>
              <span>5.0 Hz (Rapid)</span>
            </div>
          </div>

          {/* ── 5. Goto Celestial Coordinates ── */}
          <form onSubmit={handleManualCoords} className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
              <Search className="w-3 h-3 text-cyan-400" />
              <span>Slew to Celestial Coordinates</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <label className="text-[9px] text-gray-500 block mb-1">RA (Degrees)</label>
                <input
                  type="number"
                  step="any"
                  placeholder={ra ? `${ra.toFixed(4)}°` : 'RA (deg)'}
                  value={inputRa}
                  onChange={(e) => setInputRa(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-gray-500 block mb-1">Dec (Degrees)</label>
                <input
                  type="number"
                  step="any"
                  placeholder={dec ? `${dec.toFixed(4)}°` : 'Dec (deg)'}
                  value={inputDec}
                  onChange={(e) => setInputDec(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 text-xs shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              Center Telescope & Cutout
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
