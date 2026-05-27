import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b1330', elevated: '#141c3d', sunken: '#080d24' },
        ink: { DEFAULT: '#f4f5fb', muted: '#8b93b8', faint: '#525a7d' },
        line: { DEFAULT: 'rgba(255,255,255,0.07)', strong: 'rgba(255,255,255,0.13)' },
        accent: { DEFAULT: '#9bd47b', dim: '#6fae50', soft: 'rgba(155,212,123,0.15)' },
        amber: { DEFAULT: '#d4a55a' },
        // Rolex green family — used for money displays + "settled" status.
        rolex: {
          DEFAULT: '#0E3B2A',   // deep money green
          dim: '#0A2D20',       // darker variant for shadows
          edge: '#1A5A3F',      // brighter edge for borders
          ink: '#F4EDDF',       // cream for text on green
          gold: '#C9A961',      // muted gold accent
        },
        // Warm rust amber for losses — easier on the eye than pure yellow.
        loss: '#C28A4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Garamond', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'hero-card': 'linear-gradient(160deg, #1c2657 0%, #0d1432 100%)',
        'hero-green': 'linear-gradient(165deg, #15523B 0%, #0A2D20 100%)',
        'page': 'radial-gradient(1100px 500px at 50% -150px, #1a2353 0%, #0b1330 60%)',
      },
      boxShadow: {
        'pill': '0 6px 20px rgba(0,0,0,0.35)',
        'green-glow': '0 16px 40px -8px rgba(14,59,42,0.6)',
      },
    },
  },
  plugins: [],
};
export default config;
