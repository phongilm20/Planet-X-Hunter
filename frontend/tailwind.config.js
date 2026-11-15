/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'space-bg': '#0B0F19',
        'space-panel': '#111827',
        'space-border': '#1F2937',
        'cyan-accent': '#38BDF8',
        'amber-accent': '#F59E0B',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
