import type { Verse } from './types';
import { shadowDelay } from './learning.ts';

export type Phase = 'listen' | 'pause' | 'check' | null;

export type ShadowOptions = {
    loopCount?: number;       // 1, 3, 5, or 99 (infinite)
    playbackRate?: number;    // 0.75, 1, 1.25
    pauseSeconds?: number;
    onLoopTick?: (current: number, total: number) => void;
    onComplete?: () => void;
};

/** Owns every callback and timer so stale sessions cannot restart playback. */
export function createShadowSession(
    verse: Verse,
    repeat: boolean,
    update: (phase: Phase) => void,
    pauseSecondsOrOpts?: number | ShadowOptions
) {
    const opts: ShadowOptions = typeof pauseSecondsOrOpts === 'number'
        ? { pauseSeconds: pauseSecondsOrOpts }
        : (pauseSecondsOrOpts ?? {});
    const totalLoops = Math.max(1, opts.loopCount ?? 1);
    const rate = opts.playbackRate && opts.playbackRate >= 0.5 && opts.playbackRate <= 2 ? opts.playbackRate : 1;

    let cancelled = false, timer: ReturnType<typeof setTimeout> | undefined, audio: HTMLAudioElement | undefined, utterance: SpeechSynthesisUtterance | undefined;
    let phase: Phase = 'listen', started = 0, currentLoop = 1;

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
    const finish = (completedNaturally = false) => {
        if (!cancelled) {
            cancel();
            update(null);
            if (completedNaturally) opts.onComplete?.();
        }
    };
    const ended = (duration: number) => {
        if (cancelled) return;
        if (repeat && phase === 'listen') {
            phase = 'pause'; update(phase);
            timer = setTimeout(() => { if (!cancelled) { phase = 'check'; play(); } }, shadowDelay(opts.pauseSeconds ?? duration));
            return;
        }
        if (currentLoop < totalLoops) {
            currentLoop += 1;
            phase = 'listen';
            opts.onLoopTick?.(currentLoop, totalLoops);
            timer = setTimeout(() => { if (!cancelled) play(); }, 380);
            return;
        }
        finish(true);
    };
    const play = () => {
        if (cancelled) return;
        update(phase);
        opts.onLoopTick?.(currentLoop, totalLoops);
        started = Date.now();
        try {
            if (verse.audio) {
                const current = new Audio(verse.audio);
                current.playbackRate = rate;
                audio = current;
                current.onended = () => {
                    if (cancelled || audio !== current) return;
                    const duration = (current.duration || (Date.now() - started) / 1000) / rate;
                    releaseAudio(); ended(duration);
                };
                current.onerror = () => { if (audio === current) finish(false); };
                void current.play().catch(() => { if (audio === current) finish(false); });
            } else if (typeof speechSynthesis !== 'undefined') {
                const voice = speechSynthesis.getVoices().find(v => /^ar(?:-|$)/i.test(v.lang));
                if (!voice) { finish(false); return; }
                const current = new SpeechSynthesisUtterance(verse.arabic);
                utterance = current; current.voice = voice; current.rate = 0.82 * rate;
                current.onend = () => {
                    if (cancelled || utterance !== current) return;
                    current.onend = null; current.onerror = null; utterance = undefined;
                    ended((Date.now() - started) / 1000);
                };
                current.onerror = () => { if (utterance === current) finish(false); };
                speechSynthesis.speak(current);
            } else finish(false);
        } catch { finish(false); }
    };
    play();
    return { cancel };
}
