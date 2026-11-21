import type { Verse } from './types';

export type TeacherWordTarget = {
    index: number;
    verseNumber: number;
    displayArabic: string;
    canonicalArabic: string;
    skeletonArabic: string;
    readingTr: string;
    canonicalTr: string;
    meaningTr: string;
};

export type WordEvalState = 'pending' | 'correct' | 'hinted' | 'mistake-corrected';

// Classical Uthmani-to-Imla'i word equivalents so ASR Modern Standard Arabic matches Uthmani Quran script 100%
const UTHMANI_EQUIVALENTS: Record<string, string> = {
    'صلوه': 'صلاه',
    'الصلوه': 'الصلاه',
    'زكوه': 'زكاه',
    'الزكوه': 'الزكاه',
    'حيوه': 'حياه',
    'الحيوه': 'الحياه',
    'غدوه': 'غداه',
    'مشكوه': 'مشكاه',
    'نجوه': 'نجاه',
    'منوه': 'مناه',
    'ربوا': 'ربا',
    'الربوا': 'الربا',
    'سموت': 'سماوات',
    'السموت': 'السماوات',
    'اله': 'الاه',
    'الرحمن': 'الرحمان',
    'رحمن': 'رحمان',
    'ذلك': 'ذالك',
    'ولكن': 'ولاكن',
    'لكن': 'لاكن',
    'اولئك': 'اولايك',
    'ملئكه': 'ملايكه',
    'المليكه': 'الملايكه',
    'الملئكه': 'الملايكه',
    'يأيها': 'ياايها',
    'يايها': 'ياايها',
    'هؤلآء': 'هاولاء',
    'هؤلاء': 'هاولاء',
};

/** Strips tashkeel, waqf marks, tatweel and normalizes Arabic letters into canonical Imla'i form. */
export function canonicalizeArabic(raw: string): string {
    if (!raw) return '';
    let s = raw
        // Convert superscript alef (dagger alef \u0670) to regular alef before stripping harakat so رحمٰن -> رحمان
        .replace(/\u0640?\u0670/g, 'ا')
        // Remove Quranic pause marks, tashkeel, sukun, shadda, maddah, small high letters
        .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640\u06DD\u08D4-\u08FF]/g, '')
        // Normalize all alef/hamza variants
        .replace(/[أإآٱٲٳٵ]/g, 'ا')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئىی]/g, 'ي')
        .replace(/[ةۀ]/g, 'ه')
        .replace(/[ک]/g, 'ك')
        .replace(/[^\u0621-\u064A\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (UTHMANI_EQUIVALENTS[s]) {
        s = UTHMANI_EQUIVALENTS[s];
    }
    return s;
}

/** Consonantal skeleton (removes weak interior alefs & duplicate letters) so Uthmani vs ASR vowel length never causes false errors. */
export function skeletonizeArabic(canonical: string): string {
    if (!canonical) return '';
    let s = canonical;
    if (s.startsWith('ال') && s.length > 3) {
        s = s.slice(2);
    }
    // Keep leading alef if any, strip interior/trailing weak alefs & hamzas
    const head = s[0] || '';
    const rest = s.slice(1).replace(/[اء]/g, '');
    return (head + rest).replace(/(.)\1+/g, '$1');
}

/** Normalizes Turkish phonetic transliteration for tr-TR ASR matching. */
export function canonicalizeTurkishReading(raw: string): string {
    if (!raw) return '';
    return raw
        .toLowerCase()
        .replace(/[âāáà]/g, 'a')
        .replace(/[îīíì]/g, 'i')
        .replace(/[ûūúù]/g, 'u')
        .replace(/[êé]/g, 'e')
        .replace(/[ôó]/g, 'o')
        .replace(/['’`´‘ʿʾ\-.,;:!?()]/g, '')
        .replace(/ğ/g, 'g')
        .replace(/ş/g, 's')
        .replace(/ç/g, 'c')
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ı/g, 'i')
        .replace(/(.)\1+/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Normalized Levenshtein similarity in [0, 1]. */
export function stringSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > Math.max(m, n) * 0.6) return 0;
    const dp = Array.from({ length: m + 1 }, (_, i) => i);
    for (let j = 1; j <= n; j++) {
        let prev = dp[0];
        dp[0] = j;
        for (let i = 1; i <= m; i++) {
            const temp = dp[i];
            dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
            prev = temp;
        }
    }
    return 1 - dp[m] / Math.max(m, n);
}

/** Checks if a spoken Arabic token matches a target Quranic word (accounting for conjunction و prefix & sun-letter assimilation). */
export function isArabicWordMatch(spokenRaw: string, target: TeacherWordTarget): boolean {
    const spoken = canonicalizeArabic(spokenRaw);
    if (!spoken || !target.canonicalArabic) return false;
    if (spoken === target.canonicalArabic) return true;

    // Handle attached/detached Waw (و) or Fa (ف) prefix common in ASR vs Mushaf tokenization
    const stripConj = (w: string) => (w.length > 2 && (w.startsWith('و') || w.startsWith('ف')) ? w.slice(1) : w);
    if (stripConj(spoken) === stripConj(target.canonicalArabic)) return true;

    const skSpoken = skeletonizeArabic(spoken);
    const skTarget = target.skeletonArabic;
    if (skSpoken && skTarget && skSpoken === skTarget) return true;
    if (skSpoken && skTarget && skeletonizeArabic(stripConj(spoken)) === skeletonizeArabic(stripConj(target.canonicalArabic))) return true;

    // Fuzzy similarity threshold for longer words (>= 3 letters)
    if (target.canonicalArabic.length >= 3) {
        if (stringSimilarity(spoken, target.canonicalArabic) >= 0.74) return true;
        if (skSpoken.length >= 2 && skTarget.length >= 2 && stringSimilarity(skSpoken, skTarget) >= 0.76) return true;
    }
    return false;
}

/** Checks if a spoken Turkish transliteration token matches the target reading word. */
export function isTurkishWordMatch(spokenRaw: string, target: TeacherWordTarget): boolean {
    const spoken = canonicalizeTurkishReading(spokenRaw);
    const t = target.canonicalTr;
    if (!spoken || !t) return false;
    if (spoken === t) return true;
    if (t.length >= 4 && (spoken.includes(t) || t.includes(spoken))) return true;
    if (t.length >= 3 && stringSimilarity(spoken, t) >= 0.7) return true;
    return false;
}

/** Builds flat word-by-word targets across all verses in the selected lesson. */
export function buildTeacherTargets(verses: Verse[]): TeacherWordTarget[] {
    const targets: TeacherWordTarget[] = [];
    for (const v of verses) {
        if (v.words && v.words.length > 1) {
            for (const w of v.words) {
                const cleanDisp = w.arabic.trim();
                const canonAr = canonicalizeArabic(cleanDisp);
                if (!canonAr) continue;
                targets.push({
                    index: targets.length,
                    verseNumber: v.number,
                    displayArabic: cleanDisp,
                    canonicalArabic: canonAr,
                    skeletonArabic: skeletonizeArabic(canonAr),
                    readingTr: w.reading || '',
                    canonicalTr: canonicalizeTurkishReading(w.reading || ''),
                    meaningTr: w.meaning || '',
                });
            }
        } else {
            const arTokens = v.arabic.trim().split(/\s+/u).filter(Boolean);
            const trTokens = (v.reading || '').trim().split(/\s+/u).filter(Boolean);
            arTokens.forEach((tok, idx) => {
                const canonAr = canonicalizeArabic(tok);
                if (!canonAr) return;
                const trTok = trTokens[idx] || '';
                targets.push({
                    index: targets.length,
                    verseNumber: v.number,
                    displayArabic: tok,
                    canonicalArabic: canonAr,
                    skeletonArabic: skeletonizeArabic(canonAr),
                    readingTr: trTok,
                    canonicalTr: canonicalizeTurkishReading(trTok),
                    meaningTr: idx === 0 ? v.meaning : '',
                });
            });
        }
    }
    return targets;
}

export type AlignmentStepResult = {
    nextCursor: number;
    newlyMatchedIndices: number[];
    skippedViaLookaheadIndices: number[];
    detectedMismatchWord: string | null;
};

/**
 * Evaluates newly spoken tokens from the live ASR stream starting at `currentCursor`.
 * Supports joined two-word ASR tokens (e.g. "بسم الله" or "إن شاء") and 1-word Tajweed idgham lookahead.
 */
export function evaluateSpokenTokens(
    newTokens: string[],
    targets: TeacherWordTarget[],
    currentCursor: number,
    localeMode: 'ar-SA' | 'tr-TR'
): AlignmentStepResult {
    let cursor = currentCursor;
    const newlyMatched: number[] = [];
    const skippedLookahead: number[] = [];
    let mismatch: string | null = null;

    const matchFn = localeMode === 'ar-SA' ? isArabicWordMatch : isTurkishWordMatch;

    for (let i = 0; i < newTokens.length && cursor < targets.length; i++) {
        const rawTok = newTokens[i].trim();
        if (!rawTok) continue;

        const currentTarget = targets[cursor];

        // 1. Direct match on current expected word
        if (matchFn(rawTok, currentTarget)) {
            newlyMatched.push(cursor);
            cursor += 1;
            mismatch = null;
            continue;
        }

        // 2. Check if ASR merged two short target words into one token (e.g. "يأيها" or "ماخلق" or "بسمالله")
        if (cursor + 1 < targets.length) {
            const combinedTarget: TeacherWordTarget = {
                ...currentTarget,
                canonicalArabic: currentTarget.canonicalArabic + targets[cursor + 1].canonicalArabic,
                skeletonArabic: currentTarget.skeletonArabic + targets[cursor + 1].skeletonArabic,
                canonicalTr: currentTarget.canonicalTr + targets[cursor + 1].canonicalTr,
            };
            if (matchFn(rawTok, combinedTarget)) {
                newlyMatched.push(cursor, cursor + 1);
                cursor += 2;
                mismatch = null;
                continue;
            }
        }

        // 3. Check if ASR split one compound word across rawTok + newTokens[i+1]
        if (i + 1 < newTokens.length) {
            const mergedSpoken = rawTok + ' ' + newTokens[i + 1].trim();
            const mergedNoSpace = rawTok + newTokens[i + 1].trim();
            if (matchFn(mergedSpoken, currentTarget) || matchFn(mergedNoSpace, currentTarget)) {
                newlyMatched.push(cursor);
                cursor += 1;
                i += 1;
                mismatch = null;
                continue;
            }
        }

        // 4. Short-particle Tajweed assimilation lookahead (e.g. "مِن شَرِّ" where "مِن" assimilates into "شَرِّ")
        if (
            cursor + 1 < targets.length &&
            currentTarget.canonicalArabic.length <= 3 &&
            matchFn(rawTok, targets[cursor + 1])
        ) {
            skippedLookahead.push(cursor);
            newlyMatched.push(cursor, cursor + 1);
            cursor += 2;
            mismatch = null;
            continue;
        }

        // 5. Ignore echo of the immediately preceding already-matched word
        if (cursor > 0 && matchFn(rawTok, targets[cursor - 1])) {
            continue;
        }

        // Otherwise record a mismatch candidate
        mismatch = rawTok;
    }

    return {
        nextCursor: cursor,
        newlyMatchedIndices: newlyMatched,
        skippedViaLookaheadIndices: skippedLookahead,
        detectedMismatchWord: mismatch,
    };
}
