import React, { useEffect, useCallback } from 'react';

const DipoleDiagram = () => (
  <svg width="260" height="90" viewBox="0 0 260 90" style={{ display: 'block', margin: '12px auto' }}>
    {/* Background */}
    <rect width="260" height="90" rx="6" fill="#0B0F19" stroke="#1E3A5F" strokeWidth="1" />
    {/* Epoch 1 position – cyan */}
    <circle cx="75" cy="45" r="16" fill="none" stroke="#00E5FF" strokeWidth="2" opacity="0.9" />
    <circle cx="75" cy="45" r="6" fill="#00E5FF" opacity="0.85" />
    <text x="75" y="78" textAnchor="middle" fill="#00E5FF" fontSize="9" fontFamily="monospace">Epoch 1</text>
    {/* Arrow showing motion */}
    <line x1="97" y1="45" x2="148" y2="45" stroke="#667788" strokeWidth="1.5" strokeDasharray="4 3" />
    <polygon points="150,45 143,40 143,50" fill="#667788" />
    <text x="123" y="37" textAnchor="middle" fill="#667788" fontSize="8" fontFamily="monospace">motion</text>
    {/* Epoch 2 position – magenta */}
    <circle cx="175" cy="45" r="16" fill="none" stroke="#FF00FF" strokeWidth="2" opacity="0.9" />
    <circle cx="175" cy="45" r="6" fill="#FF00FF" opacity="0.85" />
    <text x="175" y="78" textAnchor="middle" fill="#FF00FF" fontSize="9" fontFamily="monospace">Epoch 2</text>
    {/* Label */}
    <text x="230" y="20" textAnchor="middle" fill="#8899AA" fontSize="8" fontFamily="monospace">DIPOLE</text>
  </svg>
);

const MonopoleDiagram = () => (
  <svg width="260" height="90" viewBox="0 0 260 90" style={{ display: 'block', margin: '12px auto' }}>
    {/* Background */}
    <rect width="260" height="90" rx="6" fill="#0B0F19" stroke="#1E3A5F" strokeWidth="1" />
    {/* Single position – variable brightness rings */}
    <circle cx="130" cy="45" r="28" fill="none" stroke="#FFD54F" strokeWidth="1" opacity="0.3" />
    <circle cx="130" cy="45" r="20" fill="none" stroke="#FFD54F" strokeWidth="1.5" opacity="0.5" />
    <circle cx="130" cy="45" r="12" fill="none" stroke="#FFD54F" strokeWidth="2" opacity="0.7" />
    <circle cx="130" cy="45" r="5" fill="#FFD54F" opacity="0.9" />
    {/* Label */}
    <text x="130" y="84" textAnchor="middle" fill="#FFD54F" fontSize="9" fontFamily="monospace">Same position — brightness changes</text>
    <text x="230" y="20" textAnchor="middle" fill="#8899AA" fontSize="8" fontFamily="monospace">MONOPOLE</text>
  </svg>
);

const steps = [
  {
    title: 'What is SPHEREx?',
    body: (
      <>
        NASA's <strong>Spectro-Photometer for the History of the Universe, Epoch of
        Reionization and Ices Explorer</strong> surveys the entire sky in 102 near-infrared
        bands (0.75–5.0&nbsp;µm) four times over 2&nbsp;years. Each all-sky pass creates a
        complete spectral data-cube, perfect for spotting faint, cold objects that move
        between epochs.
      </>
    ),
  },
  {
    title: 'What is Planet X?',
    body: (
      <>
        A hypothetical undiscovered planet in the outer solar system, well beyond Neptune.
        It would be very cold (~40–50&nbsp;K), extremely faint in optical wavelengths, but
        potentially detectable in the <strong>thermal infrared (3–5&nbsp;µm)</strong> where
        SPHEREx is most sensitive. Its gravitational influence may explain clustering
        patterns in distant trans-Neptunian objects.
      </>
    ),
  },
  {
    title: 'How to Spot a Moving Object',
    body: (
      <>
        Use the <strong>Blink Comparator</strong> or <strong>Difference Image</strong> mode.
        A real moving object (planet, brown dwarf) creates a <em>dipole</em> pattern: a
        bright spot (<span style={{ color: '#00E5FF', fontWeight: 700 }}>cyan</span>) where
        it <em>was</em> in Epoch&nbsp;1 and another bright spot (
        <span style={{ color: '#FF00FF', fontWeight: 700 }}>magenta</span>) where it{' '}
        <em>is</em> in Epoch&nbsp;2. Background stars cancel out perfectly.
        <DipoleDiagram />
      </>
    ),
  },
  {
    title: 'Moving Object vs Variable Star',
    body: (
      <>
        A variable star stays in the <strong>same position</strong> but changes brightness.
        In Difference mode it appears as a single bright or dark <em>monopole</em> (one
        spot), not a pair. Compare targets like{' '}
        <strong>WISE&nbsp;0855</strong> (dipole — nearby brown dwarf in motion) vs{' '}
        <strong>R&nbsp;Draconis</strong> (monopole — Mira variable star).
        <MonopoleDiagram />
      </>
    ),
  },
  {
    title: 'Using the 102-Band Spectrum',
    body: (
      <>
        Click any object to see its infrared spectrum across all 102 SPHEREx bands. Brown
        dwarfs show deep <strong>methane absorption at 3.3&nbsp;µm</strong>. Cold planets
        peak around <strong>4–5&nbsp;µm</strong>. Use the spectral viewer to compare your
        target against known templates for T-dwarfs, Y-dwarfs, and planetary atmosphere
        models.
      </>
    ),
  },
  {
    title: 'Cross-Match with Catalogs',
    body: (
      <>
        Use the <strong>Aladin Lite</strong> panel to check if your discovery already
        appears in <em>Gaia&nbsp;DR3</em> or <em>AllWISE</em>. A true Planet&nbsp;X
        candidate would <strong>not</strong> appear in any existing catalog — it would be a
        genuinely new source visible only in SPHEREx's deepest infrared bands.
      </>
    ),
  },
];

export default function HowToGuide({ isOpen, onClose }) {
  const isModalOpen = isOpen !== undefined ? isOpen : true;
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, handleKeyDown]);

  if (!isModalOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '48px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 600,
          background: 'linear-gradient(180deg, #111827 0%, #0B0F19 100%)',
          border: '1px solid #1E3A5F',
          borderRadius: 12,
          padding: '36px 32px 32px',
          boxShadow: '0 0 60px rgba(0, 229, 255, 0.08)',
          color: '#C9D1D9',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close guide"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: '1px solid #30363D',
            borderRadius: 6,
            color: '#8B949E',
            fontSize: 18,
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FF6B6B';
            e.currentTarget.style.borderColor = '#FF6B6B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8B949E';
            e.currentTarget.style.borderColor = '#30363D';
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 700,
            color: '#E6EDF3',
            letterSpacing: '-0.02em',
          }}
        >
          🔭 How to Hunt for Planet X with SPHEREx
        </h2>
        <p style={{ margin: '0 0 28px', color: '#8B949E', fontSize: 13 }}>
          A step-by-step guide to discovering faint, cold objects in the outer solar system.
        </p>

        {/* Steps */}
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: i < steps.length - 1 ? 24 : 0,
            }}
          >
            {/* Step number */}
            <div
              style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0, 229, 255, 0.12)',
                border: '1.5px solid #00E5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00E5FF',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'monospace',
                marginTop: 2,
              }}
            >
              {i + 1}
            </div>

            {/* Card */}
            <div
              style={{
                flex: 1,
                background: 'rgba(22, 27, 40, 0.7)',
                border: '1px solid #1E3A5F',
                borderRadius: 8,
                padding: '14px 18px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#00E5FF',
                }}
              >
                {step.title}
              </h3>
              <div style={{ color: '#B0B8C4', fontSize: 13, lineHeight: 1.75 }}>
                {step.body}
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <p
          style={{
            marginTop: 28,
            textAlign: 'center',
            color: '#4A5568',
            fontSize: 12,
          }}
        >
          Press <kbd style={{ color: '#8B949E' }}>Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}
