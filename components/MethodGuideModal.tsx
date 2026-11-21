'use client';
import { useEffect, useState } from 'react';
import { X, Mic, Sparkles, Repeat, EyeOff, GitMerge, Puzzle, CalendarCheck, Volume2, ArrowRight, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export type GuideMethodKey = 'teacher' | 'masking' | 'coach' | 'reverse' | 'order' | 'srs';

type GuideSlide = {
  key: GuideMethodKey;
  badge: string;
  title: string;
  subtitle: string;
  steps: { num: string; title: string; desc: string }[];
  diagram: string[];
  idealFor: string;
  tryHref: string;
  tryLabel: string;
};

const GUIDE_SLIDES: GuideSlide[] = [
  {
    key: 'teacher',
    badge: 'YENİ · CANLI SESLİ KONTROL',
    title: '🎙️ Sanal Hafız Hocası (Ezber Dinletme)',
    subtitle: 'Tıpkı gerçek bir hafız hocasına ders verir gibi mikrofonu açıp ezberden okuyun; doğru okuduğunuz her kelime anında açılır.',
    diagram: ['🙈 Kelimeler Gizli', '🎙️ Sesli Oku', '✅ Doğrular Yeşil Açılır', '💡 Takılınca "Fetih Ver"'],
    steps: [
      {
        num: '1',
        title: 'Ezberden (Gizli) veya Yüzünden Takip Seçin',
        desc: 'Gizli modda tüm kelimeler kapalı başlar; siz okudukça Ahmed Hüsrev hattıyla kelime kelime ekranda belirir.',
      },
      {
        num: '2',
        title: 'Arapça Kıraat veya Türkçe Okunuş Algılama',
        desc: 'İster doğrudan Arapça tecvitli kıraatle, ister Türkçe okunuş telaffuzuyla ezberinizi test edebilirsiniz.',
      },
      {
        num: '3',
        title: '“Fetih Ver” İpucu & Hoca Karnesi',
        desc: 'Takıldığınız kelimede “💡 Fetih Ver” düğmesi sadece tek kelimeyi hatırlatır; ders sonunda doğruluk yüzdeniz karnenize işlenir.',
      },
    ],
    idealFor: 'Ezberini tamamladığını düşündüğün sure ve duaları namazda okumadan önce ipuçsuz test etmek için idealdir.',
    tryHref: '/calis?kategori=basics&icerik=s1&mod=teacher',
    tryLabel: 'Sanal Hoca ile Fâtiha Dene',
  },
  {
    key: 'masking',
    badge: 'TEMEL METOT · 5 AŞAMA',
    title: '🫁 Manalı Duraklar & Kademeli Gizleme',
    subtitle: 'Uzun ayet ve duaları nefes duraklarına (vakıf) bölerek lokma lokma ezberleyin ve 5 aşamada kelimeleri gizleyin.',
    diagram: ['1. Tam Açık', '2. İlk İki Kelime', '3. Baş & Son İpucu', '4. Sıralı Test', '5. Anlam Çapası'],
    steps: [
      {
        num: '1',
        title: '🫁 Duraklar & 🔤 Kelime Kelime Anlam',
        desc: 'Âyetel Kürsî gibi uzun metinler 9 anlamlı nefes durağına ayrılır. “Kelimeler” düğmesiyle her kelimenin anlamını görerek zihne kodlayın.',
      },
      {
        num: '2',
        title: '5 Kademeli Aktif Hatırlama (Active Recall)',
        desc: 'Metni önce açık okuyun, ardından sadece başlangıç/son kelimeleri bırakarak ortadaki boşluğu zihninizden tamamlayın.',
      },
      {
        num: '3',
        title: 'Tek Dokunuşla Kontrol',
        desc: 'Gizli satıra dokunduğunuzda metin anında açılır; tekrar dokunduğunuzda kapanır.',
      },
    ],
    idealFor: 'Âyetel Kürsî, Âmenerrasûlü, Kunut ve Ettehiyyâtü gibi uzun metinlere ilk kez başlarken en rahat yöntemdir.',
    tryHref: '/calis?kategori=basics&icerik=k255&mod=list',
    tryLabel: 'Âyetel Kürsî Duraklarını Aç',
  },
  {
    key: 'coach',
    badge: 'KLASİK OSMANLI USULÜ',
    title: '🕌 Hafız Koçu · 3+3 & Rabt (Birleştirme)',
    subtitle: 'Asırlık Osmanlı hafızlık disiplinini adım adım sayan akıllı koç: 3 kez yüzünden, 3 kez ezbere ve 2 kez birleştirme.',
    diagram: ['👁️ 3x Yüzünden Oku', '🙈 3x Ezbere Oku', '🔗 2x Öncekilerle Rabt'],
    steps: [
      {
        num: '1',
        title: '3 Kez Yüzünden (Bakarak Doğru Kodlama)',
        desc: 'Hatalı ezberi önlemek için ayeti Ahmed Hüsrev hattından bakarak 3 kez tane tane okuyup “+1 Okudum”a basın.',
      },
      {
        num: '2',
        title: '3 Kez Ezbere (Göz Hafızasından Çağırma)',
        desc: 'Koç metni otomatik gizler; aynı bölümü 3 kez hiç bakmadan ezberden okuyun.',
      },
      {
        num: '3',
        title: '2 Kez Rabt (Baştan İtibaren Zincirleme)',
        desc: 'Yeni geçilen her ayeti 1. ayetten itibaren öncekilerle birleştirerek 2 kez okutur; ayet aralarındaki kopukluğu sıfırlar.',
      },
    ],
    idealFor: 'Sıfırdan yeni bir sure ezberlerken ayet geçişlerinde hiç takılmamak isteyenler için altın standarttır.',
    tryHref: '/calis?kategori=basics&icerik=s112&mod=coach',
    tryLabel: 'Hafız Koçu (3+3) ile Başla',
  },
  {
    key: 'reverse',
    badge: 'AKICILIK TEKNİĞİ',
    title: '🔄 Sondan Başa Zincirleme',
    subtitle: 'Surenin son ayetinden başlayıp her adımda bir önceki ayeti ekleyerek daima bildiğiniz sağlam zemine doğru okuyun.',
    diagram: ['Son Bölüm (6)', '5 + 6 Birlikte', '4 + 5 + 6 Birlikte', '1 → 6 Akıcı'],
    steps: [
      {
        num: '1',
        title: 'Surenin Sonu En Sağlam Liman Olur',
        desc: 'Çoğu kişi surenin başını iyi bilir ama sonuna doğru yorulup takılır. Sondan başlamak bu sorunu tamamen çözer.',
      },
      {
        num: '2',
        title: 'Her Adımda Sadece 1 Yeni Halka',
        desc: '“Öncekini Ekle” dediğinizde yeni eklenen üst ayet açık, alttaki ezberlediğiniz ayetler ipuçlu görünür.',
      },
      {
        num: '3',
        title: 'Psikolojik Rahatlık & Akıcılık',
        desc: 'Okudukça daha çok tekrar ettiğiniz son ayetlere yaklaştığınız için özgüvenle hızlanırsınız.',
      },
    ],
    idealFor: 'Surenin ortasında veya sonlarına doğru sık sık karıştırdığınız sureleri akıcı hale getirmek için birebirdir.',
    tryHref: '/calis?kategori=basics&icerik=s114&mod=reverse',
    tryLabel: 'Sondan Başa Zinciri Dene',
  },
  {
    key: 'order',
    badge: 'GEÇİŞ & KÖPRÜ KONTROLÜ',
    title: '🧩 Sıralama & Köprü Testi',
    subtitle: '“Bu ayetten sonra hangisi geliyordu?” sorusunu çözen interaktif ayet ve durak sıralama sınavı.',
    diagram: ['1. Ayet Tamam ✓', '❓ Sıradaki Hangisi?', '3 Seçenekten Bul', 'Köprüyü Kur ✓'],
    steps: [
      {
        num: '1',
        title: 'Ayet Başlangıçlarını (Köprüleri) Test Edin',
        desc: 'Karışık verilen 3 seçenek arasından sıradaki doğru ayeti veya dua bölümünü seçerek metni baştan sona inşa edin.',
      },
      {
        num: '2',
        title: 'Otomatik Zorlanılan Durak İşaretleme',
        desc: 'Yanlış seçtiğiniz geçiş noktaları otomatik olarak “🎯 Zorlandıklarım” listenize eklenir.',
      },
      {
        num: '3',
        title: 'Anlam Zinciriyle Kalıcı Sıra',
        desc: 'Her durağın Türkçe anlam çapası sayesinde ayetlerin sırasını mantıksal akışıyla hatırlarsınız.',
      },
    ],
    idealFor: 'Mâûn, Kâfirûn, Felak-Nâs veya Salli-Bârik gibi birbirine benzeyen ayet geçişlerini pekiştirmek için harikadır.',
    tryHref: '/calis?kategori=basics&icerik=s107&mod=order',
    tryLabel: 'Köprü Testini Şimdi Dene',
  },
  {
    key: 'srs',
    badge: 'KALICI HAFIZA SİSTEMİ',
    title: '🎧 Döngülü Tilavet & SM-2 Aralıklı Tekrar',
    subtitle: 'Yavaşlatılmış tecvitli dinleme (0.75x), ayet döngüsü (3x/5x/∞) ve unutma eğrisini yenen bilimsel tekrar takvimi.',
    diagram: ['🎧 0.75x · 3x Döngü', '⭐ Sağlam İşaretle', '🌙 Ertesi Gün Sınama', '📅 Kalıcı Hafıza'],
    steps: [
      {
        num: '1',
        title: 'Tilavet Hızı (0.75x–1.25x) & Ayet Döngüsü (1x–∞)',
        desc: 'Mişârî el-Afâsî tilavetini 0.75x yavaş hızda ve 3x/5x tekrar döngüsünde açarak mahreçleri kulağınıza yerleştirin.',
      },
      {
        num: '2',
        title: 'Tekrar · Öğreniyorum · Sağlam Derecelendirmesi',
        desc: 'Her ayetin altındaki değerlendirme düğmesiyle SM-2 algoritması bir sonraki tekrar vaktinizi otomatik hesaplar.',
      },
      {
        num: '3',
        title: 'Ertesi Gün İpuçsuz Sağlamlık Sınaması',
        desc: '“Sağlam” dediğiniz ayetler ertesi gün ipuçsuz sınamaya girer; hatırlarsanız uzun vadeli hafızaya onaylanır.',
      },
    ],
    idealFor: 'Ezberlediğiniz sureleri haftalar ve aylar sonra bile ilk günkü sağlamlığıyla korumak için kullanılır.',
    tryHref: '/',
    tryLabel: 'Bugünkü Planıma Git',
  },
];

type Props = {
  open: boolean;
  initialMethod?: GuideMethodKey;
  isFirstLaunch?: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
};

export default function MethodGuideModal({
  open,
  initialMethod = 'teacher',
  isFirstLaunch = false,
  onClose,
  onNavigate,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [mushafFont, setMushafFont] = useState<'husrev' | 'amiri' | 'naskh'>(() => {
    try {
      const saved = localStorage.getItem('hifz:mushaf-font:v1');
      return saved === 'amiri' || saved === 'naskh' ? saved : 'husrev';
    } catch {
      return 'husrev';
    }
  });

  useEffect(() => {
    if (!open) return;
    const idx = GUIDE_SLIDES.findIndex((s) => s.key === initialMethod);
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [open, initialMethod]);

  const applyFont = (f: 'husrev' | 'amiri' | 'naskh') => {
    setMushafFont(f);
    document.documentElement.dataset.mushafFont = f;
    try {
      localStorage.setItem('hifz:mushaf-font:v1', f);
    } catch {}
  };

  if (!open) return null;

  const slide = GUIDE_SLIDES[activeIdx];

  const iconFor = (key: GuideMethodKey) => {
    switch (key) {
      case 'teacher':
        return <Mic size={16} />;
      case 'masking':
        return <EyeOff size={16} />;
      case 'coach':
        return <Repeat size={16} />;
      case 'reverse':
        return <GitMerge size={16} />;
      case 'order':
        return <Puzzle size={16} />;
      case 'srs':
        return <CalendarCheck size={16} />;
    }
  };

  return (
    <div className="guide-modal-backdrop" role="dialog" aria-modal="true" aria-label="Ezber Metotları Rehberi" onClick={onClose}>
      <div className="guide-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="guide-modal-topbar">
          <div className="guide-welcome-tag">
            <Sparkles size={15} />
            <span>{isFirstLaunch ? 'Hoş Geldin · Hızlı Başlangıç Rehberi' : 'Hıfz Metodoloji & Kullanım Rehberi'}</span>
          </div>
          <button type="button" className="guide-close-btn" onClick={onClose} aria-label="Rehberi kapat">
            <span>{isFirstLaunch ? 'Atla' : 'Kapat'}</span>
            <X size={17} />
          </button>
        </div>

        {/* Method Selector Pills */}
        <div className="guide-tabs" role="tablist" aria-label="Ezber metotları">
          {GUIDE_SLIDES.map((s, idx) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={idx === activeIdx}
              className={idx === activeIdx ? 'active' : ''}
              onClick={() => setActiveIdx(idx)}
            >
              {iconFor(s.key)}
              <span>
                {s.key === 'teacher'
                  ? 'Sanal Hoca'
                  : s.key === 'masking'
                  ? 'Duraklar'
                  : s.key === 'coach'
                  ? '3+3 Koç'
                  : s.key === 'reverse'
                  ? 'Ters Zincir'
                  : s.key === 'order'
                  ? 'Köprü Testi'
                  : 'Döngü & Plan'}
              </span>
            </button>
          ))}
        </div>

        {/* Active Method Slide */}
        <div className="guide-slide-body">
          <span className="guide-badge">{slide.badge}</span>
          <h2>{slide.title}</h2>
          <p className="guide-subtitle">{slide.subtitle}</p>

          {/* Visual Flow Diagram */}
          <div className="guide-flow-diagram" aria-label="Metot akış şeması">
            {slide.diagram.map((node, i) => (
              <div key={i} className="guide-flow-item">
                {i > 0 && <span className="guide-flow-arrow">→</span>}
                <span className="guide-flow-box">{node}</span>
              </div>
            ))}
          </div>

          {/* 3 Concrete Steps */}
          <div className="guide-steps-list">
            {slide.steps.map((st) => (
              <div key={st.num} className="guide-step-row">
                <span className="guide-step-num">{st.num}</span>
                <div>
                  <strong>{st.title}</strong>
                  <p>{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="guide-ideal-tip">
            <BookOpen size={16} />
            <span>
              <strong>Ne zaman kullanmalı?</strong> {slide.idealFor}
            </span>
          </div>

          {/* Mushaf Calligraphy Selector Preview */}
          <div className="guide-font-selector">
            <div className="guide-font-header">
              <Volume2 size={14} style={{ display: 'none' }} />
              <strong>🖋️ Kur&apos;an-ı Kerim Hat Tercihi</strong>
              <div className="guide-font-pills">
                {[
                  { id: 'husrev', label: 'Ahmed Hüsrev Hattı' },
                  { id: 'amiri', label: 'Klasik Amiri' },
                  { id: 'naskh', label: 'Medine Nesih' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={mushafFont === f.id ? 'active' : ''}
                    onClick={() => applyFont(f.id as 'husrev' | 'amiri' | 'naskh')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="guide-font-preview" dir="rtl" lang="ar">
              بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ ۝ اَلْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ
            </div>
          </div>
        </div>

        {/* Footer Navigation & Direct Try CTA */}
        <div className="guide-modal-footer">
          <div className="guide-nav-arrows">
            <button
              type="button"
              disabled={activeIdx === 0}
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              aria-label="Önceki metot"
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {activeIdx + 1} / {GUIDE_SLIDES.length}
            </span>
            <button
              type="button"
              disabled={activeIdx === GUIDE_SLIDES.length - 1}
              onClick={() => setActiveIdx((i) => Math.min(GUIDE_SLIDES.length - 1, i + 1))}
              aria-label="Sonraki metot"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            type="button"
            className="guide-try-cta"
            onClick={() => {
              onClose();
              onNavigate(slide.tryHref);
            }}
          >
            <span>{slide.tryLabel}</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
