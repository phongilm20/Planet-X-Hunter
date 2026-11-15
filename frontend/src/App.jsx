import React, { useState, useEffect, useCallback, useRef } from 'react';
import HeaderAero from './components/HeaderAero';
import OrbitalView3D from './components/OrbitalView3D';
import SkyCanvasViewer from './components/SkyCanvasViewer';
import ScientistDrawer from './components/ScientistDrawer';
import SettingsDrawer from './components/SettingsDrawer';
import HowToGuide from './components/HowToGuide';
import { NASA_TARGETS, OBSERVATIONAL_EPOCHS } from './data/targets';

const API_BASE = '';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const mode = modeParam || 'epoch';
  // If user opens with mode=diff, blink, coadd or view=telescope, open telescope directly
  const viewParam = params.get('view');
  const defaultView = viewParam ? viewParam : (modeParam && ['diff', 'blink', 'coadd'].includes(modeParam) ? 'telescope' : 'orbit');

  return {
    ra: params.has('ra') ? parseFloat(params.get('ra')) : 133.79513,
    dec: params.has('dec') ? parseFloat(params.get('dec')) : -7.24515,
    fov: params.has('fov') ? Math.min(15, Math.max(1, parseFloat(params.get('fov')))) : 5,
    target: params.get('target') || 'WISE 0855-0714',
    mode,
    band: params.has('band') ? Math.min(102, Math.max(1, parseInt(params.get('band'), 10))) : 50,
    stretch: params.get('stretch') || 'linear',
    palette: params.get('palette') || 'daylight',
    epoch: params.has('epoch') ? parseInt(params.get('epoch'), 10) : 4,
    view: defaultView,
    persona: params.get('persona') || 'explorer',
  };
}

export default function App() {
  const initParams = useRef(parseUrlParams());

  // Navigation & Persona Modes
  const [viewMode, setViewMode] = useState(initParams.current.view); // 'orbit' | 'telescope'
  const [personaMode, setPersonaMode] = useState(initParams.current.persona); // 'explorer' | 'scientist'
  const [palette, setPalette] = useState(initParams.current.palette); // 'daylight' | 'infrared' | 'deepspace'

  // Celestial Pointing & View State
  const [selectedTarget, setSelectedTarget] = useState(
    NASA_TARGETS.find((t) => t.name === initParams.current.target) || NASA_TARGETS[0]
  );
  const [ra, setRa] = useState(initParams.current.ra);
  const [dec, setDec] = useState(initParams.current.dec);
  const [fov, setFov] = useState(initParams.current.fov);
  const [currentEpoch, setCurrentEpoch] = useState(initParams.current.epoch); // 1 to 8
  const [mode, setMode] = useState(initParams.current.mode); // 'epoch' | 'diff' | 'coadd'
  const [band, setBand] = useState(initParams.current.band);
  const [stretch, setStretch] = useState(initParams.current.stretch);
  const [blinkSpeed, setBlinkSpeed] = useState(2.0);

  // Overlays & Drawers
  const [showAnomalies, setShowAnomalies] = useState(false);
  const [showGaiaOverlay, setShowGaiaOverlay] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showScientistDrawer, setShowScientistDrawer] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Data
  const [cutoutData, setCutoutData] = useState(null);
  const [spectralData, setSpectralData] = useState(null);
  const [gaiaStars, setGaiaStars] = useState([]);
  const [irsaSources, setIrsaSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (ra != null) params.set('ra', ra.toFixed(5));
    if (dec != null) params.set('dec', dec.toFixed(5));
    params.set('fov', String(fov));
    if (selectedTarget?.name) params.set('target', selectedTarget.name);
    params.set('mode', mode);
    params.set('band', String(band));
    params.set('palette', palette);
    params.set('epoch', String(currentEpoch));
    params.set('view', viewMode);
    params.set('persona', personaMode);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [ra, dec, fov, selectedTarget, mode, band, palette, currentEpoch, viewMode, personaMode]);

  // Handle Target Selection
  const handleSelectTarget = useCallback((target) => {
    if (!target) return;
    setSelectedTarget(target);
    setRa(target.ra);
    setDec(target.dec);
    // Smoothly transition into Telescope View on target selection
    setViewMode('telescope');
  }, []);

  // Fetch Cutout Image
  useEffect(() => {
    if (ra == null || dec == null) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const epochParam = mode === 'diff' ? 'diff' : mode === 'coadd' ? 'coadd' : String(currentEpoch);
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      fov: String(fov),
      epoch: epochParam,
      band: String(band),
      stretch,
      palette,
      diff_a: '1',
      diff_b: String(currentEpoch || 5),
    });

    fetch(`${API_BASE}/api/cutout?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Cutout API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCutoutData(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [ra, dec, fov, mode, band, stretch, palette, currentEpoch]);

  // Fetch Gaia DR3 Astrometry Catalog
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      radius: String(fov),
    });

    fetch(`${API_BASE}/api/gaia?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) setGaiaStars(data.sources);
      })
      .catch(() => {});
  }, [ra, dec, fov]);

  // Fetch NASA IRSA / AllWISE Photometry Catalog
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      radius: String(fov),
    });

    fetch(`${API_BASE}/api/irsa_query?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) setIrsaSources(data.sources);
      })
      .catch(() => {});
  }, [ra, dec, fov]);

  // Fetch 102-Band Spectrogram
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      epoch: String(currentEpoch),
    });

    fetch(`${API_BASE}/api/spectrum?${params}`)
      .then((r) => r.json())
      .then(setSpectralData)
      .catch(() => {});
  }, [ra, dec, currentEpoch]);

  // Handle Pixel Click to Slew
  const handlePixelClick = useCallback((newRa, newDec) => {
    setRa(newRa);
    setDec(newDec);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {/* ── 1. Floating Top Glassmorphism Header Bar ── */}
      <HeaderAero
        viewMode={viewMode}
        setViewMode={setViewMode}
        personaMode={personaMode}
        setPersonaMode={setPersonaMode}
        palette={palette}
        setPalette={setPalette}
        selectedTarget={selectedTarget}
        onSelectTarget={handleSelectTarget}
        onOpenSettings={() => setShowSettings(true)}
        onOpenGuide={() => setShowGuide(true)}
        onOpenScientistDrawer={() => setShowScientistDrawer(true)}
        band={band}
      />

      {/* ── 2. Full-Screen Interactive Viewport ── */}
      <main className="w-full h-full">
        {viewMode === 'orbit' ? (
          <OrbitalView3D
            onSelectTarget={handleSelectTarget}
            onEnterTelescope={() => setViewMode('telescope')}
            selectedTarget={selectedTarget}
          />
        ) : (
          <SkyCanvasViewer
            cutoutData={cutoutData}
            loading={loading}
            error={error}
            ra={ra}
            dec={dec}
            fov={fov}
            target={selectedTarget}
            currentEpoch={currentEpoch}
            onEpochChange={setCurrentEpoch}
            palette={palette}
            onPaletteChange={setPalette}
            mode={mode}
            onModeChange={setMode}
            showAnomalies={showAnomalies}
            onToggleAnomalies={setShowAnomalies}
            onPixelClick={handlePixelClick}
            gaiaStars={gaiaStars}
            showGaiaOverlay={showGaiaOverlay}
            onToggleGaia={() => setShowGaiaOverlay(!showGaiaOverlay)}
            personaMode={personaMode}
          />
        )}
      </main>

      {/* ── 3. Scientist Mode Telemetry & Spectrogram Drawer ── */}
      <ScientistDrawer
        isOpen={showScientistDrawer}
        onClose={() => setShowScientistDrawer(false)}
        spectralData={spectralData}
        band={band}
        onBandChange={setBand}
        gaiaStars={gaiaStars}
        irsaSources={irsaSources}
        mode={mode}
        onModeChange={setMode}
        target={selectedTarget}
        ra={ra}
        dec={dec}
      />

      {/* ── 4. Advanced Settings & Filters Drawer ── */}
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
        onCoordsChange={(newRa, newDec) => {
          setRa(newRa);
          setDec(newDec);
          setSelectedTarget(null);
        }}
      />

      {/* ── 5. Citizen Science Interactive How-To Guide Modal ── */}
      {showGuide && (
        <HowToGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
}
