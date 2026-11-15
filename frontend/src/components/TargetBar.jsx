import React from 'react';
import { NASA_TARGETS, raToHMS, decToDMS } from '../data/targets';
import { Compass, Zap, Flame, MoveRight } from 'lucide-react';

export default function TargetBar({ selectedTarget, onSelect, targets = NASA_TARGETS }) {
  const currentTargets = targets && targets.length > 0 ? targets : NASA_TARGETS;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar max-w-full">
      <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider border-r border-gray-800 shrink-0">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>NASA Targets</span>
      </div>

      <div className="flex items-center gap-2">
        {currentTargets.map((target) => {
          const isSelected = selectedTarget?.name === target.name || 
            (selectedTarget?.ra && Math.abs(selectedTarget.ra - target.ra) < 0.001);

          const isDipole = target.expectedSignature === 'dipole' || (target.properMotion?.total > 1.0);

          return (
            <button
              key={target.name}
              onClick={() => onSelect(target)}
              className={`group text-left px-3 py-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400/50'
                  : 'bg-gray-900/70 border-gray-800 hover:border-gray-700 hover:bg-gray-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{target.icon || '✨'}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-gray-200 group-hover:text-white'}`}>
                      {target.shortName || target.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isDipole 
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60' 
                        : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                    }`}>
                      {isDipole ? 'Dipole' : 'Monopole'}
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>{raToHMS(target.ra)}</span>
                    <span className="text-gray-600">/</span>
                    <span>{decToDMS(target.dec)}</span>
                  </div>
                </div>

                {target.properMotion?.total > 0 && (
                  <div className="hidden lg:flex flex-col items-end text-[9px] text-cyan-400/80 font-mono pl-1 border-l border-gray-800">
                    <span className="flex items-center gap-0.5">
                      <MoveRight className="w-2.5 h-2.5" />
                      {target.properMotion.total.toFixed(1)}″/yr
                    </span>
                    <span className="text-gray-500">{target.spectralType}</span>
                  </div>
                )}
                {target.properMotion?.total === 0 && (
                  <div className="hidden lg:flex flex-col items-end text-[9px] text-amber-400/80 font-mono pl-1 border-l border-gray-800">
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      Var Star
                    </span>
                    <span className="text-gray-500">{target.spectralType}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
