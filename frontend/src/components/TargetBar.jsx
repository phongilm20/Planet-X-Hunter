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
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-full border text-left transition-all duration-300 shrink-0 ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md scale-105 font-bold'
                  : 'bg-white/70 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-white hover:border-slate-300 shadow-sm font-medium'
              }`}
            >
              <span className="text-sm leading-none">{target.icon || '✨'}</span>

              <div className="flex items-center gap-1.5">
                <span className="text-xs tracking-wide">
                  {target.shortName || target.name}
                </span>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                    isSelected
                      ? 'bg-sky-700 text-sky-100 border-sky-500'
                      : isDipole
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
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
