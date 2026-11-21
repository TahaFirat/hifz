import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

interface WebkitWindow extends Window {
  webkit?: {
    messageHandlers?: {
      hifzNative?: {
        postMessage: (msg: Record<string, unknown>) => void;
      };
    };
  };
}

export function hasNativeBridge(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as WebkitWindow).webkit?.messageHandlers?.hifzNative;
}

export function postNative(msg: Record<string, unknown>) {
  try {
    (window as unknown as WebkitWindow).webkit?.messageHandlers?.hifzNative?.postMessage(msg);
  } catch {
    // Ignore on non-iOS browser preview
  }
}

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') {
  postNative({ action: 'haptic', style });
}

export function scheduleNativeReminder(hour: number, minute: number, dueCount: number) {
  postNative({ action: 'scheduleReminder', hour, minute, dueCount });
}

export function cancelNativeReminder() {
  postNative({ action: 'cancelReminder' });
}

export function shareNativeText(text: string) {
  postNative({ action: 'shareText', text });
  if (!hasNativeBridge() && typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title: 'Hıfz Ezber Karnem', text }).catch(() => {});
  }
}

export function startNativeTeacher(locale: 'ar-SA' | 'tr-TR' = 'ar-SA') {
  postNative({ action: 'startTeacher', locale });
}

export function stopNativeTeacher() {
  postNative({ action: 'stopTeacher' });
}

export function setupNative() {
  document.addEventListener(
    'click',
    (e) => {
      const target = (e.target as Element | null)?.closest?.('button, a, summary, select');
      if (target) {
        triggerHaptic('selection');
      }
    },
    { passive: true }
  );

  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('native-app');
  const apply = () => {
    const light = document.documentElement.dataset.theme !== 'dark';
    // Style.Light gives dark status bar icons on light background; Style.Dark gives white icons on dark background
    StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
