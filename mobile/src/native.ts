import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Keep the iOS status bar text readable for the active light/dark theme.
export function setupNative() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native-app');
  const apply = () => {
    const light = document.documentElement.dataset.theme === 'light';
    StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
