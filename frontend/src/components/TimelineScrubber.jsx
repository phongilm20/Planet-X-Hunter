import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  Clock, 
  Calendar,
  Compass,
  ArrowRight
} from 'lucide-react';
import { TIMELINE_MILESTONES } from '../data/targets';

export default function TimelineScrubber({
  year = 2026.0,
  onYearChange,
  target,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 2x, 5x
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Animation Loop for Smooth Playback
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now) => {
      const dt = (now - lastTimeRef.current) / 1000.0;
      lastTimeRef.current = now;

      // 1 second real-time = 1.2 years in 1x speed
      const yearStep = dt * 1.2 * speedMultiplier;

      onYearChange?.((prevYear) => {
        const next = (prevYear || 2026.0) + yearStep;
        if (next > 2035.0) {
          return 2010.0; // Loop back
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, onYearChange]);

  const pm = target?.properMotion || { total: 0 };
  const dt = year - 2015.5;
  const accumulatedDrift = Math.abs(pm.total * dt);

  const isDipole = target?.expectedSignature === 'dipole' || pm.total > 0.05;

  return (
    <div className="fixed bottom-6 left-6 right-auto xl:left-8 z-30 max-w-2xl w-[calc(100vw-3rem)] xl:w-[620px] rounded-3xl bg-white/88 backdrop-blur-2xl border border-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-4 text-slate-900 select-none transition-all duration-300">
      {/* ── Top Row: Header, Year Display, Live Angular Drift ── */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-sky-700">
              Astronomical Time-Domain
            </div>
            <div className="text-sm font-extrabold font-mono text-slate-900">
              Year {year.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Live Drift / Variability Metric */}
        {isDipole ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-mono">
            <span className="text-slate-500 font-semibold">Motion:</span>
            <span className="font-black text-sky-700">{accumulatedDrift.toFixed(2)}″</span>
            <span className="text-[10px] text-slate-400">vs 2015.5</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-mono">
            <span className="text-slate-500 font-semibold">Flux Cycle:</span>
            <span className="font-black text-amber-700">Active</span>
            <span className="text-[10px] text-slate-400">Variable Star</span>
          </div>
        )}
      </div>

      {/* ── Middle: Slider Track & Milestones ── */}
      <div className="relative my-2 px-1">
        <input
          type="range"
          min="2010.0"
          max="2035.0"
          step="0.1"
          value={year}
          onChange={(e) => onYearChange?.(parseFloat(e.target.value))}
          className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
        />

        {/* Milestone Indicator Ticks */}
        <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-slate-500 mt-1 px-1">
          <button
            onClick={() => onYearChange?.(2010.0)}
            className="hover:text-sky-600 transition-colors"
          >
            2010 WISE
          </button>
          <button
            onClick={() => onYearChange?.(2014.5)}
            className="hover:text-sky-600 transition-colors"
          >
            2014.5 DR1
          </button>
          <button
            onClick={() => onYearChange?.(2025.0)}
            className={`font-black ${Math.abs(year - 2025.0) < 0.8 ? 'text-sky-600' : 'text-slate-700'} hover:text-sky-600 transition-colors`}
          >
            2025 Launch
          </button>
          <button
            onClick={() => onYearChange?.(2026.5)}
            className={`font-black ${Math.abs(year - 2026.5) < 0.8 ? 'text-sky-600' : 'text-slate-700'} hover:text-sky-600 transition-colors`}
          >
            2026.5 QR3
          </button>
          <button
            onClick={() => onYearChange?.(2035.0)}
            className="hover:text-sky-600 transition-colors"
          >
            2035.0
          </button>
        </div>
      </div>

      {/* ── Bottom Controls: Play/Pause, Speed, Reset ── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 mt-2">
        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all duration-200 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Motion</span>
              </>
            )}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold">
            {[1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  speedMultiplier === speed
                    ? 'bg-white text-sky-700 shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Reset to J2026.5 QR3 */}
        <button
          onClick={() => {
            setIsPlaying(false);
            onYearChange?.(2026.5);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
          title="Reset to Current SPHEREx QR3 Epoch (2026.5)"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset 2026.5</span>
        </button>
      </div>
    </div>
  );
}
