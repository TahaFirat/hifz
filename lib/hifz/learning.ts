import type { Word } from './types';

export type StudyMode = 'standard' | 'chain' | 'quiz';
export const stages = ['1. Kodlama', '2. Ayet Sonu', '3. Anahtar Kelimeler', '4. Okunuş İpucu', '5. Aktif Hatırlama'];
export const arabicLetters = (text: string) => text.normalize('NFKC').replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '').replace(/ٱ/g, 'ا');
// Explicit particles, not a morphological classifier. Attached prefixes stay with their word.
const particles = new Set('من لم لن في عن على الى إلى ان إن أن لا ما و ف ثم او أو بل قد هل كل هو هي هم هن انا أنا انت أنت نحن به بها له لها لكم لهم فيه فيها'.split(' '));
export const isParticle = (word: Word) => arabicLetters(word.arabic).split(/\s+/).every(w => particles.has(w));
export function stageHidden(stage: number, words: Word[], index: number): boolean {
    if (stage === 0) return false;
    if (stage === 1) {
        const counts = words.map(w => w.arabic.trim().split(/\s+/).length);
        return counts.slice(0, index + 1).reduce((a, b) => a + b, 0) > counts.reduce((a, b) => a + b, 0) - 2;
    }
    return stage === 2 ? !isParticle(words[index]) : true;
}
export const firstArabic = (text: string) => arabicLetters(text).match(/[\u0621-\u063a\u0641-\u064a]/u)?.[0] || text.trim()[0] || '';
export const firstReading = (text: string) => Array.from(text.trim()).slice(0, 2).join('') + '…';
/** 1, 2, 1+2, 3, 1+2+3, ... */
export function chainFrame(step: number, count: number) {
    const last = Math.max(1, count * 2 - 1), s = Math.max(1, Math.min(step, last));
    if (s === 1) return { indices: count ? [0] : [], levels: [0], last };
    const newest = Math.floor(s / 2);
    return s % 2 === 0
        ? { indices: [newest], levels: [0], last }
        : { indices: Array.from({ length: newest + 1 }, (_, i) => i), levels: Array.from({ length: newest + 1 }, (_, i) => i === newest ? 1 : 3), last };
}
export function choicesFor(correct: Word, pool: Word[], seed: number, readingOnly = false): Word[] {
    const key = (w: Word) => readingOnly ? w.reading.trim().toLocaleLowerCase('tr') : arabicLetters(w.arabic);
    const unique = [...new Map(pool.filter(w => key(w) !== key(correct)).map(w => [key(w), w])).values()];
    // Stable, distinct source words; rotate the correct answer's position.
    const others = unique.length ? [unique[seed % unique.length], unique[(seed + Math.max(1, Math.floor(unique.length / 2))) % unique.length]].filter((w, i, a) => a.findIndex(x => key(x) === key(w)) === i) : [];
    const result = [...others.slice(0, 2)]; result.splice(seed % (result.length + 1), 0, correct); return result;
}
export const shadowDelay = (seconds: number) => Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 4000;
export function hasArabicVoice(speech?: Pick<SpeechSynthesis, 'getVoices'>) {
    try { return !!speech?.getVoices().some(v => /^ar(?:-|$)/i.test(v.lang)); } catch { return false; }
}
