import type { Lesson, Word, Verse } from './types';
import { plain } from './core.ts';
/** Display the Turkish source transcription; never synthesize it from English. */
export function readableTurkish(text: string): string {
    const letters: Record<string, string> = { 'ḥ': 'h', 'ṣ': 's', 'ŝ': 's', 'ḍ': 'd', 'ṭ': 't', 'ẓ': 'z', 'ẕ': 'z', 'ż': 'z', 'ḳ': 'k', 'ḫ': 'h', 'ġ': 'ğ', 'ā': 'â', 'ī': 'î', 'ū': 'û', '`': '‘' };
    const clean = text.replace(/[ḥṣŝḍṭẓẕżḳḫġāīū`]/g, c => letters[c]).replace(/-/g, '').replace(/\s+/g, ' ').trim();
    return clean ? clean[0].toLocaleUpperCase('tr') + clean.slice(1) : '';
}
function consonants(text: string): string {
    return readableTurkish(text.toLowerCase().replace(/sh/g, 'ş').replace(/th/g, 's').replace(/dh/g, 'z').replace(/kh/g, 'h').replace(/gh/g, 'ğ').replace(/w/g, 'v'))
        .toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/q/g, 'k').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/[^bcdfghjklmnprstvyz]/g, '');
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
/** Only split at source phrase boundaries when the entire consonant alignment is exact. */
export function sourceGroups(words: Word[], reading: string, meaning: string): Word[] {
    const chunks = reading.trim().split(/\s+/).filter(s => consonants(s));
    const memo = new Map<string, Word[] | null>();
    function align(ci: number, wi: number): Word[] | null {
        if (ci === chunks.length)
            return wi === words.length ? [] : null;
        const key = `${ci}:${wi}`;
        if (memo.has(key))
            return memo.get(key)!;
        let joined = '';
        for (let end = wi; end < words.length; end++) {
            joined += consonants(words[end].reading);
            const expected = consonants(chunks[ci]);
            if (joined === expected) {
                const rest = align(ci + 1, end + 1);
                if (rest) {
                    const group = words.slice(wi, end + 1);
                    const result = [{ arabic: group.map(w => w.arabic).join(' '), reading: readableTurkish(chunks[ci]), meaning: group.map(w => w.meaning).join(' ') }, ...rest];
                    memo.set(key, result);
                    return result;
                }
            }
            if (joined.length > expected.length)
                break;
        }
        memo.set(key, null);
        return null;
    }
    // Keep Arabic word masking intact; the UI shows the intact Turkish source below
    // whenever its phrase boundaries cannot be matched without guessing.
    return align(0, 0) || words.map(w => ({ ...w, reading: '' }));
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
            const words = isolated?.length === v.words.length ? v.words.map((w, i) => ({ ...w, reading: isolated[i] })) : sourceGroups(v.words, row.reading, meaning);
            return { ...v, reading: readableTurkish(row.reading), meaning, words, approximate: false };
        }) };
}
/** Never invent a word reading when the source only supplies a connected phrase. */
export function displayWords(verse: Verse): Word[] {
    if (verse.words.every(w => w.reading)) return verse.words;
    return [{ arabic: verse.words.map(w => w.arabic).join(' '), reading: verse.reading, meaning: verse.meaning }];
}
