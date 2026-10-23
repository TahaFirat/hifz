# Verification — 23 October 2026

- **live-tested**: AlQuran Cloud full-Quran endpoints: quran-uthmani, tr.transliteration, tr.diyanet, ar.alafasy. Each returned all 114 surahs and 6236 nonempty ayahs; every audio-edition ayah included an audio URL. Evidence: outputs/live-bulk-check.json (generated, untracked).
- **live-tested**: 25 Quran.com chapters backing the 26 offline selections; 156 selected verses, each with Arabic words, transliteration, Turkish word meaning and complete Turkish translation. Original retrieval metadata: lib/hifz/provenance.json.
- **live-tested**: local /api/lesson for Yasin 1–5 and Mulk 26–30 returned HTTP 200. Invalid 21-ayah range returned 400. /api/enrich reported available:false. EveryAyah 001001.mp3 returned HTTP 206, audio/mpeg, 256-byte range.
- **fixture-tested**: 13 automated tests: levels, chaining, range boundaries, canonical directory, all embedded layers, prayer phrase alignment, audio URLs, basmala handling and three-provider fallback/failure behavior.
- **live-tested (browser)**: 50% mask first ayah 2/4 open; tap => 3/4; hint => 4/4. Chain mode one then two ayahs with earlier 2/4 and new 4/4. Number search 36 selected Yasin, live Arabic loaded. Prayer category displayed Subhaneke's five groups. Repeat selector changed to 5. Mobile viewport 390px had no horizontal document overflow.
- **degraded**: Acik Kuran DNS unavailable. Word readings use explicitly labelled deterministic phonetic conversion rather than verified Turkish word transcription. Prayer audio depends on a device Arabic TTS voice.
- **failed (external limit)**: initial rapid per-surah API sweep received HTTP 429 after 26 successful requests. Subsequent low-request bulk verification succeeded for all four complete editions. The app falls back to Quran.com on Cloud failure; its rate-limit behavior is fixture-tested.
- **skipped**: Gemini live generation (no API key); exhaustive playback of every ayah MP3; independent scholarly review of prayer text; offline cold reload pending browser capability.

TypeScript checking and production build are executed separately before publication. No benchmark or provider availability guarantee is implied.
