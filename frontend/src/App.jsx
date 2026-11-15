import React, { useState, useEffect, useCallback, useRef } from 'react';
import TargetBar from './components/TargetBar';
import FloatingToolbar from './components/FloatingToolbar';
import SettingsDrawer from './components/SettingsDrawer';
import EpochViewer from './components/EpochViewer';
import SpectrumChart from './components/SpectrumChart';
import AladinViewer from './components/AladinViewer';
import HowToGuide from './components/HowToGuide';
import StatusBar from './components/StatusBar';
import { bandToWavelength } from './data/targets';
import { SlidersHorizontal, BookOpen, Layers, Sparkles } from 'lucide-react';

const API_BASE = '';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    ra: params.has('ra') ? parseFloat(params.get('ra')) : 133.79513,
    dec: params.has('dec') ? parseFloat(params.get('dec')) : -7.24515,
    fov: params.has('fov') ? Math.min(15, Math.max(1, parseFloat(params.get('fov')))) : 5,
    target: params.get('target') || 'WISE 0855-0714',
    mode: params.get('mode') || 'diff',
    band: params.has('band') ? Math.min(102, Math.max(1, parseInt(params.get('band'), 10))) : 50,
    stretch: params.get('stretch') || 'linear',
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

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [ra, setRa] = useState(initParams.current.ra);
  const [dec, setDec] = useState(initParams.current.dec);
  const [fov, setFov] = useState(initParams.current.fov);
  const [mode, setMode] = useState(initParams.current.mode);
  const [band, setBand] = useState(initParams.current.band);
  const [stretch, setStretch] = useState(initParams.current.stretch);
  const [blinkSpeed, setBlinkSpeed] = useState(2);
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showGuide, setShowGuide] = useState(isFirstVisit());
  const [showSettings, setShowSettings] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(false);

  const [spectralData, setSpectralData] = useState(null);
  const [cutoutData, setCutoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);

  // Abort controllers stored as refs so they persist across renders
  const cutoutAbort = useRef(null);
  const spectrumAbort = useRef(null);

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
  // Health check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable', irsa_available: false }));
  }, []);

  // ---------------------------------------------------------------------------
  // Target selection handler
  // ---------------------------------------------------------------------------
  const handleSelectTarget = useCallback((target) => {
    if (!target) return;
    setSelectedTarget(target);
    setRa(target.ra);
    setDec(target.dec);
  }, []);

  // Resolve target name from URL on first mount
  useEffect(() => {
    if (initParams.current.target && !selectedTarget) {
      fetch(`${API_BASE}/api/targets`)
        .then((r) => r.json())
        .then((targets) => {
          const match = targets.find(
            (t) => t.name.toLowerCase() === initParams.current.target.toLowerCase()
          );
          if (match) handleSelectTarget(match);
        })
        .catch(() => {});
    }
  }, [handleSelectTarget, selectedTarget]);

  // ---------------------------------------------------------------------------
  // Fetch cutout when view parameters change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ra == null || dec == null) return;

    if (cutoutAbort.current) cutoutAbort.current.abort();
    const controller = new AbortController();
    cutoutAbort.current = controller;

    const epochParam = mode === 'blink' ? 'epoch1' : mode;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      fov: String(fov),
      epoch: epochParam,
      band: String(band),
      stretch,
    });

    setLoading(true);
    setError(null);

    const fetchCutout = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cutout?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Cutout API ${res.status}`);
        const data = await res.json();
        setCutoutData(data);

        // For blink mode also fetch epoch2
        if (mode === 'blink') {
          const params2 = new URLSearchParams({
            ra: ra.toFixed(6),
            dec: dec.toFixed(6),
            fov: String(fov),
            epoch: 'epoch2',
            band: String(band),
            stretch,
          });
          const res2 = await fetch(`${API_BASE}/api/cutout?${params2}`, {
            signal: controller.signal,
          });
          if (!res2.ok) throw new Error(`Cutout API epoch2 ${res2.status}`);
          const data2 = await res2.json();
          setCutoutData((prev) => ({ ...prev, epoch2: data2 }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Cutout fetch error:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCutout();

    return () => controller.abort();
  }, [ra, dec, fov, mode, band, stretch]);

  // ---------------------------------------------------------------------------
  // Fetch spectrum when coordinates change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ra == null || dec == null) return;

    if (spectrumAbort.current) spectrumAbort.current.abort();
    const controller = new AbortController();
    spectrumAbort.current = controller;

    const epochParam = mode === 'blink' || mode === 'diff' ? 'both' : mode === 'coadd' ? 'both' : mode;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      epoch: epochParam,
    });

    const fetchSpectrum = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/spectrum?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Spectrum API ${res.status}`);
        const data = await res.json();
        setSpectralData(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Spectrum fetch error:', err);
        }
      }
    };

    fetchSpectrum();

    return () => controller.abort();
  }, [ra, dec, mode]);

  // ---------------------------------------------------------------------------
  // Coordinate setter (e.g. from Aladin click or manual goto)
  // ---------------------------------------------------------------------------
  const handleCoordsChange = useCallback((newRa, newDec) => {
    setRa(newRa);
    setDec(newDec);
    setSelectedTarget(null);
  }, []);

  const wavelength = bandToWavelength(band);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#070A12] text-gray-100">
      {/* ===== 1. Clean Top Header ===== */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/80 shrink-0 z-30">
        <div className="flex items-center gap-3">
          {/* NASA Badge */}
          <div className="w-8 h-8 rounded-full bg-blue-900/90 flex items-center justify-center text-[10px] font-black tracking-widest text-cyan-400 border border-cyan-800 shadow-[0_0_10px_rgba(56,189,248,0.3)]">
            NASA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-cyan-400 uppercase">
                SPHEREx Time-Domain Sky Explorer
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-800/70 text-cyan-300">
                102 Bands · 0.75–5.0 µm
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              NASA Space Apps Challenge 2026: Planet X & SPHEREx
            </p>
          </div>
        </div>

        {/* ── Center Quick-Select Bar (Sleek Pills) ── */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <TargetBar
            apiBase={API_BASE}
            selectedTarget={selectedTarget}
            onSelect={handleSelectTarget}
          />
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* Citizen Guide Button */}
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-all"
            title="How to Hunt for Planet X Citizen Science Tutorial"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Citizen Guide</span>
          </button>

          {/* Settings & Filters Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/80 text-cyan-300 text-xs font-semibold shadow-sm transition-all"
            title="Open Advanced Filters & Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Settings & Filters</span>
          </button>
        </div>
      </header>

      {/* TargetBar on mobile/tablet if screen is small */}
      <div className="block md:hidden bg-gray-950 px-2 py-1 border-b border-gray-800 overflow-x-auto">
        <TargetBar
          apiBase={API_BASE}
          selectedTarget={selectedTarget}
          onSelect={handleSelectTarget}
        />
      </div>

      {/* ===== 2. Immersive Dual-Pane Sky Canvas ===== */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 p-2 gap-2 overflow-hidden">
        {/* Left Viewport: SPHEREx Multi-Epoch Cutout Canvas */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-800/80 bg-gray-950/60 flex items-center justify-center min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-cyan-300">Extracting SPHEREx Cutout...</span>
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
        </div>

        {/* Right Viewport: Aladin Lite Interactive Sky Map */}
        <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-800/80 bg-gray-950/60 min-h-[300px]">
          <AladinViewer
            ra={ra}
            dec={dec}
            fov={fov}
            onCoordsChange={handleCoordsChange}
            selectedTarget={selectedTarget}
          />
        </div>

        {/* ── 3. Centered Sleek Floating Action Toolbar ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <FloatingToolbar
            mode={mode}
            setMode={setMode}
            showAnomalies={showAnomalies}
            setShowAnomalies={setShowAnomalies}
            showSpectrum={showSpectrum}
            setShowSpectrum={setShowSpectrum}
            onOpenSettings={() => setShowSettings(true)}
            band={band}
            wavelength={wavelength}
          />
        </div>
      </div>

      {/* ===== 4. Collapsible 102-Band Spectrogram Drawer ===== */}
      {showSpectrum && (
        <div className="h-64 border-t border-gray-800/80 bg-gray-950/95 backdrop-blur-xl shrink-0 z-20 transition-all duration-300">
          <SpectrumChart
            spectralData={spectralData}
            band={band}
            onBandChange={setBand}
            mode={mode}
            loading={loading}
            onClose={() => setShowSpectrum(false)}
          />
        </div>
      )}

      {/* ===== 5. Bottom Status Bar ===== */}
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

      {/* ===== 6. Advanced Settings & Filters Slide-Over Drawer ===== */}
      <SettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fov={fov}
        onFovChange={setFov}
        band={band}
        onBandChange={setBand}
        stretch={stretch}
        onStretchChange={setStretch}
        blinkSpeed={blinkSpeed}
        onBlinkSpeedChange={setBlinkSpeed}
        mode={mode}
        ra={ra}
        dec={dec}
        onCoordsChange={handleCoordsChange}
      />

      {/* ===== 7. Citizen Science How-To Guide ===== */}
      {showGuide && (
        <HowToGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
