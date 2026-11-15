import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NASA_TARGETS } from '../data/targets';

const SURVEYS = [
  { id: 'P/allWISE/color', label: 'AllWISE Color' },
  { id: 'P/2MASS/color', label: '2MASS Color' },
  { id: 'P/DSS2/color', label: 'DSS2 Color' },
];

export default function AladinViewer({
  ra,
  dec,
  fov,
  targets = [],
  selectedTarget = null,
  onCoordinateChange,
  onCoordsChange,
}) {
  const coordChangeCallback = onCoordinateChange || onCoordsChange;
  const containerRef = useRef(null);
  const aladinRef = useRef(null);
  const targetCatalogRef = useRef(null);
  const gaiaCatalogRef = useRef(null);
  const wiseCatalogRef = useRef(null);
  const arrowOverlayRef = useRef(null);
  const prevCoordsRef = useRef({ ra, dec, fov });

  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [activeSurvey, setActiveSurvey] = useState(SURVEYS[0].id);
  const [showGaia, setShowGaia] = useState(false);
  const [showWise, setShowWise] = useState(false);

  // ── 1. Aladin Lite Initialization ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;

    function init() {
      if (cancelled) return;

      if (!window.A) {
        // Poll until the script has loaded (up to 15 s)
        let elapsed = 0;
        pollTimer = setInterval(() => {
          elapsed += 200;
          if (window.A) {
            clearInterval(pollTimer);
            pollTimer = null;
            if (!cancelled) bootstrap();
          } else if (elapsed > 15000) {
            clearInterval(pollTimer);
            pollTimer = null;
            if (!cancelled) setOffline(true);
          }
        }, 200);
        return;
      }
      bootstrap();
    }

    function bootstrap() {
      if (cancelled || aladinRef.current) return;
      try {
        const aladin = window.A.aladin('#aladin-container', {
          survey: 'P/allWISE/color',
          fov: (fov || 30) / 60,
          target: `${ra} ${dec}`,
          showReticle: true,
          showLayersControl: false,
          showGotoControl: false,
          showFullscreenControl: false,
          cooFrame: 'J2000',
        });
        aladinRef.current = aladin;

        // 6. Click / position-changed handler
        if (typeof coordChangeCallback === 'function') {
          aladin.on('positionChanged', (e) => {
            coordChangeCallback(e.ra, e.dec);
          });
        }

        setReady(true);
      } catch (err) {
        console.error('Aladin Lite init failed:', err);
        setOffline(true);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      // Aladin Lite v3 doesn't expose a destroy method; clearing the
      // container is the recommended cleanup.
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      aladinRef.current = null;
      targetCatalogRef.current = null;
      gaiaCatalogRef.current = null;
      wiseCatalogRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Sync with App State (ra / dec / fov) ───────────────────────
  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !ready) return;

    const prev = prevCoordsRef.current;
    if (prev.ra !== ra || prev.dec !== dec) {
      aladin.gotoRaDec(ra, dec);
    }
    if (prev.fov !== fov) {
      aladin.setFov(fov / 60);
    }
    prevCoordsRef.current = { ra, dec, fov };
  }, [ra, dec, fov, ready]);

  // ── 3. Survey Layer Toggle ─────────────────────────────────────────
  const handleSurveyChange = useCallback(
    (surveyId) => {
      const aladin = aladinRef.current;
      if (!aladin) return;
      aladin.setImageSurvey(surveyId);
      setActiveSurvey(surveyId);
    },
    [],
  );

  // ── 4a. Gaia DR3 Catalog Overlay ──────────────────────────────────
  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !ready) return;

    if (showGaia) {
      if (!gaiaCatalogRef.current) {
        const gaiaCat = window.A.catalogFromVizieR('I/355/gaiadr3', `${ra} ${dec}`, 0.25, {
          onClick: 'showTable',
          name: 'Gaia DR3',
          color: '#38BDF8',
          sourceSize: 8,
          limit: 1000,
        });
        aladin.addCatalog(gaiaCat);
        gaiaCatalogRef.current = gaiaCat;
      }
    } else if (gaiaCatalogRef.current) {
      gaiaCatalogRef.current.hide();
    }

    return () => {};
  }, [showGaia, ready, ra, dec]);

  // ── 4b. AllWISE Sources Overlay ────────────────────────────────────
  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !ready) return;

    if (showWise) {
      if (!wiseCatalogRef.current) {
        const wiseCat = window.A.catalogFromVizieR('II/328/allwise', `${ra} ${dec}`, 0.25, {
          onClick: 'showTable',
          name: 'AllWISE',
          color: '#FB923C',
          sourceSize: 8,
          limit: 1000,
        });
        aladin.addCatalog(wiseCat);
        wiseCatalogRef.current = wiseCat;
      }
    } else if (wiseCatalogRef.current) {
      wiseCatalogRef.current.hide();
    }

    return () => {};
  }, [showWise, ready, ra, dec]);

  // ── 5. Target Markers ─────────────────────────────────────────────
  useEffect(() => {
    const aladin = aladinRef.current;
    const targetList = targets && targets.length ? targets : NASA_TARGETS;
    if (!aladin || !ready || !targetList.length) return;

    // Remove previous target catalog if any
    if (targetCatalogRef.current) {
      try {
        targetCatalogRef.current.removeAll();
      } catch (_) {
        /* ignore */
      }
    }

    const cat = window.A.catalog({
      name: 'NASA Targets',
      sourceSize: 18,
      color: '#F59E0B',
    });

    targetList.forEach((t) => {
      cat.addSources([
        window.A.source(t.ra, t.dec, { name: t.name }),
      ]);
    });

    aladin.addCatalog(cat);
    targetCatalogRef.current = cat;
  }, [targets, ready]);

  // ── Highlight selected target ──────────────────────────────────────
  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !ready || !selectedTarget) return;
    aladin.gotoRaDec(selectedTarget.ra, selectedTarget.dec);
  }, [selectedTarget, ready]);

  // ── 7. Proper-Motion Vectors (SVG overlay) ─────────────────────────
  // We compute pixel offsets for small arrow overlays whenever the view
  // changes.  Because Aladin Lite doesn't expose world-to-pixel in the
  // public API consistently, we approximate by placing an absolutely-
  // positioned SVG layer on top of the container and converting proper
  // motion (mas/yr) into a visual direction + length.
  const renderProperMotionArrows = useCallback(() => {
    const aladin = aladinRef.current;
    const svg = arrowOverlayRef.current;
    const targetList = targets && targets.length ? targets : NASA_TARGETS;
    if (!aladin || !svg || !targetList.length) return;

    // Clear previous arrows
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const containerEl = containerRef.current;
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();

    targetList.forEach((t) => {
      const pmRa = t.pmra || t.pm_ra || (t.properMotion ? t.properMotion.ra * 1000 : 0);
      const pmDec = t.pmdec || t.pm_dec || (t.properMotion ? t.properMotion.dec * 1000 : 0);
      if (pmRa === 0 && pmDec === 0) return;

      // world2pix may not be available; guard
      let pix;
      try {
        pix = aladin.world2pix(t.ra, t.dec);
      } catch (_) {
        return;
      }
      if (!pix) return;

      const [cx, cy] = pix;

      // Scale: 1 arcsec/yr ≈ 25 px for readability
      const scale = 25 / 1000; // px per mas/yr
      const mag = Math.sqrt(pmRa * pmRa + pmDec * pmDec);
      const len = Math.min(Math.max(mag * scale, 8), 50);
      const angle = Math.atan2(-pmDec, pmRa); // screen Y is inverted

      const dx = len * Math.cos(angle);
      const dy = len * Math.sin(angle);

      const ns = 'http://www.w3.org/2000/svg';

      // Arrow line
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', cx + dx);
      line.setAttribute('y2', cy + dy);
      line.setAttribute('stroke', '#34D399');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#pm-arrow)');
      svg.appendChild(line);
    });
  }, [targets]);

  useEffect(() => {
    const aladin = aladinRef.current;
    if (!aladin || !ready) return;

    // Re-draw arrows whenever the view moves
    const handler = () => renderProperMotionArrows();
    aladin.on('positionChanged', handler);
    aladin.on('zoomChanged', handler);
    // initial draw
    renderProperMotionArrows();
  }, [ready, renderProperMotionArrows]);

  // ── Render ─────────────────────────────────────────────────────────
  if (offline) {
    return (
      <div
        style={{
          width: '100%',
          height: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #334155',
          borderRadius: 8,
          background: '#0F172A',
          color: '#94A3B8',
          fontSize: 14,
        }}
      >
        Aladin Lite requires internet connection
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#0B0F19' }}>
      {/* ── Sky viewer ───────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#0B0F19',
        }}
      >
        <div
          id="aladin-container"
          style={{ width: '100%', height: '100%' }}
        />

        {/* SVG overlay for proper-motion arrows */}
        <svg
          ref={arrowOverlayRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <marker
              id="pm-arrow"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#34D399" />
            </marker>
          </defs>
        </svg>
      </div>

      {/* ── Floating Controls HUD at bottom ────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 9999,
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}
      >
        {/* Survey selector */}
        {SURVEYS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSurveyChange(s.id)}
            style={{
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 9999,
              border: activeSurvey === s.id ? '1px solid #F59E0B' : '1px solid transparent',
              background: activeSurvey === s.id ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeSurvey === s.id ? '#FBBF24' : '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {s.label}
          </button>
        ))}

        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

        {/* Catalog toggles */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: showGaia ? '#38BDF8' : '#94A3B8',
            cursor: 'pointer',
            padding: '2px 6px',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={showGaia}
            onChange={(e) => {
              setShowGaia(e.target.checked);
              if (e.target.checked && gaiaCatalogRef.current) {
                gaiaCatalogRef.current.show();
              }
            }}
            style={{ accentColor: '#38BDF8' }}
          />
          Gaia DR3
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: showWise ? '#FB923C' : '#94A3B8',
            cursor: 'pointer',
            padding: '2px 6px',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={showWise}
            onChange={(e) => {
              setShowWise(e.target.checked);
              if (e.target.checked && wiseCatalogRef.current) {
                wiseCatalogRef.current.show();
              }
            }}
            style={{ accentColor: '#FB923C' }}
          />
          AllWISE
        </label>
      </div>
    </div>
  );
}
