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
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title: 'Hıfz Ezber Karnem', text }).catch(() => {});
  }
}

export function setupNative() {
  // Attach global tactile haptic listener for buttons and interactive cards on iOS
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
    const light = document.documentElement.dataset.theme === 'light';
    StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }).catch(() => {});
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
