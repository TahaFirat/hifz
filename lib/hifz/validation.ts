import type { Lesson } from './types';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
/** Validate caches and responses before either is allowed into the render path. */
export function isLesson(value: unknown, start: number, end: number): value is Lesson {
    if (!record(value) || typeof value.source !== 'string' || !Array.isArray(value.verses) || value.verses.length !== end - start + 1) return false;
    return value.verses.every((v: unknown, index: number) => record(v) && v.number === start + index && text(v.arabic) && text(v.reading) && text(v.meaning) && (v.audio === undefined || typeof v.audio === 'string') && Array.isArray(v.words) && v.words.length > 0 && v.words.length <= 500 && v.words.every((w: unknown) => record(w) && text(w.arabic) && typeof w.reading === 'string' && typeof w.meaning === 'string'));
}
export function restoreDisplay(value: unknown) {
    const v = record(value) ? value : {};
    const arabic = typeof v.arabic === 'boolean' ? v.arabic : true, reading = typeof v.reading === 'boolean' ? v.reading : true, meaning = typeof v.meaning === 'boolean' ? v.meaning : true;
    return { font: typeof v.font === 'number' && [0, 1, 2].includes(v.font) ? v.font : 0, arabic: arabic || (!reading && !meaning), reading, meaning };
}
