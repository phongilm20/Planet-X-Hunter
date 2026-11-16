import React from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obs-bg/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-obs-surface border border-obs-border rounded-lg shadow-2xl flex flex-col overflow-hidden text-obs-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-obs-border flex items-center justify-between shrink-0 bg-obs-raised/50">
          <div>
            <h2 className="text-base font-semibold text-obs-text tracking-tight">
              SPHEREx Time-Domain Methodology & Guide
            </h2>
            <p className="text-xs text-obs-muted mt-0.5">
              NASA Space Apps Challenge 2026 · Planet X and SPHEREx (Advanced)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-obs-muted hover:text-obs-text hover:bg-obs-border/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-obs-text/90">
          {/* Section 1 */}
          <div>
            <h3 className="text-sm font-semibold text-obs-accent uppercase tracking-wider mb-2">
              1. The Science Goal
            </h3>
            <p>
              SPHEREx (Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer)
              is a NASA Medium Explorer (MIDEX) mission designed to map the entire sky every ~6 months in 102
              near-infrared spectral bands (0.75–5.0 µm) with a 6.15″/pixel detector scale.
            </p>
            <p className="mt-2">
              Over its 2-year nominal mission (4 complete sky surveys), SPHEREx collects multi-epoch spectra of over
              a billion celestial sources. This tool allows citizen scientists and researchers to quickly inspect
              and compare sky cutouts across temporal epochs to spot moving solar system bodies, high-proper-motion brown dwarfs,
              and candidate outer-solar-system trans-Neptunian objects (including Planet X / Planet Nine).
            </p>
          </div>

          {/* Section 2 */}
          <div>
            <h3 className="text-sm font-semibold text-obs-accent uppercase tracking-wider mb-2">
              2. How to Spot Moving Objects
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded bg-obs-bg border border-obs-border">
                <span className="font-semibold text-obs-text">Blink Comparator:</span> Pioneered by Clyde Tombaugh in 1930
                to discover Pluto. Rapidly toggling (1–2 Hz) between images taken months or years apart makes moving
                objects appear to "jump" against stationary background stars.
              </div>
              <div className="p-3 rounded bg-obs-bg border border-obs-border">
                <span className="font-semibold text-obs-text">Difference Image (B − A):</span> Subtracting an earlier epoch
                from a later epoch cancels out stationary stars and galaxies. A moving object leaves a characteristic{' '}
                <span className="text-obs-accent font-semibold">dipole</span>: a black deficit hole at the earlier position
                and a white excess peak at the later position. A variable star produces a single stationary monopole.
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h3 className="text-sm font-semibold text-obs-accent uppercase tracking-wider mb-2">
              3. Crucial Astrometric & Instrument Caveats
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-obs-muted">
              <li>
                <strong className="text-obs-text">SPHEREx Pixel Scale:</strong> Each pixel spans 6.15 arcseconds.
                Fast brown dwarfs like WISE 0855 move ~8.13″/yr (1.32 pixels/yr), easily resolved across 6-month epochs.
                Distant bodies (Planet X at 400+ AU) move only ~0.16″/yr (~0.026 pixels/yr), requiring precision centroid fitting.
              </li>
              <li>
                <strong className="text-amber-400">Linear Variable Filter (LVF) Mismatch:</strong> SPHEREx uses filters whose
                transmitted wavelength varies across the focal plane. If an object falls on different physical pixels in Survey 1
                versus Survey 2, the effective band may differ slightly (e.g. 2.40 µm vs 2.45 µm). A small flux difference in the subtraction
                does NOT necessarily indicate astrophysical variability.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div>
            <h3 className="text-sm font-semibold text-obs-accent uppercase tracking-wider mb-2">
              4. Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>Spacebar</span>
                <span className="text-obs-muted">Toggle Blink play / pause</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>B / S / D</span>
                <span className="text-obs-muted">Blink / Side-by-Side / Diff</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>← / →</span>
                <span className="text-obs-muted">Step between Epoch A and B</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>R</span>
                <span className="text-obs-muted">Reset Pan & Zoom</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>+ / -</span>
                <span className="text-obs-muted">Zoom In / Out</span>
              </div>
              <div className="p-2 rounded bg-obs-bg border border-obs-border flex justify-between">
                <span>Scroll wheel</span>
                <span className="text-obs-muted">Zoom at cursor</span>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="pt-2 border-t border-obs-border text-[11px] text-obs-muted">
            <span className="font-semibold text-obs-text">Data Attribution:</span> Images and catalogs sourced from NASA/IPAC Infrared
            Science Archive (IRSA), ESA Gaia Data Release 3, NASA AllWISE/CatWISE2020, and SPHEREx simulated datasets
            (JPL/Caltech).
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-obs-border bg-obs-raised/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded bg-obs-accent text-obs-bg font-semibold hover:bg-obs-accent/90 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
