import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light "scorecard" theme. Warm off-white surfaces, near-black ink.
        bg:       { DEFAULT: '#F8F5EC', elevated: '#FFFFFF', sunken: '#EFEADB' },
        ink:      { DEFAULT: '#1A1F1B', muted: '#5C6660', faint: '#98A199' },
        line:     { DEFAULT: 'rgba(26,31,27,0.08)', strong: 'rgba(26,31,27,0.16)' },
        // Rolex green is now the *only* color accent. Used for actions + winning amounts.
        accent:   { DEFAULT: '#15523B', dim: '#0E3B2A', soft: 'rgba(21,82,59,0.10)' },
        // Soft rust for losses; gold for highlights on the green hero.
        loss:     '#B05A3C',
        amber:    { DEFAULT: '#B05A3C' },
        rolex: {
          DEFAULT: '#0E3B2A',
          dim:     '#0A2D20',
          edge:    '#1A5A3F',
          ink:     '#F4EDDF',
          gold:    '#C9A961',
          loss:    '#E8A37C',  // lighter peach for negatives on green — far more readable than the cream-bg rust.
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Display weights of Inter for hero numerals. Use `font-display` className.
        display: ['"Inter Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Subtle cream-on-cream gradient — like aged scorecard paper.
        'page': 'radial-gradient(900px 600px at 70% -100px, #FFFFFF 0%, #F8F5EC 65%)',
        'hero-card': 'linear-gradient(160deg, #FFFFFF 0%, #F4EFE0 100%)',
        'hero-green': 'linear-gradient(165deg, #15523B 0%, #0A2D20 100%)',
      },
      boxShadow: {
        'pill': '0 8px 24px -8px rgba(26,31,27,0.18)',
        'card': '0 1px 2px rgba(26,31,27,0.04), 0 8px 24px -12px rgba(26,31,27,0.10)',
        'green-glow': '0 16px 40px -8px rgba(14,59,42,0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
