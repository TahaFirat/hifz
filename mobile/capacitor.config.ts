import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tahafirat.hifz',
  appName: 'Hıfz',
  webDir: 'dist',
  backgroundColor: '#f3faf8',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    backgroundColor: '#f3faf8',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'LIGHT' },
  },
};

export default config;
