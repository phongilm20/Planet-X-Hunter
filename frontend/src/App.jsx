import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import SkyChart from './components/SkyChart';
import Timeline from './components/Timeline';
import InfoPanel from './components/InfoPanel';
import HelpModal from './components/HelpModal';
import { PRESETS } from './data/presets';
import { resolveTarget } from './data/resolve';
import { fetchSpherexObservations } from './data/irsa';
import { getTargetPositionsAtEpochs } from './data/ephemeris';
import { fetchBackgroundStars } from './data/gaia';

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('target');
  const matched = PRESETS.find(p => p.id === targetId || p.shortName.toLowerCase() === targetId?.toLowerCase());
  
  if (matched) return matched;
  if (params.has('ra') && params.has('dec')) {
    const ra = parseFloat(params.get('ra'));
    const dec = parseFloat(params.get('dec'));
    if (!isNaN(ra) && !isNaN(dec)) {
      return {
        id: 'url-target',
        name: params.get('name') || `Position (${ra.toFixed(4)}°, ${dec.toFixed(4)}°)`,
        shortName: 'URL Target',
        category: 'Shared Field',
        ra,
        dec,
        pmra: parseFloat(params.get('pmra') || '0'),
        pmdec: parseFloat(params.get('pmdec') || '0'),
        parallax: parseFloat(params.get('plx') || '0'),
        isSolarSystem: false,
        source: 'URL Link'
      };
    }
  }
  return PRESETS[0]; // Default: WISE 0855
}

export default function App() {
  const [target, setTarget] = useState(parseUrlParams);
  const [observations, setObservations] = useState([]);
  const [obsStatus, setObsStatus] = useState('loading');
  const [obsError, setObsError] = useState(null);
  const [obsFetchedAt, setObsFetchedAt] = useState(null);
  const [dataSource, setDataSource] = useState('NASA/IPAC IRSA');

  const [trackPoints, setTrackPoints] = useState([]);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [backgroundStars, setBackgroundStars] = useState([]);

  // Animation Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  // UI state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // ── Sync URL ──
  useEffect(() => {
    if (!target) return;
    const params = new URLSearchParams();
    if (target.id && !target.id.startsWith('url-')) {
      params.set('target', target.id);
    }
    params.set('ra', target.ra.toFixed(5));
    params.set('dec', target.dec.toFixed(5));
    if (target.pmra) params.set('pmra', target.pmra.toFixed(1));
    if (target.pmdec) params.set('pmdec', target.pmdec.toFixed(1));
    if (target.parallax) params.set('plx', target.parallax.toFixed(1));
    params.set('t', String(activeTrackIndex));

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [target, activeTrackIndex]);

  // ── Fetch Observations & Background Stars ──
  useEffect(() => {
    let isCancelled = false;
    setObsStatus('loading');
    setObsError(null);

    async function loadFieldData() {
      try {
        const [obsRes, starsRes] = await Promise.all([
          fetchSpherexObservations(target.ra, target.dec, 0.08, target.name),
          fetchBackgroundStars(target.ra, target.dec, 0.05)
        ]);

        if (isCancelled) return;

        setObservations(obsRes.observations || []);
        setObsStatus(obsRes.status);
        setObsError(obsRes.error || null);
        setObsFetchedAt(obsRes.fetchedAtUTC);
        setDataSource(obsRes.dataSource || 'NASA/IPAC IRSA');
        setBackgroundStars(starsRes || []);

        // Compute track points across observation dates
        const track = getTargetPositionsAtEpochs(target, obsRes.observations || []);
        setTrackPoints(track);
        setActiveTrackIndex(Math.max(0, track.length - 1));
      } catch (err) {
        if (!isCancelled) {
          console.error('Field data fetch error:', err);
          setObsStatus('error');
          setObsError(err.message || 'Error communicating with IRSA.');
        }
      }
    }

    loadFieldData();

    return () => {
      isCancelled = true;
    };
  }, [target]);

  // ── Scrubber Play Loop ──
  useEffect(() => {
    if (!isPlaying || trackPoints.length <= 1) return;

    const intervalMs = Math.floor(1200 / playSpeed);
    const timer = setInterval(() => {
      setActiveTrackIndex((prev) => {
        if (prev >= trackPoints.length - 1) {
          return 0; // Loop back
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, trackPoints]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setActiveTrackIndex((p) => Math.max(0, p - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setActiveTrackIndex((p) => Math.min(trackPoints.length - 1, p + 1));
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trackPoints]);

  // ── Retry handler ──
  const handleRetry = useCallback(async () => {
    setObsStatus('loading');
    const obsRes = await fetchSpherexObservations(target.ra, target.dec, 0.08, target.name, true);
    setObservations(obsRes.observations || []);
    setObsStatus(obsRes.status);
    setObsError(obsRes.error || null);
    setObsFetchedAt(obsRes.fetchedAtUTC);
    setDataSource(obsRes.dataSource);

    const track = getTargetPositionsAtEpochs(target, obsRes.observations || []);
    setTrackPoints(track);
  }, [target]);

  // ── Search handler ──
  const handleSearch = async (query) => {
    const resolved = await resolveTarget(query);
    if (resolved) {
      setTarget(resolved);
      setIsPlaying(false);
    } else {
      alert(`Could not resolve "${query}". Please enter an object name or coordinates (RA, Dec).`);
    }
  };

  // ── Copy Link ──
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // ── Download PNG of Chart ──
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    const footerHeight = 60;

    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height + footerHeight;

    // Draw main sky chart
    ctx.drawImage(canvas, 0, 0);

    // Draw footer attribution bar
    ctx.fillStyle = '#0B0E14';
    ctx.fillRect(0, canvas.height, canvas.width, footerHeight);
    ctx.strokeStyle = '#262E40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();

    ctx.fillStyle = '#E6EAF2';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`${target.name} · SPHEREx Sky Tracker`, 16, canvas.height + 24);

    ctx.fillStyle = '#98A2B8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`RA: ${target.ra.toFixed(5)}°  Dec: ${target.dec.toFixed(5)}° · Scale: 6.15″/px · ${dataSource}`, 16, canvas.height + 44);

    const link = document.createElement('a');
    link.download = `${target.shortName.replace(/[\s/]/g, '_')}_SPHEREx_Track.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  // ── Download CSV of Observations ──
  const handleDownloadCSV = () => {
    if (observations.length === 0) return;
    const headers = ['obs_id', 'date_utc', 'year', 'ra_deg', 'dec_deg', 'band_micron', 'access_url'];
    const rows = observations.map(o => [
      `"${o.id}"`,
      `"${o.dateStr}"`,
      o.year.toFixed(3),
      o.ra.toFixed(5),
      o.dec.toFixed(5),
      o.bandMicron.toFixed(2),
      `"${o.url}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${target.shortName.replace(/[\s/]/g, '_')}_SPHEREx_observations.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-obs-bg text-obs-text font-sans antialiased">
      {/* ── Top Header Bar ── */}
      <Header
        onSearch={handleSearch}
        onOpenHelp={() => setIsHelpOpen(true)}
        onCopyLink={handleCopyLink}
        isCopied={isCopied}
      />

      {/* ── Main Workspace: Sky Chart (Hero) + Info/Observation Side Rail ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        
        {/* Left/Center: Sky Chart Hero Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-obs-bg relative">
          <SkyChart
            target={target}
            observations={observations}
            trackPoints={trackPoints}
            backgroundStars={backgroundStars}
            activeTrackIndex={activeTrackIndex}
            onSelectTrackIndex={(idx) => {
              setIsPlaying(false);
              setActiveTrackIndex(idx);
            }}
            onExportPNG={handleExportPNG}
          />

          {/* Bottom Timeline & Motion Scrubber */}
          <Timeline
            trackPoints={trackPoints}
            activeTrackIndex={activeTrackIndex}
            onSelectTrackIndex={(idx) => {
              setIsPlaying(false);
              setActiveTrackIndex(idx);
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            playSpeed={playSpeed}
            onChangePlaySpeed={setPlaySpeed}
          />
        </main>

        {/* Right Rail: Target Details, Presets & Observation List */}
        <InfoPanel
          target={target}
          onSelectPreset={(p) => {
            setTarget(p);
            setIsPlaying(false);
          }}
          observations={observations}
          obsStatus={obsStatus}
          obsError={obsError}
          obsFetchedAt={obsFetchedAt}
          dataSource={dataSource}
          onRetry={handleRetry}
          onDownloadCSV={handleDownloadCSV}
        />
      </div>

      {/* ── Help / Methodology Modal ── */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
