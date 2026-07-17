import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.songghost.app',
  appName: 'SongGhost',
  webDir: 'dist',
  // Paint the intro's dark base behind the WebView so launch → intro never flashes.
  backgroundColor: '#0b0a09',
};

export default config;
