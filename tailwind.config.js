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
        slate: {
          200: '#ddd6f3',
          300: '#c4b5e0',
          400: '#a89bc4',
          500: '#8b7aab',
          600: '#6b5d8a',
          700: '#352a55',
          800: '#1e1540',
          900: '#120e24',
          950: '#0c0a1d',
        }
      }
    }
  },
  plugins: [],
};
