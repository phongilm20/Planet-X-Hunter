import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopBarAero from './components/TopBarAero';
import DeepSpaceUniverse3D from './components/DeepSpaceUniverse3D';
import TimelineScrubber from './components/TimelineScrubber';
import RightPanelAI from './components/RightPanelAI';
import HowToGuide from './components/HowToGuide';
import { NASA_TARGETS } from './data/targets';

const API_BASE = '';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const targetParam = params.get('target');
  const matchedTarget = NASA_TARGETS.find((t) => t.name === targetParam || t.shortName === targetParam);

  return {
    target: matchedTarget || NASA_TARGETS[0],
    ra: params.has('ra') ? parseFloat(params.get('ra')) : matchedTarget?.ra || NASA_TARGETS[0].ra,
    dec: params.has('dec') ? parseFloat(params.get('dec')) : matchedTarget?.dec || NASA_TARGETS[0].dec,
    year: params.has('year') ? parseFloat(params.get('year')) : 2026.5,
    palette: params.get('palette') || 'deepspace',
  };
}

export default function App() {
  const initParams = useRef(parseUrlParams());

  const [selectedTarget, setSelectedTarget] = useState(initParams.current.target);
  const [ra, setRa] = useState(initParams.current.ra);
  const [dec, setDec] = useState(initParams.current.dec);
  const [year, setYear] = useState(initParams.current.year);
  const [palette, setPalette] = useState(initParams.current.palette);

  // Warp-Speed Flight Trigger
  const [isWarping, setIsWarping] = useState(false);

  // Telemetry & Spectrometry Data
  const [spectralData, setSpectralData] = useState(null);
  const [gaiaStars, setGaiaStars] = useState([]);
  const [irsaSources, setIrsaSources] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  // Synchronize URL parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTarget?.name) params.set('target', selectedTarget.name);
    if (ra != null) params.set('ra', ra.toFixed(5));
    if (dec != null) params.set('dec', dec.toFixed(5));
    params.set('year', year.toFixed(1));
    params.set('palette', palette);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedTarget, ra, dec, year, palette]);

  // Handle Target Selection with Warp Flight
  const handleSelectTarget = useCallback((target) => {
    if (!target) return;
    setSelectedTarget(target);
    setRa(target.ra);
    setDec(target.dec);
    setIsWarping(true); // Trigger warp flight
  }, []);

  // Handle Custom RA/Dec Warp
  const handleCustomCoords = useCallback((newRa, newDec) => {
    const customTarget = {
      name: `J${newRa.toFixed(2)}${newDec >= 0 ? '+' : ''}${newDec.toFixed(2)}`,
      shortName: 'Custom Target',
      ra: newRa,
      dec: newDec,
      type: 'Custom Celestial Coordinates',
      spectralType: 'Unclassified',
      description: `User-specified celestial position (RA: ${newRa.toFixed(4)}°, Dec: ${newDec.toFixed(4)}°).`,
      properMotion: { ra: 0.0, dec: 0.0, total: 0.0 },
      distanceLy: null,
      color: '#38BDF8',
      haloColor: '#0EA5E9',
      starRadius: 1.5,
      icon: '✨',
      expectedSignature: 'monopole',
    };
    setSelectedTarget(customTarget);
    setRa(newRa);
    setDec(newDec);
    setIsWarping(true);
  }, []);

  // Fetch Gaia DR3 Astrometry Catalog around active target
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      radius: '0.6',
    });

    fetch(`${API_BASE}/api/gaia?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) setGaiaStars(data.sources);
      })
      .catch(() => {});
  }, [ra, dec]);

  // Fetch NASA IRSA Catalog
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      radius: '0.6',
    });

    fetch(`${API_BASE}/api/irsa_query?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sources) setIrsaSources(data.sources);
      })
      .catch(() => {});
  }, [ra, dec]);

  // Fetch 102-Band SPHEREx Spectrum
  useEffect(() => {
    if (ra == null || dec == null) return;
    const params = new URLSearchParams({
      ra: ra.toFixed(6),
      dec: dec.toFixed(6),
      epoch: '5',
    });

    fetch(`${API_BASE}/api/spectrum?${params}`)
      .then((r) => r.json())
      .then(setSpectralData)
      .catch(() => {});
  }, [ra, dec]);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none">
      
      {/* ── 1. Top Floating Glass Header Bar ── */}
      <TopBarAero
        selectedTarget={selectedTarget}
        onSelectTarget={handleSelectTarget}
        palette={palette}
        setPalette={setPalette}
        onOpenGuide={() => setShowGuide(true)}
        onCustomCoords={handleCustomCoords}
      />

      {/* ── 2. 100% Full-Screen 3D Universe Viewport ── */}
      <main className="w-full h-full">
        <DeepSpaceUniverse3D
          target={selectedTarget}
          year={year}
          onYearChange={setYear}
          gaiaStars={gaiaStars}
          palette={palette}
          isWarping={isWarping}
          onWarpComplete={() => setIsWarping(false)}
        />
      </main>

      {/* ── 3. Floating Astronomical Timeline Scrubber (Bottom Left/Center) ── */}
      <TimelineScrubber
        year={year}
        onYearChange={setYear}
        target={selectedTarget}
      />

      {/* ── 4. Sleek Right-Side Floating AI Assistant Panel (30% Width) ── */}
      <RightPanelAI
        target={selectedTarget}
        spectralData={spectralData}
        gaiaStars={gaiaStars}
        irsaSources={irsaSources}
        year={year}
      />

      {/* ── 5. Citizen Science Interactive How-To Guide Modal ── */}
      {showGuide && (
        <HowToGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      )}

    </div>
  );
}
