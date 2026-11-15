import React, { useState, useEffect, useCallback, useRef } from 'react';
import TargetBar from './components/TargetBar';
import ControlPanel from './components/ControlPanel';
import EpochViewer from './components/EpochViewer';
import SpectrumChart from './components/SpectrumChart';
import AladinViewer from './components/AladinViewer';
import HowToGuide from './components/HowToGuide';
import StatusBar from './components/StatusBar';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch cutout when view parameters change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (ra == null || dec == null) return;

    // Cancel in-flight request
    if (cutoutAbort.current) cutoutAbort.current.abort();
    const controller = new AbortController();
    cutoutAbort.current = controller;

    const epochParam = mode === 'blink' ? 'epoch1' : mode; // blink handled client-side
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
  // Coordinate setter (e.g. from Aladin click)
  // ---------------------------------------------------------------------------
  const handleCoordsChange = useCallback((newRa, newDec) => {
    setRa(newRa);
    setDec(newDec);
    setSelectedTarget(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0B0F19]">
      {/* ===== Header ===== */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          {/* NASA logo placeholder */}
          <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold text-cyan-400 border border-cyan-800">
            NASA
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-cyan-400">
              SPHEREx Time-Domain Sky Explorer
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">
              Near-Infrared All-Sky Survey · 102 Spectral Bands · 0.75–5.0 µm
            </p>
          </div>
        </div>

        {/* Target quick-select and guide button */}
        <div className="flex items-center gap-2">
          <TargetBar
            apiBase={API_BASE}
            selectedTarget={selectedTarget}
            onSelect={handleSelectTarget}
          />
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

      {/* ===== Main content grid ===== */}
      <div className="flex-1 grid grid-cols-[280px_1fr_340px] grid-rows-[1fr_1fr] gap-1 p-1 min-h-0">
        {/* Left sidebar — spans both rows */}
        <aside className="row-span-2 bg-gray-900/60 rounded-lg border border-gray-800 overflow-y-auto p-3">
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

        {/* Center-top: Cutout viewer */}
        <main className="bg-gray-900/40 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center relative">
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

        {/* Right panel: Aladin sky map — spans both rows */}
        <aside className="row-span-2 bg-gray-900/60 rounded-lg border border-gray-800 overflow-hidden">
          <AladinViewer
            ra={ra}
            dec={dec}
            fov={fov}
            onCoordsChange={handleCoordsChange}
            selectedTarget={selectedTarget}
          />
        </aside>

        {/* Center-bottom: Spectrum chart */}
        <div className="bg-gray-900/40 rounded-lg border border-gray-800 overflow-hidden">
          <SpectrumChart
            spectralData={spectralData}
            band={band}
            onBandChange={setBand}
            mode={mode}
          />
        </div>
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

      {/* ===== How-To Guide overlay ===== */}
      {showGuide && (
        <HowToGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
