import React, { useState } from 'react';
import { Search, HelpCircle, Link as LinkIcon, Check } from 'lucide-react';

export default function Header({
  onSearch,
  onOpenHelp,
  onCopyLink,
  isCopied,
}) {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
      setInputVal('');
    }
  };

  return (
    <header className="h-14 border-b border-obs-border bg-obs-surface px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Left: Branding */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-obs-accent/20 border border-obs-accent/40 flex items-center justify-center text-obs-accent font-mono font-bold text-xs">
            SX
          </div>
          <h1 className="font-semibold text-obs-text tracking-tight text-sm sm:text-base">
            SPHEREx Sky Tracker
          </h1>
        </div>
        <span className="hidden lg:inline text-[11px] text-obs-muted pl-2 border-l border-obs-border">
          NASA Space Apps Challenge 2026 · Unofficial Public Tool
        </span>
      </div>

      {/* Center: Search input (name or coordinates) */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-md relative">
        <Search className="w-3.5 h-3.5 text-obs-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Search object name or RA, Dec (e.g. 133.795, -7.245)"
          className="w-full bg-obs-bg border border-obs-border rounded px-3 pl-8 py-1.5 text-xs text-obs-text placeholder:text-obs-muted/50 focus:outline-none focus:border-obs-accent transition-colors font-mono"
        />
        <button
          type="submit"
          className="absolute right-1 top-1 bottom-1 px-2.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-obs-accent bg-obs-accent/10 hover:bg-obs-accent/20 rounded transition-colors"
        >
          Find
        </button>
      </form>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCopyLink}
          title="Copy shareable link with current celestial coordinates & observation state"
          className="px-2.5 py-1.5 text-xs font-medium rounded border border-obs-border bg-obs-raised hover:bg-obs-border text-obs-text transition-colors flex items-center gap-1.5"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <LinkIcon className="w-3.5 h-3.5 text-obs-muted" />}
          <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Methodology, instructions, and keyboard shortcuts"
          className="px-2.5 py-1.5 text-xs font-medium rounded border border-obs-accent/40 bg-obs-accent/10 hover:bg-obs-accent/20 text-obs-accent transition-colors flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
