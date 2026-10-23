import { plain, verseAudio, stripBasmala } from './core';
import turkishData from './turkish.json';
import { withTurkishSource } from './readings';
import type { Lesson, Verse } from './types';
import { z } from 'zod';
const verseSchema = z.object({ verse: z.string().min(1), transcription_tr: z.string(), translation: z.object({ text: z.string().min(1) }) });
const partsSchema = z.array(z.object({ arabic: z.string().min(1), transcription_tr: z.string(), translation_tr: z.string() })).min(1);
const cloudSchema = z.array(z.object({ ayahs: z.array(z.object({ numberInSurah: z.number(), number: z.number(), text: z.string(), audio: z.string().optional() })) })).length(4);
const quranSchema = z.object({ verse: z.object({ words: z.array(z.object({ char_type_name: z.string(), text_uthmani: z.string(), transliteration: z.object({ text: z.string().nullable() }), translation: z.object({ text: z.string() }) })), translations: z.array(z.object({ text: z.string() })).optional() }) });
async function quranVerse(chapter: number, n: number): Promise<Verse> {
    const data = quranSchema.parse(await json(`https://api.quran.com/api/v4/verses/by_key/${chapter}:${n}?language=tr&words=true&word_fields=text_uthmani&translations=77`)).verse;
    const words = data.words.filter(w => w.char_type_name === 'word').map(w => ({ arabic: w.text_uthmani, reading: w.transliteration.text || '', meaning: plain(w.translation.text) }));
    if (!words.length || !data.translations?.[0]?.text)
        throw Error('Eksik ayet');
    return { number: n, arabic: words.map(w => w.arabic).join(' '), reading: words.map(w => w.reading).join(' '), meaning: plain(data.translations[0].text), words, audio: verseAudio(chapter, n), approximate: true };
}
async function json(url: string) {
    const response = await fetch(url, { signal: AbortSignal.timeout(18000) });
    if (!response.ok)
        throw new Error(`Kaynak HTTP ${response.status}`);
    return response.json();
}
async function fetchProviderLesson(chapter: number, start: number, end: number): Promise<Lesson> {
    try {
        const results = await Promise.all(Array.from({ length: end - start + 1 }, async (_, i): Promise<Verse> => {
            const n = start + i;
            const [v, p] = await Promise.all([
                json(`https://api.acikkuran.com/surah/${chapter}/verse/${n}?author=11`),
                json(`https://api.acikkuran.com/surah/${chapter}/verse/${n}/verseparts`),
            ]);
            const row = verseSchema.parse(z.object({ data: z.unknown() }).parse(v).data);
            const parts = partsSchema.parse(z.object({ data: z.unknown() }).parse(p).data);
            return { number: n, arabic: row.verse, reading: row.transcription_tr, meaning: plain(row.translation.text), audio: verseAudio(chapter, n), words: parts.map(w => ({ arabic: w.arabic, reading: w.transcription_tr, meaning: w.translation_tr })) };
        }));
        return { source: 'Açık Kuran · Diyanet meali ve Türkçe kelime verisi', verses: results };
    }
    catch {
        let cloud;
        try {
            cloud = await json(`https://api.alquran.cloud/v1/surah/${chapter}/editions/quran-uthmani,tr.transliteration,tr.diyanet,ar.alafasy`);
        }
        catch {
            const verses: Verse[] = [];
            for (let n = start; n <= end; n++)
                verses.push(await quranVerse(chapter, n));
            return { source: 'Quran.com · Arapça metin, kelime anlamı, Diyanet meali. Diğer kaynaklar yanıt vermedi; tam okunuş ve kelime okunuşları otomatik fonetik dönüşümdür.', verses };
        }
        const [ar, tr, meaning, audio] = cloudSchema.parse(z.object({ data: z.unknown() }).parse(cloud).data);
        const verses: Verse[] = await Promise.all(ar.ayahs.filter((a: {
            numberInSurah: number;
        }) => a.numberInSurah >= start && a.numberInSurah <= end).map(async (a: {
            numberInSurah: number;
            text: string;
            number: number;
        }) => {
            const n = a.numberInSurah;
            const read = tr.ayahs.find((x: {
                numberInSurah: number;
            }) => x.numberInSurah === n)?.text || '';
            const mean = meaning.ayahs.find((x: {
                numberInSurah: number;
            }) => x.numberInSurah === n)?.text || '';
            let words;
            try {
                const q = await json(`https://api.quran.com/api/v4/verses/by_key/${chapter}:${n}?language=tr&words=true&word_fields=text_uthmani`);
                words = quranSchema.parse(q).verse.words.filter(w => w.char_type_name === 'word').map(w => ({ arabic: w.text_uthmani, reading: w.transliteration.text || '', meaning: plain(w.translation.text) }));
            }
            catch {
                // Preserve the authentic reading and translation together when word alignment is unavailable.
                words = [{ arabic: stripBasmala(a.text, chapter, n), reading: read, meaning: mean }];
            }
            return { number: n, arabic: words.map((w: {
                    arabic: string;
                }) => w.arabic).join(' '), reading: read, meaning: mean, audio: audio.ayahs.find((x: {
                    numberInSurah: number;
                }) => x.numberInSurah === n)?.audio || verseAudio(chapter, n), words, approximate: true };
        }));
        if (verses.length !== end - start + 1)
            throw Error('Ayet aralığı eksik döndü');
        return { source: 'AlQuran Cloud · Diyanet meali / Quran.com · kelime anlamları. Açık Kuran bağlantısı kurulamadı; kelime okunuşları fonetik dönüşümdür.', verses };
    }
}
export async function fetchLesson(chapter: number, start: number, end: number): Promise<Lesson> {
    const source = (turkishData as Record<string, Record<string, {
        reading: string;
        meaning: string;
    }>>)[chapter];
    if (!source)
        throw Error('Sure bulunamadı');
    return withTurkishSource(await fetchProviderLesson(chapter, start, end), chapter, source);
}
