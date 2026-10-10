import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/** Slate is driven by CSS variables so the whole palette flips in dark mode (see globals.css). */
const slate = Object.fromEntries(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((k) => [k, v(`slate-${k}`)]));

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate,
        primary: {
          DEFAULT: '#2563EB',
          50: v('primary-50'),
          100: v('primary-100'),
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: v('primary-700'),
          800: v('primary-800'),
          900: v('primary-900'),
        },
        secondary: {
          DEFAULT: '#F97316',
          50: v('secondary-50'),
          100: v('secondary-100'),
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C',
        },
        accent: {
          DEFAULT: '#22C55E',
          50: v('accent-50'),
          100: v('accent-100'),
          500: '#22C55E',
          600: '#16A34A',
          700: v('accent-700'),
        },
        // Status tints used on badges/alerts: the 50 shade and the dark text shade flip in dark mode.
        amber: { 50: v('amber-50'), 100: '#FEF3C7', 200: v('amber-200'), 400: '#FBBF24', 500: '#F59E0B', 700: v('amber-700'), 900: v('amber-900') },
        red: { 50: v('red-50'), 200: v('red-200'), 500: '#EF4444', 600: v('red-600'), 700: v('red-700') },
        orange: { 50: v('secondary-50'), 300: '#FDBA74', 400: '#FB923C', 500: '#F97316', 700: v('orange-700'), 800: v('orange-800') },
        green: { 200: v('green-200'), 700: v('accent-700') },
        emerald: { 400: '#34D399', 600: '#059669' },
        background: v('background'),
        surface: v('surface'),
        text: v('text'),
        muted: v('muted'),
      },
      backgroundColor: {
        // bg-white becomes the card surface in dark mode; text-white stays white.
        white: v('surface'),
        slate: { ...slate, 900: v('ink-900'), 950: v('ink-950') },
      },
      borderColor: { white: v('surface') },
      // Links/labels in brand blue need a lighter blue on dark backgrounds (4.5:1); buttons keep bg-primary as is.
      textColor: { primary: { DEFAULT: v('primary-text') } },
      // Gradients keep their real brand colours in both themes.
      gradientColorStops: {
        white: '#FFFFFF',
        slate: { 600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617' },
        primary: { 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        secondary: { 500: '#F97316', 600: '#EA580C' },
        accent: { 500: '#22C55E' },
        orange: { 50: v('secondary-50'), 300: '#FDBA74', 400: '#FB923C', 500: '#F97316' },
        amber: { 50: v('amber-50'), 400: '#FBBF24' },
        emerald: { 400: '#34D399', 600: '#059669' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.10)',
        card: '0 1px 1px rgba(15, 23, 42, 0.03), 0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 16px 40px -16px rgba(15, 23, 42, 0.12)',
        lift: '0 2px 4px rgba(15, 23, 42, 0.04), 0 24px 48px -16px rgba(15, 23, 42, 0.18)',
        premium: '0 24px 70px rgba(15, 23, 42, 0.14)',
        'glow-blue': '0 12px 32px -8px rgba(37, 99, 235, 0.45)',
        'glow-orange': '0 12px 32px -8px rgba(249, 115, 22, 0.45)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      backgroundImage: {
        'grid-slate': 'linear-gradient(to right, rgb(var(--grid-line) / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--grid-line) / 0.05) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(var(--float-rotate, 0deg))' },
          '50%': { transform: 'translate3d(0, -12px, 0) rotate(var(--float-rotate, 0deg))' },
        },
        'slide-in': { from: { opacity: '0', transform: 'translateX(24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      animation: {
        'fade-up': 'fade-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 300ms ease-out both',
        'scale-in': 'scale-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'slide-in': 'slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
