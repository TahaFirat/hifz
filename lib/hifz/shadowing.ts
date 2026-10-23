import type { Verse } from './types';
import { shadowDelay } from './learning.ts';
type Phase = 'listen' | 'pause' | 'check' | null;
/** Owns every callback and timer so stale sessions cannot restart playback. */
export function createShadowSession(verse: Verse, repeat: boolean, update: (phase: Phase) => void) {
    let cancelled = false, timer: ReturnType<typeof setTimeout> | undefined, audio: HTMLAudioElement | undefined, utterance: SpeechSynthesisUtterance | undefined;
    let phase: Phase = 'listen', started = 0;
    const cancel = () => {
        cancelled = true; clearTimeout(timer);
        if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); }
        if (utterance) { utterance.onend = null; utterance.onerror = null; speechSynthesis.cancel(); }
    };
    const finish = () => { cancel(); update(null); };
    const ended = (duration: number) => {
        if (cancelled) return;
        if (!repeat || phase === 'check') { finish(); return; }
        phase = 'pause'; update(phase);
        timer = setTimeout(() => { if (!cancelled) { phase = 'check'; play(); } }, shadowDelay(duration));
    };
    const play = () => {
        if (cancelled) return;
        update(phase); started = Date.now();
        if (verse.audio) {
            audio = new Audio(verse.audio);
            audio.onended = () => ended(audio?.duration || (Date.now() - started) / 1000);
            audio.onerror = finish;
            void audio.play().catch(() => { if (!cancelled) finish(); });
        } else if (typeof speechSynthesis !== 'undefined') {
            const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ar'));
            if (!voice) { finish(); return; }
            utterance = new SpeechSynthesisUtterance(verse.arabic); utterance.voice = voice; utterance.rate = .8;
            utterance.onend = () => ended((Date.now() - started) / 1000);
            utterance.onerror = () => { if (!cancelled) finish(); };
            speechSynthesis.speak(utterance);
        } else finish();
    };
    play(); return { cancel };
}
