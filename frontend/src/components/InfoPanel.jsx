import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Compass, ExternalLink, Info } from 'lucide-react';
import ObservationTable from './ObservationTable';
import { PRESETS, getRandomSkyPatch } from '../data/presets';
import { degToHMS, degToDMS } from '../lib/astro';

export default function InfoPanel({
  target,
  onSelectPreset,
  observations = [],
  obsStatus = 'success',
  obsError = null,
  obsFetchedAt = null,
  dataSource = 'NASA/IPAC IRSA',
  onRetry,
  onDownloadCSV,
}) {
  const [showPlanetXContext, setShowPlanetXContext] = useState(false);

  const pmTotal = target ? Math.hypot(target.pmra || 0, target.pmdec || 0) : 0;
  const distLy = target?.parallax > 0 ? (3.26156 / (target.parallax / 1000.0)).toFixed(2) : null;

  return (
    <aside className="w-80 xl:w-96 h-full flex flex-col bg-obs-surface border-l border-obs-border select-none z-10 shrink-0 overflow-y-auto no-scrollbar divide-y divide-obs-border text-xs">
      
      {/* ── 1. Challenge Presets Row ── */}
      <div className="p-3.5 bg-obs-bg/40">
        <div className="text-[10px] uppercase font-mono tracking-wider text-obs-muted mb-2 font-semibold">
          Challenge Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => {
            const isSelected = target?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id === 'random-patch') {
                    onSelectPreset(getRandomSkyPatch());
                  } else {
                    onSelectPreset(p);
                  }
                }}
                className={`px-2.5 py-1.5 rounded border text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-obs-accent/15 border-obs-accent text-obs-accent font-semibold'
                    : 'bg-obs-surface border-obs-border text-obs-text/90 hover:bg-obs-raised'
                }`}
              >
                <div className="truncate">{p.shortName}</div>
              </button>
            );
          })}
        </div>

        {/* Preset Caption */}
        {target?.caption && (
          <div className="mt-2.5 p-2 bg-obs-raised/50 border border-obs-border rounded text-[11px] text-obs-muted leading-relaxed">
            {target.caption}
          </div>
        )}
      </div>

      {/* ── 2. Selected Target Details ── */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-obs-accent font-semibold">
              {target?.category || 'Selected Target'}
            </div>
            <h2 className="text-sm font-bold text-obs-text mt-0.5">
              {target?.name || 'Unknown Field'}
            </h2>
          </div>
          {target?.source && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-obs-raised border border-obs-border text-obs-muted">
              {target.source}
            </span>
          )}
        </div>

        {/* Astrometric Metadata Table */}
        <div className="bg-obs-bg border border-obs-border rounded p-2.5 space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-obs-muted">RA (J2000):</span>
            <span className="text-obs-text">{degToHMS(target?.ra)} ({target?.ra?.toFixed(5)}°)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-obs-muted">Dec (J2000):</span>
            <span className="text-obs-text">{degToDMS(target?.dec)} ({target?.dec?.toFixed(5)}°)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-obs-muted">Proper Motion:</span>
            <span className="text-amber-400">
              {pmTotal > 0 ? `${(pmTotal / 1000.0).toFixed(3)}″/yr` : '—'}
            </span>
          </div>
          {target?.parallax > 0 && (
            <div className="flex justify-between">
              <span className="text-obs-muted">Distance:</span>
              <span className="text-obs-text">{distLy} ly ({target.parallax.toFixed(1)} mas)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. SPHEREx Observations List / Table ── */}
      <div className="p-3.5">
        <ObservationTable
          observations={observations}
          status={obsStatus}
          errorMessage={obsError}
          dataSource={dataSource}
          onRetry={onRetry}
          onDownloadCSV={onDownloadCSV}
        />
      </div>

      {/* ── 4. "Why Planet X is hard" Collapsible Paragraph ── */}
      <div className="p-3.5">
        <button
          onClick={() => setShowPlanetXContext((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-obs-text hover:text-obs-accent transition-colors"
        >
          <span>Why Planet X is hard to spot</span>
          {showPlanetXContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPlanetXContext && (
          <div className="mt-2.5 text-[11px] leading-relaxed text-obs-muted bg-obs-bg border border-obs-border rounded p-2.5 space-y-2">
            <p>
              A hypothetical distant planet orbiting at 400–800 AU would move extremely slowly
              (only 0.04–0.16″/year) and be extraordinarily faint, since reflected sunlight drops as 1/r⁴.
            </p>
            <p>
              Because SPHEREx pixels are 6.15″ across, a distant planet's annual shift is less than 0.05 pixels.
              Spotting such motion requires co-adding observations across multiple 6-month survey passes
              or cross-matching against baseline optical surveys (e.g. Rubin/LSST).
            </p>
            <p className="text-[10px] text-obs-text/80 pt-1 border-t border-obs-border">
              <strong>Disclosure:</strong> This tool plots SPHEREx observation timestamps and projected coordinates;
              it makes no autonomous detection claims.
            </p>
          </div>
        )}
      </div>

      {/* ── 5. Status & Data Provenance Line ── */}
      <div className="p-3.5 mt-auto bg-obs-bg/60 text-[10px] font-mono text-obs-muted space-y-1">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <span className="text-obs-accent">{dataSource}</span>
        </div>
        {obsFetchedAt && (
          <div className="flex items-center justify-between">
            <span>Last Fetched:</span>
            <span>{obsFetchedAt.slice(11, 19)} UTC</span>
          </div>
        )}
      </div>

    </aside>
  );
}
