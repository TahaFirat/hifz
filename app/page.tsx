'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Eye, EyeOff, Play, Pause, Repeat2, Link2, ArrowRight, RotateCcw } from 'lucide-react';
import { allChapters, basics, prayerCatalog } from '@/lib/hifz/catalog';
import { prayers } from '@/lib/hifz/prayers';
import offlineData from '@/lib/hifz/offline.json';
import { effectiveLevel, hiddenAt, validRange } from '@/lib/hifz/core';
import type { Content, Lesson, Verse } from '@/lib/hifz/types';
const offline = offlineData as Record<string, Lesson>;
const levels = ['Açık', '%25', '%50', 'İlk Kelime', 'Gizli'];
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
    const [level, setLevel] = useState(0), [chain, setChain] = useState(false), [step, setStep] = useState(1);
    const [showArabic, setShowArabic] = useState(true), [showReading, setShowReading] = useState(true), [showMeaning, setShowMeaning] = useState(true), [font, setFont] = useState(0);
    const [reveals, setReveals] = useState<Record<string, boolean>>({}), [range, setRange] = useState<[
        number,
        number
    ]>([1, 7]), [custom, setCustom] = useState(false), [draft, setDraft] = useState(['1', '5']);
    const [lesson, setLesson] = useState<Lesson>(offline['1']), [loading, setLoading] = useState(false), [failed, setFailed] = useState(false);
    const [playing, setPlaying] = useState<{
        verse: number;
        remaining: number;
        total: number;
    } | null>(null);
    const audio = useRef<HTMLAudioElement | null>(null), generation = useRef(0), speechGeneration = useRef(0);
    const stop = useCallback(() => { speechGeneration.current++; if (audio.current) {
        audio.current.pause();
        audio.current.onended = null;
        audio.current.onerror = null;
        audio.current = null;
    } if (typeof speechSynthesis !== 'undefined')
        speechSynthesis.cancel(); setPlaying(null); }, []);
    useEffect(() => { if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => { reg.active?.postMessage({ type: 'CACHE_ASSETS', urls: performance.getEntriesByType('resource').map(r => r.name).filter(url => new URL(url).origin === location.origin && /\.(js|css|ttf|svg)(\?|$)/.test(url)) }); }).catch(() => { });
    } return stop; }, [stop]);
    useEffect(() => {
        stop();
        setReveals({});
        setStep(1);
        setFailed(false);
        setLesson({ verses: [], source: '' });
        setLoading(true);
        const g = ++generation.current, controller = new AbortController(), cacheKey = `hifz:lesson:v2:${selected.chapter}:${range[0]}:${range[1]}`;
        const apply = (l: Lesson) => {
            if (g === generation.current) {
                setLesson(l);
                setLoading(false);
            }
        };
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
        fetch(`/api/lesson?chapter=${selected.chapter}&start=${range[0]}&end=${range[1]}`, { signal: controller.signal }).then(async (r) => {
            const d = await r.json() as Lesson & {
                error?: string;
            };
            if (!r.ok)
                throw Error(d.error || 'İçerik yüklenemedi.');
            save(cacheKey, d);
            apply(d);
        }).catch(e => {
            if (!controller.signal.aborted && g === generation.current) {
                setLoading(false);
                setFailed(true);
            }
        });
        return () => controller.abort();
    }, [selected, range, stop]);
    const catalog = category === 'basics' ? basics : category === 'prayers' ? prayerCatalog : allChapters;
    const filtered = catalog.filter(c => norm(c.name).includes(norm(query)) || (query.trim() !== '' && String(c.chapter) === query.trim()));
    const visible = chain ? lesson.verses.slice(0, step) : lesson.verses;
    const hidden = (v: Verse, vi: number, wi: number | string) => {
        const id = wordKey(v.number, wi);
        if (reveals[id] !== undefined)
            return !reveals[id];
        const l = effectiveLevel(level, chain, vi, step);
        return typeof wi === 'number' ? hiddenAt(l, wi, v.words.length) : l > 0;
    };
    const toggle = (id: string, h: boolean) => setReveals(prev => ({ ...prev, [id]: h }));
    const select = (c: Content) => { stop(); setSelected(c); setRange([c.start, c.end - c.start > 19 ? c.start + 4 : c.end]); setQuery(''); setCustom(false); };
    const changeCategory = (c: string) => { setCategory(c); select((c === 'basics' ? basics : c === 'prayers' ? prayerCatalog : allChapters)[0]); };
    const revealVerse = (v: Verse, open: boolean) => setReveals(prev => { const next = { ...prev }; v.words.forEach((_, wi) => next[wordKey(v.number, wi)] = open); next[wordKey(v.number, 'reading')] = open; next[wordKey(v.number, 'meaning')] = open; return next; });
    const hint = () => {
        for (const [vi, v] of visible.entries())
            for (let wi = 0; wi < v.words.length; wi++)
                if (hidden(v, vi, wi)) {
                    toggle(wordKey(v.number, wi), true);
                    return;
                }
    };
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            if (e.code === 'Space' && !e.repeat && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && !el.isContentEditable) {
                e.preventDefault();
                hint();
            }
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                e.preventDefault();
                document.querySelector<HTMLInputElement>('.search input')?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });
    const play = (v: Verse, times = 1) => {
        if (playing?.verse === v.number && playing.total === times) {
            stop();
            return;
        }
        stop();
        if (!v.audio) {
            if (!('speechSynthesis' in window)) {
                return;
            }
            const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'));
            if (!voice) {
                return;
            }
            let left = times;
            const sg = speechGeneration.current;
            setPlaying({ verse: v.number, remaining: left, total: times });
            const speak = () => {
                const u = new SpeechSynthesisUtterance(v.arabic);
                u.voice = voice;
                u.rate = .8;
                u.onend = () => {
                    if (sg !== speechGeneration.current)
                        return;
                    left--;
                    if (left) {
                        setPlaying({ verse: v.number, remaining: left, total: times });
                        speak();
                    }
                    else
                        setPlaying(null);
                };
                u.onerror = () => {
                    if (sg === speechGeneration.current) {
                        stop();
                    }
                };
                speechSynthesis.speak(u);
            };
            speak();
            return;
        }
        const a = new Audio(v.audio);
        audio.current = a;
        let left = times;
        setPlaying({ verse: v.number, remaining: left, total: times });
        const failed = () => {
            if (audio.current === a) {
                stop();
            }
        };
        a.onerror = failed;
        a.onended = () => {
            if (audio.current !== a)
                return;
            left--;
            if (left) {
                setPlaying({ verse: v.number, remaining: left, total: times });
                a.currentTime = 0;
                void a.play().catch(failed);
            }
            else
                stop();
        };
        void a.play().catch(failed);
    };
    return <div className={`app font-size-${font}`}>
  <header className="topbar">
   <a className="brand" href="/" aria-label="Hıfz ana sayfa">hıfz<span>.</span></a>
   <nav className="category-nav" aria-label="İçerik kategorisi">
    {[{ id: 'basics', label: 'Sureler' }, { id: 'prayers', label: 'Dualar' }, { id: 'all', label: '114 Sure' }].map(c => <button key={c.id} className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => changeCategory(c.id)}>{c.label}</button>)}
   </nav>
   <div className="header-tools">
    <button className="font-button" aria-label="Yazıyı büyüt" onClick={() => setFont((font + 1) % 3)}>A+</button>
    <button className={`icon-button chain-toggle ${chain ? 'active' : ''}`} aria-label="Zincirleme ezber" aria-pressed={chain} onClick={() => { setChain(!chain); setStep(1); setReveals({}); stop(); }}><Link2 size={21}/></button>
   </div>
  </header>
  <main className="workspace">
   <section className="library" aria-label="İçerik seçimi">
    <label className="search"><Search size={18}/><input aria-label="Sure veya dua ara" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ara"/></label>
    <div className={`chips ${category === 'all' || query ? 'expanded' : ''}`} aria-label="Sureler ve dualar">{filtered.map(c => <button key={c.key} className={`surah-chip ${selected.key === c.key ? 'chosen' : ''}`} aria-pressed={selected.key === c.key} onClick={() => select(c)}>{c.name}</button>)}</div>
    {selected.end - selected.start > 19 && <div className="range-row" aria-label="Ayet aralığı">{Array.from({ length: Math.ceil((selected.end - selected.start + 1) / 5) }, (_, i) => { const s = selected.start + i * 5, e = Math.min(s + 4, selected.end); return <button key={s} className={range[0] === s && range[1] === e ? 'selected' : ''} onClick={() => setRange([s, e])}>{s}–{e}</button>; })}<button onClick={() => setRange([selected.end - 2, selected.end])}>Son 3</button><button onClick={() => { setCustom(!custom); setDraft(range.map(String)); }}>Özel</button></div>}
    {custom && <form className="custom-form" onSubmit={e => { e.preventDefault(); const s = Number(draft[0]), n = Number(draft[1]); if (!validRange(s, n, selected.end) || s < selected.start || n - s >= 20)
        return; setRange([s, n]); setCustom(false); }}><input aria-label="Başlangıç" type="number" required min={selected.start} max={selected.end} value={draft[0]} onChange={e => setDraft([e.target.value, draft[1]])}/><span>–</span><input aria-label="Bitiş" type="number" required min={Math.max(selected.start, Number(draft[0]))} max={Math.min(selected.end, Number(draft[0]) + 19)} value={draft[1]} onChange={e => setDraft([draft[0], e.target.value])}/><button className="icon-button" aria-label="Aralığı seç"><ArrowRight size={19}/></button></form>}
   </section>
   <section className="memory-panel" aria-label="Ezber kontrolleri">
    <div className="levels" aria-label="Gizleme seviyesi">{levels.map((label, i) => <button key={label} aria-pressed={level === i} className={level === i ? 'current' : ''} onClick={() => { setLevel(i); setReveals({}); setChain(false); }}>{label}</button>)}</div>
    <div className="view-toggles" aria-label="Görünüm">{[{ label: 'Arapça', show: showArabic, set: setShowArabic }, { label: 'Okunuş', show: showReading, set: setShowReading }, { label: 'Meal', show: showMeaning, set: setShowMeaning }].map(t => <button key={t.label} aria-pressed={t.show} onClick={() => t.set(!t.show)}><span className={`toggle ${t.show ? 'on' : ''}`}/>{t.label}</button>)}</div>
   </section>
   <h1 className="lesson-title">{selected.name}</h1>
   {loading && <div className="loading" role="status" aria-label="Yükleniyor"><span /><span /><span /></div>}
   {failed && <div className="retry"><button className="icon-button" aria-label="Yeniden dene" onClick={() => setRange([...range])}><RotateCcw size={22}/></button></div>}
   <div className="verse-list">{visible.map((v, vi) => {
            const allOpen = v.words.every((_, wi) => !hidden(v, vi, wi)), isPlaying = playing?.verse === v.number;
            return <article className="verse-card" key={`${selected.key}:${v.number}`} aria-label={`${v.number}. ayet`}>
    <div className="verse-header"><span className="verse-number">{v.number}</span><div className="verse-actions">
     <button className={`icon-button ${isPlaying && playing.total === 1 ? 'active' : ''}`} aria-label={isPlaying && playing.total === 1 ? 'Durdur' : 'Dinle'} onClick={() => play(v)}>{isPlaying && playing.total === 1 ? <Pause size={18}/> : <Play size={18}/>}</button>
     <button className={`icon-button ${isPlaying && playing.total > 1 ? 'active' : ''}`} aria-label="Tekrarlı çal" aria-pressed={isPlaying && playing.total > 1} onClick={() => play(v, 3)}><Repeat2 size={19}/></button>
     <button className="icon-button" aria-label={allOpen ? 'Ayeti gizle' : 'Ayeti aç'} onClick={() => revealVerse(v, !allOpen)}>{allOpen ? <Eye size={19}/> : <EyeOff size={19}/>}</button>
    </div></div>
    {(showArabic || showReading) && <div className="word-grid" dir="rtl">{v.words.map((w, wi) => { const h = hidden(v, vi, wi); return <button key={wi} className="word-tile" aria-label={`${wi + 1}. kelime ${h ? 'aç' : 'gizle'}`} aria-pressed={!h} onClick={() => toggle(wordKey(v.number, wi), h)}>{showArabic && <span className={`word-arabic ${h ? 'blurred' : ''}`} aria-hidden={h} lang="ar">{w.arabic}</span>}{showReading && <span dir="ltr" className={`word-reading ${h ? 'blurred' : ''}`} aria-hidden={h}>{w.reading}</span>}</button>; })}</div>}
    {showMeaning && <p className="verse-meaning">{v.meaning}</p>}
   </article>;
        })}</div>
   {chain && step < lesson.verses.length && <button className="chain-next icon-button" aria-label="Sonraki ayeti ekle" onClick={() => { stop(); setStep(step + 1); setReveals({}); }}><ArrowRight size={24}/></button>}
  </main>
 </div>;
}
