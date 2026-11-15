import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  Table, 
  Layers, 
  Eye, 
  ExternalLink, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Compass,
  Cpu,
  Flame,
  Globe
} from 'lucide-react';
import { AI_INSIGHTS } from '../data/aiInsights';
import { raToHMS, decToDMS, SPHEREX_BANDS } from '../data/targets';

export default function RightPanelAI({
  target,
  spectralData,
  gaiaStars = [],
  irsaSources = [],
  year = 2026.0,
}) {
  const [selectedChip, setSelectedChip] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState('spectrum'); // 'spectrum' | 'gaia' | 'irsa' | null
  const [hoveredBand, setHoveredBand] = useState(null);

  const targetName = target?.name || 'WISE 0855-0714';
  const targetInsightData = AI_INSIGHTS[targetName] || AI_INSIGHTS['WISE 0855-0714'];
  const activeChipId = selectedChip || targetInsightData.defaultChip || 'motion';
  const currentInsightText = targetInsightData.insights[activeChipId] || targetInsightData.insights[targetInsightData.defaultChip];

  const wavelengths = spectralData?.wavelengths || [];
  const flux1 = spectralData?.flux_epoch1 || [];
  const flux2 = spectralData?.flux_epoch2 || [];

  return (
    <aside 
      className="fixed top-20 right-6 bottom-6 z-30 w-full max-w-[420px] hidden lg:flex flex-col rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] text-slate-900 overflow-hidden select-none transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
      }}
    >
      
      {/* ── 1. Target Header & Real NASA Astrometry (Bright High-Contrast Header) ── */}
      <div className="p-5 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{target?.icon || '✨'}</span>
              <span className="text-xs font-black tracking-wider uppercase text-sky-800">
                {target?.type || 'Celestial Target'}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-950 mt-1 tracking-tight">
              {target?.name || 'WISE 0855-0714'}
            </h1>
            <div className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1.5">
              <span>Classification:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 border border-slate-300 font-extrabold">
                {target?.spectralType}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-xs font-black font-mono shadow-sm">
              {target?.distanceLy ? `${target.distanceLy} ly` : 'Outer Solar Sys'}
            </span>
            <div className="text-[11px] text-slate-600 font-bold font-mono mt-1.5">
              Parallax: {target?.parallax ? `${target.parallax} mas` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Real Coordinates & Data Source Badges */}
        <div className="grid grid-cols-2 gap-2 mt-3.5 p-3 rounded-2xl bg-slate-100/90 border border-slate-300 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">J2000 Right Ascension</span>
            <span className="font-black text-slate-900 text-xs">{target?.ra ? raToHMS(target.ra) : '--'}</span>
            <span className="text-[11px] text-sky-700 font-bold block">({target?.ra?.toFixed(5)}°)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 font-bold block uppercase tracking-wider">J2000 Declination</span>
            <span className="font-black text-slate-900 text-xs">{target?.dec ? decToDMS(target.dec) : '--'}</span>
            <span className="text-[11px] text-sky-700 font-bold block">({target?.dec?.toFixed(5)}°)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black tracking-wide">
            NASA SPHEREx DR1/QR3
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black tracking-wide">
            ESA Gaia DR3 Live
          </span>
        </div>
      </div>

      {/* ── Scrollable Body: AI Assistant & Spectrum ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">

        {/* ── 2. AI Astrophysics Assistant ("AI Discovery Insight") ── */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/90 border border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-950">
                AI Discovery Insight
              </span>
            </div>
            <span className="text-[10px] font-black font-mono text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          {/* Interactive Prompt Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {targetInsightData.chips.map((chip) => {
              const isActive = activeChipId === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedChip(chip.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow font-black scale-105'
                      : 'bg-white text-slate-800 hover:bg-indigo-50 border border-slate-300 shadow-sm'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* AI Explanation Text */}
          <div className="text-xs text-slate-800 leading-relaxed font-sans prose prose-indigo max-w-none">
            {currentInsightText.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2 last:mb-0 font-medium">
                {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
              </p>
            ))}
          </div>
        </div>

        {/* ── 3. 102-Band SPHEREx Spectrogram (Collapsible Accordion) ── */}
        <div className="rounded-2xl bg-white border border-slate-300 overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'spectrum' ? null : 'spectrum')}
            className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-700" />
              <span className="text-xs font-black text-slate-900">
                102-Band SPHEREx Spectrogram (0.75 – 5.0 µm)
              </span>
            </div>
            {activeAccordion === 'spectrum' ? (
              <ChevronUp className="w-4 h-4 text-slate-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {activeAccordion === 'spectrum' && (
            <div className="p-3.5 space-y-3">
              {/* Custom SVG 102-Band Spectrum Curve */}
              <div className="relative w-full h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-2">
                {/* Wavelength Grid & Absorption Labels */}
                <div className="absolute inset-0 flex justify-between px-3 text-[9px] font-mono text-slate-400 pointer-events-none pt-1">
                  <span>0.75 µm</span>
                  <span className="text-indigo-300 font-bold">CH₄ 1.6</span>
                  <span className="text-cyan-300 font-bold">H₂O 2.7</span>
                  <span className="text-amber-300 font-bold">CH₄ 3.3</span>
                  <span>5.0 µm</span>
                </div>

                {/* SVG Curve Plot */}
                <svg className="w-full h-full pt-4" viewBox="0 0 102 60" preserveAspectRatio="none">
                  {/* Epoch 1 curve (Cyan / Blue) */}
                  {wavelengths.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.8"
                      points={wavelengths
                        .map((w, i) => {
                          const val = flux1[i] || 1.0;
                          const y = Math.max(5, Math.min(55, 60 - val * 22));
                          return `${i},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Epoch 2 curve (Magenta / Orange) */}
                  {wavelengths.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="1.8"
                      strokeDasharray="2.5,1.5"
                      points={wavelengths
                        .map((w, i) => {
                          const val = flux2[i] || 1.0;
                          const y = Math.max(5, Math.min(55, 60 - val * 22));
                          return `${i},${y}`;
                        })
                        .join(' ')}
                    />
                  )}
                </svg>

                {/* Legend Overlay */}
                <div className="absolute bottom-1.5 left-2.5 flex items-center gap-3 text-[9px] font-mono text-slate-200 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-sky-400 inline-block rounded" />
                    <span className="font-bold">Epoch 1 (DR1)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-1 bg-rose-500 inline-block border-b border-dashed rounded" />
                    <span className="font-bold">Epoch 2 (QR3)</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 font-mono font-bold flex items-center justify-between">
                <span>102 Narrow Spectral Channels</span>
                <span className="text-sky-700 font-extrabold">Resolving Power R ≈ 35 to 130</span>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Raw Gaia DR3 & IRSA Telemetry Table (Collapsible) ── */}
        <div className="rounded-2xl bg-white border border-slate-300 overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveAccordion(activeAccordion === 'gaia' ? null : 'gaia')}
            className="w-full flex items-center justify-between p-3.5 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black text-slate-900">
                Gaia DR3 & NASA IRSA Astrometry ({gaiaStars.length} Stars)
              </span>
            </div>
            {activeAccordion === 'gaia' ? (
              <ChevronUp className="w-4 h-4 text-slate-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {activeAccordion === 'gaia' && (
            <div className="p-3 overflow-x-auto max-h-48 no-scrollbar">
              <table className="w-full text-left text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 font-bold">
                    <th className="py-1">Source ID</th>
                    <th className="py-1">RA / Dec</th>
                    <th className="py-1">pmRA / pmDE</th>
                    <th className="py-1">G Mag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {gaiaStars.slice(0, 8).map((star, i) => (
                    <tr key={i} className="hover:bg-slate-50 font-medium">
                      <td className="py-1 font-bold text-sky-800 truncate max-w-[90px]">
                        {star.source_id?.replace('GAIA-DR3-', '') || `Star #${i+1}`}
                      </td>
                      <td className="py-1">
                        {star.ra?.toFixed(3)}°, {star.dec?.toFixed(3)}°
                      </td>
                      <td className="py-1">
                        {star.pmra?.toFixed(1)}, {star.pmdec?.toFixed(1)}
                      </td>
                      <td className="py-1 font-bold text-slate-900">
                        {star.phot_g_mean_mag?.toFixed(1) || '17.0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── Footer Status Pill ── */}
      <div className="p-3 border-t border-slate-200 bg-slate-100 text-center">
        <div className="text-[10px] font-mono font-bold text-slate-600">
          SPHEREx Near-IR All-Sky Spectral Survey • NASA JPL & Caltech IPAC
        </div>
      </div>

    </aside>
  );
}
