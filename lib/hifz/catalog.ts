import chaptersData from './chapters.json';
import type { Chapter, Content } from './types';
export const chapters: Chapter[] = chaptersData;
const special: Content[] = [
    { key: 's1', name: 'Fâtiha', chapter: 1, start: 1, end: 7, kind: 'surah' },
    { key: 'k255', name: 'Âyetel Kürsî', chapter: 2, start: 255, end: 255, kind: 'surah' },
    { key: 'k285', name: 'Âmenerrasûlü', chapter: 2, start: 285, end: 286, kind: 'surah' },
    { key: 'h22', name: 'Hüvallahüllezi', chapter: 59, start: 22, end: 24, kind: 'surah' },
];
export const basics: Content[] = [...special, ...chapters.filter(c => c.id >= 93).map(c => ({ key: `s${c.id}`, name: c.name, chapter: c.id, start: 1, end: c.id === 96 ? 5 : c.verseCount, kind: 'surah' as const }))];
export const prayerCatalog: Content[] = ['Sübhaneke', 'Ettehiyyatü', 'Allahümme Salli', 'Allahümme Bârik', 'Rabbenâ Âtinâ', 'Rabbenağfirlî', 'Kunut Duası 1', 'Kunut Duası 2'].map((name, i) => ({ key: ['subhaneke', 'tahiyyat', 'salli', 'barik', 'rabbena', 'rabbenagfirli', 'kunut1', 'kunut2'][i], name, chapter: 0, start: 1, end: 1, kind: 'prayer' }));
export const allChapters: Content[] = chapters.map(c => ({ key: `all${c.id}`, name: c.name, chapter: c.id, start: 1, end: c.verseCount, kind: 'surah' }));
