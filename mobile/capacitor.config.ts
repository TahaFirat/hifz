import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tahafirat.hifz',
  appName: 'Hıfz',
  webDir: 'dist',
  backgroundColor: '#070b10',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    backgroundColor: '#070b10',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK' },
  },
};

export default config;
