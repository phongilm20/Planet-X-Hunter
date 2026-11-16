import React, { useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';
import { angularSeparation, SPHEREX_PIXEL_SCALE_ARCSEC } from '../lib/astro';

export default function Timeline({
  trackPoints = [],
  activeTrackIndex = 0,
  onSelectTrackIndex,
  isPlaying = false,
  onTogglePlay,
  playSpeed = 1,
  onChangePlaySpeed,
}) {
  if (trackPoints.length === 0) return null;

  const currentPoint = trackPoints[activeTrackIndex] || trackPoints[0];
  const firstPoint = trackPoints[0];

  // Compute live elapsed time and displacement from initial epoch
  const elapsedYears = Math.max(0, currentPoint.year - firstPoint.year);
  const totalShiftArcsec = angularSeparation(
    firstPoint.ra,
    firstPoint.dec,
    currentPoint.ra,
    currentPoint.dec
  );
  const totalShiftPixels = totalShiftArcsec / SPHEREX_PIXEL_SCALE_ARCSEC;

  // Min and max years for timeline axis
  const minYear = trackPoints[0].year;
  const maxYear = trackPoints[trackPoints.length - 1].year;
  const yearSpan = Math.max(0.5, maxYear - minYear);

  return (
    <div className="w-full bg-obs-surface border-t border-obs-border px-4 py-3 select-none z-20 shrink-0">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        
        {/* Top: Controls & Live Displacement Readout */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Play / Step Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className={`px-3 py-1.5 rounded font-medium flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-obs-accent/20 text-obs-accent border border-obs-accent/50 hover:bg-obs-accent/30'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Track'}</span>
            </button>

            <button
              onClick={() => onSelectTrackIndex(Math.max(0, activeTrackIndex - 1))}
              disabled={activeTrackIndex <= 0}
              className="p-1.5 rounded border border-obs-border bg-obs-raised hover:bg-obs-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Step backward (Left arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-obs-text" />
            </button>

            <button
              onClick={() => onSelectTrackIndex(Math.min(trackPoints.length - 1, activeTrackIndex + 1))}
              disabled={activeTrackIndex >= trackPoints.length - 1}
              className="p-1.5 rounded border border-obs-border bg-obs-raised hover:bg-obs-border disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Step forward (Right arrow)"
            >
              <ChevronRight className="w-3.5 h-3.5 text-obs-text" />
            </button>

            {/* Speed Selector (1x, 2x, 5x) */}
            <div className="flex items-center gap-1 ml-2 border border-obs-border rounded p-0.5 bg-obs-bg">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onChangePlaySpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    playSpeed === spd
                      ? 'bg-obs-accent text-obs-bg font-bold'
                      : 'text-obs-muted hover:text-obs-text'
                  }`}
                >
                  {spd}×
                </button>
              ))}
            </div>
          </div>

          {/* Live Astrometric Displacement Readout */}
          <div className="font-mono text-xs text-obs-text/90 flex flex-wrap items-center gap-2">
            <span>
              Elapsed: <strong className="text-obs-accent">{elapsedYears.toFixed(2)} yr</strong>
            </span>
            <span className="text-obs-muted">·</span>
            <span>
              Target shifted: <strong className="text-amber-400">{totalShiftArcsec.toFixed(2)}″</strong>
            </span>
            <span className="text-obs-muted">
              (≈ <strong className="text-obs-text">{totalShiftPixels.toFixed(2)}</strong> SPHEREx px)
            </span>
          </div>
        </div>

        {/* Bottom: Interactive Scrubber Track with Real Observation Ticks */}
        <div className="relative w-full h-8 flex items-center">
          {/* Background rail */}
          <div className="absolute inset-x-0 h-1.5 bg-obs-bg rounded-full border border-obs-border" />

          {/* Progress fill */}
          {trackPoints.length > 1 && (
            <div
              className="absolute left-0 h-1.5 bg-obs-accent rounded-full transition-all duration-150"
              style={{
                width: `${((currentPoint.year - minYear) / yearSpan) * 100}%`,
              }}
            />
          )}

          {/* Discrete Observation Ticks */}
          {trackPoints.map((pt, idx) => {
            const pct = Math.max(0, Math.min(100, ((pt.year - minYear) / yearSpan) * 100));
            const isSelected = idx === activeTrackIndex;

            return (
              <button
                key={idx}
                onClick={() => onSelectTrackIndex(idx)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group focus:outline-none"
                style={{ left: `${pct}%` }}
                title={`${pt.label} (${pt.date.slice(0, 10)})`}
              >
                {/* Tick dot */}
                <div
                  className={`rounded-full transition-all duration-150 ${
                    isSelected
                      ? 'w-4 h-4 bg-amber-400 border-2 border-obs-bg shadow-md scale-125'
                      : pt.isHistorical
                      ? 'w-2 h-2 bg-slate-500 hover:bg-slate-300'
                      : 'w-2.5 h-2.5 bg-obs-accent hover:bg-blue-300'
                  }`}
                />

                {/* Tick label */}
                <span
                  className={`absolute top-full mt-1.5 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'text-amber-300 font-bold'
                      : pt.isHistorical
                      ? 'text-obs-muted/70'
                      : 'text-obs-muted group-hover:text-obs-text'
                  }`}
                >
                  {pt.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
