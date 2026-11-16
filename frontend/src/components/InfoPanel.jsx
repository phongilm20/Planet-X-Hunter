import React, { useState, useEffect } from 'react';
import { 
  Info, 
  ExternalLink, 
  HelpCircle, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  BookOpen
} from 'lucide-react';
import { degToHMS, degToDMS, computeDisplacement, SPHEREX_PIXEL_SCALE_ARCSEC } from '../utils/astronomy';

export default function InfoPanel({
  target,
  targetCoords,
  epochA,
  epochB,
  spectralData,
}) {
  const [showPlanetXContext, setShowPlanetXContext] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(true);

  if (!target && !targetCoords) return null;

  const deltaYears = Math.abs((epochB?.year || 2026.5) - (epochA?.year || 2025.0));
  const pmRa = target?.pmRa?.value || 0;
  const pmDec = target?.pmDec?.value || 0;
  const { totalArcsec, totalPixels } = computeDisplacement(pmRa, pmDec, deltaYears);

  const raVal = target?.ra?.value || targetCoords?.ra;
  const decVal = target?.dec?.value || targetCoords?.dec;

  const wavelengths = spectralData?.wavelengths || [];
  const fluxEpoch1 = spectralData?.flux_epoch1 || [];
  const fluxEpoch2 = spectralData?.flux_epoch2 || [];
  const hasSpectrum = wavelengths.length > 0;

  return (
    <aside className="w-80 xl:w-96 h-full flex flex-col bg-obs-surface border-l border-obs-border select-none z-10 shrink-0 overflow-y-auto no-scrollbar divide-y divide-obs-border/70 text-xs">
      
      {/* ── 1. Target Header & Coordinates ── */}
      <div className="p-4 bg-obs-bg/40">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-obs-accent font-semibold">
              {target?.category || 'Custom Coordinates'}
            </div>
            <h2 className="text-base font-bold text-obs-text mt-0.5">
              {target?.commonName || target?.name || 'Selected Coordinate'}
            </h2>
          </div>
          {target?.discoveryYear?.value && (
            <span className="px-2 py-0.5 rounded bg-obs-raised text-obs-muted font-mono text-[10px] border border-obs-border">
              Disc. {target.discoveryYear.value}
            </span>
          )}
        </div>

        {/* Real Coordinates & Sexagesimal Readout */}
        <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded bg-obs-raised border border-obs-border font-mono text-[11px]">
          <div>
            <span className="text-[10px] text-obs-muted block">Right Ascension</span>
            <strong className="text-obs-text block">{degToHMS(raVal)}</strong>
            <span className="text-[10px] text-obs-muted">({raVal?.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-[10px] text-obs-muted block">Declination</span>
            <strong className="text-obs-text block">{degToDMS(decVal)}</strong>
            <span className="text-[10px] text-obs-muted">({decVal?.toFixed(5)}°)</span>
          </div>
        </div>
      </div>

      {/* ── 2. What Is It? & Why Does It Move? ── */}
      <div className="p-4 space-y-3 leading-relaxed">
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-obs-muted mb-1 font-semibold">
            What is it?
          </h3>
          <p className="text-obs-text">
            {target?.whatIsIt || 'A user-specified celestial position under multi-epoch observation.'}
          </p>
        </div>

        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-obs-muted mb-1 font-semibold">
            Why does it move?
          </h3>
          <p className="text-obs-text">
            {target?.whyDoesItMove || 'Celestial objects exhibit proper motion according to their true space velocity and distance.'}
          </p>
        </div>

        {/* ── 3. What You Should See (Live Calculated Displacement) ── */}
        <div className="p-3 rounded bg-obs-raised border border-obs-border font-mono">
          <div className="text-[10px] text-obs-accent font-semibold uppercase tracking-wider mb-1">
            What you should see (Epoch A → B)
          </div>
          <div className="text-obs-text text-[11px] space-y-1">
            <div>
              Elapsed Baseline: <strong>{deltaYears.toFixed(2)} years</strong>
            </div>
            <div>
              Expected Shift: <strong className="text-obs-amber">{totalArcsec.toFixed(2)}″</strong> ({totalPixels.toFixed(2)} SPHEREx pixels)
            </div>
            <div className="text-[10px] text-obs-muted pt-1 border-t border-obs-border/50">
              {target?.expectedBehavior === 'monopole'
                ? 'Monopole signature: position stays fixed; brightness changes.'
                : 'Dipole signature: negative residual at old position, positive at new.'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Sourced Facts Table ── */}
      <div className="p-4 space-y-2">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-obs-muted font-semibold">
          Catalog Properties & Sourced Values
        </h3>

        <div className="divide-y divide-obs-border/50 font-mono text-[11px]">
          {target?.distance && (
            <div className="py-1.5 flex items-start justify-between gap-2">
              <span className="text-obs-muted">Distance:</span>
              <div className="text-right">
                <span className="text-obs-text font-semibold">{target.distance.value} {target.distance.unit}</span>
                <span className="block text-[9px] text-obs-muted/80">{target.distance.source}</span>
              </div>
            </div>
          )}

          {target?.parallax && (
            <div className="py-1.5 flex items-start justify-between gap-2">
              <span className="text-obs-muted">Parallax:</span>
              <div className="text-right">
                <span className="text-obs-text font-semibold">{target.parallax.value} {target.parallax.unit}</span>
                <span className="block text-[9px] text-obs-muted/80">{target.parallax.source}</span>
              </div>
            </div>
          )}

          {target?.pmTotal && (
            <div className="py-1.5 flex items-start justify-between gap-2">
              <span className="text-obs-muted">Proper Motion:</span>
              <div className="text-right">
                <span className="text-obs-text font-semibold">{target.pmTotal.value} {target.pmTotal.unit}</span>
                <span className="block text-[9px] text-obs-muted/80">{target.pmRa.source}</span>
              </div>
            </div>
          )}

          {target?.spectralType && (
            <div className="py-1.5 flex items-start justify-between gap-2">
              <span className="text-obs-muted">Spectral Type:</span>
              <div className="text-right">
                <span className="text-obs-text font-semibold">{target.spectralType.value}</span>
                <span className="block text-[9px] text-obs-muted/80">{target.spectralType.source}</span>
              </div>
            </div>
          )}

          {target?.magnitude && (
            <div className="py-1.5 flex items-start justify-between gap-2">
              <span className="text-obs-muted">Magnitude:</span>
              <div className="text-right">
                <span className="text-obs-text font-semibold">{target.magnitude.value} {target.magnitude.unit}</span>
                <span className="block text-[9px] text-obs-muted/80">{target.magnitude.source}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. SPHEREx 102-Band Spectrophotometry (Rendered ONLY if data exists) ── */}
      {hasSpectrum && (
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono uppercase tracking-wider text-obs-muted font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-obs-accent" />
              <span>SPHEREx 102-Band Spectrum (0.75–5.0 µm)</span>
            </h3>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-obs-raised text-obs-amber border border-obs-border">
              SIMULATED
            </span>
          </div>

          <div className="w-full h-32 bg-obs-bg rounded border border-obs-border p-2 relative">
            {/* Molecular Features Annotation (Clearly stated as TYPICAL POSITIONS) */}
            <div className="absolute top-1 inset-x-2 flex justify-between text-[8px] font-mono text-obs-muted/70 pointer-events-none">
              <span>0.75 µm</span>
              <span title="Typical position of CH4 absorption">CH₄ 1.6</span>
              <span title="Typical position of H2O ice absorption">H₂O 2.7</span>
              <span title="Typical position of CH4 absorption">CH₄ 3.3</span>
              <span>5.0 µm</span>
            </div>

            {/* SVG Spectrogram curve */}
            <svg className="w-full h-full pt-3" viewBox="0 0 102 50" preserveAspectRatio="none">
              {/* Epoch 1 curve */}
              <polyline
                fill="none"
                stroke="#4DA3FF"
                strokeWidth="1.5"
                points={wavelengths
                  .map((w, i) => {
                    const val = fluxEpoch1[i] || 1.0;
                    const y = Math.max(4, Math.min(46, 50 - val * 20));
                    return `${i},${y}`;
                  })
                  .join(' ')}
              />
              {/* Epoch 2 curve */}
              {fluxEpoch2.length > 0 && (
                <polyline
                  fill="none"
                  stroke="#FF6B6B"
                  strokeWidth="1.5"
                  strokeDasharray="2,1"
                  points={wavelengths
                    .map((w, i) => {
                      const val = fluxEpoch2[i] || 1.0;
                      const y = Math.max(4, Math.min(46, 50 - val * 20));
                      return `${i},${y}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>

            <div className="absolute bottom-1 right-2 text-[8px] font-mono text-obs-muted/70">
              *Annotated lines show typical molecular band positions
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Honest Planet X / Planet Nine Disclosure ── */}
      <div className="p-4 bg-obs-bg/20">
        <button
          onClick={() => setShowPlanetXContext(!showPlanetXContext)}
          className="w-full flex items-center justify-between text-left text-obs-muted hover:text-obs-text transition-colors"
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-obs-accent">
            How would Planet X look?
          </span>
          {showPlanetXContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPlanetXContext && (
          <div className="mt-2 text-obs-muted text-xs leading-relaxed font-sans space-y-2 border-t border-obs-border/50 pt-2">
            <p>
              A hypothetical planet in the distant scattered disk (~450 AU) would move extremely slowly (<strong className="text-obs-text">≈0.16″/year</strong>, dominated by Earth's annual parallax reflex).
            </p>
            <p>
              Because reflected sunlight drops with the fourth power of distance ($1/r^4$), it is nearly invisible to optical survey telescopes. SPHEREx searches for its internal thermal glow in Band 6 (4.5–5.0 µm) by subtracting all-sky maps separated by 6 months.
            </p>
            <div className="p-2 rounded bg-obs-raised text-[10px] text-obs-muted font-mono border border-obs-border">
              Note: This tool provides scientific image inspection and proper-motion differencing for researchers and citizen scientists; it does not claim astronomical detections.
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}
