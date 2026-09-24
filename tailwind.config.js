/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stockscans: {
          bgDark: '#12161f',
          panelDark: '#1a1f2c',
          borderDark: '#2a3142',
          textDark: '#e2e8f0',
          textMutedDark: '#94a3b8',
          bgLight: '#f8fafc',
          panelLight: '#ffffff',
          borderLight: '#e2e8f0',
          textLight: '#0f172a',
          bullish: '#26a69a',
          bearish: '#ef5350',
          accent: '#2563eb'
        }
      }
    },
  },
  plugins: [],
}
