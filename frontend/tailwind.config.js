/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'obs-bg': '#0B0E14',
        'obs-surface': '#121722',
        'obs-raised': '#1A2130',
        'obs-border': '#262E40',
        'obs-text': '#E6EAF2',
        'obs-muted': '#98A2B8',
        'obs-accent': '#4DA3FF',
        'obs-amber': '#F5B94C',
        'obs-red': '#FF6B6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
      },
    },
  },
  plugins: [],
}
