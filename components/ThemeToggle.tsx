'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [light, setLight] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.dataset.theme !== 'dark');
    setReady(true);
  }, []);

  function toggle() {
    const nextLight = document.documentElement.dataset.theme === 'dark';
    const nextTheme = nextLight ? 'light' : 'dark';
    setLight(nextLight);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      localStorage.setItem('hifz:theme', nextTheme);
    } catch {}
  }

  return (
    <button
      className="icon-button theme-toggle"
      disabled={!ready}
      aria-label={light ? 'Gece temasına geç' : 'Ferah gündüz temasına geç'}
      title={light ? 'Gece teması' : 'Gündüz teması'}
      onClick={toggle}
    >
      {light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
