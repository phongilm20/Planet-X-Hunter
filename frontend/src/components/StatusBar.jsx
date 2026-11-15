import React from 'react';

/**
 * Maps SPHEREx band index (1-102) to approximate centre wavelength in µm.
 * SPHEREx covers 0.75–5.0 µm across 102 bands (roughly linear spacing).
 */
function bandToWavelength(band) {
  const minLambda = 0.75;
  const maxLambda = 5.0;
  const lambda = minLambda + ((band - 1) / 101) * (maxLambda - minLambda);
  return lambda.toFixed(2);
}

const Dot = ({ color }) => (
  <span
    style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      backgroundColor: color,
      boxShadow: `0 0 4px ${color}`,
      marginRight: 5,
      verticalAlign: 'middle',
    }}
  />
);

const Spinner = () => (
  <span
    style={{
      display: 'inline-block',
      width: 12,
      height: 12,
      border: '2px solid rgba(0,229,255,0.25)',
      borderTop: '2px solid #00E5FF',
      borderRadius: '50%',
      animation: 'statusbar-spin 0.8s linear infinite',
      verticalAlign: 'middle',
      marginLeft: 8,
    }}
  />
);

export default function StatusBar({
  ra = 0,
  dec = 0,
  fov = 5,
  band = 1,
  mode = 'SINGLE',
  loading = false,
  apiHealth = null,
  health = null,
  error = null,
}) {
  const currentHealth = apiHealth || health;
  const wavelength = bandToWavelength(band);

  const apiOnline = currentHealth && currentHealth.status === 'ok';
  const irsaLive = currentHealth && currentHealth.irsa_available;

  return (
    <>
      {/* Keyframes for spinner — injected once */}
      <style>{`
        @keyframes statusbar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 32,
          zIndex: 8000,
          background: '#0D1117',
          borderTop: '1px solid #1E3A5F',
          boxShadow: '0 -1px 8px rgba(0, 229, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: 11,
          color: '#8B949E',
          userSelect: 'none',
        }}
      >
        {/* Left — Coordinates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>
            RA:&nbsp;
            <span style={{ color: '#C9D1D9' }}>{ra.toFixed(4)}°</span>
          </span>
          <span style={{ color: '#30363D', margin: '0 2px' }}>|</span>
          <span>
            Dec:&nbsp;
            <span style={{ color: '#C9D1D9' }}>{dec.toFixed(4)}°</span>
          </span>
          <span style={{ color: '#30363D', margin: '0 2px' }}>|</span>
          <span>
            FoV:&nbsp;
            <span style={{ color: '#C9D1D9' }}>{fov.toFixed(1)}&prime;</span>
          </span>
        </div>

        {/* Center — Band / Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>
            Band:&nbsp;
            <span style={{ color: '#C9D1D9' }}>{band}</span>
          </span>
          <span style={{ color: '#30363D', margin: '0 2px' }}>|</span>
          <span>
            λ:&nbsp;
            <span style={{ color: '#C9D1D9' }}>{wavelength}&nbsp;µm</span>
          </span>
          <span style={{ color: '#30363D', margin: '0 2px' }}>|</span>
          <span>
            Mode:&nbsp;
            <span style={{ color: '#00E5FF', fontWeight: 600 }}>{mode}</span>
          </span>
        </div>

        {/* Right — Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* API health */}
          {apiHealth ? (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Dot color={apiOnline ? '#3FB950' : '#F85149'} />
              <span style={{ color: apiOnline ? '#3FB950' : '#F85149' }}>
                {apiOnline ? 'API Online' : 'API Offline'}
              </span>
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Dot color="#484F58" />
              <span style={{ color: '#484F58' }}>No Signal</span>
            </span>
          )}

          {/* IRSA status */}
          {apiHealth && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Dot color={irsaLive ? '#58A6FF' : '#D29922'} />
              <span style={{ color: irsaLive ? '#58A6FF' : '#D29922' }}>
                {irsaLive ? 'IRSA Live' : 'IRSA Fallback (Synthetic)'}
              </span>
            </span>
          )}

          {/* Loading spinner */}
          {loading && <Spinner />}
        </div>
      </div>
    </>
  );
}
