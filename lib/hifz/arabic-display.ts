/**
 * Formats Quranic Arabic for clear Turkish / Ahmed Hüsrev Mushaf reading
 * without mutating the underlying stored/recited verse text.
 */
export function displayArabic(text: string): string {
    return text
        .replace(/\u0671/g, 'ا')            // Alef wasla -> clear Alef
        .replace(/\u0640\u0670/g, '\u0670') // Remove stretching tatweel under superscript alef (ـٰ -> ٰ)
        .replace(/[\u06DF\u06E0]/g, '');    // Omit Uthmani silent circle marks for clean Turkish Mushaf flow
}
