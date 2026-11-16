import React from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obs-bg/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl max-h-[85vh] bg-obs-surface border border-obs-border rounded-lg shadow-2xl flex flex-col overflow-hidden text-obs-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-obs-border flex items-center justify-between shrink-0 bg-obs-raised/50">
          <div>
            <h2 className="text-sm font-semibold text-obs-text">
              SPHEREx Sky Tracker — User Guide & Methodology
            </h2>
            <p className="text-[11px] text-obs-muted mt-0.5">
              NASA Space Apps Challenge 2026 · "Planet X and SPHEREx" (Advanced)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-obs-muted hover:text-obs-text hover:bg-obs-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-obs-text/90">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obs-accent mb-1.5">
              What This Tool Does
            </h3>
            <p>
              NASA's SPHEREx mission surveys the entire sky every ~6 months in 102 near-infrared bands (0.75–5.0 µm).
              This tool provides an instant, transparent answer to:
            </p>
            <blockquote className="mt-1.5 pl-3 border-l-2 border-obs-accent text-obs-text italic">
              "When has SPHEREx observed this patch of sky, and where was the target at each of those times?"
            </blockquote>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obs-accent mb-1.5">
              Reading the Sky Chart
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-obs-muted">
              <li>
                <strong className="text-obs-text">Projection:</strong> Local tangent plane with North up and East left.
                Distances are shown in arcseconds from field center.
              </li>
              <li>
                <strong className="text-obs-accent">SPHEREx Pointings:</strong> Diamonds indicating where the telescope
                pointed, colored chronologically from light blue to deep sapphire.
              </li>
              <li>
                <strong className="text-amber-400">Target Track:</strong> The target's calculated positions connected by a
                motion vector line. Scrubbing or playing the timeline advances the marker along its track.
              </li>
              <li>
                <strong className="text-obs-text">Reference Scale:</strong> Includes an arcsecond scale bar and a 6.15″
                SPHEREx detector pixel circle for instant scale comparison.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-obs-accent mb-1.5">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>/</span>
                <span className="text-obs-muted">Focus search input</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>Spacebar</span>
                <span className="text-obs-muted">Play / Pause track</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>← / →</span>
                <span className="text-obs-muted">Step between epochs</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>+ / -</span>
                <span className="text-obs-muted">Zoom in / Zoom out</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>0 or R</span>
                <span className="text-obs-muted">Reset field view</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-obs-border text-[11px] text-obs-muted">
            <strong>Data Attribution:</strong> Live data retrieved directly in-browser from NASA/IPAC IRSA (SPHEREx),
            ESA Gaia DR3, CDS Sesame / SIMBAD, and JPL Horizons. Built for NASA Space Apps Challenge 2026. Not an official NASA product.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-obs-border bg-obs-raised/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded bg-obs-accent text-obs-bg font-semibold hover:bg-obs-accent/90 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
