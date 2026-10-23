import { isLesson } from './validation.ts';
/** Covers both response headers and body; cancellation never leaves a permanent spinner. */
export async function requestLesson(chapter: number, start: number, end: number, signal: AbortSignal) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal.aborted) throw Error('İstek iptal edildi');
    signal.addEventListener('abort', cancel, {once:true});
    const timer = setTimeout(cancel, 30000);
    let rejectAbort = () => {};
    const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = () => reject(Error('İstek iptal edildi')); controller.signal.addEventListener('abort', rejectAbort, {once:true}); });
    try {
        const request = async () => {
            const response = await fetch(`/api/lesson?chapter=${chapter}&start=${start}&end=${end}`, {signal:controller.signal});
            if (!response.ok) throw Error('İçerik yüklenemedi');
            const data: unknown = await response.json();
            if (controller.signal.aborted) throw Error('İstek iptal edildi');
            if (!isLesson(data, start, end)) throw Error('Eksik içerik');
            return data;
        };
        return await Promise.race([request(), aborted]);
    } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); controller.signal.removeEventListener('abort', rejectAbort); }
}
