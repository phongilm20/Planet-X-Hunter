import React, { useState } from 'react';
import { 
  Layers, 
  Eye, 
  Sparkles, 
  Sliders, 
  Radar, 
  HelpCircle, 
  Search, 
  Activity, 
  Maximize2, 
  Gauge,
  Film
} from 'lucide-react';
import { SPHEREX_BANDS, bandToWavelength, bandToDetector } from '../data/targets';

export default function ControlPanel(props) {
  // Support both prop naming styles
  const fov = props.fov ?? 5;
  const setFov = props.onFovChange || props.setFov;
  const mode = props.mode || 'epoch1';
  const setMode = props.onModeChange || props.setMode;
  const band = props.band ?? 50;
  const setBand = props.onBandChange || props.setBand;
  const stretch = props.stretch || 'linear';
  const setStretch = props.onStretchChange || props.setStretch;
  const blinkSpeed = props.blinkSpeed ?? 2;
  const setBlinkSpeed = props.onBlinkSpeedChange || props.setBlinkSpeed;
  const showAnomalies = props.showAnomalies ?? false;
  const setShowAnomalies = props.onShowAnomaliesChange || props.setShowAnomalies;
  const ra = props.ra;
  const dec = props.dec;
  const onCoordsChange = props.onCoordsChange;

  const [inputRa, setInputRa] = useState('');
  const [inputDec, setInputDec] = useState('');

  const wavelength = bandToWavelength(band);
  const currentDetector = bandToDetector(band);

  const handleManualCoords = (e) => {
    e.preventDefault();
    const parsedRa = parseFloat(inputRa);
    const parsedDec = parseFloat(inputDec);
    if (!isNaN(parsedRa) && !isNaN(parsedDec) && onCoordsChange) {
      onCoordsChange(parsedRa, parsedDec);
    }
  };

  const MODES = [
    { id: 'epoch1', label: 'Epoch 1 (DR1)', desc: 'Month 0 baseline', icon: Layers, color: 'text-blue-400' },
    { id: 'epoch2', label: 'Epoch 2 (QR3)', desc: 'Month 6 cadence', icon: Layers, color: 'text-emerald-400' },
    { id: 'blink', label: 'Auto-Blink', desc: 'Motion comparator', icon: Film, color: 'text-amber-400' },
    { id: 'diff', label: 'Difference (E2-E1)', desc: 'Dipole & variable finder', icon: Sparkles, color: 'text-fuchsia-400' },
    { id: 'coadd', label: 'Co-Add Stack', desc: 'Maximum SNR boost', icon: Eye, color: 'text-cyan-400' },
  ];

  return (
    <div className="flex flex-col gap-4 text-xs text-gray-300">
      {/* ── Mode Selection ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between text-gray-400 font-semibold uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Observation Mode
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode && setMode(m.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                  active
                    ? 'bg-gray-800/90 border-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.25)] text-white'
                    : 'bg-gray-950/40 border-gray-800/80 hover:border-gray-700 hover:bg-gray-800/50 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${active ? m.color : 'text-gray-500'}`} />
                  <div>
                    <div className="font-semibold">{m.label}</div>
                    <div className="text-[10px] text-gray-500">{m.desc}</div>
                  </div>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_4px_#38BDF8]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Auto-Detect Dipoles ────────────────────────────────────── */}
      <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className={`w-4 h-4 ${showAnomalies ? 'text-cyan-400 animate-spin' : 'text-gray-500'}`} style={{ animationDuration: '4s' }} />
          <div>
            <div className="font-semibold text-gray-200">Auto-Detect Anomaly</div>
            <div className="text-[10px] text-gray-400">Highlight &gt;3.2σ Dipoles &amp; Monopoles</div>
          </div>
        </div>
        <button
          onClick={() => setShowAnomalies && setShowAnomalies(!showAnomalies)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            showAnomalies ? 'bg-cyan-500' : 'bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              showAnomalies ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* ── Blink Speed (if mode === 'blink') ─────────────────────── */}
      {mode === 'blink' && (
        <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40">
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
              <Gauge className="w-3.5 h-3.5" />
              Blink Rate
            </span>
            <span className="font-mono text-amber-400 font-bold">{blinkSpeed} Hz</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.5"
            value={blinkSpeed}
            onChange={(e) => setBlinkSpeed && setBlinkSpeed(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono">
            <span>0.5 Hz (Slow)</span>
            <span>5.0 Hz (Rapid)</span>
          </div>
        </div>
      )}

      {/* ── 102-Band Wavelength Scrubber ──────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            SPHEREx Band ({band}/102)
          </span>
          <span className="font-mono font-bold text-cyan-400 text-xs">
            λ = {wavelength.toFixed(3)} µm
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="102"
          value={band}
          onChange={(e) => setBand && setBand(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono">
          <span className="text-gray-500">0.75 µm</span>
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ backgroundColor: `${currentDetector.color}25`, color: currentDetector.color, border: `1px solid ${currentDetector.color}50` }}
          >
            {currentDetector.name} ({currentDetector.startWl}–{currentDetector.endWl} µm)
          </span>
          <span className="text-gray-500">5.00 µm</span>
        </div>
      </div>

      {/* ── Field of View (FoV) ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            Field of View
          </span>
          <span className="font-mono text-cyan-400 font-bold">{fov.toFixed(1)} arcmin</span>
        </div>
        <input
          type="range"
          min="1.0"
          max="15.0"
          step="0.5"
          value={fov}
          onChange={(e) => setFov && setFov(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono">
          <span>1.0′ (Deep Zoom)</span>
          <span>15.0′ (Wide Survey)</span>
        </div>
      </div>

      {/* ── Contrast Stretch ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Pixel Stretch
        </div>
        <div className="grid grid-cols-3 gap-1">
          {['linear', 'log', 'asinh'].map((s) => (
            <button
              key={s}
              onClick={() => setStretch && setStretch(s)}
              className={`py-1 rounded text-center font-mono uppercase text-[10px] font-semibold border transition-all ${
                stretch === s
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'bg-gray-950/40 border-gray-800 hover:border-gray-700 text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Manual Coordinate Input ───────────────────────────────── */}
      <form onSubmit={handleManualCoords} className="pt-2 border-t border-gray-800/80">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
          <Search className="w-3 h-3 text-cyan-400" />
          <span>Goto Celestial Coordinates</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-1.5 font-mono">
          <input
            type="number"
            step="any"
            placeholder={ra ? `RA: ${ra.toFixed(4)}°` : 'RA (deg)'}
            value={inputRa}
            onChange={(e) => setInputRa(e.target.value)}
            className="w-full px-2 py-1 rounded bg-gray-950 border border-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400 text-[11px]"
          />
          <input
            type="number"
            step="any"
            placeholder={dec ? `Dec: ${dec.toFixed(4)}°` : 'Dec (deg)'}
            value={inputDec}
            onChange={(e) => setInputDec(e.target.value)}
            className="w-full px-2 py-1 rounded bg-gray-950 border border-gray-800 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-400 text-[11px]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 rounded font-semibold transition-colors flex items-center justify-center gap-1 text-[11px]"
        >
          <Search className="w-3 h-3" />
          Point SPHEREx FoV
        </button>
      </form>
    </div>
  );
}
