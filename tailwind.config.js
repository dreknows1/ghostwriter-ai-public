/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // "Haunted Studio Noir" — ink/charcoal structural scale. Named `slate` so the
        // existing bg-slate-*/border-slate-*/text-slate-* usage across the app (which
        // used to carry the old purple theme) repaints to the new palette everywhere
        // in one place, instead of a component-by-component sweep.
        slate: {
          50: '#f8f4ec',
          100: '#f4efe7',
          200: '#e4dccb',
          300: '#c9bfae',
          400: '#a99b8a',
          500: '#8a7c6c',
          600: '#5c5348',
          700: '#3a332c',
          800: '#1d1815',
          900: '#141110',
          950: '#0b0a09',
        },
        // Spectral teal secondary — links, checks, tags. Never used for CTAs.
        cyan: {
          50: '#eafbf8',
          100: '#cdf5ee',
          200: '#9be9dd',
          300: '#6fdfcd',
          400: '#4fd7c4',
          500: '#35bfac',
          600: '#279988',
          700: '#1f7a6d',
          800: '#195f55',
          900: '#154d45',
          950: '#0a2e29',
        },
        // Candlelight amber primary — the ONE loud color, reserved for the hero CTA.
        amber: {
          50: '#fdf6ec',
          100: '#faead0',
          200: '#f6d7a3',
          300: '#f6c987',
          400: '#f3ba5f',
          500: '#e2993c',
          600: '#b9752a',
          700: '#935c22',
          800: '#6f461c',
          900: '#4a2f14',
          950: '#2b1a0b',
        },
        orange: {
          50: '#fdf6ec',
          100: '#faead0',
          200: '#f6d7a3',
          300: '#f6c987',
          400: '#f3ba5f',
          500: '#e2993c',
          600: '#b9752a',
          700: '#935c22',
          800: '#6f461c',
          900: '#4a2f14',
          950: '#2b1a0b',
        },
        // Warm "lamplit page" — where lyrics live.
        parchment: {
          DEFAULT: '#f1e4c8',
          2: '#e8d6b1',
          ink: '#2b2015',
          soft: '#5c4a35',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
