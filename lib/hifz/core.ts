export function hiddenAt(level: number, index: number, count: number): boolean {
    if (level === 0)
        return false;
    if (level === 1)
        return index >= count - Math.max(1, Math.round(count / 4));
    if (level === 2)
        return index % 2 === 1;
    if (level === 3)
        return index > 0;
    return true;
}
export function effectiveLevel(level: number, chain: boolean, index: number, step: number): number {
    return chain ? (index < step - 1 ? 2 : 0) : level;
}
export function plain(text: string): string { return text.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim(); }
export function turkishReading(text: string): string {
    return text.replace(/sh/g, 'ş').replace(/th/g, 's').replace(/dh/g, 'z').replace(/kh/g, 'h').replace(/gh/g, 'ğ')
        .replace(/ḥ/g, 'h').replace(/ṣ/g, 's').replace(/ḍ/g, 'd').replace(/ṭ/g, 't').replace(/ẓ/g, 'z')
        .replace(/ā/g, 'â').replace(/ī/g, 'î').replace(/ū/g, 'û').replace(/ʿ/g, "‘").replace(/ʾ/g, "’").replace(/w/g, 'v');
}
export function verseAudio(chapter: number, verse: number): string {
    return `https://everyayah.com/data/Alafasy_128kbps/${String(chapter).padStart(3, '0')}${String(verse).padStart(3, '0')}.mp3`;
}
export function validRange(start: number, end: number, max: number): boolean {
    return Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start && end <= max;
}
export function stripBasmala(text: string, chapter: number, verse: number): string {
    if (chapter === 1 || chapter === 9 || verse !== 1)
        return text;
    const words = text.trim().split(/\s+/);
    const prefix = words.slice(0, 4).join(' ').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '').replace(/ٱ/g, 'ا');
    return prefix === 'بسم الله الرحمن الرحيم' ? words.slice(4).join(' ') : text;
}
