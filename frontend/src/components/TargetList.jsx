import React, { useState } from 'react';
import { Search, Compass, ExternalLink, ArrowRight } from 'lucide-react';
import TARGETS_CATALOG from '../data/targets.json';
import { parseCoordinates } from '../utils/astronomy';
import { resolveName } from '../data/adapter';

export default function TargetList({
  selectedTargetId,
  onSelectTarget,
  onCustomCoords,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState(null);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // 1. Try parsing direct coordinates (decimal or sexagesimal)
    const parsed = parseCoordinates(searchQuery);
    if (parsed) {
      onCustomCoords?.(parsed.ra, parsed.dec, `Custom (${parsed.ra.toFixed(3)}°, ${parsed.dec.toFixed(3)}°)`);
      setSearchStatus(null);
      return;
    }

    // 2. Try resolving object name via adapter
    setSearchStatus('Resolving name…');
    const result = await resolveName(searchQuery);
    if (result) {
      if (result.target) {
        onSelectTarget?.(result.target.id);
      } else {
        onCustomCoords?.(result.ra, result.dec, result.name);
      }
      setSearchStatus(null);
    } else {
      setSearchStatus('Target not found. Enter RA, Dec (e.g. 133.795, -7.245)');
    }
  };

  return (
    <aside className="w-72 xl:w-80 h-full flex flex-col bg-obs-surface border-r border-obs-border select-none z-10 shrink-0">
      
      {/* ── Search Bar ── */}
      <div className="p-3 border-b border-obs-border bg-obs-bg/60">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 text-obs-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search object or RA, Dec…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obs-surface border border-obs-border rounded pl-8 pr-3 py-1.5 text-xs text-obs-text placeholder:text-obs-muted focus:border-obs-accent font-mono"
          />
        </form>
        {searchStatus && (
          <div className="text-[11px] text-obs-amber mt-1 px-1 font-mono">{searchStatus}</div>
        )}
      </div>

      {/* ── Preset Targets Header ── */}
      <div className="px-3 py-2 border-b border-obs-border/70 flex items-center justify-between text-[11px] font-mono text-obs-muted uppercase tracking-wider">
        <span>Curated Targets</span>
        <span>{TARGETS_CATALOG.length} Presets</span>
      </div>

      {/* ── Targets List ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-obs-border/50 no-scrollbar">
        {TARGETS_CATALOG.map((t) => {
          const isSelected = selectedTargetId === t.id;
          const isMover = t.expectedBehavior === 'dipole';

          return (
            <button
              key={t.id}
              onClick={() => onSelectTarget?.(t.id)}
              className={`w-full text-left p-3 transition-colors flex flex-col gap-1 ${
                isSelected
                  ? 'bg-obs-raised border-l-2 border-obs-accent'
                  : 'hover:bg-obs-raised/50'
              }`}
            >
              {/* Target Name & Category Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${isSelected ? 'text-obs-accent' : 'text-obs-text'}`}>
                  {t.commonName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-obs-bg border border-obs-border text-obs-muted">
                  {t.category}
                </span>
              </div>

              {/* One-Line Plain Science Summary */}
              <div className="text-[11px] text-obs-muted leading-snug line-clamp-2">
                {t.summary}
              </div>

              {/* Metrics: Proper Motion Rate & Distance */}
              <div className="flex items-center gap-3 text-[10px] font-mono mt-0.5 text-obs-muted">
                <span>
                  μ: <strong className={isMover ? 'text-obs-amber' : 'text-obs-text'}>{t.pmTotal.value} {t.pmTotal.unit.replace(' (apparent)', '')}</strong>
                </span>
                <span>•</span>
                <span>
                  Dist: <strong className="text-obs-text">{t.distance.value} {t.distance.unit}</strong>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Bottom Info Notice ── */}
      <div className="p-3 border-t border-obs-border bg-obs-bg/60 text-[10px] text-obs-muted leading-relaxed font-sans">
        Select a target or enter coordinates to examine multi-epoch SPHEREx infrared imaging and proper-motion vectors.
      </div>

    </aside>
  );
}
