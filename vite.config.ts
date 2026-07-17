
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 1. Load env vars from .env files (if any)
  // Use '.' instead of process.cwd() to prevent TypeScript errors when Node types are incomplete
  const env = loadEnv(mode, '.', '');

  // 2. Create the define object, prioritizing the loaded env, 
  // but falling back to process.env (critical for Vercel system vars)
  return {
    plugins: [react()],
    build: {
      // WKWebView's capacitor:// custom scheme never fires load events for
      // <link rel="modulepreload">, so Vite's preload helper awaits forever and
      // every dynamic import() hangs — this is what wedged the RevenueCat SDK
      // init (and with it, all iOS purchases). Preload is a web-only micro-
      // optimization; disable it so dynamic imports load directly.
      modulePreload: false,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      'process.env.CONVEX_URL': JSON.stringify(env.CONVEX_URL || process.env.CONVEX_URL),
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY)
    }
  };
});
