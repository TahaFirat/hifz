import type { Verse } from './types';
import { shadowDelay } from './learning.ts';
type Phase = 'listen' | 'pause' | 'check' | null;
/** Owns every callback and timer so stale sessions cannot restart playback. */
export function createShadowSession(verse: Verse, repeat: boolean, update: (phase: Phase) => void, pauseSeconds?:number) {
    let cancelled = false, timer: ReturnType<typeof setTimeout> | undefined, audio: HTMLAudioElement | undefined, utterance: SpeechSynthesisUtterance | undefined;
    let phase: Phase = 'listen', started = 0;
    const releaseAudio = () => {
        const current = audio; audio = undefined;
        if (current) {
            current.onended = null; current.onerror = null;
            try { current.pause(); current.removeAttribute?.('src'); current.load?.(); } catch {}
        }
    };
    const cancel = () => {
        cancelled = true; clearTimeout(timer);
        releaseAudio();
        if (utterance) { utterance.onend = null; utterance.onerror = null; try { speechSynthesis.cancel(); } catch {} }
    };
    const finish = () => { if (!cancelled) { cancel(); update(null); } };
    const ended = (duration: number) => {
        if (cancelled) return;
        if (!repeat || phase === 'check') { finish(); return; }
        phase = 'pause'; update(phase);
        timer = setTimeout(() => { if (!cancelled) { phase = 'check'; play(); } }, shadowDelay(pauseSeconds ?? duration));
    };
    const play = () => {
        if (cancelled) return;
        update(phase); started = Date.now();
        try { if (verse.audio) {
            const current = new Audio(verse.audio); audio = current;
            current.onended = () => {
                if (cancelled || audio !== current) return;
                const duration = current.duration || (Date.now() - started) / 1000;
                releaseAudio(); ended(duration);
            };
            current.onerror = () => { if (audio === current) finish(); };
            void current.play().catch(() => { if (audio === current) finish(); });
        } else if (typeof speechSynthesis !== 'undefined') {
            const voice = speechSynthesis.getVoices().find(v => /^ar(?:-|$)/i.test(v.lang));
            if (!voice) { finish(); return; }
            const current = new SpeechSynthesisUtterance(verse.arabic); utterance = current; current.voice = voice; current.rate = .8;
            current.onend = () => {
                if (cancelled || utterance !== current) return;
                current.onend = null; current.onerror = null; utterance = undefined;
                ended((Date.now() - started) / 1000);
            };
            current.onerror = () => { if (utterance === current) finish(); };
            speechSynthesis.speak(current);
        } else finish(); } catch { finish(); }
    };
    play(); return { cancel };
}
