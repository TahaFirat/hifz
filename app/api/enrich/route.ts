import { GoogleGenAI, Type } from '@google/genai';
import { env } from 'cloudflare:workers';
import { chapters } from '@/lib/hifz/catalog';
import { fetchLesson } from '@/lib/hifz/providers';
import { validRange } from '@/lib/hifz/core';
import { z } from 'zod';
export async function GET() { return Response.json({ available: Boolean((env as {
        GEMINI_API_KEY?: string;
    }).GEMINI_API_KEY) }); }
export async function POST(request: Request) {
    const key = (env as {
        GEMINI_API_KEY?: string;
    }).GEMINI_API_KEY;
    if (!key)
        return Response.json({ error: 'Gemini yapılandırılmadı. Sunucuya GEMINI_API_KEY eklenmesi gerekiyor.' }, { status: 503 });
    if (request.headers.get('origin') !== new URL(request.url).origin)
        return Response.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 });
    let p: {
        chapter: number;
        start: number;
        end: number;
    };
    try {
        p = z.object({ chapter: z.number().int(), start: z.number().int(), end: z.number().int() }).parse(await request.json());
    }
    catch {
        return Response.json({ error: 'Geçersiz istek.' }, { status: 400 });
    }
    const c = chapters.find(c => c.id === p.chapter);
    if (!c || !validRange(p.start, p.end, c.verseCount) || p.end - p.start >= 5)
        return Response.json({ error: 'Gemini için en fazla 5 ayet seçin.' }, { status: 400 });
    try {
        const lesson = await fetchLesson(p.chapter, p.start, p.end);
        const ai = new GoogleGenAI({ apiKey: key });
        const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Her Arapça kelime/grup için Türkçe okunuş ve kelime anlamını ver. Arapça metni ve sırasını DEĞİŞTİRME. Meali yeniden yazma. Yalnız JSON döndür. Veri: ${JSON.stringify(lesson.verses.map(v => ({ number: v.number, words: v.words.map(w => ({ arabic: w.arabic })) })))}`, config: { httpOptions: { timeout: 30000 }, temperature: 0, responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ['number', 'words'], properties: { number: { type: Type.INTEGER }, words: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ['arabic', 'reading', 'meaning'], properties: { arabic: { type: Type.STRING }, reading: { type: Type.STRING }, meaning: { type: Type.STRING } } } } } } } } });
        const generated = JSON.parse(result.text || 'null');
        if (!Array.isArray(generated) || generated.length !== lesson.verses.length)
            throw Error('Eksik sonuç');
        for (let i = 0; i < lesson.verses.length; i++) {
            const v = lesson.verses[i], g = generated[i];
            if (g.number !== v.number || g.words?.length !== v.words.length || g.words.some((w: {
                arabic: string;
                reading: string;
                meaning: string;
            }, j: number) => w.arabic !== v.words[j].arabic || !w.reading || !w.meaning || w.reading.length > 500 || w.meaning.length > 1000))
                throw Error('Kelime eşlemesi geçersiz');
            v.words = g.words;
            v.approximate = false;
        }
        return Response.json({ ...lesson, source: lesson.source + ' · Gemini kelime eşleştirmesi (yapay zekâ; doğruluğunu kaynak metinle kontrol edin).' });
    }
    catch {
        return Response.json({ error: 'Gemini zenginleştirmesi tamamlanamadı. Kaynak metin korunuyor.' }, { status: 502 });
    }
}
