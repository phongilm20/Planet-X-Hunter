import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  Table, 
  Layers, 
  Eye, 
  Sparkles, 
  Download, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import SpectrumChart from './SpectrumChart';

export default function ScientistDrawer({
  isOpen,
  onClose,
  spectralData,
  band,
  onBandChange,
  gaiaStars = [],
  irsaSources = [],
  mode,
  onModeChange,
  diffA,
  setDiffA,
  diffB,
  setDiffB,
  target,
  ra,
  dec,
}) {
  const [activeTab, setActiveTab] = useState('spectrum'); // 'spectrum' | 'gaia' | 'irsa'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col max-h-[75vh] bg-white/92 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-15px_40px_rgba(0,0,0,0.25)] text-slate-900 rounded-t-3xl transition-all duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Astrophysicist Telemetry Console</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('spectrum')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'spectrum' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              102-Band SPHEREx Spectrogram
            </button>
            <button
              onClick={() => setActiveTab('gaia')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'gaia' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gaia DR3 Astrometry ({gaiaStars.length})
            </button>
            <button
              onClick={() => setActiveTab('irsa')}
              className={`px-3 py-1 rounded-full transition-all ${
                activeTab === 'irsa' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NASA IRSA / AllWISE ({irsaSources.length})
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Close Scientist Console"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tab 1: 102-Band Spectrogram */}
        {activeTab === 'spectrum' && (
          <div className="w-full h-64">
            <SpectrumChart
              spectralData={spectralData}
              band={band}
              onBandChange={onBandChange}
              mode={mode}
            />
          </div>
        )}

        {/* Tab 2: Raw Gaia DR3 Table */}
        {activeTab === 'gaia' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Live CDS VizieR TAP / Gaia DR3 Astrometry Catalog around center: ({ra?.toFixed(4)}°, {dec?.toFixed(4)}°)</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Real Astrometric Epoch 2016.0
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Source ID</th>
                    <th className="px-3 py-2">RA (deg)</th>
                    <th className="px-3 py-2">Dec (deg)</th>
                    <th className="px-3 py-2">pmRA (mas/yr)</th>
                    <th className="px-3 py-2">pmDec (mas/yr)</th>
                    <th className="px-3 py-2">Parallax (mas)</th>
                    <th className="px-3 py-2">G Mag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gaiaStars.map((star, idx) => (
                    <tr key={idx} className="hover:bg-sky-50/50 transition-colors">
                      <td className="px-3 py-1.5 font-bold text-sky-700">{star.source_id}</td>
                      <td className="px-3 py-1.5">{star.ra?.toFixed(5)}</td>
                      <td className="px-3 py-1.5">{star.dec?.toFixed(5)}</td>
                      <td className={`px-3 py-1.5 ${Math.abs(star.pmra) > 10 ? 'font-bold text-amber-600' : ''}`}>{star.pmra}</td>
                      <td className={`px-3 py-1.5 ${Math.abs(star.pmdec) > 10 ? 'font-bold text-amber-600' : ''}`}>{star.pmdec}</td>
                      <td className="px-3 py-1.5">{star.parallax}</td>
                      <td className="px-3 py-1.5">{star.phot_g_mean_mag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: NASA IRSA / AllWISE Catalog */}
        {activeTab === 'irsa' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>NASA/IPAC Infrared Science Archive (IRSA) AllWISE Multi-Band Photometry Catalog</span>
              <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                NASA IRSA Mirror Active
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Designation</th>
                    <th className="px-3 py-2">RA (deg)</th>
                    <th className="px-3 py-2">Dec (deg)</th>
                    <th className="px-3 py-2">W1 (3.4 µm)</th>
                    <th className="px-3 py-2">W2 (4.6 µm)</th>
                    <th className="px-3 py-2">W3 (12 µm)</th>
                    <th className="px-3 py-2">Dist (arcsec)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {irsaSources.map((src, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-3 py-1.5 font-bold text-amber-700">{src.designation || `WISE-${idx}`}</td>
                      <td className="px-3 py-1.5">{src.ra?.toFixed(5)}</td>
                      <td className="px-3 py-1.5">{src.dec?.toFixed(5)}</td>
                      <td className="px-3 py-1.5">{src.w1mpro}</td>
                      <td className="px-3 py-1.5">{src.w2mpro}</td>
                      <td className="px-3 py-1.5">{src.w3mpro}</td>
                      <td className="px-3 py-1.5">{src.dist_arcsec}″</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
