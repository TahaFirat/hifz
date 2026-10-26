import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tahafirat.hifz',
  appName: 'Hıfz',
  webDir: 'dist',
  backgroundColor: '#061412',
  ios: {
    contentInset: 'never',
    allowsLinkPreview: false,
    preferredContentMode: 'mobile',
    backgroundColor: '#061412',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK' },
  },
};

export default config;
