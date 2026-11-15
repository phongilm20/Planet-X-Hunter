import React, { useState, useEffect, useCallback, useRef } from 'react';
import TopBarAero from './components/TopBarAero';
import DeepSpaceUniverse3D from './components/DeepSpaceUniverse3D';
import SolarSystemView3D from './components/SolarSystemView3D';
import TimelineScrubber from './components/TimelineScrubber';
import RightPanelAI from './components/RightPanelAI';
import HowToGuide from './components/HowToGuide';
import InfraredScannerHUD from './components/InfraredScannerHUD';
import PlanetXChallengeModal from './components/PlanetXChallengeModal';
import GuidedMissionBanner from './components/GuidedMissionBanner';
import { NASA_TARGETS } from './data/targets';
import { narrator } from './utils/speechNarration';

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
    viewMode: params.get('view') === 'solarsystem' ? 'solarsystem' : 'deepspace',
  };
}

export default function App() {
  const initParams = useRef(parseUrlParams());

  const [viewMode, setViewMode] = useState(initParams.current.viewMode); // 'deepspace' | 'solarsystem'
  const [selectedTarget, setSelectedTarget] = useState(initParams.current.target);
  const [ra, setRa] = useState(initParams.current.ra);
  const [dec, setDec] = useState(initParams.current.dec);
  const [year, setYear] = useState(initParams.current.year);
  const [palette, setPalette] = useState(initParams.current.palette);

  // Warp-Speed Flight Trigger
  const [isWarping, setIsWarping] = useState(false);

  // Infrared X-Ray Scanner Lens
  const [isScannerActive, setIsScannerActive] = useState(false);

  // Gamified Planet X Challenge
  const [isHunting, setIsHunting] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  // Cinematic Guided Mission State
  const [guidedMission, setGuidedMission] = useState({
    active: false,
    stage: 1,
    title: '',
    subtitle: '',
    isMuted: false,
  });

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
    params.set('view', viewMode);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedTarget, ra, dec, year, palette, viewMode]);

  // Keyboard shortcut 'L' for Infrared Lens
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'l' || e.key === 'L') {
        setIsScannerActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Target Selection with Warp Flight
  const handleSelectTarget = useCallback((target) => {
    if (!target) return;
    setViewMode('deepspace');
    setSelectedTarget(target);
    setRa(target.ra);
    setDec(target.dec);
    setIsWarping(true);
  }, []);

  // Handle Custom RA/Dec Warp
  const handleCustomCoords = useCallback((newRa, newDec) => {
    setViewMode('deepspace');
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

  // Trigger Gamified Planet X Anomaly Challenge
  const handleStartHunt = useCallback(() => {
    const planetXTarget = NASA_TARGETS.find((t) => t.name.includes('Planet X')) || NASA_TARGETS[5];
    setViewMode('deepspace');
    setSelectedTarget(planetXTarget);
    setRa(planetXTarget.ra);
    setDec(planetXTarget.dec);
    setYear(2014.5);
    setIsWarping(true);
    setIsScannerActive(true);
    setIsHunting(true);
  }, []);

  // ── Cinematic Guided Mission Showcase (4 Stages) ──
  const guidedMissionTimerRef = useRef(null);

  const startGuidedMission = useCallback(() => {
    // Stage 1: Solar System Scale & SPHEREx Intro
    setViewMode('solarsystem');
    setIsScannerActive(false);
    setGuidedMission({
      active: true,
      stage: 1,
      title: "Stage 1: The Outer Solar System & SPHEREx Mission",
      subtitle: "NASA's SPHEREx space telescope surveys the entire sky in 102 near-infrared colors, searching beyond the Kuiper Belt for cold rogue worlds and Planet X.",
      isMuted: narrator.isMuted,
    });
    narrator.speak(
      "Welcome, Explorer. NASA's SPHEREx space telescope surveys the entire sky in 102 near-infrared colors, hunting for the coldest, most elusive objects in our universe."
    );

    // Stage 2: Warp to Barnard's Star (at 11s)
    guidedMissionTimerRef.current = setTimeout(() => {
      const barnard = NASA_TARGETS.find((t) => t.name.includes('Barnard')) || NASA_TARGETS[1];
      handleSelectTarget(barnard);
      setYear(2010.0);
      setGuidedMission((prev) => ({
        ...prev,
        stage: 2,
        title: "Stage 2: Barnard's Star — Fastest Proper Motion in the Sky",
        subtitle: "At over ten arcseconds per year, Barnard's Star leaps visibly across the static background starfield between SPHEREx epochs.",
      }));
      narrator.speak(
        "At nearly ten arcseconds per year, Barnard's Star has the fastest proper motion in the sky, visibly leaping past distant background stars."
      );
    }, 11000);

    // Stage 3: Warp to R Draconis (at 23s)
    setTimeout(() => {
      const rDra = NASA_TARGETS.find((t) => t.name.includes('R Draconis')) || NASA_TARGETS[4];
      handleSelectTarget(rDra);
      setYear(2026.0);
      setGuidedMission((prev) => ({
        ...prev,
        stage: 3,
        title: "Stage 3: R Draconis — Mira Variable Stellar Pulsations",
        subtitle: "A pulsating red giant star that expands, cools, and brightens every 245 days, producing massive infrared luminosity swings.",
      }));
      narrator.speak(
        "R Draconis, a Mira red giant, rhythmically expands and cools every two hundred and forty-five days, causing dramatic infrared luminosity swings across SPHEREx epochs."
      );
    }, 23000);

    // Stage 4: Warp to WISE 0855 with Infrared Lens (at 35s)
    setTimeout(() => {
      const wise = NASA_TARGETS.find((t) => t.name.includes('WISE 0855')) || NASA_TARGETS[0];
      handleSelectTarget(wise);
      setYear(2026.5);
      setIsScannerActive(true);
      setGuidedMission((prev) => ({
        ...prev,
        stage: 4,
        title: "Stage 4: WISE 0855 — Sub-Brown Dwarf & Planet X Analogue",
        subtitle: "Nearly invisible to optical telescopes, the SPHEREx Infrared Lens unmasks its thermal glow and water ice clouds just 7.3 light-years away.",
      }));
      narrator.speak(
        "And finally, WISE 0855—a planetary-mass sub-brown dwarf just seven light years away. Nearly invisible in optical light, SPHEREx unmasks its thermal glow and water ice clouds, showing us how we will find Planet X."
      );
    }, 35000);

    // Complete Mission (at 48s)
    setTimeout(() => {
      setGuidedMission((prev) => ({ ...prev, active: false }));
    }, 48000);
  }, [handleSelectTarget]);

  const stopGuidedMission = useCallback(() => {
    narrator.stop();
    if (guidedMissionTimerRef.current) clearTimeout(guidedMissionTimerRef.current);
    setGuidedMission((prev) => ({ ...prev, active: false }));
  }, []);

  const toggleMissionMute = useCallback(() => {
    const isMuted = narrator.toggleMute();
    setGuidedMission((prev) => ({ ...prev, isMuted }));
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenGuide={() => setShowGuide(true)}
        onCustomCoords={handleCustomCoords}
        onStartHunt={handleStartHunt}
        onStartGuidedMission={startGuidedMission}
      />

      {/* ── 2. Cinematic Guided Mission Subtitle Banner ── */}
      {guidedMission.active && (
        <GuidedMissionBanner
          stage={guidedMission.stage}
          title={guidedMission.title}
          subtitle={guidedMission.subtitle}
          isMuted={guidedMission.isMuted}
          onToggleMute={toggleMissionMute}
          onStop={stopGuidedMission}
        />
      )}

      {/* ── 3. Main 3D Viewport (Deep Space vs Solar System Scale) ── */}
      <main className="w-full h-full">
        {viewMode === 'solarsystem' ? (
          <SolarSystemView3D
            onSelectTarget={handleSelectTarget}
            onReturnToDeepSpace={() => setViewMode('deepspace')}
          />
        ) : (
          <DeepSpaceUniverse3D
            target={selectedTarget}
            year={year}
            onYearChange={setYear}
            gaiaStars={gaiaStars}
            palette={palette}
            isWarping={isWarping}
            onWarpComplete={() => setIsWarping(false)}
          />
        )}
      </main>

      {/* ── 4. Cursor Magic Lens: SPHEREx Infrared Scanner HUD ── */}
      <InfraredScannerHUD
        isActive={isScannerActive}
        onToggle={() => setIsScannerActive(!isScannerActive)}
        isHunting={isHunting}
        anomalyDistance={isHunting ? 0.05 : 0.6} // In hunt mode, anomaly is right in sight
        onLockAnomaly={() => setShowDiscoveryModal(true)}
      />

      {/* ── 5. Gamified Discovery Challenge HUD (When Hunting Planet X) ── */}
      {isHunting && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-slate-950/90 border border-cyan-400 text-cyan-200 shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-bounce">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black tracking-wider uppercase">
            Planet X Hunt: Scan with Infrared Lens & Click Anomaly
          </span>
          <button
            onClick={() => setShowDiscoveryModal(true)}
            className="px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow transition-all"
          >
            Lock Signal 🎯
          </button>
          <button
            onClick={() => setIsHunting(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕ Exit
          </button>
        </div>
      )}

      {/* ── 6. Floating Astronomical Timeline Scrubber (Bottom Left) ── */}
      {viewMode === 'deepspace' && (
        <TimelineScrubber
          year={year}
          onYearChange={setYear}
          target={selectedTarget}
        />
      )}

      {/* ── 7. Sleek Right-Side Floating AI Assistant Panel (30% Width) ── */}
      {viewMode === 'deepspace' && (
        <RightPanelAI
          target={selectedTarget}
          spectralData={spectralData}
          gaiaStars={gaiaStars}
          irsaSources={irsaSources}
          year={year}
        />
      )}

      {/* ── 8. Official NASA Citizen Scientist Discovery Report Modal ── */}
      <PlanetXChallengeModal
        isOpen={showDiscoveryModal}
        onClose={() => {
          setShowDiscoveryModal(false);
          setIsHunting(false);
        }}
        onExploreIn3D={() => {
          setShowDiscoveryModal(false);
          setIsHunting(false);
          setViewMode('solarsystem');
        }}
      />

      {/* ── 9. Citizen Science Interactive How-To Guide Modal ── */}
      {showGuide && (
        <HowToGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      )}

    </div>
  );
}
