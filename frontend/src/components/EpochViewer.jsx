import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ── Mode badge config ──────────────────────────────────────────────
const MODE_BADGES = {
  epoch1: { label: 'EPOCH 1 (DR1)', bg: '#2563eb', color: '#fff' },
  epoch2: { label: 'EPOCH 2 (QR3)', bg: '#16a34a', color: '#fff' },
  blink:  { label: 'BLINK COMPARATOR', bg: '#d97706', color: '#fff', animated: true },
  diff:   { label: 'DIFFERENCE (E2-E1)', bg: '#c026d3', color: '#fff' },
  coadd:  { label: 'CO-ADD (SNR BOOST)', bg: '#06b6d4', color: '#fff' },
};

// ── Pulse keyframes injected once ──────────────────────────────────
const STYLE_ID = '__epoch-viewer-keyframes__';
function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ev-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.6; transform: scale(1.06); }
    }
    @keyframes ev-blink-dot {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.2; }
    }
    @keyframes ev-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes ev-crossfade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ── Simple WCS pixel → RA/Dec (TAN projection, CDi_j) ─────────────
function pixelToRaDec(px, py, wcs) {
  if (!wcs) return null;
  const crpix1 = wcs.CRPIX1 ?? wcs.crpix1 ?? 0;
  const crpix2 = wcs.CRPIX2 ?? wcs.crpix2 ?? 0;
  const crval1 = wcs.CRVAL1 ?? wcs.crval1 ?? 0;
  const crval2 = wcs.CRVAL2 ?? wcs.crval2 ?? 0;
  const cd11 = wcs.CD1_1 ?? wcs.cd1_1 ?? (wcs.CDELT1 ?? wcs.cdelt1 ?? 1);
  const cd12 = wcs.CD1_2 ?? wcs.cd1_2 ?? 0;
  const cd21 = wcs.CD2_1 ?? wcs.cd2_1 ?? 0;
  const cd22 = wcs.CD2_2 ?? wcs.cd2_2 ?? (wcs.CDELT2 ?? wcs.cdelt2 ?? 1);

  const dx = px - crpix1;
  const dy = py - crpix2;
  const ra  = crval1 + cd11 * dx + cd12 * dy;
  const dec = crval2 + cd21 * dx + cd22 * dy;
  return { ra, dec };
}

// ── Component ──────────────────────────────────────────────────────
export default function EpochViewer({
  cutoutData = null,
  cutoutDataEpoch1 = null,
  cutoutDataEpoch2 = null,
  mode = 'epoch1',
  blinkSpeed = 1000,
  showAnomalies = false,
  loading = false,
  ra,
  dec,
  band,
  onPixelClick,
}) {
  ensureKeyframes();

  // ── Blink state ────────────────────────────────────────────────
  const [blinkEpoch, setBlinkEpoch] = useState(1);
  const blinkRef = useRef(null);

  useEffect(() => {
    if (mode !== 'blink') {
      setBlinkEpoch(1);
      return;
    }
    const intervalMs = blinkSpeed <= 10 ? 1000 / Math.max(blinkSpeed, 0.2) : blinkSpeed;
    const interval = setInterval(() => {
      setBlinkEpoch((prev) => (prev === 1 ? 2 : 1));
    }, intervalMs);
    blinkRef.current = interval;
    return () => clearInterval(interval);
  }, [mode, blinkSpeed]);

  // ── Resolve which image / data to show ─────────────────────────
  const activeData = useMemo(() => {
    if (mode === 'epoch1') return cutoutDataEpoch1 || cutoutData;
    if (mode === 'epoch2') return cutoutDataEpoch2 || cutoutData?.epoch2 || cutoutData;
    if (mode === 'blink') {
      const e1 = cutoutDataEpoch1 || cutoutData;
      const e2 = cutoutDataEpoch2 || cutoutData?.epoch2 || cutoutData;
      return blinkEpoch === 1 ? e1 : e2;
    }
    // diff / coadd are pre-computed on the backend and passed via cutoutData
    return cutoutData;
  }, [mode, blinkEpoch, cutoutData, cutoutDataEpoch1, cutoutDataEpoch2]);

  const hasImage = !!activeData?.image;
  const imgWidth  = activeData?.width  ?? 512;
  const imgHeight = activeData?.height ?? 512;
  const anomalies = activeData?.anomalies ?? cutoutData?.anomalies ?? [];
  const stats     = activeData?.stats     ?? cutoutData?.stats     ?? null;
  const wcs       = activeData?.wcs       ?? cutoutData?.wcs       ?? null;

  // ── Click handler ──────────────────────────────────────────────
  const containerRef = useRef(null);

  const handleClick = useCallback(
    (e) => {
      if (!onPixelClick || !wcs) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Map viewport click → image pixel coords
      const scaleX = imgWidth / rect.width;
      const scaleY = imgHeight / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;
      const coord = pixelToRaDec(px, py, wcs);
      if (coord) onPixelClick(coord.ra, coord.dec);
    },
    [onPixelClick, wcs, imgWidth, imgHeight],
  );

  // ── Badge ──────────────────────────────────────────────────────
  const badge = MODE_BADGES[mode] ?? MODE_BADGES.epoch1;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 280,
        background: '#070A12',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: hasImage ? 'crosshair' : 'default',
        userSelect: 'none',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Empty state ─────────────────────────────────────────── */}
      {!hasImage && !loading && <EmptyState />}

      {/* ── Image layer (with blink crossfade) ──────────────────── */}
      {mode === 'blink' && (cutoutDataEpoch1?.image || cutoutData?.image) && (cutoutDataEpoch2?.image || cutoutData?.epoch2?.image) ? (
        <BlinkLayer
          epoch1Src={cutoutDataEpoch1?.image || cutoutData?.image}
          epoch2Src={cutoutDataEpoch2?.image || cutoutData?.epoch2?.image}
          blinkEpoch={blinkEpoch}
        />
      ) : (
        hasImage && (
          <img
            src={activeData.image}
            alt="Cutout"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        )
      )}

      {/* ── Crosshair ───────────────────────────────────────────── */}
      <Crosshair />

      {/* ── Mode badge ──────────────────────────────────────────── */}
      <ModeBadge badge={badge} blinkEpoch={blinkEpoch} mode={mode} />

      {/* ── Blink epoch label ───────────────────────────────────── */}
      {mode === 'blink' && hasImage && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'monospace',
            background: blinkEpoch === 1 ? '#2563eb' : '#16a34a',
            color: '#fff',
          }}
        >
          {blinkEpoch === 1 ? 'EPOCH 1' : 'EPOCH 2'}
        </div>
      )}

      {/* ── Anomaly overlays ────────────────────────────────────── */}
      {showAnomalies && anomalies.length > 0 && (
        <AnomalyOverlays anomalies={anomalies} imgWidth={imgWidth} imgHeight={imgHeight} />
      )}

      {/* ── Stats HUD ───────────────────────────────────────────── */}
      {stats && hasImage && <StatsHUD stats={stats} />}

      {/* ── Loading overlay ─────────────────────────────────────── */}
      {loading && <LoadingOverlay />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sub-components
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EmptyState() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.35)',
        fontFamily: 'monospace',
        gap: 12,
      }}
    >
      {/* Crosshair icon */}
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.2">
        <circle cx="24" cy="24" r="14" />
        <line x1="24" y1="4" x2="24" y2="16" />
        <line x1="24" y1="32" x2="24" y2="44" />
        <line x1="4" y1="24" x2="16" y2="24" />
        <line x1="32" y1="24" x2="44" y2="24" />
      </svg>
      <span style={{ fontSize: 13 }}>Select a target or enter coordinates</span>
    </div>
  );
}

// ── Blink Layer (crossfade) ──────────────────────────────────────
function BlinkLayer({ epoch1Src, epoch2Src, blinkEpoch }) {
  const imgStyle = (visible) => ({
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    transition: 'opacity 0.25s ease-in-out',
    opacity: visible ? 1 : 0,
  });

  return (
    <>
      <img src={epoch1Src} alt="Epoch 1" draggable={false} style={imgStyle(blinkEpoch === 1)} />
      <img src={epoch2Src} alt="Epoch 2" draggable={false} style={imgStyle(blinkEpoch === 2)} />
    </>
  );
}

// ── Crosshair ────────────────────────────────────────────────────
function Crosshair() {
  const line = {
    position: 'absolute',
    background: 'rgba(255,255,255,0.18)',
    pointerEvents: 'none',
  };
  return (
    <>
      {/* Vertical */}
      <div style={{ ...line, width: 1, height: '100%', left: '50%', top: 0, transform: 'translateX(-0.5px)' }} />
      {/* Horizontal */}
      <div style={{ ...line, height: 1, width: '100%', top: '50%', left: 0, transform: 'translateY(-0.5px)' }} />
    </>
  );
}

// ── Mode Badge ───────────────────────────────────────────────────
function ModeBadge({ badge, blinkEpoch, mode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'monospace',
        letterSpacing: '0.04em',
        background: badge.bg,
        color: badge.color,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        zIndex: 10,
      }}
    >
      {badge.animated && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#fff',
            display: 'inline-block',
            animation: 'ev-blink-dot 0.8s ease-in-out infinite',
          }}
        />
      )}
      {badge.label}
    </div>
  );
}

// ── Anomaly Overlays ─────────────────────────────────────────────
function AnomalyOverlays({ anomalies, imgWidth, imgHeight }) {
  return (
    <>
      {anomalies.map((a, i) => {
        const isDipole = (a.type ?? '').toLowerCase().includes('dipole');
        const color = isDipole ? '#00e5ff' : '#ffab00';

        // Normalize bounding-box coords to percentages
        const x = ((a.x ?? a.xmin ?? 0) / imgWidth) * 100;
        const y = ((a.y ?? a.ymin ?? 0) / imgHeight) * 100;
        const w = ((a.width ?? (a.xmax - a.xmin) ?? 20) / imgWidth) * 100;
        const h = ((a.height ?? (a.ymax - a.ymin) ?? 20) / imgHeight) * 100;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: `${w}%`,
              height: `${h}%`,
              border: `1.5px solid ${color}`,
              borderRadius: 3,
              pointerEvents: 'none',
              animation: 'ev-pulse 2s ease-in-out infinite',
              boxShadow: `0 0 6px ${color}44`,
              zIndex: 5,
            }}
          >
            {a.significance != null && (
              <span
                style={{
                  position: 'absolute',
                  top: -16,
                  left: 0,
                  fontSize: 9,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}
              >
                {Number(a.significance).toFixed(1)}σ
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

// ── Stats HUD ────────────────────────────────────────────────────
function StatsHUD({ stats }) {
  const fmt = (v) => (v != null ? Number(v).toPrecision(4) : '—');
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        padding: '5px 8px',
        borderRadius: 4,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        fontSize: 10,
        fontFamily: 'monospace',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.6,
        zIndex: 6,
        pointerEvents: 'none',
      }}
    >
      <div>min {fmt(stats.min)}</div>
      <div>max {fmt(stats.max)}</div>
      <div>μ   {fmt(stats.mean)}</div>
      <div>σ   {fmt(stats.std ?? stats.sigma ?? stats.stddev)}</div>
    </div>
  );
}

// ── Loading Overlay ──────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 20,
        gap: 14,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: '#06b6d4',
          borderRadius: '50%',
          animation: 'ev-spin 0.8s linear infinite',
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.04em',
        }}
      >
        Generating cutout…
      </span>
    </div>
  );
}
