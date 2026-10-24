import './api-shim';
import '@/app/globals.css';
import '@/app/responsive.css';
import '@/app/methods.css';
import '@/app/mobile-first.css';
import '@/app/typography.css';
import '@/app/learning.css';
import '@/app/passages.css';
import '@/app/focus.css';
import '@/app/reading.css';
import './native.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Home from '@/app/page';
import HifzWorkshop from '@/components/HifzWorkshop';
import { setupNative } from './native';

type LocState = {
  route: 'home' | 'calis';
  search: string;
};

const getLoc = (): LocState => ({
  route: window.location.pathname.replace(/\/+$/, '').endsWith('/calis') ? 'calis' : 'home',
  search: window.location.search,
});

function App() {
  const [loc, setLoc] = useState<LocState>(getLoc);

  useEffect(() => {
    const onPop = () => setLoc(getLoc());
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a');
      const href = anchor?.getAttribute('href');
      if (!anchor || anchor.target || !href) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
        if (cleanPath !== '/' && cleanPath !== '/calis') return;
        event.preventDefault();
        const nextUrl = cleanPath + url.search + url.hash;
        if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
          window.history.pushState(null, '', nextUrl);
        }
        setLoc(getLoc());
        window.scrollTo(0, 0);
      } catch {
        // Ignore malformed hrefs
      }
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (loc.route === 'calis') {
    const params = new URLSearchParams(loc.search);
    const k = params.get('kategori');
    const category = k === 'prayers' || k === 'all' ? k : 'basics';
    return (
      <HifzWorkshop
        key="calis"
        initialChallenge={params.get('sina') === '1'}
        initialCategory={category}
        initialKey={params.get('icerik') ?? undefined}
        initialStart={params.get('baslangic') ?? undefined}
        initialEnd={params.get('bitis') ?? undefined}
      />
    );
  }
  return <Home key="home" />;
}

setupNative();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
