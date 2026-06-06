import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Graphite base
        graphite: {
          DEFAULT: '#0A0B0D',
          900: '#0A0B0D',
          800: '#111316',
          700: '#16191D',
          600: '#1E2227',
          500: '#272C33',
        },
        ink: '#FFFFFF',
        muted: '#A1A6AD',
        faint: '#6B7178',
        // BMW M palette — use sparingly
        m: {
          blue: '#0066B1',
          purple: '#5C2D91',
          red: '#E2001A',
        },
        // Primary clickable accent
        bmw: '#1C69D4',
        'bmw-dark': '#1454AE',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        ticker: '0.28em',
      },
      maxWidth: {
        edge: '1320px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'stripe-slide': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
