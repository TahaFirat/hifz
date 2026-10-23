'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Moon, HandHeart, Search, Eye, EyeOff, Volume2, Repeat2, RotateCcw, Lightbulb, Link2, List, LockKeyhole, Unlock, Check, WifiOff, Pause, X, Settings2, Sparkles, LayoutGrid, AlignRight, ArrowRight } from 'lucide-react';
import { allChapters, basics, chapters, prayerCatalog } from '@/lib/hifz/catalog';
import { prayers } from '@/lib/hifz/prayers';
import offlineData from '@/lib/hifz/offline.json';
import { effectiveLevel, hiddenAt, validRange } from '@/lib/hifz/core';
import type { Content, Lesson, Target, Verse } from '@/lib/hifz/types';
const offline = offlineData as Record<string, Lesson>;
const levels = [{ name: 'Tam açık', ratio: '%0', caption: 'Oku & dinle', icon: Unlock }, { name: 'Isınma', ratio: '%25', caption: 'Son kelimeler', icon: Moon }, { name: 'Yarı yarıya', ratio: '%50', caption: 'Bir açık, bir gizli', icon: LayoutGrid }, { name: 'İlk kelime', ratio: 'İpucu', caption: 'Devamını hatırla', icon: Lightbulb }, { name: 'Kendini test et', ratio: '%100', caption: 'Tamamı gizli', icon: LockKeyhole }];
const read = (key: string) => { try {
    return localStorage.getItem(key);
}
catch {
    return null;
} };
const save = (key: string, value: unknown) => { try {
    localStorage.setItem(key, JSON.stringify(value));
}
catch { } };
const wordKey = (v: number, w: number | string) => `${v}:${w}`;
const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export default function Home() {
    const [category, setCategory] = useState('basics'), [selected, setSelected] = useState<Content>(basics[0]), [query, setQuery] = useState('');
    const [level, setLevel] = useState(0), [target, setTarget] = useState<Target>('both'), [chain, setChain] = useState(false), [step, setStep] = useState(1);
    const [showReading, setShowReading] = useState(true), [showMeaning, setShowMeaning] = useState(true), [font, setFont] = useState(0), [classic, setClassic] = useState(false);
    const [reveals, setReveals] = useState<Record<string, boolean>>({}), [range, setRange] = useState<[
        number,
        number
    ]>([1, 7]), [custom, setCustom] = useState(false), [draft, setDraft] = useState(['1', '5']);
    const [lesson, setLesson] = useState<Lesson>(offline['1']), [loading, setLoading] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const [settings, setSettings] = useState(false), [gemini, setGemini] = useState(false), [enriching, setEnriching] = useState(false), [online, setOnline] = useState(true), [repeats, setRepeats] = useState(3);
    const [remembered, setRemembered] = useState<Record<string, boolean>>({}), [playing, setPlaying] = useState<{
        verse: number;
        remaining: number;
        total: number;
    } | null>(null);
    const audio = useRef<HTMLAudioElement | null>(null), generation = useRef(0), aiAbort = useRef<AbortController | null>(null), speechGeneration = useRef(0);
    const stop = useCallback(() => { speechGeneration.current++; if (audio.current) {
        audio.current.pause();
        audio.current.onended = null;
        audio.current.onerror = null;
        audio.current = null;
    } if (typeof speechSynthesis !== 'undefined')
        speechSynthesis.cancel(); setPlaying(null); }, []);
    useEffect(() => { setOnline(navigator.onLine); const update = () => setOnline(navigator.onLine); window.addEventListener('online', update); window.addEventListener('offline', update); try {
        const p = JSON.parse(read('hifz:progress:v1') || '{}');
        if (p && typeof p === 'object' && !Array.isArray(p))
            setRemembered(p);
    }
    catch { } fetch('/api/enrich').then(r => r.json()).then(d => setGemini((d as {
        available?: boolean;
    }).available === true)).catch(() => { }); if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => { reg.active?.postMessage({ type: 'CACHE_ASSETS', urls: performance.getEntriesByType('resource').map(r => r.name).filter(url => new URL(url).origin === location.origin && /\.(js|css|ttf|svg)(\?|$)/.test(url)) }); }).catch(() => { });
    } return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); stop(); }; }, [stop]);
    useEffect(() => { if (!notice)
        return; const t = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(t); }, [notice]);
    useEffect(() => {
        stop();
        setReveals({});
        setStep(1);
        setError('');
        setLesson({ verses: [], source: '' });
        setLoading(true);
        setEnriching(false);
        aiAbort.current?.abort();
        const g = ++generation.current, controller = new AbortController(), cacheKey = `hifz:lesson:v2:${selected.chapter}:${range[0]}:${range[1]}`;
        const apply = (l: Lesson) => { if (g === generation.current) {
            setLesson(l);
            setLoading(false);
        } };
        if (prayers[selected.key]) {
            apply(prayers[selected.key]);
            return;
        }
        try {
            const cached = JSON.parse(read(cacheKey) || 'null');
            if (cached?.source?.includes('Gemini') && cached?.verses?.length === range[1] - range[0] + 1) {
                apply(cached);
                return;
            }
        }
        catch { }
        const embedded = offline[selected.chapter]?.verses.filter(v => v.number >= range[0] && v.number <= range[1]);
        if (embedded?.length === range[1] - range[0] + 1) {
            apply({ ...offline[selected.chapter], verses: embedded });
            return;
        }
        try {
            const cached = JSON.parse(read(cacheKey) || 'null');
            if (cached?.verses?.length === range[1] - range[0] + 1) {
                apply(cached);
                return;
            }
        }
        catch { }
        fetch(`/api/lesson?chapter=${selected.chapter}&start=${range[0]}&end=${range[1]}`, { signal: controller.signal }).then(async (r) => { const d = await r.json() as Lesson & {
            error?: string;
        }; if (!r.ok)
            throw Error(d.error || 'İçerik yüklenemedi.'); save(cacheKey, d); apply(d); }).catch(e => { if (!controller.signal.aborted && g === generation.current) {
            setLoading(false);
            setError(e.message);
        } });
        return () => controller.abort();
    }, [selected, range, stop]);
    const catalog = category === 'basics' ? basics : category === 'prayers' ? prayerCatalog : allChapters;
    const filtered = catalog.filter(c => norm(c.name).includes(norm(query)) || (query.trim() !== '' && String(c.chapter) === query.trim()));
    const chapter = chapters.find(c => c.id === selected.chapter), visible = chain ? lesson.verses.slice(0, step) : lesson.verses;
    const hidden = (v: Verse, vi: number, wi: number | string) => { const id = wordKey(v.number, wi); if (reveals[id] !== undefined)
        return !reveals[id]; const l = effectiveLevel(level, chain, vi, step); return typeof wi === 'number' ? hiddenAt(l, wi, v.words.length) : l > 0; };
    const toggle = (id: string, h: boolean) => setReveals(prev => ({ ...prev, [id]: h }));
    const select = (c: Content) => { stop(); setSelected(c); setRange([c.start, c.end - c.start > 19 ? c.start + 4 : c.end]); setQuery(''); setCustom(false); };
    const changeCategory = (c: string) => { setCategory(c); select((c === 'basics' ? basics : c === 'prayers' ? prayerCatalog : allChapters)[0]); };
    const progressKey = (n: number) => `${selected.kind === 'prayer' ? selected.key : selected.chapter}:${n}`;
    const done = lesson.verses.filter(v => remembered[progressKey(v.number)]).length, totalWords = visible.reduce((n, v) => n + v.words.length, 0), opened = visible.reduce((n, v, vi) => n + v.words.filter((_, wi) => !hidden(v, vi, wi)).length, 0);
    const revealVerse = (v: Verse, open: boolean) => setReveals(prev => { const next = { ...prev }; v.words.forEach((_, wi) => next[wordKey(v.number, wi)] = open); next[wordKey(v.number, 'reading')] = open; next[wordKey(v.number, 'meaning')] = open; return next; });
    const hint = () => { for (const [vi, v] of visible.entries())
        for (let wi = 0; wi < v.words.length; wi++)
            if (hidden(v, vi, wi)) {
                toggle(wordKey(v.number, wi), true);
                return;
            } setNotice('Görünür ayetlerdeki bütün kelimeler açık.'); };
    useEffect(() => { const handler = (e: KeyboardEvent) => { const el = e.target as HTMLElement; if (e.code === 'Space' && !e.repeat && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) && !el.isContentEditable && !settings) {
        e.preventDefault();
        hint();
    } if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !settings) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('.search input')?.focus();
    } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
    const mark = (v: Verse) => { setRemembered(prev => { const next = { ...prev, [progressKey(v.number)]: !prev[progressKey(v.number)] }; save('hifz:progress:v1', next); return next; }); };
    const play = (v: Verse, times = 1) => {
        if (playing?.verse === v.number && playing.total === times) {
            stop();
            return;
        }
        stop();
        if (!v.audio) {
            if (!('speechSynthesis' in window)) {
                setNotice('Bu cihazda Arapça ses desteği yok.');
                return;
            }
            const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'));
            if (!voice) {
                setNotice('Dua seslendirmesi için cihazınıza Arapça konuşma sesi yükleyin.');
                return;
            }
            let left = times;
            const sg = speechGeneration.current;
            setPlaying({ verse: v.number, remaining: left, total: times });
            const speak = () => { const u = new SpeechSynthesisUtterance(v.arabic); u.voice = voice; u.rate = .8; u.onend = () => { if (sg !== speechGeneration.current)
                return; left--; if (left) {
                setPlaying({ verse: v.number, remaining: left, total: times });
                speak();
            }
            else
                setPlaying(null); }; u.onerror = () => { if (sg === speechGeneration.current) {
                stop();
                setNotice('Cihaz seslendirmesi başlatılamadı.');
            } }; speechSynthesis.speak(u); };
            speak();
            return;
        }
        const a = new Audio(v.audio);
        audio.current = a;
        let left = times;
        setPlaying({ verse: v.number, remaining: left, total: times });
        const failed = () => { if (audio.current === a) {
            stop();
            setNotice('Ses yüklenemedi. İnternet bağlantınızı kontrol edin.');
        } };
        a.onerror = failed;
        a.onended = () => { if (audio.current !== a)
            return; left--; if (left) {
            setPlaying({ verse: v.number, remaining: left, total: times });
            a.currentTime = 0;
            void a.play().catch(failed);
        }
        else
            stop(); };
        void a.play().catch(failed);
    };
    const enrich = async () => { const controller = new AbortController(); aiAbort.current = controller; const g = generation.current; setEnriching(true); try {
        const r = await fetch('/api/enrich', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chapter: selected.chapter, start: range[0], end: range[1] }) });
        const d = await r.json() as Lesson & {
            error?: string;
        };
        if (!r.ok)
            throw Error(d.error);
        if (g !== generation.current)
            return;
        setLesson(d);
        save(`hifz:lesson:v2:${selected.chapter}:${range[0]}:${range[1]}`, d);
        setNotice('Yapay zekâ eşleştirmesi eklendi. Kaynak metinle kontrol edin.');
    }
    catch (e) {
        if (!controller.signal.aborted)
            setNotice(e instanceof Error ? e.message : 'Zenginleştirme başarısız.');
    }
    finally {
        if (g === generation.current)
            setEnriching(false);
    } };
    return <div className={`app font-size-${font}`}>
  <header className="topbar"><a className="brand" href="/" aria-label="Hıfz ana sayfa"><span className="brand-symbol">۞</span><span>hıfz<span className="gold">.</span></span><span className="brand-sub">SURE & DUA<br />EZBER ATÖLYESİ</span></a>
   <nav className="category-nav" aria-label="İçerik kategorisi"><button className={category === 'basics' ? 'active' : ''} onClick={() => changeCategory('basics')}><Moon size={17}/>Namaz Sureleri <span>26</span></button><button className={category === 'prayers' ? 'active' : ''} onClick={() => changeCategory('prayers')}><HandHeart size={18}/>Namaz Duaları <span>8</span></button><button className={category === 'all' ? 'active' : ''} onClick={() => changeCategory('all')}><BookOpen size={17}/>Tüm Sureler <span>114</span></button></nav>
   <div className="header-tools"><div className="font-control">{['A−', 'A+', 'A++'].map((f, i) => <button key={f} aria-label={`Yazı boyutu ${i + 1}`} aria-pressed={font === i} className={font === i ? 'selected' : ''} onClick={() => setFont(i)}>{f}</button>)}</div><button className="icon-button" aria-label="Atölye ayarları" onClick={() => setSettings(true)}><Settings2 size={20}/></button></div>
  </header>
  <main className="workspace">
   <section className="library" aria-label="İçerik seçimi"><div className="library-row"><div className="section-label"><BookOpen size={18}/>{category === 'prayers' ? 'Dua seçimi' : 'Sure seçimi'}<span className="divider"/><span className="library-total">{catalog.length} içerik</span></div><label className="search"><Search size={18}/><input aria-label="Sure adı veya numarası ara" value={query} onChange={e => setQuery(e.target.value)} placeholder={category === 'prayers' ? 'Dua adı ara…' : 'Sure adı veya numarası ara…'}/><kbd>/</kbd></label></div>
    <div className={`chips ${category === 'all' || query ? 'expanded' : ''}`} aria-label="Sureler ve dualar">{filtered.map(c => <button key={c.key} className={`surah-chip ${selected.key === c.key ? 'chosen' : ''}`} onClick={() => select(c)}>{selected.key === c.key && <span className="chip-dot"/>}{c.name}<span>{c.kind === 'prayer' ? 'dua' : c.end - c.start + 1}</span></button>)}{!filtered.length && <p className="empty-search">Eşleşen içerik bulunamadı.</p>}</div>
    {selected.end - selected.start > 19 && <div className="range-row"><span>Ayet aralığı</span>{Array.from({ length: Math.ceil((selected.end - selected.start + 1) / 5) }, (_, i) => { const s = selected.start + i * 5, e = Math.min(s + 4, selected.end); return <button key={s} className={range[0] === s && range[1] === e ? 'range-active' : ''} onClick={() => setRange([s, e])}>{s}–{e}</button>; })}<button onClick={() => setRange([selected.end - 2, selected.end])}>Son 3 ayet</button><button onClick={() => { setCustom(!custom); setDraft(range.map(String)); }}>Özel aralık</button></div>}
    {custom && <form className="custom-form" onSubmit={e => { e.preventDefault(); const s = Number(draft[0]), n = Number(draft[1]); if (!validRange(s, n, selected.end) || s < selected.start || n - s >= 20) {
        setNotice('İçerik sınırları içinde en fazla 20 ayet seçin.');
        return;
    } setRange([s, n]); setCustom(false); }}><label>İlk ayet<input type="number" min={selected.start} max={selected.end} value={draft[0]} onChange={e => setDraft([e.target.value, draft[1]])}/></label><label>Son ayet<input type="number" min={selected.start} max={selected.end} value={draft[1]} onChange={e => setDraft([draft[0], e.target.value])}/></label><button className="primary">Uygula</button></form>}
   </section>
   <section className="memory-panel" aria-label="Ezber seviyesi"><div className="panel-heading"><h2><span className="tiny-star">✧</span>Ezber seviyesi</h2><span className="panel-help">Gizli kelimelere dokunarak açabilirsiniz</span><span className="level-counter">SEVİYE <b>0{level}</b> / 04</span></div><div className="levels">{levels.map((l, i) => <button key={l.name} aria-pressed={level === i} className={`level ${level === i ? 'current' : ''}`} onClick={() => { setLevel(i); setReveals({}); setChain(false); }}><div className="level-top"><l.icon size={19}/><span>{l.ratio}</span>{level === i && <Check className="level-check" size={14}/>}</div><strong>{l.name}</strong><small>{l.caption}</small></button>)}</div><div className="target-row"><span><EyeOff size={15}/>Neyi gizleyelim?</span><div className="target-options">{([{ id: 'both', label: 'Arapça + Okunuş' }, { id: 'reading', label: 'Sadece Okunuş' }, { id: 'meaning', label: 'Kelime Anlamı' }] as const).map(t => <button key={t.id} aria-pressed={target === t.id} className={target === t.id ? 'selected' : ''} onClick={() => { setTarget(t.id); setReveals({}); }}>{target === t.id && <Check size={13}/>} {t.label}</button>)}</div></div></section>
   <div className="view-row"><div className="view-tabs"><button className={!chain ? 'active' : ''} aria-pressed={!chain} onClick={() => { setChain(false); setReveals({}); }}><List size={17}/>Tüm ayetler</button><button className={chain ? 'active' : ''} aria-pressed={chain} onClick={() => { setChain(true); setStep(1); setReveals({}); stop(); }}><Link2 size={17}/>Zincirleme ezber<span className="new-badge">ADIM ADIM</span></button></div><div className="view-toggles"><button aria-pressed={showReading} onClick={() => setShowReading(!showReading)}><span className={`toggle ${showReading ? 'on' : ''}`}/>Okunuş</button><button aria-pressed={showMeaning} onClick={() => setShowMeaning(!showMeaning)}><span className={`toggle ${showMeaning ? 'on' : ''}`}/>Meal</button><span className="divider"/><button className="icon-button" aria-label={classic ? 'Kelime kartlarına geç' : 'Tam ayet görünümüne geç'} onClick={() => setClassic(!classic)}>{classic ? <LayoutGrid size={18}/> : <AlignRight size={18}/>}</button></div></div>
   <section className="lesson-heading"><div className="lesson-identity"><div className="chapter-emblem">{selected.kind === 'prayer' ? <HandHeart size={26}/> : <span>{selected.chapter}</span>}</div><div><div className="eyebrow">{selected.kind === 'prayer' ? 'NAMAZ DUASI' : `${chapter?.revelation.toLocaleUpperCase('tr')} SURE`}</div><h1>{selected.name}{selected.kind === 'surah' && <span>{selected.start === 1 ? 'Suresi' : '· ' + selected.start + '–' + selected.end}</span>}</h1><p>{selected.kind === 'prayer' ? 'Anlam bütünlüğüne göre kelime grupları' : `${selected.end - selected.start + 1} ayet${range[1] - range[0] + 1 < selected.end - selected.start + 1 ? ' · ' + range[0] + '–' + range[1] + '. ayetler' : ''} · Mişârî Râşid el-Afâsî`}</p></div></div><div className="lesson-right">{selected.kind === 'surah' && <div className="arabic-title" lang="ar" dir="rtl">{chapter?.arabicName.replace('سُورَةُ', '').replace('سورة', '')}</div>}<div className="availability">{!online ? <><WifiOff size={13}/>Çevrimdışı</> : prayers[selected.key] || offline[selected.chapter]?.verses.filter(v => v.number >= range[0] && v.number <= range[1]).length === range[1] - range[0] + 1 ? <><span className="status-dot"/>Çevrimdışı hazır</> : <><span className="status-dot"/>Canlı veri / önbellek</>}</div></div></section>
   {chain && <div className="chain-banner"><Link2 size={19}/><strong>Adım {step} / {lesson.verses.length}</strong><span>{step === 1 ? 'İlk ayeti oku, dinle ve hatırla.' : 'Önceki ayetler %50 gizli. Yeni ayeti onlara bağla.'}</span></div>}
   {loading && <div className="loading" role="status"><span className="spinner"/>Ayetler ve kelime anlamları yükleniyor…</div>}{error && <div className="error-panel" role="alert"><WifiOff /><p>{error}</p><button onClick={() => setRange([...range])}>Yeniden dene</button></div>}
   <div className="verse-list">{visible.map((v, vi) => {
            const openCount = v.words.filter((_, wi) => !hidden(v, vi, wi)).length, isPlaying = playing?.verse === v.number;
            return <article className={`verse-card ${isPlaying ? 'is-playing' : ''}`} key={`${selected.key}:${v.number}`}><div className="verse-header"><div className="verse-actions"><span className="verse-number"><span>{String(v.number).padStart(2, '0')}</span>{selected.kind === 'prayer' ? 'Dua' : 'Ayet'}</span><span className="divider"/><button className={isPlaying && playing.total === 1 ? 'audio-active' : ''} onClick={() => play(v)}>{isPlaying && playing.total === 1 ? <Pause size={16}/> : <Volume2 size={16}/>}<span>{isPlaying && playing.total === 1 ? 'Durdur' : 'Dinle'}</span></button><button className={isPlaying && playing.total > 1 ? 'audio-active' : ''} onClick={() => play(v, repeats)}><Repeat2 size={16}/>{isPlaying && playing.total > 1 ? `${playing.total - playing.remaining + 1}/${playing.total}` : `${repeats}×`} <span>Döngü</span></button><button className="eye-control" aria-label={`${v.number}. ayeti ${openCount === v.words.length ? 'gizle' : 'tam aç'}`} onClick={() => revealVerse(v, openCount !== v.words.length)}>{openCount === v.words.length ? <Eye size={17}/> : <EyeOff size={17}/>}</button></div><div className="word-progress"><span className={`progress-dot ${openCount === v.words.length ? 'complete' : ''}`}/><b>{openCount}</b> / {v.words.length}<span>kelime açık</span></div></div>
    {classic ? <button className="classic-arabic" dir="rtl" lang="ar" onClick={() => revealVerse(v, openCount !== v.words.length)} aria-label="Ayeti aç veya gizle"><span className={target === 'both' && openCount !== v.words.length ? 'blurred' : ''}>{v.arabic}</span><span className="ayah-sign">﴿{v.number.toLocaleString('ar')}﴾</span></button> : <div className="word-grid" dir="rtl">{v.words.map((w, wi) => { const h = hidden(v, vi, wi), ah = h && target === 'both', rh = h && (target === 'both' || target === 'reading'), mh = h && target === 'meaning'; return <button key={wi} className={`word-tile ${h ? 'concealed' : ''} ${reveals[wordKey(v.number, wi)] ? 'revealed' : ''}`} aria-label={`${wi + 1}. kelime ${h ? 'aç' : 'gizle'}`} aria-pressed={!h} onClick={() => toggle(wordKey(v.number, wi), h)}><span className="word-index">{String(wi + 1).padStart(2, '0')}</span><span className={`word-arabic ${ah ? 'blurred' : ''}`} aria-hidden={ah} lang="ar">{w.arabic}</span>{showReading && <span dir="ltr" className={`word-reading ${rh ? 'blurred' : ''}`} aria-hidden={rh}>{w.reading}</span>}{showMeaning && <span dir="ltr" className={`word-meaning ${mh ? 'blurred' : ''}`} aria-hidden={mh}>{w.meaning}</span>}{h && <LockKeyhole className="tile-lock" size={12}/>}</button>; })}</div>}
    {(showReading || showMeaning) && <div className="verse-translations">{showReading && <div className="translation-row"><span className="translation-label">OKUNUŞ</span><button className={`full-reading ${target !== 'meaning' && hidden(v, vi, 'reading') ? 'text-concealed' : ''}`} onClick={() => toggle(wordKey(v.number, 'reading'), hidden(v, vi, 'reading'))} aria-label="Tam okunuşu aç veya gizle"><span>{v.reading}</span>{target !== 'meaning' && hidden(v, vi, 'reading') && <EyeOff size={16}/>}</button></div>}{showMeaning && <div className="translation-row"><span className="translation-label">MEAL</span><button className={`full-meaning ${target === 'meaning' && hidden(v, vi, 'meaning') ? 'text-concealed' : ''}`} onClick={() => toggle(wordKey(v.number, 'meaning'), hidden(v, vi, 'meaning'))} aria-label="Tam meali aç veya gizle"><span>{v.meaning}</span>{target === 'meaning' && hidden(v, vi, 'meaning') && <EyeOff size={16}/>}</button></div>}</div>}<div className="verse-bottom"><span>{selected.kind === 'prayer' ? 'Ses: cihazın Arapça sesi' : v.approximate ? 'Kelime okunuşu: fonetik dönüşüm' : ''}</span><button className={remembered[progressKey(v.number)] ? 'memorized' : ''} aria-pressed={!!remembered[progressKey(v.number)]} onClick={() => mark(v)}><Check size={14}/>{remembered[progressKey(v.number)] ? 'Ezberlendi' : 'Ezberledim'}</button></div></article>;
        })}</div>
   {chain && lesson.verses.length > 0 && <button className="chain-next primary" onClick={() => { if (step < lesson.verses.length) {
        stop();
        setStep(step + 1);
        setReveals({});
    }
    else
        setNotice('Bu aralık tamamlandı. Ezberlediğiniz ayetleri kartlardan işaretleyebilirsiniz.'); }}>{step < lesson.verses.length ? `Ezberledim, ${lesson.verses[step].number}. ayeti ekle` : 'Bu aralık tamamlandı'}<ArrowRight size={19}/></button>}
   {!loading && !error && <div className="lesson-end"><span>✦</span><span>{chain ? `${step} / ${lesson.verses.length} ayet` : selected.name + ' · ' + lesson.verses.length + ' ' + (selected.kind === 'prayer' ? 'dua' : 'ayet')}</span><span>✦</span></div>}
   <div className="source-note"><span>Kaynaklar: {lesson.source}</span>{selected.kind === 'surah' && <button disabled={!gemini || enriching || range[1] - range[0] >= 5} onClick={enrich} title={!gemini ? 'Sunucuda GEMINI_API_KEY yapılandırılmalı' : 'En fazla 5 ayet'}><Sparkles size={14}/>{enriching ? 'Eşleştiriliyor…' : 'Gemini ile eşleştir'}{!gemini && ' · yapılandırılmadı'}</button>}</div>
  </main>
  <footer className="practice-bar"><div className="session-progress"><div className="progress-ring" style={{ '--progress': `${lesson.verses.length ? done / lesson.verses.length * 100 : 0}%` } as React.CSSProperties}><Check size={18}/></div><div><strong>{done}<span> / {lesson.verses.length} {selected.kind === 'prayer' ? 'dua' : 'ayet'}</span></strong><small>Ezberlendi olarak işaretlenen</small></div></div><div className="practice-actions"><button className="reset-button" onClick={() => { setReveals({}); setNotice('İpuçları sıfırlandı.'); }}><RotateCcw size={16}/><span>Sıfırla</span></button><button className="reveal-all" disabled={!visible.length} onClick={() => visible.forEach(v => revealVerse(v, opened !== totalWords))}><Eye size={17}/><span>{opened === totalWords ? 'Tümünü gizle' : 'Tümünü aç'}</span></button><button className="hint-button" disabled={loading || !visible.length} onClick={hint}><Lightbulb size={18}/><span>Sıradaki kelimeyi aç</span><kbd>SPACE</kbd></button></div></footer>
  {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Bildirimi kapat" onClick={() => setNotice('')}><X size={16}/></button></div>}
  {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape')
        setSettings(false); if (e.key === 'Tab') {
        const f = e.currentTarget.querySelectorAll('button,select') as unknown as NodeListOf<HTMLElement>;
        if (e.shiftKey && document.activeElement === f[0]) {
            e.preventDefault();
            f[f.length - 1].focus();
        }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
            e.preventDefault();
            f[0].focus();
        }
    } }}><div className="modal-heading"><h2 id="settings-title">Atölye ayarları</h2><button autoFocus className="icon-button" aria-label="Ayarları kapat" onClick={() => setSettings(false)}><X size={20}/></button></div><label className="setting-row">Dinleme döngüsü<select value={repeats} onChange={e => setRepeats(Number(e.target.value))}><option value={3}>3 tekrar</option><option value={5}>5 tekrar</option></select></label><div className="setting-note"><BookOpen size={20}/><p>26 temel sure/aşır ve 8 dua uygulamaya gömülüdür. İlk ziyaretten sonra arayüz çevrimdışı saklanır. Ses dosyaları internet gerektirir. Dualarda cihazın Arapça konuşma sesi kullanılır.</p></div><div className="setting-note"><Eye size={20}/><p>Tam Türkçe okunuş AlQuran Cloud, kelime anlamları Quran.com kaynaklıdır. Kelime okunuşlarındaki fonetik dönüşümü tam okunuşla birlikte çalışın.</p></div><div className="setting-note"><Sparkles size={20}/><p>Gemini: {gemini ? 'Yapılandırıldı.' : 'Yapılandırılmadı; sunucuya GEMINI_API_KEY ekleyin.'} Yapay zekâ eşleştirmelerini kaynak metinle kontrol edin.</p></div><button className="reset-data" onClick={() => { setRemembered({}); save('hifz:progress:v1', {}); setNotice('Ezber işaretleri temizlendi.'); }}>Ezber işaretlerimi temizle</button></section></div>}
 </div>;
}
