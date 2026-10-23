import type { StudyMode } from './learning';

export type StudyState = { level: number; mode: StudyMode; step: number; cursor: number; spotlight: boolean; reveals: Record<string, boolean> };
export const defaultStudy = (): StudyState => ({ level: 0, mode: 'standard', step: 1, cursor: 0, spotlight: false, reveals: {} });
const integer = (v: unknown, min: number, max: number, fallback: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fallback;
/** Storage is optional and may have been edited or written by an older release. */
export function restoreStudy(value: unknown): StudyState {
    const fallback = defaultStudy();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
    const v = value as Record<string, unknown>;
    const entries = v.reveals && typeof v.reveals === 'object' && !Array.isArray(v.reveals) ? Object.entries(v.reveals).slice(0, 2000).filter(([k, val]) => /^\d{1,3}:\d{1,3}$/.test(k) && typeof val === 'boolean') : [];
    return { level: integer(v.level, 0, 4, 0), mode: v.mode === 'chain' || v.mode === 'quiz' ? v.mode : 'standard', step: integer(v.step, 1, 39, 1), cursor: integer(v.cursor, 0, 19, 0), spotlight: v.spotlight === true, reveals: Object.fromEntries(entries) };
}
export function lessonRange(start: unknown, end: unknown, content: {start: number; end: number}): [number, number] {
    const s = Number(start), e = Number(end);
    return start !== undefined && end !== undefined && Number.isInteger(s) && Number.isInteger(e) && s >= content.start && e <= content.end && e >= s && e - s < 20 ? [s, e] : [content.start, Math.min(content.end, content.start + (content.end - content.start > 19 ? 4 : 19))];
}
