'use client';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Eye, EyeOff, Play, Pause, Repeat2, ArrowRight, RotateCcw, Focus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { allChapters, basics, prayerCatalog } from '@/lib/hifz/catalog';
import { prayers } from '@/lib/hifz/prayers';
import offlineData from '@/lib/hifz/offline.json';
import { validRange } from '@/lib/hifz/core';
import { stageHidden, firstArabic, chainFrame, choicesFor, hasArabicVoice, type StudyMode } from '@/lib/hifz/learning';
import {methods,initialCoach,advanceCoach,reverseFrame,cueMask,bridgeMask} from '@/lib/hifz/methods';
import { restoreStudy, lessonSelection } from '@/lib/hifz/study';
import { requestLesson } from '@/lib/hifz/client';
import { isLesson, restoreDisplay } from '@/lib/hifz/validation';
import { displayArabic } from '@/lib/hifz/arabic-display';
import { displayWords } from '@/lib/hifz/readings';
import { createShadowSession } from '@/lib/hifz/shadowing';
import type { Content, Lesson, Verse } from '@/lib/hifz/types';
const offline = offlineData as Record<string, Lesson>;
const levels = [{id:0,label:'Açık'},{id:1,label:'Aralıklı'},{id:3,label:'İlk Harf / Hece'},{id:4,label:'Kapalı'}];
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
export default function HifzWorkshop({ initialCategory = 'basics', initialKey, initialStart, initialEnd: requestedEnd }: {
    initialCategory?: string;
    initialKey?: string;
    initialStart?: string;
    initialEnd?: string;
}) {
    const initialSelection = lessonSelection({category: initialCategory, key: initialKey, start: initialStart, end: requestedEnd}, {basics, prayers: prayerCatalog, all: allChapters});
    const initialContent = initialSelection.content, initialRange = initialSelection.range;
    const initialEnd = initialRange[1];
    const initialData = prayers[initialContent.key] || offline[initialContent.chapter];
    const initialVerses = useMemo(() => initialData?.verses.filter(v => v.number >= initialRange[0] && v.number <= initialEnd).map(v => ({...v, words: displayWords(v)})) || [], [initialData, initialRange[0], initialEnd]);
    const [category, setCategory] = useState(initialCategory), [selected, setSelected] = useState<Content>(initialContent), [query, setQuery] = useState('');
    const [level, setLevel] = useState(0), [mode, setMode] = useState<StudyMode>('standard'), [step, setStep] = useState(1);
    const [showArabic, setShowArabic] = useState(true), [showReading, setShowReading] = useState(true), [showMeaning, setShowMeaning] = useState(true), [font, setFont] = useState(0);
    const [reveals, setReveals] = useState<Record<string, boolean>>({}), [range, setRange] = useState<[
        number,
        number
    ]>(initialRange), [custom, setCustom] = useState(false), [draft, setDraft] = useState(['1', '5']);
    const [lesson, setLesson] = useState<Lesson>({ verses: initialVerses, source: initialData?.source || '' }), [loading, setLoading] = useState(initialVerses.length === 0), [failed, setFailed] = useState(false);
    const [playing, setPlaying] = useState<{verse: number; repeat: boolean; phase: 'listen' | 'pause' | 'check'} | null>(null);
    const [difficult, setDifficult] = useState<Record<string, boolean>>({}), [focus, setFocus] = useState(false);
    const [displayReady, setDisplayReady] = useState(false), [canSpeak, setCanSpeak] = useState(false);
    const [spotlight, setSpotlight] = useState(false), [cursor, setCursor] = useState(0), [restoredKey, setRestoredKey] = useState('');
    const [wrong, setWrong] = useState<string | null>(null);
    const [coach,setCoach]=useState(initialCoach),[reverseWords,setReverseWords]=useState<number|null>(null);
    const session = useRef<ReturnType<typeof createShadowSession> | null>(null), generation = useRef(0);
    const levelBar = useRef<HTMLDivElement>(null);
    const stop = useCallback(() => { session.current?.cancel(); session.current = null; setPlaying(null); }, []);
    useEffect(() => { try { const d = JSON.parse(read('hifz:difficult:v2') || '{}'); if (d && typeof d === 'object' && !Array.isArray(d)) setDifficult(d); } catch {} }, []);
    useEffect(() => {
        try { const p = restoreDisplay(JSON.parse(read('hifz:display:v1') || 'null')); setFont(p.font); setShowArabic(p.arabic); setShowReading(p.reading); setShowMeaning(p.meaning); } catch {}
        setDisplayReady(true);
    }, []);
    useEffect(() => { if (displayReady) save('hifz:display:v1', {font, arabic: showArabic, reading: showReading, meaning: showMeaning}); }, [displayReady, font, showArabic, showReading, showMeaning]);
    useEffect(() => {
        if (!('speechSynthesis' in window)) return;
        const speech = window.speechSynthesis, refresh = () => setCanSpeak(hasArabicVoice(speech));
        refresh(); speech.addEventListener('voiceschanged', refresh);
        return () => speech.removeEventListener('voiceschanged', refresh);
    }, []);
    useEffect(() => { if (displayReady && mode === 'quiz' && !showArabic && !showReading) setShowArabic(true); }, [displayReady, mode, showArabic, showReading]);
    const difficultyKey = (v: Verse, wi: number) => selected.kind === 'prayer' ? `prayer:${selected.key}:${v.number}:${wi}` : `quran:${selected.chapter}:${v.number}:${wi}`;
    const mark = (v: Verse, wi: number) => setDifficult(prev => { const next = {...prev}; const key = difficultyKey(v, wi); if(next[key]) delete next[key]; else next[key] = true; save('hifz:difficult:v2', next); return next; });
    const changeMode = (next: StudyMode) => { stop(); setMode(next); setReveals({}); setWrong(null); setFocus(false); setSpotlight(false);setReverseWords(null);setCoach(initialCoach());setStep(1);setLevel(next==='quiz'?4:0); };
    // Old indices referred to whole phrases; keep those records but never apply them to new word indices.
    const studyKey = `hifz:study:v2:${selected.key}:${range[0]}:${range[1]}`;
    useEffect(() => {
        // An offline navigation can use the generic cached shell. Recover the actual URL selection.
        const p = new URLSearchParams(location.search);
        const next = lessonSelection({category:p.get('kategori'), key:p.get('icerik'), start:p.get('baslangic'), end:p.get('bitis')}, {basics, prayers:prayerCatalog, all:allChapters});
        if (next.category !== category || next.content.key !== selected.key || next.range[0] !== range[0] || next.range[1] !== range[1]) {
            setCategory(next.category); setSelected(next.content); setRange(next.range);
        }
    }, [initialCategory, initialKey, initialStart, requestedEnd]);
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(reg => { reg.active?.postMessage({ type: 'CACHE_ASSETS', urls: performance.getEntriesByType('resource').map(r => r.name).filter(url => new URL(url).origin === location.origin && /\.(js|css|ttf|svg)(\?|$)/.test(url)) }); }).catch(() => { });
        }
        window.addEventListener('pagehide', stop);
        return () => { window.removeEventListener('pagehide', stop); stop(); };
    }, [stop]);
    useEffect(() => {
        stop();
        setFailed(false);
        setLesson({ verses: [], source: '' });
        setLoading(true);
        const g = ++generation.current, controller = new AbortController(), cacheKey = `hifz:lesson:v5:${selected.chapter}:${range[0]}:${range[1]}`;
        const apply = (l: Lesson) => {
            if (g === generation.current && !controller.signal.aborted) {
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
            if (isLesson(cached, range[0], range[1])) {
                apply(cached);
                return;
            }
        }
        catch { }
        requestLesson(selected.chapter, range[0], range[1], controller.signal).then(d => {
            if (controller.signal.aborted || g !== generation.current) return;
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
    useEffect(() => {
        let saved: unknown = null; try { saved = JSON.parse(read(studyKey) || 'null'); } catch {}
        const state = restoreStudy(saved);
        setLevel(state.level); setMode(state.mode==='chain'?'coach':state.mode);setCoach(state.coach??initialCoach());setReverseWords(state.reverseWords===true?(state.reverseVerse??null):null); setStep(state.step); setCursor(state.cursor); setSpotlight(state.spotlight); setReveals(state.reveals); setFocus(false); setWrong(null); setRestoredKey(studyKey);
    }, [studyKey]);
    useEffect(() => { if (restoredKey === studyKey) save(studyKey, {level, mode, step, cursor, spotlight, reveals,coach,reverseWords:reverseWords!==null,reverseVerse:reverseWords}); }, [restoredKey, studyKey, level, mode, step, cursor, spotlight, reveals,coach,reverseWords]);
    useEffect(() => {
        const bar = levelBar.current, active = bar?.querySelector<HTMLElement>('.current');
        if (bar && active) bar.scrollLeft += active.getBoundingClientRect().left - bar.getBoundingClientRect().left - 8;
    }, [level, focus]);
    useEffect(() => { save('hifz:last-lesson:v1', { key: selected.key, name: selected.name, category, range }); }, [selected, category, range]);
    const catalog = category === 'basics' ? basics : category === 'prayers' ? prayerCatalog : allChapters;
    const filtered = catalog.filter(c => norm(c.name).includes(norm(query)) || (query.trim() !== '' && String(c.chapter) === query.trim()));
    const frame = chainFrame(step, lesson.verses.length);
    const current = Math.min(cursor, Math.max(0, lesson.verses.length - 1));
    const coachIndex=Math.min(coach.verse,Math.max(0,lesson.verses.length-1));
    const visible = focus ? lesson.verses : mode === 'coach' ? (coach.phase==='link'?lesson.verses.slice(0,coachIndex+1):lesson.verses.slice(coachIndex,coachIndex+1)) : mode==='reverse'?reverseFrame(step,lesson.verses.length).map(i=>lesson.verses[i]) : mode === 'chain' ? frame.indices.map(i => lesson.verses[i]).filter(Boolean) : spotlight ? lesson.verses.slice(current, current + 1) : lesson.verses;
    const masks = useMemo(() => new Map(lesson.verses.map(v => [v.number, Array.from({length: 5}, (_, stage) => v.words.map((_, wi) => stageHidden(stage, v.words, wi)))])), [lesson]);
    const moveVerse = (delta: number) => { stop(); setWrong(null); setCursor(Math.max(0, Math.min(lesson.verses.length - 1, current + delta))); };
    const stageFor = (vi: number, v: Verse) => playing?.verse === v.number && playing.phase === 'pause' ? 3 : reverseWords===v.number ? 4 : mode==='coach' ? coach.phase==='read'?0:3 : mode==='reverse'?step===1?0:vi===0?3:4 : mode === 'chain' ? frame.levels[vi] : level;
    const hidden = (v: Verse, vi: number, wi: number) => {
        if (playing?.verse === v.number && playing.phase === 'pause') return true;
        const id = wordKey(v.number, wi);
        if (reveals[id] !== undefined) return !reveals[id];
        if(focus) return !!difficult[difficultyKey(v,wi)];
        if(mode==='bridge') return bridgeMask(wi,v.words.length);
        if(mode==='standard') return cueMask(stageFor(vi,v),wi);
        return (masks.get(v.number)?.[stageFor(vi, v)]?.[wi] ?? false);
    };
    const pool = useMemo(() => [...lesson.verses.flatMap(v => v.words), ...offline['1'].verses.flatMap(v => displayWords(v))], [lesson]);
    const toggle = (id: string, h: boolean) => setReveals(prev => ({ ...prev, [id]: h }));
    const select = (c: Content) => { if (selected.key === c.key) { setQuery(''); setCustom(false); return; } stop(); setSelected(c); setRange([c.start, c.end - c.start > 19 ? c.start + 4 : c.end]); setQuery(''); setCustom(false); };
    const changeCategory = (c: string) => { setCategory(c); select((c === 'basics' ? basics : c === 'prayers' ? prayerCatalog : allChapters)[0]); };
    const revealVerse = (v: Verse, open: boolean) => setReveals(prev => { const next = { ...prev }; v.words.forEach((_, wi) => next[wordKey(v.number, wi)] = open); next[wordKey(v.number, 'reading')] = open; next[wordKey(v.number, 'meaning')] = open; return next; });
    const hint = () => {
        if (mode === 'quiz' || playing?.phase === 'pause') return;
        for (const [vi, v] of visible.entries())
            for (const wi of Array.from({length:v.words.length},(_,i)=>reverseWords===v.number?v.words.length-1-i:i))
                if (hidden(v, vi, wi)) {
                    toggle(wordKey(v.number, wi), true);
                    return;
                }
    };
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;
            if (e.code === 'Space' && !e.repeat && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) && !el.isContentEditable) {
                e.preventDefault();
                hint();
            }
            if (spotlight && mode !== 'chain' && ['ArrowLeft', 'ArrowRight'].includes(e.key) && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName) && !el.isContentEditable) { e.preventDefault(); moveVerse(e.key === 'ArrowRight' ? 1 : -1); }
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                e.preventDefault();
                setSpotlight(false);
                requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.search input')?.focus());
            }
            if (e.key === 'Escape' && spotlight) setSpotlight(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });
    const play = (v: Verse, repeat = false) => {
        if (playing?.verse === v.number && playing.repeat === repeat) { stop(); return; }
        stop(); session.current = createShadowSession(v, repeat, phase => setPlaying(phase ? {verse: v.number, repeat, phase} : null),4);
    };
    const changeStage = (i: number) => { stop(); setLevel(i); setReveals({}); setWrong(null); setFocus(false); if (i === 0) { setShowArabic(true); setShowReading(true); setShowMeaning(true); } };
    return <div className={`app font-size-${font} ${spotlight ? 'spotlight' : ''}`}>
  <header className="topbar">
   <a className="brand" href="/" aria-label="Hıfz ana sayfa">hıfz<span>.</span></a>
   <nav className="category-nav" aria-label="İçerik kategorisi">
    {[{ id: 'basics', label: 'Sureler' }, { id: 'prayers', label: 'Dualar' }, { id: 'all', label: '114 Sure' }].map(c => <button key={c.id} className={category === c.id ? 'active' : ''} aria-pressed={category === c.id} onClick={() => changeCategory(c.id)}>{c.label}</button>)}
   </nav>
   <div className="header-tools">
    <button className="font-button" aria-label="Yazıyı büyüt" onClick={() => setFont((font + 1) % 3)}>A+</button>
    <ThemeToggle />
   </div>
  </header>
  <main className="workspace">
   <section className="library" aria-label="İçerik seçimi">
    <label className="search"><Search size={18}/><input aria-label="Sure veya dua ara" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ara"/>{query && <button type="button" className="clear-search" aria-label="Aramayı temizle" onClick={e => { setQuery(''); e.currentTarget.parentElement?.querySelector('input')?.focus(); }}><X size={16}/></button>}</label>
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
   <section className="method-panel" aria-label="Ezber metodu">
    <label htmlFor="method-select">Ezber metodu</label><select id="method-select" className="study-mode" aria-label="Ezber metodu seçici" disabled={!displayReady||restoredKey!==studyKey} value={mode==='chain'?'coach':mode} onChange={e=>changeMode(e.target.value as StudyMode)}>{methods.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select>
    <details key={mode} className="method-info"><summary>🧠 Bilimsel & Hafızlık Tekniği Nasıl Çalışır?</summary><p>{methods.find(m=>m.id===mode)?.description}</p><p>† Arapçadan hesaplanan yardımcı okunuş. Tecvit ve durak okuyuşunu tilavetten kontrol et.</p></details>
   </section>
   <section className="memory-panel" aria-label="Ezber kontrolleri">
    <div className="levels" ref={levelBar} aria-label="Gizleme seviyesi">{mode==='standard'&&levels.map(({label,id}) => <button key={id} aria-pressed={!focus && level === id} className={!focus && level === id ? 'current' : ''} onClick={() => {setReverseWords(null);changeStage(id);}}>{label}</button>)}<button className={focus ? 'current' : ''} aria-pressed={focus} onClick={() => {stop(); setFocus(!focus); setReveals({}); setWrong(null);}}>🎯 Zorlandıklarım</button></div>
    <div className="view-toggles" aria-label="Görünüm">{[{ label: 'Arapça', show: showArabic, set: setShowArabic }, { label: 'Okunuş', show: showReading, set: setShowReading }, { label: 'Meal', show: showMeaning, set: setShowMeaning }].map(t => <button key={t.label} aria-pressed={t.show} disabled={t.show && ([showArabic, showReading, showMeaning].filter(Boolean).length === 1 || (mode === 'quiz' && t.label !== 'Meal' && [showArabic, showReading].filter(Boolean).length === 1))} onClick={() => t.set(!t.show)}><span className={`toggle ${t.show ? 'on' : ''}`}/>{t.label}</button>)}</div>
   </section>
   {mode==='coach'&&!focus&&lesson.verses.length>0&&<section className="coach-bar" aria-label="Hafız koçu">
    <div><strong>{coach.complete?'Çalışma tamamlandı':coach.phase==='read'?'Yüzünden oku':coach.phase==='recall'?'Bakmadan oku':'Rabt · Birleştir'}</strong><span>{coach.phase==='link'?`${lesson.verses[0].number}–${lesson.verses[coachIndex].number}. ayetler`:`${lesson.verses[coachIndex].number}. ayet`}</span></div>
    <div className="repetition-dots" aria-label={`${coach.count}/${coach.phase==='link'?2:3} tekrar`}>{Array.from({length:coach.phase==='link'?2:3},(_,i)=><span key={i} className={i<coach.count?'done':''}>{i+1}</span>)}</div>
    <button disabled={loading||!!playing} onClick={()=>{stop();setReveals({});setCoach(coach.complete?initialCoach():advanceCoach({...coach,verse:coachIndex},lesson.verses.length));}}>{coach.complete?'Yeniden başla':'+1 Okudum'}</button>
   </section>}
   <div className="lesson-bar"><h1 className="lesson-title">{selected.name}</h1><div className="lesson-tools">
    {spotlight && mode !== 'chain' && <nav className="focus-navigation" aria-label="Ayetler"><button className="icon-button" aria-label="Önceki ayet" disabled={loading || current === 0} onClick={() => moveVerse(-1)}><ChevronLeft size={19}/></button><button className="icon-button" aria-label="Sonraki ayet" disabled={loading || current >= lesson.verses.length - 1} onClick={() => moveVerse(1)}><ChevronRight size={19}/></button></nav>}
    {!['coach','reverse','bridge'].includes(mode)&&<button className={`icon-button ${spotlight ? 'active' : ''}`} aria-label="Odak görünümü" aria-pressed={spotlight} title="Odak" onClick={() => { stop(); setSpotlight(!spotlight); }}><Focus size={20}/></button>}
   </div></div>
   {loading && <div className="loading" role="status" aria-label="Yükleniyor"><span /><span /><span /></div>}
   {failed && <div className="retry"><button className="icon-button" aria-label="Yeniden dene" onClick={() => setRange([...range])}><RotateCcw size={22}/></button></div>}
   <div className="verse-list">{visible.map((v, vi) => {
            const allOpen = v.words.every((_, wi) => !hidden(v, vi, wi)), isPlaying = playing?.verse === v.number;
            const order=Array.from({length:v.words.length},(_,i)=>reverseWords===v.number?v.words.length-1-i:i);
            const nextWord = order.find(wi=>hidden(v,vi,wi))??-1;
            const currentStage = stageFor(vi, v), pausing = isPlaying && playing.phase === 'pause';
            const options = mode === 'quiz' && nextWord >= 0 && !pausing ? choicesFor(v.words[nextWord], pool, v.number + nextWord, !showArabic) : [];
            return <Fragment key={`${selected.key}:${v.number}`}><article className="verse-card" aria-label={`${v.number}. ayet`}>
    <div className="verse-header"><span className="verse-number">{v.number}</span><div className="verse-actions">
     <button className={`icon-button ${isPlaying && !playing.repeat ? 'active' : ''}`} disabled={!v.audio && !canSpeak} aria-label={isPlaying && !playing.repeat ? 'Durdur' : 'Dinle'} onClick={() => play(v)}>{isPlaying && !playing.repeat ? <Pause size={18}/> : <Play size={18}/>}</button>
     <button className={`icon-button ${isPlaying && playing.repeat ? 'active' : ''}`} disabled={!v.audio && !canSpeak} aria-label="Tekrarlı çal" aria-pressed={isPlaying && playing.repeat} onClick={() => play(v, true)}><Repeat2 size={19}/></button>
     <button className="icon-button" aria-label={allOpen ? 'Ayeti gizle' : 'Ayeti aç'} onClick={() => revealVerse(v, !allOpen)}>{allOpen ? <Eye size={19}/> : <EyeOff size={19}/>}</button>
    </div>{pausing && <span className="shadow-cue" role="status">🎙️ Sıra Sende — Yüksek Sesle Oku <span className="shadow-progress" role="progressbar" aria-label="4 saniye tekrar süresi" aria-valuemin={0} aria-valuemax={4}/></span>}</div>
    {(showArabic||showReading) && <div className="word-grid memorization-grid" dir="rtl" aria-label="Ayet kelimeleri">{v.words.map((w, wi) => {
        const h = hidden(v, vi, wi), marked = !!difficult[difficultyKey(v, wi)];
        const cue=h&&currentStage===3&&(!focus||pausing);
        const active = h && wi === nextWord && (currentStage === 4 || mode === 'quiz');
        const sequential = currentStage === 4 || mode === 'quiz';
        return <span key={wi} className={`word-tile ${marked ? 'difficult' : ''} ${active ? 'next-word' : ''} ${mode==='bridge'&&wi===0?'bridge-first':''} ${mode==='bridge'&&wi===v.words.length-1?'bridge-last':''} ${wrong === wordKey(v.number, wi) ? 'answer-wrong' : ''}`}>
            <button className="word-content" aria-label={`${wi + 1}. kelime ${h ? 'aç' : 'gizle'}`} aria-pressed={!h} disabled={pausing || (h && (mode === 'quiz' || (sequential && wi !== nextWord)))} onClick={() => toggle(wordKey(v.number, wi), h)} onDoubleClick={() => { mark(v, wi); toggle(wordKey(v.number, wi), true); }}>
            {showArabic&&<span className="word-arabic" lang="ar" aria-hidden={h&&!cue}>{h?(cue?`${firstArabic(displayArabic(w.arabic))}・・・`:<span className="word-slot">ـ ـ ـ</span>):displayArabic(w.arabic)}</span>}
            {showReading&&<span className="word-reading" lang="tr" dir="ltr" aria-hidden={h&&!cue}>{h?(cue?Array.from(w.reading).slice(0,3).join('')+'…':'···'):w.reading}{!h&&w.readingSource==='calculated'&&<small title="Arapçadan hesaplanan yardımcı okunuş; tilavetle kontrol et" aria-label="Hesaplanan yardımcı okunuş">†</small>}</span>}
            {!h&&showMeaning&&w.meaning&&<span className="word-gloss" dir="ltr" lang="tr">{w.meaning}</span>}
            </button>
            <button className="difficulty-dot" aria-label={`${wi + 1}. kelime: Zorlandım`} aria-pressed={marked} onClick={() => mark(v, wi)}>☆</button>
        </span>;
    })}</div>}
    {options.length > 0 && <div className="word-choices" aria-label="Kelime seçenekleri" dir={showArabic ? "rtl" : "ltr"}>{options.map((w, i) => <button key={i} lang={showArabic ? "ar" : "tr"} onClick={() => {
        const id = wordKey(v.number, nextWord), correct = w.arabic === v.words[nextWord].arabic;
        if (correct) { toggle(id, true); setWrong(null); }
        else { setWrong(id); setReveals(prev => ({...prev, [id]: true})); if (!difficult[difficultyKey(v, nextWord)]) mark(v, nextWord); }
    }}>{showArabic ? displayArabic(w.arabic) : w.reading}</button>)}</div>}
    {mode==='quiz'&&nextWord<0&&<p className="verse-done" role="status">✓ Ayet tamamlandı</p>}
    {mode!=='quiz'&&<div className="word-tools">
    {nextWord>=0&&<button disabled={pausing} onClick={()=>toggle(wordKey(v.number,nextWord),true)}>Sıradaki Kelimeyi Aç <kbd>Boşluk</kbd></button>}
    {['standard','reverse'].includes(mode)&&v.words.length>12&&<button aria-pressed={reverseWords===v.number} onClick={()=>{stop();setReverseWords(reverseWords===v.number?null:v.number);setReveals({});}}>Kelimeleri sondan başa {reverseWords===v.number?'✓':''}</button>}</div>}
    {showMeaning && <p className="verse-meaning">{v.meaning}</p>}
   </article>{mode==='bridge'&&!focus&&visible[vi+1]&&<div className="transition-bridge" aria-label={`${v.number}. ayetten ${visible[vi+1].number}. ayete geçiş`}><small>🔗 Geçiş Köprüsü</small><div><span lang="ar" dir="rtl">{displayArabic(v.words.at(-1)?.arabic??'')}</span><span aria-hidden="true">←</span><span lang="ar" dir="rtl">{displayArabic(visible[vi+1].words[0]?.arabic??'')}</span></div></div>}</Fragment>;
        })}</div>
   {mode === 'chain' && step < frame.last && <button className="chain-next" onClick={() => { stop(); setStep(step + 1); setReveals({}); setWrong(null); }}>Sonraki Adım <ArrowRight size={18}/></button>}
   {mode==='reverse'&&!focus&&<div className="method-next"><button disabled={loading||step<=1} onClick={()=>{stop();setStep(Math.max(1,step-1));setReveals({});}}>Önceki adım</button><button disabled={loading||step>=lesson.verses.length} onClick={()=>{stop();setStep(step+1);setReveals({});setWrong(null);}}>Önceki ayeti ekle ←</button><span>{Math.min(step,lesson.verses.length)}/{lesson.verses.length}</span></div>}

  </main>
 </div>;
}
