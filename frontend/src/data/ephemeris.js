import snapshotData from './ephemeris-snapshot.json';
import { propagateProperMotion, angularSeparation, GAIA_EPOCH } from '../lib/astro';

/**
 * Compute the target's trajectory positions at given observation epochs
 * 
 * Supports:
 * 1. Solar system objects (via verified Horizons snapshot or live API)
 * 2. Proper-motion celestial targets (stars / brown dwarfs propagated from Gaia ref epoch)
 */
export function getTargetPositionsAtEpochs(target, observationEpochs = []) {
  if (!target) return [];

  // Case 1: Solar system object with Horizons snapshot
  if (target.isSolarSystem && target.solarSystemKey && snapshotData.targets[target.solarSystemKey]) {
    const points = snapshotData.targets[target.solarSystemKey];
    return points.map(pt => ({
      date: pt.date,
      year: pt.year,
      ra: pt.ra,
      dec: pt.dec,
      label: pt.date.slice(0, 10),
      isHistorical: false,
      provenance: 'Horizons snapshot (2026-11-15)'
    }));
  }

  // Case 2: Proper motion stellar / brown dwarf object
  // Build a track spanning historical baselines + SPHEREx observation dates
  const epochsToSample = [];

  // Historical reference ticks (WISE 2010.5, Gaia 2016.0)
  epochsToSample.push({
    date: '2010-06-01T00:00:00Z',
    year: 2010.5,
    label: 'WISE 2010.5',
    isHistorical: true,
    provenance: 'WISE Catalog'
  });
  epochsToSample.push({
    date: '2016-01-01T00:00:00Z',
    year: 2016.0,
    label: 'Gaia 2016.0',
    isHistorical: true,
    provenance: 'Gaia DR3'
  });

  // If there are real SPHEREx observations, add their dates
  if (observationEpochs.length > 0) {
    observationEpochs.forEach(obs => {
      epochsToSample.push({
        date: obs.timeUTC,
        year: obs.year,
        label: `SPHEREx ${obs.dateStr}`,
        isHistorical: false,
        provenance: 'SPHEREx Observation'
      });
    });
  } else {
    // Standard SPHEREx survey cadence points (Survey 1-4)
    epochsToSample.push(
      { date: '2025-03-15T00:00:00Z', year: 2025.2, label: 'SPHEREx 2025.2 (Survey 1)', isHistorical: false, provenance: 'SPHEREx Cadence' },
      { date: '2025-09-15T00:00:00Z', year: 2025.7, label: 'SPHEREx 2025.7 (Survey 2)', isHistorical: false, provenance: 'SPHEREx Cadence' },
      { date: '2026-03-15T00:00:00Z', year: 2026.2, label: 'SPHEREx 2026.2 (Survey 3)', isHistorical: false, provenance: 'SPHEREx Cadence' },
      { date: '2026-09-15T00:00:00Z', year: 2026.7, label: 'SPHEREx 2026.7 (Survey 4)', isHistorical: false, provenance: 'SPHEREx Cadence' }
    );
  }

  // Deduplicate and sort by year
  const seenYears = new Set();
  const track = [];

  epochsToSample.sort((a, b) => a.year - b.year).forEach(ep => {
    const rounded = Math.round(ep.year * 10) / 10;
    if (seenYears.has(rounded)) return;
    seenYears.add(rounded);

    const pos = propagateProperMotion(
      target.ra,
      target.dec,
      target.pmra || 0,
      target.pmdec || 0,
      ep.year,
      GAIA_EPOCH
    );

    track.push({
      date: ep.date,
      year: ep.year,
      ra: pos.ra,
      dec: pos.dec,
      label: ep.label,
      isHistorical: ep.isHistorical,
      provenance: ep.provenance
    });
  });

  return track;
}
