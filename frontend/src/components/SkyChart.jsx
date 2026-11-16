import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Layers, 
  Compass, 
  Crosshair,
  Calendar,
  Move
} from 'lucide-react';
import { 
  tangentPlaneProject, 
  degToHMS, 
  degToDMS, 
  SPHEREX_PIXEL_SCALE_ARCSEC 
} from '../lib/astro';

export default function SkyChart({
  target,
  observations = [],
  trackPoints = [],
  backgroundStars = [],
  activeTrackIndex = 0,
  onSelectTrackIndex,
  onExportPNG,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Zoom & Pan state (field radius in arcseconds)
  // Default: 120 arcsec (+-2 arcmin)
  const [fieldRadiusArcsec, setFieldRadiusArcsec] = useState(120);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // in arcseconds
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Layer toggles
  const [showFootprints, setShowFootprints] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  const [showBackgroundStars, setShowBackgroundStars] = useState(true);

  // Hover state
  const [hoveredItem, setHoveredItem] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Center coordinates
  const centerRa = target?.ra || 0;
  const centerDec = target?.dec || 0;

  // Render loop
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0B0E14';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    // Scale: pixels per arcsecond
    // visible radius = fieldRadiusArcsec
    const scale = (Math.min(width, height) / 2 - 40) / fieldRadiusArcsec;

    // Transform arcsecond offsets to canvas coords (North Up = -Y, East Left = -X)
    const arcsecToCanvas = (dxArcsec, dyArcsec) => {
      const px = centerX - (dxArcsec - panOffset.x) * scale;
      const py = centerY - (dyArcsec - panOffset.y) * scale;
      return { px, py };
    };

    // Draw Subtle Grid & Coordinate Cross
    ctx.strokeStyle = '#1A2130';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal RA axis (Dec = 0 offset)
    const yAxis = centerY + panOffset.y * scale;
    ctx.moveTo(0, yAxis);
    ctx.lineTo(width, yAxis);
    // Vertical Dec axis (RA = 0 offset)
    const xAxis = centerX + panOffset.x * scale;
    ctx.moveTo(xAxis, 0);
    ctx.lineTo(xAxis, height);
    ctx.stroke();

    // Range rings (30", 60", 120")
    [30, 60, 120, 300, 600].forEach((r) => {
      if (r * scale < Math.min(width, height) / 2) {
        ctx.strokeStyle = '#151D2A';
        ctx.beginPath();
        ctx.arc(xAxis, yAxis, r * scale, 0, Math.PI * 2);
        ctx.stroke();
        // Ring label
        ctx.fillStyle = '#4B5565';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${r}″`, xAxis + r * scale + 4, yAxis - 4);
      }
    });

    // ── Layer 1: Gaia Background Stationary Stars ──
    if (showBackgroundStars && backgroundStars.length > 0) {
      backgroundStars.forEach((star) => {
        const proj = tangentPlaneProject(star.ra, star.dec, centerRa, centerDec);
        const { px, py } = arcsecToCanvas(proj.xArcsec, proj.yArcsec);
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const starRadius = Math.max(1.5, Math.min(4.0, (18.0 - (star.mag || 14)) * 0.7));
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.arc(px, py, starRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // ── Layer 2: SPHEREx Observation Footprints / Pointings ──
    if (showFootprints && observations.length > 0) {
      const minYear = observations[0].year;
      const maxYear = observations[observations.length - 1].year;
      const yearRange = Math.max(0.1, maxYear - minYear);

      observations.forEach((obs, idx) => {
        const proj = tangentPlaneProject(obs.ra, obs.dec, centerRa, centerDec);
        const { px, py } = arcsecToCanvas(proj.xArcsec, proj.yArcsec);

        // Single-hue sequential colormap (Light Blue to Dark Accent)
        const t = (obs.year - minYear) / yearRange;
        // Color ramp from cyan-blue #70B5FF to deep sapphire #2563EB
        const rVal = Math.round(112 * (1 - t) + 37 * t);
        const gVal = Math.round(181 * (1 - t) + 99 * t);
        const bVal = Math.round(255 * (1 - t) + 235 * t);
        const colStr = `rgb(${rVal}, ${gVal}, ${bVal})`;

        // SPHEREx pointing marker (diamond with FOV outline)
        ctx.strokeStyle = colStr;
        ctx.fillStyle = `${colStr}33`;
        ctx.lineWidth = 1.5;

        // Draw diamond
        const size = 7;
        ctx.beginPath();
        ctx.moveTo(px, py - size);
        ctx.lineTo(px + size, py);
        ctx.lineTo(px, py + size);
        ctx.lineTo(px - size, py);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // SPHEREx pixel scale circle reference around pointing
        const pxCircleRad = (SPHEREX_PIXEL_SCALE_ARCSEC / 2) * scale;
        if (pxCircleRad > 3) {
          ctx.strokeStyle = `${colStr}55`;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(px, py, pxCircleRad, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // ── Layer 3: Target Track (Proper Motion / Ephemeris trajectory) ──
    if (showTrack && trackPoints.length > 0) {
      // Connect points with thin line
      ctx.strokeStyle = '#4DA3FF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      trackPoints.forEach((pt, i) => {
        const proj = tangentPlaneProject(pt.ra, pt.dec, centerRa, centerDec);
        const { px, py } = arcsecToCanvas(proj.xArcsec, proj.yArcsec);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Draw dated dots along the track
      trackPoints.forEach((pt, i) => {
        const proj = tangentPlaneProject(pt.ra, pt.dec, centerRa, centerDec);
        const { px, py } = arcsecToCanvas(proj.xArcsec, proj.yArcsec);
        const isActive = i === activeTrackIndex;

        // Outer glow/ring for active
        if (isActive) {
          ctx.strokeStyle = '#F5B94C';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Dot fill
        ctx.fillStyle = pt.isHistorical ? '#98A2B8' : isActive ? '#F5B94C' : '#4DA3FF';
        ctx.beginPath();
        ctx.arc(px, py, isActive ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Text label
        ctx.fillStyle = isActive ? '#F5B94C' : '#E6EAF2';
        ctx.font = isActive ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
        ctx.fillText(pt.label || `${pt.year.toFixed(1)}`, px + 8, py - 4);
      });
    }

    // ── Center Reticle (Target Center) ──
    ctx.strokeStyle = '#F5B94C88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(xAxis, yAxis, 4, 0, Math.PI * 2);
    ctx.moveTo(xAxis - 8, yAxis);
    ctx.lineTo(xAxis + 8, yAxis);
    ctx.moveTo(xAxis, yAxis - 8);
    ctx.lineTo(xAxis, yAxis + 8);
    ctx.stroke();

    // ── Scale Bar & SPHEREx Pixel Scale Indicator ──
    const barArcsec = fieldRadiusArcsec <= 60 ? 10 : fieldRadiusArcsec <= 180 ? 30 : 60;
    const barPx = barArcsec * scale;
    const barX = 24;
    const barY = height - 28;

    ctx.strokeStyle = '#E6EAF2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX + barPx, barY);
    ctx.moveTo(barX, barY - 4);
    ctx.lineTo(barX, barY + 4);
    ctx.moveTo(barX + barPx, barY - 4);
    ctx.lineTo(barX + barPx, barY + 4);
    ctx.stroke();

    ctx.fillStyle = '#E6EAF2';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(`${barArcsec}″`, barX + barPx / 2 - 8, barY - 8);

    // SPHEREx pixel circle reference
    const spxRad = (SPHEREX_PIXEL_SCALE_ARCSEC / 2) * scale;
    const spxX = barX + barPx + 48;
    ctx.strokeStyle = '#4DA3FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(spxX, barY, spxRad, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#98A2B8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`SPHEREx Pixel (6.15″)`, spxX + spxRad + 8, barY + 3);

    // ── Compass Indicator (N Up, E Left) ──
    const compX = width - 40;
    const compY = 40;
    ctx.strokeStyle = '#98A2B8';
    ctx.lineWidth = 1.5;
    // North (Up)
    ctx.beginPath();
    ctx.moveTo(compX, compY);
    ctx.lineTo(compX, compY - 20);
    ctx.stroke();
    ctx.fillStyle = '#E6EAF2';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('N', compX - 3, compY - 24);

    // East (Left)
    ctx.beginPath();
    ctx.moveTo(compX, compY);
    ctx.lineTo(compX - 20, compY);
    ctx.stroke();
    ctx.fillText('E', compX - 32, compY + 4);

  }, [
    centerRa, 
    centerDec, 
    fieldRadiusArcsec, 
    panOffset, 
    showFootprints, 
    showTrack, 
    showBackgroundStars, 
    observations, 
    trackPoints, 
    backgroundStars, 
    activeTrackIndex
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        drawChart();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Mouse drag & pan
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dxPx = e.clientX - dragStartRef.current.x;
      const dyPx = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const scale = (Math.min(canvas.width, canvas.height) / 2 - 40) / fieldRadiusArcsec;
      setPanOffset((prev) => ({
        x: prev.x - dxPx / scale,
        y: prev.y + dyPx / scale,
      }));
    }

    // Tooltip hit test
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });

    const scale = (Math.min(canvas.width, canvas.height) / 2 - 40) / fieldRadiusArcsec;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Hit test track points
    let hit = null;
    trackPoints.forEach((pt, idx) => {
      const proj = tangentPlaneProject(pt.ra, pt.dec, centerRa, centerDec);
      const px = centerX - (proj.xArcsec - panOffset.x) * scale;
      const py = centerY - (proj.yArcsec - panOffset.y) * scale;
      const dist = Math.hypot(mx - px, my - py);
      if (dist < 10) {
        hit = {
          type: 'track',
          index: idx,
          title: pt.label || `Epoch ${pt.year.toFixed(2)}`,
          date: pt.date,
          ra: pt.ra,
          dec: pt.dec,
          provenance: pt.provenance
        };
      }
    });

    setHoveredItem(hit);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom controls
  const handleZoom = (factor) => {
    setFieldRadiusArcsec((prev) => Math.max(15, Math.min(900, prev * factor)));
  };

  const handleReset = () => {
    setFieldRadiusArcsec(120);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden bg-obs-bg select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => {
          if (hoveredItem && hoveredItem.type === 'track') {
            onSelectTrackIndex(hoveredItem.index);
          }
        }}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Top Floating Controls & Layer Toggles */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
        <button
          onClick={() => setShowFootprints((v) => !v)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showFootprints 
              ? 'bg-obs-accent/20 border-obs-accent text-obs-accent' 
              : 'bg-obs-surface/80 border-obs-border text-obs-muted hover:text-obs-text'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#4DA3FF]" />
          <span>SPHEREx Pointings ({observations.length})</span>
        </button>

        <button
          onClick={() => setShowTrack((v) => !v)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showTrack 
              ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
              : 'bg-obs-surface/80 border-obs-border text-obs-muted hover:text-obs-text'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Target Track</span>
        </button>

        <button
          onClick={() => setShowBackgroundStars((v) => !v)}
          className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
            showBackgroundStars 
              ? 'bg-obs-raised border-obs-border text-obs-text' 
              : 'bg-obs-surface/80 border-obs-border text-obs-muted hover:text-obs-text'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Gaia Stars</span>
        </button>
      </div>

      {/* Top Right Zoom & Export Controls */}
      <div className="absolute top-3 right-16 flex items-center gap-1 bg-obs-surface/90 border border-obs-border rounded p-1 z-10">
        <button
          onClick={() => handleZoom(0.7)}
          title="Zoom in (+ key)"
          className="p-1.5 text-obs-muted hover:text-obs-text hover:bg-obs-raised rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(1.4)}
          title="Zoom out (- key)"
          className="p-1.5 text-obs-muted hover:text-obs-text hover:bg-obs-raised rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          title="Reset field (0 or R key)"
          className="p-1.5 text-obs-muted hover:text-obs-text hover:bg-obs-raised rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onExportPNG}
          title="Download PNG of chart"
          className="p-1.5 text-obs-muted hover:text-obs-text hover:bg-obs-raised rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover Tooltip */}
      {hoveredItem && (
        <div
          className="absolute pointer-events-none z-30 bg-obs-surface border border-obs-accent/70 rounded p-2.5 shadow-xl text-xs space-y-1 font-mono"
          style={{
            left: Math.min(window.innerWidth - 250, mousePos.x + 14),
            top: Math.max(10, mousePos.y - 40),
          }}
        >
          <div className="font-bold text-obs-accent">{hoveredItem.title}</div>
          <div className="text-obs-text">UTC: {hoveredItem.date}</div>
          <div className="text-obs-muted">RA: {degToHMS(hoveredItem.ra)} ({hoveredItem.ra.toFixed(5)}°)</div>
          <div className="text-obs-muted">Dec: {degToDMS(hoveredItem.dec)} ({hoveredItem.dec.toFixed(5)}°)</div>
          <div className="text-[10px] text-amber-400 pt-0.5 border-t border-obs-border">Source: {hoveredItem.provenance}</div>
        </div>
      )}
    </div>
  );
}
