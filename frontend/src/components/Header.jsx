import React, { useState } from 'react';
import { parseCoordinates } from '../utils/astronomy';

export default function Header({
  onCustomCoords,
  onExportPNG,
  onOpenHelp,
  activeMode,
  provenance,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const parsed = parseCoordinates(searchInput.trim());
    if (parsed) {
      setSearchError('');
      onCustomCoords(parsed.ra, parsed.dec, `Custom (${parsed.ra.toFixed(3)}, ${parsed.dec.toFixed(3)})`);
      setSearchInput('');
    } else {
      setSearchError('Coordinates must be decimal (e.g. 133.79, -7.24) or sexagesimal (e.g. 08:55:10 -07:14:42)');
    }
  };

  const badgeStyle = {
    'LIVE IRSA': 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
    'CACHED': 'bg-sky-950/80 text-sky-300 border-sky-600/50',
    'SIMULATED': 'bg-amber-950/80 text-amber-300 border-amber-600/50',
  }[provenance] || 'bg-obs-surface text-obs-muted border-obs-border';

  return (
    <header className="h-14 border-b border-obs-border bg-obs-surface px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Left: Branding & Official Disclaimer */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-obs-accent/20 border border-obs-accent/40 flex items-center justify-center text-obs-accent font-mono font-bold text-xs">
            SX
          </div>
          <span className="font-semibold text-obs-text tracking-tight text-sm sm:text-base truncate">
            SPHEREx Time-Domain Sky Explorer
          </span>
        </div>
        <span className="hidden xl:inline-block text-[11px] text-obs-muted/70 pl-2 border-l border-obs-border truncate">
          NASA Space Apps Challenge 2026 · Not an official NASA product
        </span>
      </div>

      {/* Middle: Coordinate search bar */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-sm w-full">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (searchError) setSearchError('');
          }}
          placeholder="Jump to RA, Dec (e.g. 133.79, -7.24)"
          className="w-full bg-obs-bg border border-obs-border rounded px-3 py-1 text-xs text-obs-text placeholder:text-obs-muted/50 focus:outline-none focus:border-obs-accent/70 transition-colors font-mono"
        />
        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-2 text-[10px] uppercase font-mono font-semibold tracking-wider text-obs-accent bg-obs-accent/10 hover:bg-obs-accent/20 rounded transition-colors"
        >
          Go
        </button>
        {searchError && (
          <div className="absolute top-full left-0 mt-1 text-[11px] text-obs-red bg-obs-bg border border-obs-red/50 px-2 py-1 rounded shadow-lg z-50">
            {searchError}
          </div>
        )}
      </form>

      {/* Right: Provenance Badge, Export, Help */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Provenance Badge */}
        <div
          title="Data provenance: LIVE IRSA (official API), CACHED (offline mirror), or SIMULATED (realistic physical simulation)"
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-semibold tracking-wider uppercase ${badgeStyle}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {provenance || 'CACHED'}
        </div>

        {/* PNG Export */}
        <button
          onClick={onExportPNG}
          title="Export publication-ready PNG with scale bar, compass, timestamp, and provenance"
          className="px-2.5 py-1 text-xs font-medium rounded border border-obs-border bg-obs-raised hover:bg-obs-border text-obs-text transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-obs-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Help / Methodology */}
        <button
          onClick={onOpenHelp}
          title="Methodology, science guide, and keyboard shortcuts"
          className="px-2.5 py-1 text-xs font-medium rounded border border-obs-accent/40 bg-obs-accent/10 hover:bg-obs-accent/20 text-obs-accent transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
