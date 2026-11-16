import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Crosshair as CrosshairIcon, 
  Compass, 
  Sliders, 
  Layers, 
  Info, 
  AlertTriangle,
  Move,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { degToHMS, degToDMS, pixelToSky, skyToPixel, SPHEREX_PIXEL_SCALE_ARCSEC } from '../utils/astronomy';

export default function SkyImageViewer({
  mode = 'blink', // 'blink' | 'side-by-side' | 'difference'
  onModeChange,
  cutoutA,
  cutoutB,
  cutoutDiff,
  loading = false,
  error = null,
  target,
  targetCoords,
  gaiaSources = [],
  stretch = 'linear',
  onStretchChange,
  colormap = 'grayscale',
  onColormapChange,
  blinkSpeedHz = 2.0,
  onBlinkSpeedChange,
  activeBlinkEpoch = 'A',
  onToggleBlinkEpoch,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasRightRef = useRef(null); // For side-by-side view

  // Pan & Zoom state (synchronized across panels)
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Overlays
  const [showMarkers, setShowMarkers] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Mouse hover readout
  const [hoverReadout, setHoverReadout] = useState(null);

  // Reset Pan/Zoom
  const handleResetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Keyboard shortcut listener for viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyR') {
        handleResetView();
      } else if (e.code === 'KeyB') {
        onModeChange?.('blink');
      } else if (e.code === 'KeyS') {
        onModeChange?.('side-by-side');
      } else if (e.code === 'KeyD') {
        onModeChange?.('difference');
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(8.0, z * 1.25));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(0.5, z / 1.25));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetView, onModeChange]);

  // Active cutout depending on mode
  const activeCutout =
    mode === 'difference'
      ? cutoutDiff
      : activeBlinkEpoch === 'A'
      ? cutoutA
      : cutoutB;

  // WCS & Dimensions
  const wcs = activeCutout?.wcs || cutoutA?.wcs;
  const imgWidth = activeCutout?.width || 256;
  const imgHeight = activeCutout?.height || 256;

  // Render single canvas frame with colormap, stretch, and overlays
  const renderCanvasFrame = useCallback(
    (canvas, cutout, label, isDiff = false) => {
      if (!canvas || !cutout) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(w / 2 + pan.x, h / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-imgWidth / 2, -imgHeight / 2);

      // 1. Draw base astronomical image
      if (cutout.imageObj) {
        ctx.drawImage(cutout.imageObj, 0, 0, imgWidth, imgHeight);
      }

      // 2. Crosshair overlay
      if (showCrosshair) {
        ctx.strokeStyle = 'rgba(77, 163, 255, 0.4)';
        ctx.lineWidth = 1 / zoom;
        // Center crosshair
        const cx = imgWidth / 2;
        const cy = imgHeight / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 15, cy);
        ctx.lineTo(cx + 15, cy);
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy + 15);
        ctx.stroke();
      }

      // 3. Gaia DR3 Stationary Reference Stars Overlay
      if (showCatalog && gaiaSources.length > 0 && wcs) {
        ctx.strokeStyle = '#F5B94C';
        ctx.fillStyle = 'rgba(245, 185, 76, 0.2)';
        ctx.lineWidth = 1 / zoom;
        gaiaSources.forEach((star) => {
          const pt = skyToPixel(star.ra, star.dec, wcs);
          if (pt.x >= 0 && pt.x <= imgWidth && pt.y >= 0 && pt.y <= imgHeight) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4 / zoom, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }

      // 4. Target Marker Overlay & Proper Motion Vector
      if (showMarkers && target && wcs) {
        const ptA = skyToPixel(target.ra?.value || target.ra, target.dec?.value || target.dec, wcs);

        // Vector arrow linking Epoch A to Epoch B
        const pmRa = target.pmRa?.value || target.pmRa || 0;
        const pmDec = target.pmDec?.value || target.pmDec || 0;
        const dtA = (cutoutA?.year || 2025.0) - 2014.5;
        const dtB = (cutoutB?.year || 2026.5) - 2014.5;

        const cdelt1 = wcs.CDELT1 || -0.000325;
        const cdelt2 = wcs.CDELT2 || 0.000325;
        const shiftX_A = (pmRa * dtA / 3600.0) / cdelt1;
        const shiftY_A = (pmDec * dtA / 3600.0) / cdelt2;
        const shiftX_B = (pmRa * dtB / 3600.0) / cdelt1;
        const shiftY_B = (pmDec * dtB / 3600.0) / cdelt2;

        const posX_A = ptA.x + shiftX_A;
        const posY_A = ptA.y + shiftY_A;
        const posX_B = ptA.x + shiftX_B;
        const posY_B = ptA.y + shiftY_B;

        // Draw connecting vector
        ctx.strokeStyle = '#4DA3FF';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([3 / zoom, 2 / zoom]);
        ctx.beginPath();
        ctx.moveTo(posX_A, posY_A);
        ctx.lineTo(posX_B, posY_B);
        ctx.stroke();
        ctx.setLineDash([]);

        // Epoch A marker circle (Cyan / NASA blue)
        ctx.strokeStyle = '#4DA3FF';
        ctx.lineWidth = 1.8 / zoom;
        ctx.beginPath();
        ctx.arc(posX_A, posY_A, 8 / zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Epoch B marker circle (Amber / Red)
        ctx.strokeStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(posX_B, posY_B, 8 / zoom, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#E6EAF2';
        ctx.font = `${Math.max(10, 11 / zoom)}px "Inter", sans-serif`;
        ctx.fillText(target.commonName || target.name, posX_B + 12 / zoom, posY_B + 4 / zoom);
      }

      ctx.restore();
    },
    [pan, zoom, imgWidth, imgHeight, showCrosshair, showCatalog, gaiaSources, wcs, showMarkers, target, cutoutA, cutoutB]
  );

  // Load and cache Image objects for base64 cutouts
  const [loadedImages, setLoadedImages] = useState({});

  useEffect(() => {
    const toLoad = [
      { key: 'A', cutout: cutoutA },
      { key: 'B', cutout: cutoutB },
      { key: 'diff', cutout: cutoutDiff },
    ];

    toLoad.forEach(({ key, cutout }) => {
      if (cutout?.image && !loadedImages[cutout.image]) {
        const img = new Image();
        img.src = cutout.image.startsWith('data:') ? cutout.image : `data:image/png;base64,${cutout.image}`;
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [cutout.image]: img }));
        };
      }
    });
  }, [cutoutA, cutoutB, cutoutDiff, loadedImages]);

  // Redraw canvases whenever view, images, or modes change
  useEffect(() => {
    if (mode === 'side-by-side') {
      const cA = cutoutA ? { ...cutoutA, imageObj: loadedImages[cutoutA.image] } : null;
      const cB = cutoutB ? { ...cutoutB, imageObj: loadedImages[cutoutB.image] } : null;
      renderCanvasFrame(canvasRef.current, cA, cutoutA?.shortLabel || 'Epoch A');
      renderCanvasFrame(canvasRightRef.current, cB, cutoutB?.shortLabel || 'Epoch B');
    } else {
      const curCutout = mode === 'difference' ? cutoutDiff : activeBlinkEpoch === 'A' ? cutoutA : cutoutB;
      const curObj = curCutout ? { ...curCutout, imageObj: loadedImages[curCutout.image] } : null;
      renderCanvasFrame(canvasRef.current, curObj, curCutout?.shortLabel || '', mode === 'difference');
    }
  }, [mode, activeBlinkEpoch, cutoutA, cutoutB, cutoutDiff, loadedImages, renderCanvasFrame]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }

    // Pixel & WCS readout under cursor
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasX = (mouseX - rect.width / 2 - pan.x) / zoom + imgWidth / 2;
    const canvasY = (mouseY - rect.height / 2 - pan.y) / zoom + imgHeight / 2;

    if (canvasX >= 0 && canvasX <= imgWidth && canvasY >= 0 && canvasY <= imgHeight && wcs) {
      const { ra, dec } = pixelToSky(canvasX, canvasY, wcs);
      setHoverReadout({
        pixelX: Math.round(canvasX),
        pixelY: Math.round(canvasY),
        raDeg: ra,
        decDeg: dec,
        raHms: degToHMS(ra),
        decDms: degToDMS(dec),
        epochLabel: mode === 'difference' ? 'Difference (B - A)' : activeBlinkEpoch === 'A' ? cutoutA?.shortLabel : cutoutB?.shortLabel,
      });
    } else {
      setHoverReadout(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((z) => Math.min(10.0, Math.max(0.4, z * factor)));
  };

  // Provenance Badge
  const provenance = activeCutout?.provenance || 'simulated';

  // Wavelength awareness mismatch check
  const wavelengthA = cutoutA?.wavelengthUm;
  const wavelengthB = cutoutB?.wavelengthUm;
  const isWavelengthMismatch = wavelengthA && wavelengthB && Math.abs(wavelengthA - wavelengthB) > 0.15;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-obs-bg select-none overflow-hidden border-r border-obs-border"
    >
      {/* ── Top Viewer Toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-obs-surface border-b border-obs-border text-xs z-20">
        
        {/* Left: Mode Segmented Control (Blink, Side-by-side, Difference) */}
        <div className="flex items-center gap-1 bg-obs-bg p-0.5 rounded border border-obs-border">
          <button
            onClick={() => onModeChange?.('blink')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'blink'
                ? 'bg-obs-accent text-white font-semibold'
                : 'text-obs-muted hover:text-obs-text'
            }`}
            title="Blink Comparator: Toggles between Epoch A and B [Key: B]"
          >
            Blink
          </button>
          <button
            onClick={() => onModeChange?.('side-by-side')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'side-by-side'
                ? 'bg-obs-accent text-white font-semibold'
                : 'text-obs-muted hover:text-obs-text'
            }`}
            title="Side-by-Side: Synchronized dual viewport [Key: S]"
          >
            Side-by-Side
          </button>
          <button
            onClick={() => onModeChange?.('difference')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'difference'
                ? 'bg-obs-accent text-white font-semibold'
                : 'text-obs-muted hover:text-obs-text'
            }`}
            title="Difference Matrix: Epoch B - Epoch A subtraction [Key: D]"
          >
            Difference (B − A)
          </button>
        </div>

        {/* Center: Active Epoch Indicator / Mismatch Notice */}
        <div className="flex items-center gap-2">
          {mode === 'blink' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obs-bg border border-obs-border text-xs font-mono">
              <span className="text-obs-muted">Showing:</span>
              <span className={`font-semibold ${activeBlinkEpoch === 'A' ? 'text-obs-accent' : 'text-obs-red'}`}>
                {activeBlinkEpoch === 'A' ? cutoutA?.shortLabel || 'Epoch A' : cutoutB?.shortLabel || 'Epoch B'}
              </span>
            </div>
          )}

          {/* Provenance Badge */}
          <div
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider border ${
              provenance === 'IRSA-live'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : provenance === 'cached'
                ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                : 'bg-amber-950/80 text-amber-400 border-amber-800'
            }`}
            title={
              provenance === 'IRSA-live'
                ? 'Live data query from NASA/IPAC IRSA'
                : provenance === 'cached'
                ? 'Bundled cached survey cutout'
                : 'Simulated survey frame generated with physical Gaussian PSFs and proper motion offsets.'
            }
          >
            {provenance === 'IRSA-live' ? 'LIVE IRSA' : provenance === 'cached' ? 'CACHED' : 'SIMULATED'}
          </div>
        </div>

        {/* Right: Overlay Toggles & Stretch Settings */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
              showMarkers
                ? 'bg-obs-raised text-obs-accent border-obs-accent/60'
                : 'bg-obs-bg text-obs-muted border-obs-border hover:text-obs-text'
            }`}
            title="Toggle computed position markers and proper-motion vector"
          >
            Markers
          </button>
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
              showCatalog
                ? 'bg-obs-raised text-obs-amber border-obs-amber/60'
                : 'bg-obs-bg text-obs-muted border-obs-border hover:text-obs-text'
            }`}
            title="Toggle known Gaia reference stars"
          >
            Gaia Overlay
          </button>
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={`p-1.5 rounded transition-colors border ${
              showCrosshair
                ? 'bg-obs-raised text-obs-accent border-obs-accent/60'
                : 'bg-obs-bg text-obs-muted border-obs-border hover:text-obs-text'
            }`}
            title="Toggle center crosshair"
          >
            <CrosshairIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-1.5 rounded transition-colors border ${
              showControls
                ? 'bg-obs-raised text-obs-accent border-obs-accent/60'
                : 'bg-obs-bg text-obs-muted border-obs-border hover:text-obs-text'
            }`}
            title="Adjust stretch and colormap"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Optional Stretch & Colormap Drawer ── */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-2 bg-obs-raised border-b border-obs-border text-xs z-10">
          <div className="flex items-center gap-3">
            <span className="text-obs-muted font-medium">Stretch:</span>
            {['linear', 'sqrt', 'asinh', 'log'].map((s) => (
              <button
                key={s}
                onClick={() => onStretchChange?.(s)}
                className={`px-2 py-0.5 rounded capitalize ${
                  stretch === s ? 'bg-obs-accent text-white font-semibold' : 'text-obs-muted hover:text-obs-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-obs-muted font-medium">Colormap:</span>
            {['grayscale', 'inferno', 'viridis'].map((cm) => (
              <button
                key={cm}
                onClick={() => onColormapChange?.(cm)}
                className={`px-2 py-0.5 rounded capitalize ${
                  colormap === cm ? 'bg-obs-accent text-white font-semibold' : 'text-obs-muted hover:text-obs-text'
                }`}
              >
                {cm}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Wavelength Mismatch Warning Banner (LVF Science Caveat) ── */}
      {isWavelengthMismatch && (
        <div className="px-3 py-1.5 bg-obs-amber/10 border-b border-obs-amber/30 text-obs-amber text-xs flex items-center gap-2 z-10">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Wavelength notice:</strong> Epoch A ({wavelengthA} µm) and Epoch B ({wavelengthB} µm) observe in different SPHEREx bands. Pixel differences may reflect color gradients across Linear Variable Filters rather than pure motion.
          </span>
        </div>
      )}

      {/* ── Central Interactive Canvas Viewport ── */}
      <div
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Loading Spinner Overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-obs-bg/60 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-2 rounded bg-obs-surface border border-obs-border text-xs text-obs-text font-medium shadow-lg">
              <div className="w-4 h-4 border-2 border-obs-accent border-t-transparent rounded-full animate-spin" />
              <span>Fetching observation frames…</span>
            </div>
          </div>
        )}

        {/* Canvases */}
        {mode === 'side-by-side' ? (
          <div className="w-full h-full grid grid-cols-2 divide-x divide-obs-border">
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRef} width={512} height={512} className="max-w-full max-h-full" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-obs-surface/80 border border-obs-border text-[11px] font-mono text-obs-accent">
                {cutoutA?.shortLabel || 'Epoch A'} ({cutoutA?.wavelengthUm} µm)
              </div>
            </div>
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <canvas ref={canvasRightRef} width={512} height={512} className="max-w-full max-h-full" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-obs-surface/80 border border-obs-border text-[11px] font-mono text-obs-red">
                {cutoutB?.shortLabel || 'Epoch B'} ({cutoutB?.wavelengthUm} µm)
              </div>
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} width={512} height={512} className="max-w-full max-h-full" />
        )}

        {/* Astrometric Scale Bar & Compass (Bottom Left of Canvas) */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 pointer-events-none font-mono text-[10px] text-obs-muted bg-obs-surface/85 backdrop-blur px-2.5 py-1.5 rounded border border-obs-border shadow">
          <div className="flex items-center justify-between gap-4">
            <span>Scale: 30″</span>
            <span>SPHEREx ≈ 6.15″/px</span>
          </div>
          {/* 30 arcsec bar at current zoom */}
          <div className="w-24 h-1 bg-obs-accent relative">
            <div className="absolute -top-1 left-0 w-0.5 h-3 bg-obs-accent" />
            <div className="absolute -top-1 right-0 w-0.5 h-3 bg-obs-accent" />
          </div>
          <div className="text-[9px] text-obs-muted/80">North up, East left</div>
        </div>

        {/* Difference Dipole Legend (When in difference mode) */}
        {mode === 'difference' && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 bg-obs-surface/90 px-3 py-1.5 rounded border border-obs-border text-[11px] font-mono shadow">
            <span className="text-obs-text font-bold">Dipole Signature:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-obs-accent inline-block" />
              <span className="text-obs-muted">Old Position (negative residual)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-obs-red inline-block" />
              <span className="text-obs-muted">New Position (positive residual)</span>
            </div>
          </div>
        )}

        {/* Floating Pan/Zoom Controls (Top Right of Viewport) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-obs-surface/80 rounded border border-obs-border p-1 shadow">
          <button
            onClick={() => setZoom((z) => Math.min(8.0, z * 1.25))}
            className="p-1 hover:bg-obs-raised text-obs-muted hover:text-obs-text rounded transition-colors"
            title="Zoom In [+]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
            className="p-1 hover:bg-obs-raised text-obs-muted hover:text-obs-text rounded transition-colors"
            title="Zoom Out [-]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 hover:bg-obs-raised text-obs-muted hover:text-obs-text rounded transition-colors"
            title="Reset Pan & Zoom [Key: R]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Bottom Pixel & WCS Status Readout Bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-obs-surface border-t border-obs-border text-[11px] font-mono text-obs-muted z-20">
        <div className="flex items-center gap-4">
          {hoverReadout ? (
            <>
              <span>
                RA: <strong className="text-obs-text">{hoverReadout.raHms}</strong> ({hoverReadout.raDeg.toFixed(5)}°)
              </span>
              <span>
                Dec: <strong className="text-obs-text">{hoverReadout.decDms}</strong> ({hoverReadout.decDeg.toFixed(5)}°)
              </span>
              <span>
                Pixel: [{hoverReadout.pixelX}, {hoverReadout.pixelY}]
              </span>
            </>
          ) : (
            <span>Hover cursor over canvas for live RA/Dec coordinates</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Field: {(cutoutA?.stats ? `${(cutoutA.width * SPHEREX_PIXEL_SCALE_ARCSEC / 60).toFixed(1)}′` : '26.2′')}</span>
        </div>
      </div>
    </div>
  );
}
