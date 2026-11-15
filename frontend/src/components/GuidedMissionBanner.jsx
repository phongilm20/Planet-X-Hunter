import React from 'react';
import { Volume2, VolumeX, X, Sparkles, Compass, Radio } from 'lucide-react';

export default function GuidedMissionBanner({
  stage,
  totalStages = 4,
  title,
  subtitle,
  isMuted,
  onToggleMute,
  onStop,
}) {
  const progressPercent = Math.round((stage / totalStages) * 100);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div 
        className="rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] select-none border transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          color: '#0F172A',
        }}
      >
        {/* Top Meta Line: Mission Stage + Audio Toggle + Exit */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600">
              Live Planetarium Showcase • Stage {stage} of {totalStages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voiceover Mute Toggle */}
            <button
              onClick={onToggleMute}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                isMuted
                  ? 'bg-slate-200 text-slate-600'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
              title={isMuted ? 'Unmute AI Voiceover' : 'Mute AI Voiceover'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
              <span>{isMuted ? 'Voice Muted' : 'Voice Active'}</span>
            </button>

            {/* Exit Mission Button */}
            <button
              onClick={onStop}
              className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              title="Exit Guided Mission"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2.5">
          <div 
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Cinematic Title & Voiceover Subtitles */}
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1 font-sans">
            "{subtitle}"
          </p>
        </div>
      </div>
    </div>
  );
}
