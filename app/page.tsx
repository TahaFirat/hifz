'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, HandHeart, Moon, Mic, HelpCircle, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LearningHome from '@/components/LearningHome';
import type { GuideMethodKey } from '@/components/MethodGuideModal';
import { allSelections, basics, prayerCatalog } from '@/lib/hifz/catalog';
import { lessonRange } from '@/lib/hifz/study';

export default function Home({ onOpenGuide }: { onOpenGuide?: (key?: GuideMethodKey) => void }) {
  const [last, setLast] = useState<{
    key: string;
    name: string;
    category: string;
    range: [number, number];
  } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hifz:last-lesson:v1') || 'null');
      const list = saved?.category === 'all' ? allSelections : saved?.category === 'prayers' ? prayerCatalog : basics;
      const item = list.find((c) => c.key === saved?.key);
      if (item) {
        setLast({
          key: item.key,
          name: item.name,
          category: saved.category === 'all' || saved.category === 'prayers' ? saved.category : 'basics',
          range: lessonRange(saved.range?.[0], saved.range?.[1], item),
        });
      }
    } catch {}
  }, []);

  return (
    <div className="home-page">
      <header className="home-header">
        <a className="brand" href="/">
          ۞ Hıfz <span>Atölye</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onOpenGuide && (
            <button type="button" className="guide-header-pill" onClick={() => onOpenGuide('teacher')}>
              <HelpCircle size={15} />
              <span>Metot Rehberi</span>
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="home-content">
        {/* Uplifting Welcome & Method Guide Hero */}
        <section className="home-welcome-banner" aria-label="Hoş geldin ve metot rehberi">
          <span className="home-welcome-badge">
            <Sparkles size={13} /> Ahmed Hüsrev Hattı · 5 Pedagojik Metot · Sanal Hoca
          </span>
          <h1>Sure &amp; Dua Ezber Atölyesi</h1>
          <p>
            Uzun ayetleri anlamlı nefes duraklarına bölerek ezberle, Osmanlı 3+3 Rabt koçuyla birleştir ve{' '}
            <strong>Sanal Hafız Hocası</strong> ile sesli ezber vererek doğruluğunu anında ölç.
          </p>
          <div className="home-hero-actions">
            <a className="home-primary-cta" href="/calis?kategori=basics&icerik=s1&mod=teacher">
              <Mic size={17} />
              <span>Sanal Hocaya Ezber Ver</span>
            </a>
            {onOpenGuide && (
              <button type="button" className="home-guide-cta" onClick={() => onOpenGuide('masking')}>
                <HelpCircle size={17} />
                <span>Metotlar Nasıl Çalışır?</span>
              </button>
            )}
          </div>
        </section>

        {last && (
          <a
            className="resume-link"
            href={`/calis?kategori=${last.category}&icerik=${encodeURIComponent(last.key)}&baslangic=${last.range[0]}&bitis=${last.range[1]}`}
          >
            <span>
              Kaldığın yerden devam et: <strong>{last.name}</strong>
            </span>
            <ArrowRight size={19} />
          </a>
        )}

        <LearningHome />

        <div className="entry-grid">
          {[
            { href: '/calis?kategori=basics', name: 'Namaz Sureleri', sub: 'Fâtiha, Âyetel Kürsî, Kısa Sureler', Icon: Moon },
            { href: '/calis?kategori=prayers', name: 'Namaz Duaları', sub: 'Sübhâneke, Ettehiyyâtü, Kunut', Icon: HandHeart },
            { href: '/calis?kategori=basics&icerik=s112&mod=teacher', name: 'Sanal Hoca', sub: 'Sesli ezber dinlet & hata gör', Icon: Mic },
            { href: '/calis?kategori=all', name: '114 Sure Mushaf', sub: 'Yâsîn, Mülk, Nebe ve tümü', Icon: BookOpen },
          ].map(({ href, name, sub, Icon }) => (
            <a className="entry-card" key={href} href={href}>
              <Icon size={24} strokeWidth={1.6} />
              <div className="entry-card-text">
                <span>{name}</span>
                <small>{sub}</small>
              </div>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>

        <div className="quick-links">
          <a href="/calis?icerik=s1">Fâtiha</a>
          <span>·</span>
          <a href="/calis?icerik=k255">Âyetel Kürsî</a>
          <span>·</span>
          <a href="/calis?icerik=k285">Âmenerrasûlü</a>
          <span>·</span>
          <a href="/calis?kategori=prayers&icerik=subhaneke">Sübhâneke</a>
          <span>·</span>
          <a href="/calis?kategori=all&icerik=all36">Yâsîn</a>
        </div>
      </main>
    </div>
  );
}
