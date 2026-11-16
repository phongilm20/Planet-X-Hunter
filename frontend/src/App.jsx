import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import TargetList from './components/TargetList';
import SkyImageViewer from './components/SkyImageViewer';
import Timeline from './components/Timeline';
import InfoPanel from './components/InfoPanel';
import HelpModal from './components/HelpModal';
import TARGETS_CATALOG from './data/targets.json';
import { 
  OBSERVATIONAL_EPOCHS, 
  getCutout, 
  getDifferenceCutout, 
  getCatalogSources,
  getSpectrum
} from './data/adapter';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('target');
  const matchedTarget = TARGETS_CATALOG.find((t) => t.id === targetId || t.commonName === targetId) || TARGETS_CATALOG[0];

  return {
    target: matchedTarget,
    targetId: matchedTarget.id,
    ra: params.has('ra') ? parseFloat(params.get('ra')) : matchedTarget.ra.value,
    dec: params.has('dec') ? parseFloat(params.get('dec')) : matchedTarget.dec.value,
    epochAId: params.get('epochA') || 'epoch-2014',
    epochBId: params.get('epochB') || 'epoch-2025-m6',
    mode: params.get('mode') || 'blink', // 'blink' | 'side-by-side' | 'difference'
    stretch: params.get('stretch') || 'asinh', // 'linear' | 'asinh' | 'sqrt' | 'log'
    colormap: params.get('colormap') || 'grayscale', // 'grayscale' | 'inferno' | 'viridis'
    blinkSpeed: params.has('speed') ? parseFloat(params.get('speed')) : 1.5,
  };
}

export default function App() {
  const initialParams = useRef(parseUrlParams());

  // ── Target & Coordinate State ──
  const [selectedTargetId, setSelectedTargetId] = useState(initialParams.current.targetId);
  const [currentTarget, setCurrentTarget] = useState(initialParams.current.target);
  const [targetCoords, setTargetCoords] = useState({
    ra: initialParams.current.ra,
    dec: initialParams.current.dec,
  });

  // ── Epoch & Timeline State ──
  const [selectedEpochAId, setSelectedEpochAId] = useState(initialParams.current.epochAId);
  const [selectedEpochBId, setSelectedEpochBId] = useState(initialParams.current.epochBId);
  const [activeBlinkEpoch, setActiveBlinkEpoch] = useState('A'); // 'A' | 'B'
  const [isPlayingBlink, setIsPlayingBlink] = useState(true);
  const [blinkSpeedHz, setBlinkSpeedHz] = useState(initialParams.current.blinkSpeed);

  // ── Viewer Display Modes ──
  const [activeMode, setActiveMode] = useState(initialParams.current.mode);
  const [stretch, setStretch] = useState(initialParams.current.stretch);
  const [colormap, setColormap] = useState(initialParams.current.colormap);

  // ── Cutouts & Scientific Data ──
  const [cutoutA, setCutoutA] = useState(null);
  const [cutoutB, setCutoutB] = useState(null);
  const [cutoutDiff, setCutoutDiff] = useState(null);
  const [spectralData, setSpectralData] = useState(null);
  const [gaiaSources, setGaiaSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── UI Modals ──
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // ── Sync URL parameters ──
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTargetId) params.set('target', selectedTargetId);
    params.set('ra', targetCoords.ra.toFixed(6));
    params.set('dec', targetCoords.dec.toFixed(6));
    params.set('epochA', selectedEpochAId);
    params.set('epochB', selectedEpochBId);
    params.set('mode', activeMode);
    params.set('stretch', stretch);
    params.set('colormap', colormap);
    params.set('speed', blinkSpeedHz.toFixed(1));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [
    selectedTargetId,
    targetCoords,
    selectedEpochAId,
    selectedEpochBId,
    activeMode,
    stretch,
    colormap,
    blinkSpeedHz,
  ]);

  // ── Fetch Cutouts & Data ──
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [cutA, cutB, cutDiff, spec, sources] = await Promise.all([
          getCutout(selectedEpochAId, targetCoords.ra, targetCoords.dec, 300, 50),
          getCutout(selectedEpochBId, targetCoords.ra, targetCoords.dec, 300, 50),
          getDifferenceCutout(selectedEpochAId, selectedEpochBId, targetCoords.ra, targetCoords.dec, 300, 50),
          getSpectrum(currentTarget?.commonName || currentTarget?.name || 'Target', targetCoords.ra, targetCoords.dec),
          getCatalogSources(targetCoords.ra, targetCoords.dec, 0.08),
        ]);

        if (!isCancelled) {
          setCutoutA(cutA);
          setCutoutB(cutB);
          setCutoutDiff(cutDiff);
          setSpectralData(spec);
          setGaiaSources(sources || []);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to load astronomical data:', err);
          setError('Failed to fetch sky cutouts. Rendering simulated fallback.');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedEpochAId, selectedEpochBId, targetCoords, currentTarget]);

  // ── Blink Interval Engine ──
  useEffect(() => {
    if (activeMode !== 'blink' || !isPlayingBlink) return;

    const intervalMs = Math.max(250, Math.floor(1000 / blinkSpeedHz));
    const timer = setInterval(() => {
      setActiveBlinkEpoch((prev) => (prev === 'A' ? 'B' : 'A'));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeMode, isPlayingBlink, blinkSpeedHz]);

  // ── Keyboard Shortcuts (Space, B, S, D, ArrowLeft, ArrowRight) ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlayingBlink((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveMode('blink');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveMode('side-by-side');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveMode('difference');
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlayingBlink(false);
        setActiveBlinkEpoch('A');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlayingBlink(false);
        setActiveBlinkEpoch('B');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Target Switch Handlers ──
  const handleSelectTarget = useCallback((targetId) => {
    const found = TARGETS_CATALOG.find((t) => t.id === targetId);
    if (found) {
      setSelectedTargetId(found.id);
      setCurrentTarget(found);
      setTargetCoords({ ra: found.ra.value, dec: found.dec.value });
    }
  }, []);

  const handleCustomCoords = useCallback((ra, dec, name) => {
    setSelectedTargetId(null);
    setCurrentTarget({
      id: 'custom',
      commonName: name || `Custom (${ra.toFixed(3)}°, ${dec.toFixed(3)}°)`,
      name: name || 'User Specified Coordinates',
      category: 'User Custom Field',
      ra: { value: ra, unit: 'deg', source: 'User Input' },
      dec: { value: dec, unit: 'deg', source: 'User Input' },
      pmRa: { value: 0, unit: 'mas/yr', source: 'N/A' },
      pmDec: { value: 0, unit: 'mas/yr', source: 'N/A' },
      parallax: { value: 0, unit: 'mas', source: 'N/A' },
      spectralType: { value: 'Unknown', source: 'N/A' },
      distanceLightYears: { value: 0, source: 'N/A' },
      description: 'User specified sky coordinates.',
    });
    setTargetCoords({ ra, dec });
  }, []);

  // ── Export High-Resolution Annotated PNG ──
  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Create an export canvas with metadata banner
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    const bannerHeight = 80;
    
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height + bannerHeight;

    // Draw main sky frame
    exportCtx.drawImage(canvas, 0, 0);

    // Draw metadata banner footer
    exportCtx.fillStyle = '#0B0E14';
    exportCtx.fillRect(0, canvas.height, canvas.width, bannerHeight);
    exportCtx.strokeStyle = '#262E40';
    exportCtx.lineWidth = 1;
    exportCtx.beginPath();
    exportCtx.moveTo(0, canvas.height);
    exportCtx.lineTo(canvas.width, canvas.height);
    exportCtx.stroke();

    // Text labels
    exportCtx.fillStyle = '#E6EAF2';
    exportCtx.font = 'bold 14px "Space Grotesk", sans-serif';
    const targetTitle = currentTarget?.commonName || 'SPHEREx Observation';
    exportCtx.fillText(targetTitle, 16, canvas.height + 26);

    exportCtx.fillStyle = '#98A2B8';
    exportCtx.font = '11px "JetBrains Mono", monospace';
    const coordsStr = `RA: ${targetCoords.ra.toFixed(5)}° · Dec: ${targetCoords.dec.toFixed(5)}° · Scale: 6.15″/px`;
    exportCtx.fillText(coordsStr, 16, canvas.height + 46);

    const epA = OBSERVATIONAL_EPOCHS.find((e) => e.id === selectedEpochAId);
    const epB = OBSERVATIONAL_EPOCHS.find((e) => e.id === selectedEpochBId);
    const epochStr = `Epoch A: ${epA?.shortLabel || 'A'} | Epoch B: ${epB?.shortLabel || 'B'} · Mode: ${activeMode.toUpperCase()}`;
    exportCtx.fillText(epochStr, 16, canvas.height + 66);

    // Provenance stamp
    const prov = (cutoutA?.provenance || 'CACHED').toUpperCase();
    exportCtx.fillStyle = '#4DA3FF';
    exportCtx.font = 'bold 11px "JetBrains Mono", monospace';
    const provStr = `[${prov}] SPHEREx Time-Domain Sky Explorer · NASA Space Apps 2026`;
    const provWidth = exportCtx.measureText(provStr).width;
    exportCtx.fillText(provStr, exportCanvas.width - provWidth - 16, canvas.height + 46);

    // Trigger download
    const link = document.createElement('a');
    link.download = `${(currentTarget?.commonName || 'sky-cutout').replace(/\s+/g, '_')}_SPHEREx_${activeMode}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [currentTarget, targetCoords, selectedEpochAId, selectedEpochBId, activeMode, cutoutA]);

  const activeProvenance = (cutoutA?.provenance || 'cached').toUpperCase();
  const currentEpochA = OBSERVATIONAL_EPOCHS.find((e) => e.id === selectedEpochAId) || OBSERVATIONAL_EPOCHS[0];
  const currentEpochB = OBSERVATIONAL_EPOCHS.find((e) => e.id === selectedEpochBId) || OBSERVATIONAL_EPOCHS[1];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-obs-bg text-obs-text font-sans antialiased">
      {/* ── Top Header Bar ── */}
      <Header
        onCustomCoords={handleCustomCoords}
        onExportPNG={handleExportPNG}
        onOpenHelp={() => setIsHelpOpen(true)}
        activeMode={activeMode}
        provenance={activeProvenance}
      />

      {/* ── Desktop 3-Column Observatory Main View ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        
        {/* Left Column: Target Catalog Rail */}
        <TargetList
          selectedTargetId={selectedTargetId}
          onSelectTarget={handleSelectTarget}
          onCustomCoords={handleCustomCoords}
        />

        {/* Center Column: Sky Image Viewer (Blink / Side-by-Side / Diff) */}
        <main className="flex-1 flex flex-col min-w-0 bg-obs-bg relative">
          <SkyImageViewer
            mode={activeMode}
            onModeChange={setActiveMode}
            cutoutA={cutoutA}
            cutoutB={cutoutB}
            cutoutDiff={cutoutDiff}
            loading={loading}
            error={error}
            target={currentTarget}
            targetCoords={targetCoords}
            gaiaSources={gaiaSources}
            stretch={stretch}
            onStretchChange={setStretch}
            colormap={colormap}
            onColormapChange={setColormap}
            blinkSpeedHz={blinkSpeedHz}
            onBlinkSpeedChange={setBlinkSpeedHz}
            activeBlinkEpoch={activeBlinkEpoch}
            onToggleBlinkEpoch={() => {
              setIsPlayingBlink(false);
              setActiveBlinkEpoch((prev) => (prev === 'A' ? 'B' : 'A'));
            }}
          />

          {/* Bottom Rail: Discrete Epoch Timeline & Blink Scrubber */}
          <Timeline
            epochs={OBSERVATIONAL_EPOCHS}
            selectedEpochAId={selectedEpochAId}
            onSelectEpochA={setSelectedEpochAId}
            selectedEpochBId={selectedEpochBId}
            onSelectEpochB={setSelectedEpochBId}
            activeBlinkEpoch={activeBlinkEpoch}
            isPlayingBlink={isPlayingBlink}
            onTogglePlayBlink={() => setIsPlayingBlink((prev) => !prev)}
            blinkSpeedHz={blinkSpeedHz}
            onBlinkSpeedChange={setBlinkSpeedHz}
            onStepBlink={(direction) => {
              setIsPlayingBlink(false);
              setActiveBlinkEpoch(direction === 'left' ? 'A' : 'B');
            }}
            target={currentTarget}
          />
        </main>

        {/* Right Column: Astrophysical Context & 102-Band NIR Spectrum */}
        <InfoPanel
          target={currentTarget}
          targetCoords={targetCoords}
          epochA={currentEpochA}
          epochB={currentEpochB}
          spectralData={spectralData}
        />
      </div>

      {/* ── Help & Methodology Modal ── */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
