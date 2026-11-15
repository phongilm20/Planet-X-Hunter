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
      onClose();
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Bright VisionOS Aero-Glass) */}
      <div className="relative w-full max-w-sm h-full bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 shadow-2xl flex flex-col z-10 overflow-y-auto text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              Advanced Settings & Filters
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 text-xs text-slate-700">
          {/* Current Target Coordinates HUD */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-2 uppercase tracking-wider text-[10px]">
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span>Celestial Pointing (J2000)</span>
            </div>
            <div className="font-mono text-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Right Ascension:</span>
                <span className="font-bold">{ra?.toFixed(5)}° ({raToHMS(ra || 0)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Declination:</span>
                <span className="font-bold">{dec?.toFixed(5)}° ({decToDMS(dec || 0)})</span>
              </div>
            </div>
          </div>

          {/* ── 1. SPHEREx Wavelength Band Scrubber (1-102) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <Activity className="w-4 h-4 text-sky-600" />
                SPHEREx Band ({band}/102)
              </span>
              <span className="font-mono font-bold text-sky-700 text-xs bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                λ = {wavelength.toFixed(3)} µm
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="102"
              value={band}
              onChange={(e) => onBandChange?.(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />

            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500">0.75 µm</span>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: `${currentDetector.color}15`,
                  color: currentDetector.color,
                  border: `1px solid ${currentDetector.color}40`,
                }}
              >
                {currentDetector.name} ({currentDetector.startWl}–{currentDetector.endWl} µm)
              </span>
              <span className="text-slate-500">5.00 µm</span>
            </div>
          </div>

          {/* ── 2. Field of View (FoV) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-900">
                <Maximize2 className="w-4 h-4 text-sky-600" />
                Field of View (FoV)
              </span>
              <span className="font-mono text-sky-700 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0′ (Deep Zoom)</span>
              <span>15.0′ (Wide Survey)</span>
            </div>
          </div>

          {/* ── 3. Pixel Contrast Stretch ── */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sliders className="w-4 h-4 text-sky-600" />
              Dynamic Contrast Stretch
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'linear', label: 'Linear', desc: 'Direct ADU' },
                { id: 'log', label: 'Log', desc: 'Faint structures' },
                { id: 'asinh', label: 'Asinh', desc: 'ZScale / HDR' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onStretchChange?.(s.id)}
                  className={`py-2 px-1 rounded-xl text-center font-mono text-[11px] border transition-all ${
                    stretch === s.id
                      ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-md'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="uppercase">{s.label}</div>
                  <div className={`text-[8px] mt-0.5 ${stretch === s.id ? 'text-sky-100' : 'text-slate-400'}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 4. Blink Rate ── */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Gauge className="w-4 h-4 text-amber-600" />
                Blink Comparator Speed
              </span>
              <span className="font-mono text-amber-800 font-bold bg-white px-2 py-0.5 rounded-full border border-amber-300">
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
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-amber-700 font-mono">
              <span>0.5 Hz (Slow)</span>
              <span>5.0 Hz (Rapid)</span>
            </div>
          </div>

          {/* ── 5. Manual Coordinates Slew ── */}
          <form onSubmit={handleManualCoords} className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              <Search className="w-3.5 h-3.5 text-sky-600" />
              <span>Slew to Celestial Coordinates</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">RA (deg)</label>
                <input
                  type="number"
                  step="any"
                  placeholder={ra ? `${ra.toFixed(4)}°` : 'RA'}
                  value={inputRa}
                  onChange={(e) => setInputRa(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Dec (deg)</label>
                <input
                  type="number"
                  step="any"
                  placeholder={dec ? `${dec.toFixed(4)}°` : 'Dec'}
                  value={inputDec}
                  onChange={(e) => setInputDec(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 text-xs shadow-md"
            >
              <Search className="w-3.5 h-3.5" />
              Center Telescope & Cutout
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-colors shadow"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
