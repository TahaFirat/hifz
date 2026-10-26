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
import { Calendar, BookOpenCheck, Sparkles, BarChart3, Bell, BellOff, Share2, ArrowRight, CheckCircle2 } from 'lucide-react';
import Home from '@/app/page';
import HifzWorkshop from '@/components/HifzWorkshop';
import useReviews from '@/components/useReviews';
import { basics, prayerCatalog } from '@/lib/hifz/catalog';
import {
  setupNative,
  triggerHaptic,
  scheduleNativeReminder,
  cancelNativeReminder,
  shareNativeText,
} from './native';

type TabRoute = 'home' | 'calis' | 'tecvit' | 'karne';

type LocState = {
  route: TabRoute;
  search: string;
};

const getLoc = (): LocState => {
  const path = window.location.pathname.replace(/\/+$/, '');
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('sekme');
  if (tab === 'tecvit') return { route: 'tecvit', search: window.location.search };
  if (tab === 'karne') return { route: 'karne', search: window.location.search };
  if (path.endsWith('/calis') || params.has('icerik') || params.has('kategori')) {
    return { route: 'calis', search: window.location.search };
  }
  return { route: 'home', search: window.location.search };
};

const TAJWEED_RULES = [
  {
    id: 'qalqalah',
    title: 'Kalkale (Kutbu Ced — ق ط ب ج د)',
    color: '#fbbf24',
    summary: 'ق ط ب ج د harfleri cezimli (sükûnlu) geldiğinde veya durak sonunda sesin hafifçe çarptırılarak yankılanmasıdır.',
    arabic: 'قُلْ هُوَ اللّٰهُ اَحَدٌ ۝ اللّٰهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ',
    highlightNote: 'İhlâs Suresi durak sonlarındaki د (Dâl) harfleri Kalkale-i Kübrâ ile okunur.',
    practiceHref: '/calis?kategori=basics&icerik=s112',
    practiceLabel: 'İhlâs Suresinde Çalış',
  },
  {
    id: 'ghunnah',
    title: 'Gunne & Şeddeli Nûn / Mîm (نّ / مّ)',
    color: '#34d399',
    summary: 'Şeddeli Nûn (نّ) ve Şeddeli Mîm (مّ) harflerinde ses genizden 1.5 elif miktarı tutularak akıtılır.',
    arabic: 'اِنَّآ اَعْطَيْنَاكَ الْكَوْثَرَ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    highlightNote: 'اِنَّا ve النَّاسِ kelimelerindeki şeddeli نّ harfleri tam gunne ile tutulur.',
    practiceHref: '/calis?kategori=basics&icerik=s108',
    practiceLabel: 'Kevser Suresinde Çalış',
  },
  {
    id: 'madd',
    title: 'Medd-i Muttasıl & Munfasıl (آ / ٓ )',
    color: '#38bdf8',
    summary: 'Harf-i medden sonra hemze geldiğinde ses 4 elif miktarı uzatılarak kıraat dengesi korunur.',
    arabic: 'اِذَا جَآءَ نَصْرُ اللّٰهِ وَالْفَتْحُ ۝ لَآ اَعْبُدُ مَا تَعْبُدُونَ',
    highlightNote: 'جَآءَ (Muttasıl) ve لَآ اَعْبُدُ (Munfasıl) uzatmaları nefes durağı ritmini belirler.',
    practiceHref: '/calis?kategori=basics&icerik=s110',
    practiceLabel: 'Nasr Suresinde Çalış',
  },
  {
    id: 'idgham',
    title: 'İdğam & İhfâ Geçişleri (Tenvin / Sâkin Nûn)',
    color: '#a78bfa',
    summary: 'Sâkin Nûn veya tenvinden sonra gelen harfe göre sesin gunneli/gunnesiz kaynaştırılması veya gizlenmesidir.',
    arabic: 'وَيْلٌ لِكُلِّ هُمَزَةٍ لُمَزَةٍ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
    highlightNote: 'هُمَزَةٍ لُمَزَةٍ (İdğam-ı Bilâ Gunne) ve مِنْ شَرِّ (İhfâ) geçişlerine dikkat edilir.',
    practiceHref: '/calis?kategori=basics&icerik=s104',
    practiceLabel: 'Hümeze Suresinde Çalış',
  },
];

function TajweedStudio({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [selectedRule, setSelectedRule] = useState(TAJWEED_RULES[0].id);
  const [customArabic, setCustomArabic] = useState('قُلْ اَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ');

  const countMatches = (text: string, chars: string[]) =>
    chars.reduce((acc, ch) => acc + (text.split(ch).length - 1), 0);

  const qalqalahHits = countMatches(customArabic, ['ق', 'ط', 'ب', 'ج', 'د']);
  const ghunnahHits = countMatches(customArabic, ['نّ', 'مّ', 'ً', 'ٍ', 'ٌ']);
  const maddHits = countMatches(customArabic, ['آ', 'ٰ', 'ٓ']);

  return (
    <div className="ios-studio-page">
      <section className="ios-hero-banner">
        <span className="ios-hero-badge">
          <Sparkles size={13} /> Hıfz Tecvit &amp; Mahreç Laboratuvarı
        </span>
        <h1>Renkli Tecvit Rehberi &amp; Ayet Analizi</h1>
        <p>
          Ezber yaparken kelimeleri doğru mahreç ve uzatmalarla yerleştirmek, yanlış ezberi sonradan düzeltmekten çok daha kolaydır. Aşağıdaki kuralları inceleyip doğrudan ilgili surede 3+3 Rabt koçuyla uygulayabilirsin.
        </p>
      </section>

      <section className="ios-card">
        <h2>
          <span>Canlı Ayet Harf &amp; Tecvit Çözümleyici</span>
        </h2>
        <input
          value={customArabic}
          onChange={(e) => setCustomArabic(e.target.value)}
          dir="rtl"
          lang="ar"
          aria-label="Tecvit analizi için Arapça ayet metni"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--tile)',
            color: 'var(--text)',
            fontFamily: "'Noto Naskh Arabic', Amiri, serif",
            fontSize: '26px',
            textAlign: 'right',
          }}
        />
        <div className="ios-stat-grid">
          <div className="ios-stat-card">
            <strong style={{ color: '#fbbf24' }}>{qalqalahHits}</strong>
            <span>Kalkale Harfi (ق ط ب ج د)</span>
          </div>
          <div className="ios-stat-card">
            <strong style={{ color: '#34d399' }}>{ghunnahHits}</strong>
            <span>Gunne / Tenvin İzi</span>
          </div>
          <div className="ios-stat-card">
            <strong style={{ color: '#38bdf8' }}>{maddHits}</strong>
            <span>Med / Uzatma İşareti</span>
          </div>
        </div>
      </section>

      <div className="tajweed-rule-grid">
        {TAJWEED_RULES.map((rule) => (
          <article
            key={rule.id}
            className="tajweed-rule-card"
            style={{ borderLeftColor: rule.color }}
            onClick={() => {
              triggerHaptic('selection');
              setSelectedRule(rule.id);
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong style={{ color: rule.color, fontSize: 15 }}>{rule.title}</strong>
              {selectedRule === rule.id && <CheckCircle2 size={17} color={rule.color} />}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{rule.summary}</p>
            <div className="tajweed-arabic-sample">{rule.arabic}</div>
            <small style={{ color: 'var(--text)', opacity: 0.85, fontSize: 12 }}>💡 {rule.highlightNote}</small>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="ios-secondary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onNavigate(rule.practiceHref);
                }}
              >
                <span>{rule.practiceLabel}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MasteryDashboard({ onNavigate }: { onNavigate: (href: string) => void }) {
  const { records } = useReviews();
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    try {
      return localStorage.getItem('hifz:ios-reminder:v1') === '1';
    } catch {
      return false;
    }
  });
  const [reminderHour, setReminderHour] = useState(() => {
    try {
      return Number(localStorage.getItem('hifz:ios-reminder-hour:v1') || '20');
    } catch {
      return 20;
    }
  });

  const allRecords = Object.values(records);
  const solidCount = allRecords.filter((r) => r.rating === 'solid').length;
  const learningCount = allRecords.filter((r) => r.rating === 'learning').length;
  const againCount = allRecords.filter((r) => r.rating === 'again').length;
  const dueNow = allRecords.filter((r) => r.due <= Date.now()).length;

  let hardUnitsCount = 0;
  try {
    const raw = JSON.parse(localStorage.getItem('hifz:difficult-units:v1') || '{}');
    hardUnitsCount = Object.keys(raw).filter((k) => raw[k] === true).length;
  } catch {}

  const toggleReminder = () => {
    const next = !reminderEnabled;
    setReminderEnabled(next);
    try {
      localStorage.setItem('hifz:ios-reminder:v1', next ? '1' : '0');
      localStorage.setItem('hifz:ios-reminder-hour:v1', String(reminderHour));
    } catch {}
    if (next) {
      triggerHaptic('success');
      scheduleNativeReminder(reminderHour, 30, dueNow);
    } else {
      triggerHaptic('light');
      cancelNativeReminder();
    }
  };

  const handleShare = () => {
    triggerHaptic('medium');
    const summary = `🕌 Hıfz Ezber Karnem:\n• Sağlam Ezberlenen: ${solidCount} ayet/dua\n• Öğrenilen: ${learningCount} ayet/dua\n• Toplam Çalışılan: ${allRecords.length} kayıt\nOsmanlı 3+3 & Rabt metoduyla Hıfz'da çalışıyorum.`;
    shareNativeText(summary);
  };

  return (
    <div className="ios-studio-page">
      <section className="ios-hero-banner">
        <span className="ios-hero-badge">
          <BarChart3 size={13} /> Kişisel Ezber Karnesi &amp; Hatırlatıcı
        </span>
        <h1>Ezber İlerleme Raporum</h1>
        <p>
          Aralıklı tekrar (Spaced Repetition) algoritmasıyla işaretlediğin tüm sure, aşır ve namaz dualarının sağlamlık dağılımı.
        </p>
      </section>

      <div className="ios-stat-grid">
        <div className="ios-stat-card">
          <strong>{solidCount}</strong>
          <span>Sağlam Ezber</span>
        </div>
        <div className="ios-stat-card">
          <strong style={{ color: '#f59e0b' }}>{learningCount + againCount}</strong>
          <span>Aktif Çalışılan</span>
        </div>
        <div className="ios-stat-card">
          <strong style={{ color: '#38bdf8' }}>{hardUnitsCount}</strong>
          <span>Zorlanılan Durak</span>
        </div>
      </div>

      <section className="ios-card">
        <h2>
          <span>🔔 Günlük iOS Ezber Hatırlatıcısı</span>
          <span style={{ fontSize: 12, color: reminderEnabled ? 'var(--gold)' : 'var(--muted)' }}>
            {reminderEnabled ? `Aktif · Her gün ${String(reminderHour).padStart(2, '0')}:30` : 'Kapalı'}
          </span>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
          Her gün belirlediğin saatte tekrar zamanı gelen ayet ve dualar için iOS yerel bildirimi gönderilir.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            aria-label="Bildirim saati"
            value={reminderHour}
            onChange={(e) => {
              const h = Number(e.target.value);
              setReminderHour(h);
              try {
                localStorage.setItem('hifz:ios-reminder-hour:v1', String(h));
              } catch {}
              if (reminderEnabled) scheduleNativeReminder(h, 30, dueNow);
            }}
            style={{
              minHeight: 44,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--tile)',
              color: 'var(--text)',
            }}
          >
            {[6, 7, 8, 12, 17, 19, 20, 21, 22].map((h) => (
              <option key={h} value={h}>
                Her gün {String(h).padStart(2, '0')}:30
              </option>
            ))}
          </select>
          <button type="button" className="ios-action-btn" onClick={toggleReminder}>
            {reminderEnabled ? <BellOff size={17} /> : <Bell size={17} />}
            <span>{reminderEnabled ? 'Bildirimi Kapat' : 'Günlük Bildirimi Aç'}</span>
          </button>
          <button type="button" className="ios-secondary-btn" onClick={handleShare}>
            <Share2 size={16} />
            <span>Karnemi Paylaş</span>
          </button>
        </div>
      </section>

      <section className="ios-card">
        <h2>
          <span>Namaz Duaları &amp; Temel Sureler Matrisi</span>
          <small style={{ color: 'var(--muted)', fontWeight: 500 }}>{prayerCatalog.length + basics.length} Seçki</small>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {[...prayerCatalog.slice(0, 8), ...basics.slice(0, 10)].map((item) => {
            const prefix = item.kind === 'prayer' ? `prayer:${item.key}:` : `quran:${item.chapter}:`;
            const itemRecords = allRecords.filter((r) => r.id.startsWith(prefix));
            const solid = itemRecords.filter((r) => r.rating === 'solid').length;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  onNavigate(`/calis?kategori=${item.kind === 'prayer' ? 'prayers' : 'basics'}&icerik=${item.key}`)
                }
                style={{
                  background: 'var(--tile)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>{item.name}</strong>
                <span style={{ fontSize: 11, color: solid > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                  {solid > 0 ? `✓ ${solid} ayet sağlam` : itemRecords.length > 0 ? `${itemRecords.length} ayet çalışıldı` : 'Başla →'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [loc, setLoc] = useState<LocState>(getLoc);

  const navigateTo = (href: string) => {
    const url = new URL(href, window.location.origin);
    const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
    const nextUrl = cleanPath + url.search + url.hash;
    if (window.location.pathname + window.location.search + window.location.hash !== nextUrl) {
      window.history.pushState(null, '', nextUrl);
    }
    setLoc(getLoc());
    window.scrollTo(0, 0);
  };

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
        navigateTo(cleanPath + url.search + url.hash);
      } catch {
        // Ignore malformed hrefs
      }
    };
    const onQuickAction = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string }>).detail;
      if (!detail?.type) return;
      if (detail.type.endsWith('.daily')) navigateTo('/calis?kategori=basics&icerik=s1&gunluk=1');
      else if (detail.type.endsWith('.coach')) navigateTo('/calis?kategori=basics&icerik=s1');
      else if (detail.type.endsWith('.challenge')) navigateTo('/calis?kategori=basics&icerik=s1&sina=1');
    };
    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    window.addEventListener('hifz:quick-action', onQuickAction);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
      window.removeEventListener('hifz:quick-action', onQuickAction);
    };
  }, []);

  const renderContent = () => {
    if (loc.route === 'tecvit') {
      return <TajweedStudio key="tecvit" onNavigate={navigateTo} />;
    }
    if (loc.route === 'karne') {
      return <MasteryDashboard key="karne" onNavigate={navigateTo} />;
    }
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
  };

  return (
    <>
      {renderContent()}
      <nav className="ios-tabbar" aria-label="Hıfz Ana Sekmeler">
        <button
          type="button"
          className={loc.route === 'home' ? 'active' : ''}
          aria-pressed={loc.route === 'home'}
          onClick={() => navigateTo('/')}
        >
          <Calendar size={20} />
          <span>Bugün Planım</span>
        </button>
        <button
          type="button"
          className={loc.route === 'calis' ? 'active' : ''}
          aria-pressed={loc.route === 'calis'}
          onClick={() => navigateTo('/calis?kategori=basics&icerik=s1')}
        >
          <BookOpenCheck size={20} />
          <span>Ezber Atölyesi</span>
        </button>
        <button
          type="button"
          className={loc.route === 'tecvit' ? 'active' : ''}
          aria-pressed={loc.route === 'tecvit'}
          onClick={() => navigateTo('/?sekme=tecvit')}
        >
          <Sparkles size={20} />
          <span>Tecvit &amp; Mahreç</span>
        </button>
        <button
          type="button"
          className={loc.route === 'karne' ? 'active' : ''}
          aria-pressed={loc.route === 'karne'}
          onClick={() => navigateTo('/?sekme=karne')}
        >
          <BarChart3 size={20} />
          <span>Ezber Karnem</span>
        </button>
      </nav>
    </>
  );
}

setupNative();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
