import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SPHEREX_BANDS, bandToWavelength } from '../data/targets';
import { Activity, Eye, AlertTriangle } from 'lucide-react';

const FLAG_CONFIG = {
  SOURCE_CONFUSION: { symbol: 'triangle-up', color: '#F97316', label: 'Source Confusion' },
  DIFFRACTION_SPIKE: { symbol: 'diamond', color: '#EF4444', label: 'Diffraction Spike' },
  COSMIC_RAY: { symbol: 'star', color: '#EC4899', label: 'Cosmic Ray' },
  SATURATED: { symbol: 'square', color: '#FBBF24', label: 'Saturated' },
};

export default function SpectrumChart({
  spectralData,
  band = 50,
  setBand,
  onBandChange,
  loading = false,
  showFlags: initialShowFlags = true,
}) {
  const [showFlags, setShowFlags] = useState(initialShowFlags);
  const chartContainerRef = useRef(null);
  const handleSetBand = onBandChange || setBand;

  const currentWavelength = bandToWavelength(band);

  // Render or update plot
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!spectralData) return;

    const Plotly = window.Plotly;
    if (!Plotly) {
      console.warn("Plotly is not yet loaded on window.");
      return;
    }

    const {
      wavelengths = [],
      flux_epoch1 = [],
      flux_epoch2 = [],
      flux_error1 = [],
      flux_error2 = [],
      flags = [],
      band_ids = [],
    } = spectralData;

    if (!wavelengths.length) return;

    const customHover1 = wavelengths.map((w, i) =>
      `<b>Band #${band_ids[i] || i + 1}</b><br>λ = ${w.toFixed(3)} µm<br>Epoch 1: ${flux_epoch1[i]?.toFixed(3) || 'N/A'} MJy/sr<br>Flag: <b>${flags[i] || 'CLEAN'}</b>`
    );

    const customHover2 = wavelengths.map((w, i) =>
      `<b>Band #${band_ids[i] || i + 1}</b><br>λ = ${w.toFixed(3)} µm<br>Epoch 2: ${flux_epoch2[i]?.toFixed(3) || 'N/A'} MJy/sr<br>Flag: <b>${flags[i] || 'CLEAN'}</b>`
    );

    const traces = [];

    // Trace 1: Epoch 1 (Cyan)
    if (flux_epoch1.length) {
      traces.push({
        x: wavelengths,
        y: flux_epoch1,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Epoch 1 (DR1)',
        line: { color: '#38BDF8', width: 2 },
        marker: { size: 4, color: '#38BDF8' },
        error_y: {
          type: 'data',
          array: flux_error1,
          visible: true,
          color: 'rgba(56,189,248,0.4)',
          thickness: 1,
          width: 2,
        },
        hoverinfo: 'text',
        text: customHover1,
      });
    }

    // Trace 2: Epoch 2 (Amber)
    if (flux_epoch2.length) {
      traces.push({
        x: wavelengths,
        y: flux_epoch2,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Epoch 2 (QR3)',
        line: { color: '#F59E0B', width: 2 },
        marker: { size: 4, color: '#F59E0B' },
        error_y: {
          type: 'data',
          array: flux_error2,
          visible: true,
          color: 'rgba(245,158,11,0.4)',
          thickness: 1,
          width: 2,
        },
        hoverinfo: 'text',
        text: customHover2,
      });
    }

    // Contamination flags overlay
    if (showFlags) {
      const flagX = [];
      const flagY = [];
      const flagSymbols = [];
      const flagColors = [];
      const flagHover = [];

      flags.forEach((f, i) => {
        if (f && f !== 'CLEAN' && FLAG_CONFIG[f]) {
          const cfg = FLAG_CONFIG[f];
          const yVal = flux_epoch2[i] ?? flux_epoch1[i] ?? 0;
          flagX.push(wavelengths[i]);
          flagY.push(yVal * 1.1 + 0.1);
          flagSymbols.push(cfg.symbol);
          flagColors.push(cfg.color);
          flagHover.push(`<b>FLAG: ${cfg.label}</b><br>Band #${band_ids[i] || i + 1} (${wavelengths[i].toFixed(3)} µm)`);
        }
      });

      if (flagX.length) {
        traces.push({
          x: flagX,
          y: flagY,
          type: 'scatter',
          mode: 'markers',
          name: 'Quality Flags',
          marker: {
            symbol: flagSymbols,
            size: 9,
            color: flagColors,
            line: { width: 1, color: '#FFFFFF' },
          },
          hoverinfo: 'text',
          text: flagHover,
          showlegend: true,
        });
      }
    }

    // Layout configuration
    // Background detector regions
    const detectorShapes = SPHEREX_BANDS.map((det) => ({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: det.startWl,
      x1: det.endWl,
      y0: 0,
      y1: 1,
      fillcolor: det.color,
      opacity: 0.08,
      line: { width: 0 },
      layer: 'below',
    }));

    // Vertical indicator line for selected wavelength
    detectorShapes.push({
      type: 'line',
      xref: 'x',
      yref: 'paper',
      x0: currentWavelength,
      x1: currentWavelength,
      y0: 0,
      y1: 1,
      line: {
        color: '#00E5FF',
        width: 1.5,
        dash: 'dot',
      },
      layer: 'above',
    });

    const layout = {
      paper_bgcolor: '#0B0F19',
      plot_bgcolor: '#111827',
      margin: { l: 45, r: 20, t: 30, b: 35 },
      height: 230,
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0.02,
        y: 1.15,
        font: { family: 'monospace', size: 10, color: '#9CA3AF' },
        bgcolor: 'rgba(0,0,0,0)',
      },
      shapes: detectorShapes,
      xaxis: {
        title: { text: 'Wavelength (µm)', font: { size: 10, color: '#6B7280' } },
        range: [0.70, 5.10],
        tickvals: [0.75, 1.11, 1.64, 2.42, 3.82, 4.42, 5.0],
        tickformat: '.2f',
        tickfont: { family: 'monospace', size: 9, color: '#9CA3AF' },
        gridcolor: '#1F2937',
        zerolinecolor: '#374151',
      },
      yaxis: {
        title: { text: 'Flux (MJy/sr)', font: { size: 10, color: '#6B7280' } },
        tickfont: { family: 'monospace', size: 9, color: '#9CA3AF' },
        gridcolor: '#1F2937',
        zerolinecolor: '#374151',
        autorange: true,
      },
      hovermode: 'closest',
      hoverlabel: {
        bgcolor: '#111827',
        bordercolor: '#38BDF8',
        font: { family: 'monospace', size: 11, color: '#F3F4F6' },
      },
    };

    const config = {
      responsive: true,
      displayModeBar: false,
      staticPlot: false,
    };

    Plotly.react(chartContainerRef.current, traces, layout, config);

    // Click handler to select band
    const el = chartContainerRef.current;
    const onClick = (data) => {
      if (data?.points?.[0]) {
        const pt = data.points[0];
        const clickedWl = pt.x;
        // Find nearest band
        let bestIdx = 0;
        let bestDist = 999;
        wavelengths.forEach((w, i) => {
          const d = Math.abs(w - clickedWl);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        });
        const selectedId = band_ids[bestIdx] || bestIdx + 1;
        handleSetBand?.(selectedId);
      }
    };

    el.on('plotly_click', onClick);

    const onResize = () => {
      Plotly.Plots.resize(el);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (el?.removeAllListeners) {
        el.removeAllListeners('plotly_click');
      }
    };
  }, [spectralData, currentWavelength, showFlags, handleSetBand]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-900/60 p-2">
      {/* Top Header */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-gray-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-gray-200">102-Band SPHEREx Spectrophotometer</span>
          <span className="text-[10px] text-gray-500 font-mono">(0.75 – 5.0 µm)</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quality flags toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 hover:text-gray-200 select-none">
            <input
              type="checkbox"
              checked={showFlags}
              onChange={(e) => setShowFlags(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Bitmask Flags
            </span>
          </label>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
            Selected: Band #{band} (λ={currentWavelength.toFixed(3)} µm)
          </span>
        </div>
      </div>

      {/* Plot Area */}
      <div className="flex-1 w-full min-h-[190px] relative">
        {loading && (
          <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
