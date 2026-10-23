export type Word = {
    arabic: string;
    reading: string;
    meaning: string;
    readingSource?: 'source' | 'calculated';
};
export type Verse = {
    number: number;
    arabic: string;
    reading: string;
    meaning: string;
    words: Word[];
    audio?: string;
    approximate?: boolean;
};
export type Chapter = {
    id: number;
    name: string;
    arabicName: string;
    verseCount: number;
    revelation: string;
};
export type Content = {
    key: string;
    name: string;
    chapter: number;
    start: number;
    end: number;
    kind: 'surah' | 'prayer';
};
export type Lesson = {
    verses: Verse[];
    source: string;
};
export type Target = 'both' | 'reading' | 'meaning';
