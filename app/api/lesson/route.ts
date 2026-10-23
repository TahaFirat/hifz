import { chapters } from '@/lib/hifz/catalog';
import { validRange } from '@/lib/hifz/core';
import { fetchLesson } from '@/lib/hifz/providers';
export async function GET(request: Request) {
    const p = new URL(request.url).searchParams;
    const chapter = Number(p.get('chapter')), start = Number(p.get('start')), end = Number(p.get('end'));
    const c = chapters.find(c => c.id === chapter);
    if (!c || !validRange(start, end, c.verseCount) || end - start >= 20)
        return Response.json({ error: '1–20 ayet arasında geçerli bir aralık seçin.' }, { status: 400 });
    try {
        return Response.json(await fetchLesson(chapter, start, end), { headers: { 'Cache-Control': 'public, max-age=86400' } });
    }
    catch {
        return Response.json({ error: 'Veri kaynaklarına ulaşılamadı. İnternet bağlantınızı kontrol edip yeniden deneyin. Gömülü sure ve dualar çevrimdışı kullanılabilir.' }, { status: 503 });
    }
}
