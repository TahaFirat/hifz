import type { StudyMode } from './learning';
import type { Content } from './types';
import {restoreCoach,type CoachState} from './methods.ts';

export type StudyState = { level: number; mode: StudyMode; step: number; cursor: number; spotlight: boolean; reveals: Record<string, boolean>;coach?:CoachState;reverseWords?:boolean;reverseVerse?:number };
export const defaultStudy = (): StudyState => ({ level: 0, mode: 'standard', step: 1, cursor: 0, spotlight: false, reveals: {} });
const integer = (v: unknown, min: number, max: number, fallback: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fallback;

export type AyahStudyState={schema:3;level:number;mode:'list'|'coach'|'reverse'|'shadow';step:number;cursor:number;spotlight:boolean;reveals:Record<string,boolean>;coach:CoachState;orderTest:boolean};
export const defaultAyahStudy=():AyahStudyState=>({schema:3,level:0,mode:'list',step:1,cursor:0,spotlight:false,reveals:{},coach:restoreCoach(null),orderTest:false});
/** Restore verse-keyed progress; old verse:word-index reveal keys are intentionally ignored. */
export function restoreAyahStudy(value:unknown):AyahStudyState {
    const fallback=defaultAyahStudy();if(!value||typeof value!=='object'||Array.isArray(value))return fallback;
    const v=value as Record<string,unknown>;
    const rawMode=String(v.mode||'list');
    const mode:AyahStudyState['mode']=rawMode==='coach'||rawMode==='chain'?'coach':rawMode==='reverse'?'reverse':rawMode==='shadow'||rawMode==='quiz'?'shadow':'list';
    const rawLevel=integer(v.level,0,4,0),level=v.schema===3?rawLevel:rawLevel===3?1:rawLevel;
    const entries=v.reveals&&typeof v.reveals==='object'&&!Array.isArray(v.reveals)?Object.entries(v.reveals).slice(0,286).filter(([k,val])=>/^\d{1,3}$/u.test(k)&&typeof val==='boolean'):[];
    return {schema:3,level,mode,step:integer(v.step,1,39,1),cursor:integer(v.cursor,0,285,0),spotlight:v.spotlight===true,reveals:Object.fromEntries(entries),coach:restoreCoach(v.coach),orderTest:v.orderTest===true};
}
/** Storage is optional and may have been edited or written by an older release. */
export function restoreStudy(value: unknown): StudyState {
    const fallback = defaultStudy();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
    const v = value as Record<string, unknown>;
    const entries = v.reveals && typeof v.reveals === 'object' && !Array.isArray(v.reveals) ? Object.entries(v.reveals).slice(0, 2000).filter(([k, val]) => /^\d{1,3}:\d{1,3}$/.test(k) && typeof val === 'boolean') : [];
    return { level: integer(v.level, 0, 4, 0), mode: ['chain','quiz','coach','reverse','bridge'].includes(String(v.mode)) ? v.mode as StudyMode : 'standard', step: integer(v.step, 1, 39, 1), cursor: integer(v.cursor, 0, 19, 0), spotlight: v.spotlight === true, reveals: Object.fromEntries(entries),...(v.coach?{coach:restoreCoach(v.coach)}:{}),...(v.reverseWords===true?{reverseWords:true,reverseVerse:integer(v.reverseVerse,1,286,1)}:{}) };
}
export function lessonRange(start: unknown, end: unknown, content: {start: number; end: number}): [number, number] {
    const s = Number(start), e = Number(end);
    return start !== undefined && end !== undefined && Number.isInteger(s) && Number.isInteger(e) && s >= content.start && e <= content.end && e >= s && e - s < 20 ? [s, e] : [content.start, Math.min(content.end, content.start + (content.end - content.start > 19 ? 4 : 19))];
}
/** Shared by initial props and offline-shell recovery; unknown query values use the catalog default. */
export function lessonSelection(input: {category?: string | null; key?: string | null; start?: string | null; end?: string | null}, lists: Record<'basics' | 'prayers' | 'all', Content[]>) {
    const category = input.category === 'prayers' || input.category === 'all' ? input.category : 'basics';
    const content = lists[category].find(c => c.key === input.key) || lists[category][0];
    return {category, content, range: lessonRange(input.start ?? undefined, input.end ?? undefined, content)};
}
