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
        // BMW M motorsport tricolour — now the core accent identity
        m: {
          blue: '#1786D4',
          'blue-deep': '#0A5CC0',
          purple: '#6A2CC0',
          red: '#E2001A',
        },
        // Primary clickable accent (sits within the M blue family)
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
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'glow-drift': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.85' },
          '100%': { transform: 'translate3d(-2%,1%,0) scale(1.07)', opacity: '1' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(260%) skewX(-20deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'glow-drift': 'glow-drift 14s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;
