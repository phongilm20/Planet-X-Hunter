import React, { useState, useEffect } from 'react';
import { Flame, Eye, Sparkles, Crosshair, Radar } from 'lucide-react';

export default function InfraredScannerHUD({
  isActive,
  onToggle,
  anomalyDistance = 1.0, // 0.0 (locked) to 1.0 (far)
  isHunting = false,
  onLockAnomaly,
}) {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isActive]);

  const signalStrength = Math.max(0, Math.min(100, Math.round((1.0 - anomalyDistance) * 100)));
  const isNearby = signalStrength > 65;
  const isLocked = signalStrength > 90;

  return (
    <>
      {/* ── Floating Cursor Magic Lens HUD ── */}
      {isActive && isVisible && (
        <div
          className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Circular Glass Lens Ring */}
          <div
            className={`relative w-64 h-64 rounded-full border-2 transition-colors duration-300 shadow-[0_0_50px_rgba(56,189,248,0.35)] backdrop-contrast-125 backdrop-brightness-110 overflow-hidden flex items-center justify-center ${
              isLocked
                ? 'border-emerald-400 ring-4 ring-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.5)]'
                : isNearby
                ? 'border-amber-400 ring-2 ring-amber-500/30'
                : 'border-cyan-400/80 ring-1 ring-cyan-500/20'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(234, 88, 12, 0.24) 0%, rgba(56, 189, 248, 0.16) 60%, rgba(2, 6, 23, 0.25) 100%)',
            }}
          >
            {/* Rotating Radar Sweep Line */}
            <div
              className="absolute inset-0 rounded-full border-t border-cyan-300/40 animate-spin pointer-events-none"
              style={{ animationDuration: '4s' }}
            />

            {/* Crosshair Reticle Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 border border-cyan-400/50 rounded-full flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-emerald-400 animate-ping' : isNearby ? 'bg-amber-400' : 'bg-cyan-400'}`} />
              </div>
              <div className="absolute w-full h-[1px] bg-cyan-400/20" />
              <div className="absolute h-full w-[1px] bg-cyan-400/20" />
            </div>

            {/* Top HUD Label */}
            <div className="absolute top-3 text-[9px] font-black tracking-widest text-cyan-200 uppercase font-mono px-2 py-0.5 rounded-full bg-slate-950/70 border border-cyan-500/30">
              SPHEREx NIR 0.75-5.0 µm
            </div>

            {/* Bottom Signal Readout / Lock Prompt */}
            {isHunting ? (
              <div className="absolute bottom-3 text-center">
                {isLocked ? (
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                    Target Locked! Click to Log
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300">
                    Infrared Signal: {signalStrength}%
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute bottom-3 text-[9px] font-mono text-cyan-300/80 bg-slate-950/60 px-2 py-0.5 rounded-full">
                Thermal CH₄ & H₂O Filter
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Floating Lens Toggle Control Button ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button
          onClick={onToggle}
          className={`group flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs shadow-2xl transition-all duration-300 border ${
            isActive
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white border-white/60 shadow-[0_0_30px_rgba(244,63,94,0.4)] scale-105'
              : 'bg-white/92 hover:bg-white text-slate-900 border-white/80 hover:scale-105 shadow-[0_10px_30px_rgba(0,0,0,0.18)]'
          }`}
        >
          <Flame className={`w-4 h-4 ${isActive ? 'text-amber-200 animate-bounce' : 'text-amber-600'}`} />
          <span>{isActive ? 'SPHEREx Infrared Lens: ACTIVE' : 'Toggle SPHEREx Infrared Lens'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            Press L
          </span>
        </button>
      </div>
    </>
  );
}
