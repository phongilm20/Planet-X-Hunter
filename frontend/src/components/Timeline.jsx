import React, { useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { OBSERVATIONAL_EPOCHS } from '../data/adapter';
import { computeDisplacement, SPHEREX_PIXEL_SCALE_ARCSEC } from '../utils/astronomy';

export default function Timeline({
  epochs = OBSERVATIONAL_EPOCHS,
  selectedEpochAId,
  onSelectEpochA,
  selectedEpochBId,
  onSelectEpochB,
  activeBlinkEpoch,
  isPlayingBlink,
  onTogglePlayBlink,
  blinkSpeedHz = 2.0,
  onBlinkSpeedChange,
  onStepBlink,
  target,
}) {
  const epochA = epochs.find((e) => e.id === selectedEpochAId) || epochs[0];
  const epochB = epochs.find((e) => e.id === selectedEpochBId) || epochs[3];

  const deltaYears = Math.abs((epochB.year || 2026.5) - (epochA.year || 2025.0));

  // Compute live proper-motion displacement
  const pmRa = target?.pmRa?.value || target?.pmRa || 0;
  const pmDec = target?.pmDec?.value || target?.pmDec || 0;
  const { totalArcsec, totalPixels } = computeDisplacement(pmRa, pmDec, deltaYears);

  // Keyboard spacebar listener for blink play/pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlayBlink?.();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onStepBlink?.('left');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onStepBlink?.('right');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlayBlink, onStepBlink]);

  return (
    <div className="w-full bg-obs-surface border-t border-obs-border px-4 py-3 select-none z-20">
      
      {/* ── Top Row: The Core "Aha!" Mathematical Displacement Line ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-obs-border/70 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-obs-accent shrink-0" />
          <span className="text-obs-muted">Proper-Motion Displacement:</span>
          <span className="font-semibold text-obs-text">
            Elapsed: <strong className="text-obs-accent font-bold">{deltaYears.toFixed(2)} yr</strong>
          </span>
          <span className="text-obs-border">•</span>
          <span className="font-semibold text-obs-text">
            Expected shift: <strong className="text-obs-amber font-bold">{totalArcsec.toFixed(2)}″</strong> ({totalPixels.toFixed(2)} SPHEREx pixels)
          </span>
        </div>

        <div className="flex items-center gap-3 text-obs-muted text-[11px]">
          <span>Detector Scale: <strong>{SPHEREX_PIXEL_SCALE_ARCSEC}″/px</strong></span>
          <span>Spacebar: Toggle Blink</span>
        </div>
      </div>

      {/* ── Middle: Discrete Observation Epoch Ticks ── */}
      <div className="relative flex items-center justify-between py-2 px-3">
        {/* Horizontal connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[1px] bg-obs-border z-0" />

        {epochs.map((ep, i) => {
          const isA = ep.id === selectedEpochAId;
          const isB = ep.id === selectedEpochBId;
          const isActiveBlink = (activeBlinkEpoch === 'A' && isA) || (activeBlinkEpoch === 'B' && isB);

          return (
            <div key={ep.id} className="relative z-10 flex flex-col items-center">
              {/* Epoch Handle Radio / Buttons */}
              <div className="flex items-center gap-1 mb-1.5">
                <button
                  onClick={() => onSelectEpochA?.(ep.id)}
                  className={`w-4 h-4 rounded-full border text-[9px] font-bold flex items-center justify-center transition-all ${
                    isA
                      ? 'bg-obs-accent text-white border-obs-accent ring-2 ring-obs-accent/30 shadow'
                      : 'bg-obs-bg border-obs-border text-obs-muted hover:border-obs-accent/60'
                  }`}
                  title={`Set as Epoch A: ${ep.label}`}
                >
                  A
                </button>
                <button
                  onClick={() => onSelectEpochB?.(ep.id)}
                  className={`w-4 h-4 rounded-full border text-[9px] font-bold flex items-center justify-center transition-all ${
                    isB
                      ? 'bg-obs-red text-white border-obs-red ring-2 ring-obs-red/30 shadow'
                      : 'bg-obs-bg border-obs-border text-obs-muted hover:border-obs-red/60'
                  }`}
                  title={`Set as Epoch B: ${ep.label}`}
                >
                  B
                </button>
              </div>

              {/* Tick marker circle */}
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  isActiveBlink
                    ? 'bg-white border-obs-accent scale-125 shadow-[0_0_8px_rgba(77,163,255,0.6)]'
                    : isA || isB
                    ? 'bg-obs-raised border-obs-text'
                    : ep.isBaseline
                    ? 'bg-obs-surface border-obs-muted/50'
                    : 'bg-obs-bg border-obs-border'
                }`}
              />

              {/* Epoch Date & Survey ID Label */}
              <div className="text-center mt-1.5 font-mono">
                <div className={`text-xs font-semibold ${isA ? 'text-obs-accent' : isB ? 'text-obs-red' : 'text-obs-text'}`}>
                  {ep.year.toFixed(1)}
                </div>
                <div className="text-[10px] text-obs-muted tracking-tight max-w-[100px] truncate">
                  {ep.isBaseline ? 'Baseline' : ep.isFuture ? 'Predicted' : ep.surveyId.replace('SPHEREx-', '')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Controls: Blink Player & Speed ── */}
      <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-obs-border/70 text-xs">
        {/* Play/Pause & Step */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlayBlink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow ${
              isPlayingBlink
                ? 'bg-obs-raised text-obs-amber border border-obs-amber/50 hover:bg-obs-surface'
                : 'bg-obs-accent text-white hover:bg-obs-accent/90'
            }`}
            title="Toggle continuous blink [Spacebar]"
          >
            {isPlayingBlink ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Blink</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Blink</span>
              </>
            )}
          </button>

          <button
            onClick={() => onStepBlink?.('toggle')}
            className="px-2.5 py-1.5 rounded bg-obs-raised border border-obs-border text-obs-text hover:bg-obs-surface font-mono text-xs"
            title="Step between Epoch A and B [Left/Right Arrow]"
          >
            Step (A ↔ B)
          </button>
        </div>

        {/* Blink Frequency Slider (0.5 to 4.0 Hz) */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-obs-muted">Blink Rate:</span>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.25"
            value={blinkSpeedHz}
            onChange={(e) => onBlinkSpeedChange?.(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-obs-border rounded appearance-none cursor-pointer accent-obs-accent"
          />
          <span className="font-semibold text-obs-text w-12 text-right">{blinkSpeedHz.toFixed(1)} Hz</span>
        </div>
      </div>

    </div>
  );
}
