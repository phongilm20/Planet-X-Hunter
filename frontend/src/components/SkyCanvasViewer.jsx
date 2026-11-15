import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OBSERVATIONAL_EPOCHS, SKY_PALETTES } from '../data/targets';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Layers, 
  Sun, 
  Moon, 
  Flame, 
  Compass, 
  Search, 
  Radar, 
  Crosshair,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function SkyCanvasViewer({
  cutoutData,
  loading,
  error,
  ra,
  dec,
  fov,
  target,
  currentEpoch,
  onEpochChange,
  palette,
  onPaletteChange,
  mode,
  onModeChange,
  showAnomalies,
  onToggleAnomalies,
  onPixelClick,
  gaiaStars = [],
  showGaiaOverlay = true,
  onToggleGaia,
  personaMode = 'explorer', // 'explorer' | 'scientist'
}) {
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);
  const [spotlightActive, setSpotlightActive] = useState(false);

  // Play / Pause loop across 8 observational epochs
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        onEpochChange?.((prev) => {
          const next = typeof prev === 'number' ? prev + 1 : 1;
          return next > 8 ? 1 : next;
        });
      }, 1000);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, onEpochChange]);

  const activeImage = cutoutData?.image;
  const anomalies = cutoutData?.anomalies || [];
  const stats = cutoutData?.stats;
  const wcs = cutoutData?.wcs;

  // Pixel to Celestial (RA/Dec) click
  const handleCanvasClick = (e) => {
    if (!containerRef.current || !wcs) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const size = cutoutData?.width || 256;
    const px = (x / rect.width) * size;
    const py = (y / rect.height) * size;

    const crpix1 = wcs.CRPIX1 || 128;
    const crpix2 = wcs.CRPIX2 || 128;
    const cdelt1 = wcs.CDELT1 || -0.000325;
    const cdelt2 = wcs.CDELT2 || 0.000325;

    const clickedRa = (wcs.CRVAL1 || ra) + (px - crpix1) * cdelt1;
    const clickedDec = (wcs.CRVAL2 || dec) + (py - crpix2) * cdelt2;

    onPixelClick?.(clickedRa, clickedDec);
  };

  const currentEpochInfo = OBSERVATIONAL_EPOCHS.find((ep) => ep.id === currentEpoch) || OBSERVATIONAL_EPOCHS[3];

  const isDaylight = palette === 'daylight';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden transition-colors duration-500 ${
        isDaylight ? 'bg-[#F8FAFC]' : palette === 'infrared' ? 'bg-[#0F0C24]' : 'bg-[#070A12]'
      }`}
    >
      {/* ── Main Full-Screen Astronomical Canvas Container ── */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="relative w-full h-full max-w-[95vh] max-h-[95vh] flex items-center justify-center cursor-crosshair rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300"
        style={{
          borderColor: isDaylight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-md">
            <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
              Extracting Epoch {currentEpoch} Spectral Cube...
            </span>
          </div>
        )}

        {/* Astronomical Image Layer */}
        {activeImage ? (
          <img
            src={activeImage}
            alt="SPHEREx Cutout"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
            <Crosshair className="w-10 h-10 animate-pulse text-sky-500" />
            <span className="text-sm font-semibold">Aligning SPHEREx Sky Viewer...</span>
          </div>
        )}

        {/* Reticle Crosshair at Center */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-16 h-16 border border-sky-400/80 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-sky-400" />
          </div>
          <div className="absolute w-28 h-[1px] bg-sky-400/60" />
          <div className="absolute h-28 w-[1px] bg-sky-400/60" />
        </div>

        {/* Real Gaia DR3 Star Overlays */}
        {showGaiaOverlay && gaiaStars.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {gaiaStars.map((star, i) => {
              // Convert star RA/Dec to relative % within FoV
              if (!wcs) return null;
              const size = cutoutData?.width || 256;
              const cdelt1 = wcs.CDELT1 || -0.000325;
              const cdelt2 = wcs.CDELT2 || 0.000325;
              const crval1 = wcs.CRVAL1 || ra;
              const crval2 = wcs.CRVAL2 || dec;
              const crpix1 = wcs.CRPIX1 || 128;
              const crpix2 = wcs.CRPIX2 || 128;

              const px = crpix1 + (star.ra - crval1) / cdelt1;
              const py = crpix2 + (star.dec - crval2) / cdelt2;

              if (px < 0 || px > size || py < 0 || py > size) return null;

              const leftPct = (px / size) * 100;
              const topPct = (py / size) * 100;

              return (
                <div
                  key={star.source_id || i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-sky-400/60 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-sky-400" />
                  </div>
                  {/* Proper motion vector arrow if notable */}
                  {Math.abs(star.pmra) > 5 || Math.abs(star.pmdec) > 5 ? (
                    <div
                      className="absolute top-1/2 left-1/2 w-4 h-[1.5px] bg-emerald-400 origin-left"
                      style={{
                        transform: `rotate(${Math.atan2(-star.pmdec, star.pmra)}rad)`,
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Anomaly Bounding Boxes (>3.2σ Dipole / Monopole) */}
        {showAnomalies && anomalies.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {anomalies.map((anom, idx) => {
              const size = cutoutData?.width || 256;
              const leftPct = (anom.x / size) * 100;
              const topPct = (anom.y / size) * 100;
              const isDipole = anom.type === 'dipole';

              return (
                <div
                  key={idx}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 transition-transform duration-300 ${
                    spotlightActive ? 'scale-125 ring-4 ring-cyan-400 animate-bounce' : 'scale-100'
                  } ${
                    isDipole
                      ? 'border-cyan-400 bg-cyan-400/15 shadow-[0_0_15px_rgba(56,189,248,0.6)]'
                      : 'border-amber-400 bg-amber-400/15 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: 38,
                    height: 38,
                  }}
                >
                  <div
                    className={`absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase whitespace-nowrap ${
                      isDipole ? 'bg-cyan-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {isDipole ? 'DIPOLE' : 'VARIABLE'} {anom.significance}σ
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Top-Left Canvas HUD: Current Epoch & Target Info ── */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="px-3.5 py-2 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg text-slate-900 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-xs font-black tracking-wider uppercase text-sky-700">
                {mode === 'diff' ? 'Difference Imaging' : mode === 'coadd' ? 'Co-Added Stack' : currentEpochInfo.fullLabel}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2">
              <span>Cadence: Year {currentEpochInfo.year}</span>
              <span>•</span>
              <span>{currentEpochInfo.survey}</span>
            </div>
          </div>
        </div>

        {/* ── Top-Right Canvas HUD: Image Statistics & WCS ── */}
        {stats && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none hidden sm:block">
            <div className="px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-lg border border-white/50 shadow text-[10px] font-mono text-slate-700 space-y-0.5">
              <div>Peak Flux: {stats.max} ADU</div>
              <div>RMS Noise (σ): {stats.std} ADU</div>
              <div>FoV: {fov?.toFixed(1)}′ ({((fov || 5) * 60).toFixed(0)}″)</div>
            </div>
          </div>
        )}

        {/* ── Explorer Mode Visual Explanation Callout (Jargon-free) ── */}
        {personaMode === 'explorer' && target && (
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto">
            <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-xl flex items-center justify-between gap-3 text-slate-900">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{target.icon || '✨'}</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{target.name}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-sky-100 text-sky-700 font-mono font-semibold">
                      {target.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 line-clamp-1">
                    {target.description}
                  </div>
                </div>
              </div>

              {/* 1-Click "Spot a Moving Object!" interactive discovery button */}
              <button
                onClick={() => {
                  onToggleAnomalies?.(true);
                  setSpotlightActive(true);
                  setTimeout(() => setSpotlightActive(false), 2400);
                }}
                className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all duration-200 shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spot Moving Object!</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Floating Multi-Epoch Continuous Time Scrubber Bar ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-full max-w-xl px-4">
        <div className="p-2 rounded-full bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.3)] flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shrink-0 shadow transition-all duration-200 hover:scale-105 active:scale-95"
            title={isPlaying ? 'Pause Continuous Multi-Epoch Animation' : 'Play Continuous Multi-Epoch Time Series'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* 8 Observational Epoch Pills */}
          <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {OBSERVATIONAL_EPOCHS.map((ep) => {
              const isSelected = currentEpoch === ep.id && mode !== 'diff' && mode !== 'coadd';
              return (
                <button
                  key={ep.id}
                  onClick={() => {
                    onModeChange?.('epoch');
                    onEpochChange?.(ep.id);
                  }}
                  className={`px-2 py-1 rounded-full text-[10px] font-mono font-bold transition-all duration-200 shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md scale-105'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={`${ep.fullLabel} (${ep.survey})`}
                >
                  {ep.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5 shrink-0" />

          {/* Difference Mode Quick Pill */}
          <button
            onClick={() => onModeChange?.(mode === 'diff' ? 'epoch' : 'diff')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono shrink-0 transition-all duration-200 border ${
              mode === 'diff'
                ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-md'
                : 'border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Difference Mode: Subtract Epoch 1 from Current Epoch to reveal Dipoles"
          >
            Diff (E-E₁)
          </button>
        </div>
      </div>
    </div>
  );
}
