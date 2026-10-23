import type { Lesson, Word, Verse } from './types';
import { plain } from './core.ts';
import { alignArabicWords } from './transliteration.ts';
/** Display the Turkish source transcription; never synthesize it from English. */
export function readableTurkish(text: string): string {
    const letters: Record<string, string> = { 'ḥ': 'h', 'ṣ': 's', 'ŝ': 's', 'ḍ': 'd', 'ṭ': 't', 'ẓ': 'z', 'ẕ': 'z', 'ż': 'z', 'ḳ': 'k', 'ḫ': 'h', 'ġ': 'ğ', 'ā': 'â', 'ī': 'î', 'ū': 'û', '`': '‘' };
    const clean = text.replace(/[ḥṣŝḍṭẓẕżḳḫġāīū`]/g, c => letters[c]).replace(/-/g, '').replace(/\s+/g, ' ').trim();
    return clean ? clean[0].toLocaleUpperCase('tr') + clean.slice(1) : '';
}
// Independent word onsets for Fatiha; connected recitation remains in verse.reading.
const fatiha: Record<number, string[]> = {
    1: ['Bismi', 'Allâhi', 'Errahmâni', 'Errahîm'],
    2: ['Elhamdü', 'Lillâhi', 'Rabbi', 'El-âlemîn'],
    3: ['Errahmâni', 'Errahîm'],
    4: ['Mâliki', 'Yevmi', 'Ed-dîn'],
    5: ['İyyâke', 'Na‘büdü', 'Ve iyyâke', 'Neste‘în'],
    6: ['İhdinâ', 'Es-sırâta', 'El-müstekîm'],
    7: ['Sırâta', 'Ellezîne', 'En‘amte', 'Aleyhim', 'Ğayri', 'El-mağdûbi', 'Aleyhim', 'Ve lâ', 'Ed-dâllîn'],
};
/** Preserve the public helper; all output units are now independent Arabic words. */
export function sourceGroups(words: Word[], reading: string, meaning: string): Word[] {
    return alignArabicWords(words, reading, false);
}
export function withTurkishSource(lesson: Lesson, chapter: number, source: Record<string, {
    reading: string;
    meaning: string;
}>): Lesson {
    return { ...lesson, source: 'AlQuran Cloud · Muhammet Abay Türkçe çeviriyazı ve Diyanet Vakfı meali', verses: lesson.verses.map(v => {
            const row = source[v.number];
            if (!row?.reading || !row.meaning)
                throw Error('Türkçe kaynak eksik');
            const meaning = plain(row.meaning);
            const isolated = chapter === 1 ? fatiha[v.number] : undefined;
            const nativeTurkish = lesson.source.startsWith('Açık Kuran') && !v.approximate && v.words.every(w => w.reading.trim());
            const independent=alignArabicWords(v.words,row.reading,nativeTurkish);
            const words = isolated?.length === independent.length ? independent.map((w, i) => ({ ...w, reading: isolated[i],readingSource:'source' as const })) : independent.map(w=>({...w,reading:readableTurkish(w.reading)}));
            return { ...v, reading: readableTurkish(row.reading), meaning, words, approximate: false };
        }) };
}
/** Always tokenize the UI, including old cached phrase-based lessons and prayers. */
export function displayWords(verse: Verse): Word[] {
    return alignArabicWords(verse.words.length ? verse.words : [{arabic:verse.arabic,reading:'',meaning:''}], verse.reading);
}
