import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.songghost.app',
  appName: 'SongGhost',
  webDir: 'dist',
  // Paint cream behind the WebView so launch → web handoff never flashes.
  backgroundColor: '#F7F3EA',
};

export default config;
