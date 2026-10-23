# Adaptive memorization verification

The original Verse model and provider/cache validation remain compatible. `StudyUnit` is a presentation layer with a stable parent verse number and segment ID (`255.1` etc.). No word-card interaction remains in the study UI.

- Short (1–7 Arabic words): one whole verse.
- Medium (8–14): two sections, preferring a source waqf boundary. An annotation token is not counted as a word.
- Long: source-marked stops first; oversized spans are study sections of approximately 5–7 words. Meaningful curated phrases can exceed that range rather than separating dependent text.
- Explicit three-language plans cover 1:7, 2:255, 2:285–286, 59:22–24 and all eight prayers. Ayat al-Kursi has nine stops. Original Arabic words, marks and order are preserved.
- Ordinary Arabic letters inside words are never stop delimiters. No-stop annotations are excluded as split points; paired marks are not both selected. A mechanical study boundary is labelled “Bölüm”, not presented as a canonical waqf ruling.
- Generic punctuation alignment is used only when source-marked Arabic stops and source clause counts agree. This is a heuristic, not a semantic certification. Otherwise the original reading/meaning remains available together in an ayah-level disclosure; no guessed partial translation or synthesized Turkish pronunciation is generated.
- Existing audio is a full-ayah recording. It has its own control above segmented ayahs. Segment controls require an available Arabic device voice; no segment recording or audio timestamp is fabricated.
- Study state uses a new v4 namespace and stable segment IDs. Previous progress is retained in its previous storage key. Difficulty marks are browser-local and carried into the new namespace.

## Evidence

- Fixture-tested: Arabic source coverage; short/medium thresholds; all curated plans and prayers; nine Ayat al-Kursi anchors; no-stop preservation; source-safe fallback; more than twenty coach units; state restoration; stable, distinct ordering choices.
- Live-tested against local preview: 3 read → 3 recall → 2 linking; reverse 9 → 8+9; wrong/correct ordering; cue reveal; anchor-only state; whole view; refresh persistence. DOM overflow checks at 320, 390 and 768 CSS px. These were browser viewport checks, not physical-device tests.
- Skipped: physical iOS/Android audio and a complete reciter/tajwid review of every possible automatically generated section. Source providers are covered by fixtures; no new live-provider reliability claim is made.

## Sources and limits

Waqf/ibtida terminology and the distinction between permitted and prohibited stops: [TDV İslâm Ansiklopedisi](https://islamansiklopedisi.org.tr/vakf-ve-ibtida). The final missing meaning in the embedded 2:286 source was completed against [Diyanet’s 2:286 meal](https://kuran.diyanet.gov.tr/mushaf/kuran-meal-1/bakara-suresi-2/ayet-286/diyanet-isleri-baskanligi-meali-1). Existing whole-verse readings remain unchanged; curated segment readings are explicit study transcriptions.

The interface uses the requested 3+3+2 cumulative practice mechanics. It makes no “five minutes”, “never forget”, or scientifically validated “6446” guarantee. Generic study sections are not a substitute for a recitation teacher’s ruling on stopping and restarting.
