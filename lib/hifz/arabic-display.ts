/** Same display convention as zkr/Huşu. Never mutate the stored/recited source. */
export function displayArabic(text: string): string {
    return text.replace(/\u0671/g, 'ا');
}
