import React from 'react';
import { NASA_TARGETS } from '../data/targets';
import { Compass } from 'lucide-react';

export default function TargetBar({ selectedTarget, onSelect, targets = NASA_TARGETS }) {
  const currentTargets = targets && targets.length > 0 ? targets : NASA_TARGETS;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 no-scrollbar max-w-full">
      <div className="hidden 2xl:flex items-center gap-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>NASA Targets:</span>
      </div>

      <div className="flex items-center gap-1.5">
        {currentTargets.map((target) => {
          const isSelected =
            selectedTarget?.name === target.name ||
            (selectedTarget?.ra && Math.abs(selectedTarget.ra - target.ra) < 0.001);

          const isDipole = target.expectedSignature === 'dipole' || target.properMotion?.total > 1.0;

          return (
            <button
              key={target.name}
              onClick={() => onSelect(target)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border text-left transition-all duration-300 shrink-0 ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_16px_rgba(56,189,248,0.35)] ring-1 ring-cyan-400/50 scale-[1.02]'
                  : 'bg-gray-900/60 border-gray-800/90 hover:border-gray-700 hover:bg-gray-800/80 hover:shadow-lg'
              }`}
            >
              <span className="text-sm leading-none">{target.icon || '✨'}</span>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    isSelected ? 'text-cyan-300' : 'text-gray-200 group-hover:text-white'
                  }`}
                >
                  {target.shortName || target.name}
                </span>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                    isDipole
                      ? 'bg-blue-950/70 text-blue-300 border-blue-800/50'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                  }`}
                >
                  {isDipole ? `${target.properMotion?.total?.toFixed(1) || '8.1'}″/yr` : 'Var'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
