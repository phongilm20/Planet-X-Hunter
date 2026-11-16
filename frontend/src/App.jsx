import React, { useState, useEffect, useCallback, useRef } from 'react';
import TargetBar from './components/TargetBar';
import ControlPanel from './components/ControlPanel';
import EpochViewer from './components/EpochViewer';
import SpectrumChart from './components/SpectrumChart';
import AladinViewer from './components/AladinViewer';
import HowToGuide from './components/HowToGuide';
import StatusBar from './components/StatusBar';
import { NASA_TARGETS } from './data/targets';
import { getCutoutData, generateSpectrum, findTarget } from './utils/astroEngine';
import { Download, CheckCircle, Sparkles } from 'lucide-react';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ra: params.has('ra') ? parseFloat(params.get('ra')) : 133.79513,
    dec: params.has('dec') ? parseFloat(params.get('dec')) : -7.24515,
    fov: params.has('fov') ? Math.min(15, Math.max(1, parseFloat(params.get('fov')))) : 5,
    target: params.get('target') || 'WISE 0855-0714',
    mode: params.get('mode') || 'diff',
    band: params.has('band') ? Math.min(102, Math.max(1, parseInt(params.get('band'), 10))) : 50,
    stretch: params.get('stretch') || 'asinh',
  };
}

function isFirstVisit() {
  try {
    const visited = localStorage.getItem('spherex-visited');
    if (!visited) {
      localStorage.setItem('spherex-visited', 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export default function App() {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const initParams = useRef(parseUrlParams());

  const [selectedTarget, setSelectedTarget] = useState(
    NASA_TARGETS.find(t => t.name.toLowerCase().includes('wise 0855')) || NASA_TARGETS[0]
  );
  const [ra, setRa] = useState(initParams.current.ra);
  const [dec, setDec] = useState(initParams.current.dec);
  const [fov, setFov] = useState(initParams.current.fov);
  const [mode, setMode] = useState(initParams.current.mode);
  const [band, setBand] = useState(initParams.current.band);
  const [stretch, setStretch] = useState(initParams.current.stretch);
  const [blinkSpeed, setBlinkSpeed] = useState(2);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showGuide, setShowGuide] = useState(isFirstVisit());
  const [spectralData, setSpectralData] = useState(null);
  const [cutoutData, setCutoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health] = useState({ status: 'ok', engine: 'client-side-astro-v2', irsa_available: true });
  const [exportSuccess, setExportSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // URL ↔ State sync
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams();
    if (ra != null) params.set('ra', ra.toFixed(6));
    if (dec != null) params.set('dec', dec.toFixed(6));
    params.set('fov', String(fov));
    if (selectedTarget?.name) params.set('target', selectedTarget.name);
    params.set('mode', mode);
    params.set('band', String(band));
    params.set('stretch', stretch);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [ra, dec, fov, selectedTarget, mode, band, stretch]);

  // ---------------------------------------------------------------------------
  // Target selection handler
  // ---------------------------------------------------------------------------
  const handleSelectTarget = useCallback((target) => {
    if (!target) return;
    setSelectedTarget(target);
    setRa(target.ra);
    setDec(target.dec);
  }, []);

  // ---------------------------------------------------------------------------
  // Client-Side Astronomical Calculation Pipeline (Instant 0 ms latency)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ra == null || dec == null) return;

    setLoading(true);
    setError(null);

    // Compute cutout and difference frame locally via astroEngine
    try {
      const cutout = getCutoutData(ra, dec, fov, mode, band, stretch, 256);
      setCutoutData(cutout);
    } catch (err) {
      console.error('Cutout processing error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ra, dec, fov, mode, band, stretch]);

  // ---------------------------------------------------------------------------
  // 102-Band Spectrum Extraction
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ra == null || dec == null) return;
    try {
      const spectrum = generateSpectrum(ra, dec, 'both', selectedTarget);
      setSpectralData(spectrum);
    } catch (err) {
      console.error('Spectrum extraction error:', err);
    }
  }, [ra, dec, selectedTarget]);

  // ---------------------------------------------------------------------------
  // Coordinate setter (e.g. from Aladin click or Manual Goto)
  // ---------------------------------------------------------------------------
  const handleCoordsChange = useCallback((newRa, newDec) => {
    setRa(newRa);
    setDec(newDec);
    const matched = findTarget(newRa, newDec);
    setSelectedTarget(matched);
  }, []);

  // ---------------------------------------------------------------------------
  // Citizen Science Discovery Dossier Export
  // ---------------------------------------------------------------------------
  const handleExportDossier = useCallback(() => {
    const report = {
      project: 'SPHEREx Time-Domain Sky Explorer & Planet X Hunter',
      timestamp: new Date().toISOString(),
      observation: {
        ra: Number(ra.toFixed(6)),
        dec: Number(dec.toFixed(6)),
        fov_arcmin: fov,
        active_band: band,
        mode,
        stretch,
      },
      target_context: selectedTarget ? {
        name: selectedTarget.name,
        type: selectedTarget.type,
        proper_motion: selectedTarget.properMotion,
        expected_signature: selectedTarget.expectedSignature,
      } : {
        classification: 'User Celestial Coordinate / Custom Candidate',
      },
      wcs_metadata: cutoutData?.wcs || null,
      detected_anomalies: cutoutData?.anomalies || [],
      spectrophotometry_102_band: spectralData ? {
        wavelengths: spectralData.wavelengths,
        flux_epoch1: spectralData.flux_epoch1,
        flux_epoch2: spectralData.flux_epoch2,
        flags: spectralData.flags,
      } : null,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const targetTag = selectedTarget?.shortName ? selectedTarget.shortName.replace(/[^a-zA-Z0-9]/g, '_') : `RA_${ra.toFixed(2)}`;
    a.download = `NASA_SPHEREx_Dossier_${targetTag}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  }, [ra, dec, fov, band, mode, stretch, selectedTarget, cutoutData, spectralData]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#0B0F19] text-gray-200 overflow-x-hidden">
      {/* ===== Header ===== */}
      <header className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-gray-900/90 border-b border-gray-800 shrink-0 gap-2">
        <div className="flex items-center gap-3">
          {/* NASA logo badge */}
          <div className="w-9 h-9 rounded-full bg-blue-950 flex items-center justify-center text-xs font-black text-cyan-400 border border-cyan-700/60 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            NASA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold tracking-wide text-cyan-400">
                SPHEREx Time-Domain Sky Explorer
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                <Sparkles className="w-2.5 h-2.5" /> Planet X Hunter
              </span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-0.5">
              Near-Infrared All-Sky Survey · 102 Spectral Bands (0.75–5.0 µm) · 6-Month Cadence
            </p>
          </div>
        </div>

        {/* Target quick-select and header action buttons */}
        <div className="flex items-center gap-2">
          <TargetBar
            selectedTarget={selectedTarget}
            onSelect={handleSelectTarget}
          />
          
          {/* Export Discovery Dossier Button */}
          <button
            onClick={handleExportDossier}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all ${
              exportSuccess
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-gray-800/90 hover:bg-gray-700 border-gray-700 text-gray-200 hover:text-white'
            }`}
            title="Export scientific discovery dossier for NASA submission"
          >
            {exportSuccess ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden md:inline">{exportSuccess ? 'Dossier Exported!' : 'Export Dossier'}</span>
          </button>

          {/* Citizen Guide Button */}
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 text-xs font-semibold shrink-0 transition-colors"
            title="How to Hunt for Planet X Guide"
          >
            <span>📖</span>
            <span className="hidden md:inline">Citizen Guide</span>
          </button>
        </div>
      </header>

      {/* ===== Main content layout (Responsive CSS Grid) ===== */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_340px] gap-2 p-2 min-h-0">
        {/* Left sidebar — Controls */}
        <aside className="bg-gray-900/60 rounded-lg border border-gray-800 overflow-y-auto p-3 max-h-[88vh]">
          <ControlPanel
            fov={fov}
            onFovChange={setFov}
            mode={mode}
            onModeChange={setMode}
            band={band}
            onBandChange={setBand}
            stretch={stretch}
            onStretchChange={setStretch}
            blinkSpeed={blinkSpeed}
            onBlinkSpeedChange={setBlinkSpeed}
            showAnomalies={showAnomalies}
            onShowAnomaliesChange={setShowAnomalies}
            ra={ra}
            dec={dec}
            onCoordsChange={handleCoordsChange}
          />
        </aside>

        {/* Center column: Cutout viewer + Spectrum chart */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Primary Viewport: Cutout & Blink Comparator */}
          <main className="bg-gray-900/40 rounded-lg border border-gray-800 p-2 flex items-center justify-center relative min-h-[380px]">
            {loading && (
              <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <EpochViewer
              cutoutData={cutoutData}
              mode={mode}
              blinkSpeed={blinkSpeed}
              showAnomalies={showAnomalies}
              band={band}
              loading={loading}
              error={error}
              onPixelClick={handleCoordsChange}
            />
          </main>

          {/* Secondary Viewport: 102-Band Spectrogram */}
          <div className="bg-gray-900/40 rounded-lg border border-gray-800 p-2 min-h-[300px]">
            <SpectrumChart
              spectralData={spectralData}
              band={band}
              onBandChange={setBand}
              mode={mode}
            />
          </div>
        </div>

        {/* Right sidebar: Aladin Sky Atlas contextual view */}
        <aside className="bg-gray-900/60 rounded-lg border border-gray-800 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
          <AladinViewer
            ra={ra}
            dec={dec}
            fov={fov}
            onCoordsChange={handleCoordsChange}
            selectedTarget={selectedTarget}
          />
        </aside>
      </div>

      {/* ===== Status bar ===== */}
      <StatusBar
        ra={ra}
        dec={dec}
        fov={fov}
        band={band}
        mode={mode}
        health={health}
        loading={loading}
        error={error}
      />

      {/* ===== How-To Guide modal ===== */}
      {showGuide && (
        <HowToGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
