'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Eye, EyeOff, Play, Pause, Repeat2, ArrowRight, RotateCcw } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { allChapters, basics, prayerCatalog } from '@/lib/hifz/catalog';
import { prayers } from '@/lib/hifz/prayers';
import offlineData from '@/lib/hifz/offline.json';
import { validRange } from '@/lib/hifz/core';
import { stages, stageHidden, firstArabic, firstReading, chainFrame, choicesFor, type StudyMode } from '@/lib/hifz/learning';
import { displayWords } from '@/lib/hifz/readings';
import { createShadowSession } from '@/lib/hifz/shadowing';
import type { Content, Lesson, Verse } from '@/lib/hifz/types';
const offline = offlineData as Record<string, Lesson>;
const levels = stages;
const read = (key: string) => {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
};
const save = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch { }
};
const wordKey = (v: number, w: number | string) => `${v}:${w}`;
const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
export default function HifzWorkshop({ initialCategory = 'basics', initialKey }: {
    initialCategory?: string;
    initialKey?: string;
}) {
    const initialList = initialCategory === 'prayers' ? prayerCatalog : initialCategory === 'all' ? allChapters : basics;
    const initialContent = initialList.find(c => c.key === initialKey) || initialList[0];
    const initialEnd = initialContent.end - initialContent.start > 19 ? initialContent.start + 4 : initialContent.end;
    const initialData = prayers[initialContent.key] || offline[initialContent.chapter];
    const initialVerses = initialData?.verses.filter(v => v.number >= initialContent.start && v.number <= initialEnd).map(v => ({...v, words: displayWords(v)})) || [];
    const [category, setCategory] = useState(initialCategory), [selected, setSelected] = useState<Content>(initialContent), [query, setQuery] = useState('');
    const [level, setLevel] = useState(0), [mode, setMode] = useState<StudyMode>('standard'), [step, setStep] = useState(1);
    const [showArabic, setShowArabic] = useState(true), [showReading, setShowReading] = useState(true), [showMeaning, setShowMeaning] = useState(true), [font, setFont] = useState(0);
    const [reveals, setReveals] = useState<Record<string, boolean>>({}), [range, setRange] = useState<[
        number,
        number
    ]>([initialContent.start, initialEnd]), [custom, setCustom] = useState(false), [draft, setDraft] = useState(['1', '5']);
    const [lesson, setLesson] = useState<Lesson>({ verses: initialVerses, source: initialData?.source || '' }), [loading, setLoading] = useState(initialVerses.length === 0), [failed, setFailed] = useState(false);
    const [playing, setPlaying] = useState<{verse: number; repeat: boolean; phase: 'listen' | 'pause' | 'check'} | null>(null);
    const [difficult, setDifficult] = useState<Record<string, boolean>>({}), [focus, setFocus] = useState(false);
    const [wrong, setWrong] = useState<string | null>(null);
    const session = useRef<ReturnType<typeof createShadowSession> | null>(null), generation = useRef(0);
    const stop = useCallback(() => { session.current?.cancel(); session.current = null; setPlaying(null); }, []);
    useEffect(() => { try { const d = JSON.parse(read('hifz:difficult:v1') || '{}'); if (d && typeof d === 'object' && !Array.isArray(d)) setDifficult(d); } catch {} }, []);
    const difficultyKey = (v: Verse, wi: number) => selected.kind === 'prayer' ? `prayer:${selected.key}:${v.number}:${wi}` : `quran:${selected.chapter}:${v.number}:${wi}`;
    const mark = (v: Verse, wi: number) => setDifficult(prev => { const next = {...prev}; const key = difficultyKey(v, wi); if(next[key]) delete next[key]; else next[key] = true; save('hifz:difficult:v1', next); return next; });
    useEffect(() => { stop(); setReveals({}); setWrong(null); setFocus(false); setStep(1); if (mode === 'quiz') setLevel(4); }, [mode, stop]);
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => { reg.active?.postMessage({ type: 'CACHE_ASSETS', urls: performance.getEntriesByType('resource').map(r => r.name).filter(url => new URL(url).origin === location.origin && /\.(js|css|ttf|svg)(\?|$)/.test(url)) }); }).catch(() => { });
        }
        return stop;
    }, [stop]);
    useEffect(() => {
        stop();
        setReveals({});
        setStep(1);
        setFailed(false);
        setLesson({ verses: [], source: '' });
        setLoading(true);
        const g = ++generation.current, controller = new AbortController(), cacheKey = `hifz:lesson:v4:${selected.chapter}:${range[0]}:${range[1]}`;
        const apply = (l: Lesson) => {
            if (g === generation.current) {
                setLesson({...l, verses: l.verses.map(v => ({...v, words: displayWords(v)}))});
                setLoading(false);
            }
        };
        if (prayers[selected.key]) {
            apply(prayers[selected.key]);
            return;
        }
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
    useEffect(() => { save('hifz:last-lesson:v1', { key: selected.key, name: selected.name, category }); }, [selected, category]);
    const catalog = category === 'basics' ? basics : category === 'prayers' ? prayerCatalog : allChapters;
    const filtered = catalog.filter(c => norm(c.name).includes(norm(query)) || (query.trim() !== '' && String(c.chapter) === query.trim()));
    const frame = chainFrame(step, lesson.verses.length);
    const visible = mode === 'chain' ? frame.indices.map(i => lesson.verses[i]).filter(Boolean) : lesson.verses;
    const stageFor = (vi: number, v: Verse) => playing?.verse === v.number && playing.phase === 'pause' ? 3 : mode === 'chain' ? frame.levels[vi] : level;
    const hidden = (v: Verse, vi: number, wi: number) => {
        if (playing?.verse === v.number && playing.phase === 'pause') return true;
        const id = wordKey(v.number, wi);
        if (reveals[id] !== undefined) return !reveals[id];
        return focus ? !!difficult[difficultyKey(v, wi)] : stageHidden(stageFor(vi, v), v.words, wi);
    };
    const pool = [...lesson.verses.flatMap(v => v.words), ...offline['1'].verses.flatMap(v => v.words)];
    const toggle = (id: string, h: boolean) => setReveals(prev => ({ ...prev, [id]: h }));
    const select = (c: Content) => { stop(); setSelected(c); setRange([c.start, c.end - c.start > 19 ? c.start + 4 : c.end]); setQuery(''); setCustom(false); };
    const changeCategory = (c: string) => { setCategory(c); select((c === 'basics' ? basics : c === 'prayers' ? prayerCatalog : allChapters)[0]); };
    const revealVerse = (v: Verse, open: boolean) => setReveals(prev => { const next = { ...prev }; v.words.forEach((_, wi) => next[wordKey(v.number, wi)] = open); next[wordKey(v.number, 'reading')] = open; next[wordKey(v.number, 'meaning')] = open; return next; });
    const hint = () => {
        if (mode === 'quiz' || playing?.phase === 'pause') return;
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
    const play = (v: Verse, repeat = false) => {
        if (playing?.verse === v.number && playing.repeat === repeat) { stop(); return; }
        stop(); session.current = createShadowSession(v, repeat, phase => setPlaying(phase ? {verse: v.number, repeat, phase} : null));
    };
    const changeStage = (i: number) => { stop(); setLevel(i); setReveals({}); setWrong(null); setFocus(false); if (i === 0) { setShowArabic(true); setShowReading(true); setShowMeaning(true); } };
    return <div className={`app font-size-${font}`}>
  <header className="topbar">
   <a className="brand" href="/" aria-label="Hıfz ana sayfa">hıfz<span>.</span></a>
   <nav className="category-nav" aria-label="İçerik kategorisi">
    {[{ id: 'basics', label: 'Sureler' }, { id: 'prayers', label: 'Dualar' }, { id: 'all', label: '114 Sure' }].map(c => <button key={c.id} className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => changeCategory(c.id)}>{c.label}</button>)}
   </nav>
   <div className="header-tools">
    <button className="font-button" aria-label="Yazıyı büyüt" onClick={() => setFont((font + 1) % 3)}>A+</button>
    <select className="study-mode" aria-label="Çalışma modu" value={mode} onChange={e => setMode(e.target.value as StudyMode)}><option value="standard">Standart</option><option value="chain">⛓️ Zincirleme</option><option value="quiz">🧩 Boşluk Doldur</option></select>
    <ThemeToggle />
   </div>
  </header>
  <main className="workspace">
   <section className="library" aria-label="İçerik seçimi">
    <label className="search"><Search size={18}/><input aria-label="Sure veya dua ara" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ara"/></label>
    <div className={`chips ${category === 'all' || query ? 'expanded' : ''}`} aria-label="Sureler ve dualar">{filtered.map(c => <button key={c.key} className={`surah-chip ${selected.key === c.key ? 'chosen' : ''}`} aria-pressed={selected.key === c.key} onClick={() => select(c)}>{c.name}</button>)}</div>
    {selected.end - selected.start > 19 && <div className="range-row" aria-label="Ayet aralığı">{Array.from({ length: Math.ceil((selected.end - selected.start + 1) / 5) }, (_, i) => { const s = selected.start + i * 5, e = Math.min(s + 4, selected.end); return <button key={s} className={range[0] === s && range[1] === e ? 'selected' : ''} onClick={() => setRange([s, e])}>{s}–{e}</button>; })}<button onClick={() => setRange([selected.end - 2, selected.end])}>Son 3</button><button onClick={() => { setCustom(!custom); setDraft(range.map(String)); }}>Özel</button></div>}
    {custom && <form className="custom-form" onSubmit={e => {
                e.preventDefault();
                const s = Number(draft[0]), n = Number(draft[1]);
                if (!validRange(s, n, selected.end) || s < selected.start || n - s >= 20)
                    return;
                setRange([s, n]);
                setCustom(false);
            }}><input aria-label="Başlangıç" type="number" required min={selected.start} max={selected.end} value={draft[0]} onChange={e => setDraft([e.target.value, draft[1]])}/><span>–</span><input aria-label="Bitiş" type="number" required min={Math.max(selected.start, Number(draft[0]))} max={Math.min(selected.end, Number(draft[0]) + 19)} value={draft[1]} onChange={e => setDraft([draft[0], e.target.value])}/><button className="icon-button" aria-label="Aralığı seç"><ArrowRight size={19}/></button></form>}
   </section>
   <section className="memory-panel" aria-label="Ezber kontrolleri">
    <div className="levels" aria-label="Gizleme seviyesi">{levels.map((label, i) => <button key={label} aria-pressed={level === i} className={level === i ? 'current' : ''} onClick={() => changeStage(i)}>{label}</button>)}<button className={focus ? 'current' : ''} aria-pressed={focus} onClick={() => {stop(); setFocus(!focus); setReveals({}); setWrong(null);}}>🎯 Zorlandıklarım</button></div>
    <div className="view-toggles" aria-label="Görünüm">{[{ label: 'Arapça', show: showArabic, set: setShowArabic }, { label: 'Okunuş', show: showReading, set: setShowReading }, { label: 'Meal', show: showMeaning, set: setShowMeaning }].map(t => <button key={t.label} aria-pressed={t.show} onClick={() => t.set(!t.show)}><span className={`toggle ${t.show ? 'on' : ''}`}/>{t.label}</button>)}</div>
   </section>
   <h1 className="lesson-title">{selected.name}</h1>
   {loading && <div className="loading" role="status" aria-label="Yükleniyor"><span /><span /><span /></div>}
   {failed && <div className="retry"><button className="icon-button" aria-label="Yeniden dene" onClick={() => setRange([...range])}><RotateCcw size={22}/></button></div>}
   <div className="verse-list">{visible.map((v, vi) => {
            const allOpen = v.words.every((_, wi) => !hidden(v, vi, wi)), isPlaying = playing?.verse === v.number;
            const nextWord = v.words.findIndex((_, wi) => hidden(v, vi, wi));
            const currentStage = stageFor(vi, v), pausing = isPlaying && playing.phase === 'pause';
            const options = mode === 'quiz' && nextWord >= 0 && !pausing ? choicesFor(v.words[nextWord], pool, v.number + nextWord) : [];
            return <article className="verse-card" key={`${selected.key}:${v.number}`} aria-label={`${v.number}. ayet`}>
    <div className="verse-header"><span className="verse-number">{v.number}</span><div className="verse-actions">
     <button className={`icon-button ${isPlaying && !playing.repeat ? 'active' : ''}`} aria-label={isPlaying && !playing.repeat ? 'Durdur' : 'Dinle'} onClick={() => play(v)}>{isPlaying && !playing.repeat ? <Pause size={18}/> : <Play size={18}/>}</button>
     <button className={`icon-button ${isPlaying && playing.repeat ? 'active' : ''}`} aria-label="Tekrarlı çal" aria-pressed={isPlaying && playing.repeat} onClick={() => play(v, true)}><Repeat2 size={19}/></button>
     <button className="icon-button" aria-label={allOpen ? 'Ayeti gizle' : 'Ayeti aç'} onClick={() => revealVerse(v, !allOpen)}>{allOpen ? <Eye size={19}/> : <EyeOff size={19}/>}</button>
    </div>{pausing && <span className="shadow-cue" role="status">🎙️ Sıra Sende</span>}</div>
    {(showArabic || showReading) && <div className="word-grid" dir="rtl">{v.words.map((w, wi) => {
        const h = hidden(v, vi, wi), cue = h && currentStage === 3 && (!focus || pausing);
        const marked = !!difficult[difficultyKey(v, wi)];
        const active = h && wi === nextWord && (currentStage === 4 || mode === 'quiz');
        const sequential = currentStage === 4 || mode === 'quiz';
        return <div key={wi} className={`word-tile ${marked ? 'difficult' : ''} ${active ? 'next-word' : ''} ${wrong === wordKey(v.number, wi) ? 'answer-wrong' : ''}`}>
            <button className="word-content" aria-label={`${wi + 1}. kelime ${h ? 'aç' : 'gizle'}`} aria-pressed={!h} disabled={pausing || (h && (mode === 'quiz' || (sequential && wi !== nextWord)))} onClick={() => toggle(wordKey(v.number, wi), h)} onDoubleClick={() => { mark(v, wi); toggle(wordKey(v.number, wi), true); }}>
            {showArabic && <span className={`word-arabic ${h && !cue ? 'blurred' : ''}`} aria-hidden={h && !cue} lang="ar">{cue ? firstArabic(w.arabic) + '…' : w.arabic}</span>}
            {showReading && <span dir="ltr" className={`word-reading ${h && !cue ? 'blurred' : ''}`} aria-hidden={h && !cue}>{cue ? firstReading(w.reading) : w.reading}</span>}
            </button>
            <button className="difficulty-dot" aria-label={`${wi + 1}. kelime: Zorlandım`} aria-pressed={marked} onClick={() => mark(v, wi)}>•</button>
        </div>;
    })}</div>}
    {options.length > 0 && <div className="word-choices" aria-label="Kelime seçenekleri" dir="rtl">{options.map((w, i) => <button key={i} lang="ar" onClick={() => {
        const id = wordKey(v.number, nextWord), correct = w.arabic === v.words[nextWord].arabic;
        if (correct) { toggle(id, true); setWrong(null); }
        else { setWrong(id); setReveals(prev => ({...prev, [id]: true})); if (!difficult[difficultyKey(v, nextWord)]) mark(v, nextWord); }
    }}>{w.arabic}</button>)}</div>}
    {showMeaning && <p className="verse-meaning">{v.meaning}</p>}
   </article>;
        })}</div>
   {mode === 'chain' && step < frame.last && <button className="chain-next" onClick={() => { stop(); setStep(step + 1); setReveals({}); setWrong(null); }}>Sonraki Adım <ArrowRight size={18}/></button>}

  </main>
 </div>;
}
