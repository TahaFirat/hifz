import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { hiddenAt, effectiveLevel, validRange, verseAudio } from '../lib/hifz/core.ts';
import { prayers } from '../lib/hifz/prayers.ts';
const chapters = JSON.parse(fs.readFileSync(new URL('../lib/hifz/chapters.json', import.meta.url), 'utf8'));
const data = JSON.parse(fs.readFileSync(new URL('../lib/hifz/offline.json', import.meta.url), 'utf8'));
const mask = (level: number, count: number) => Array.from({ length: count }, (_, i) => hiddenAt(level, i, count));
test('five levels preserve verse order and correct hint positions', () => { assert.deepEqual(mask(0, 4), [false, false, false, false]); assert.deepEqual(mask(1, 4), [false, false, false, true]); assert.deepEqual(mask(2, 5), [false, true, false, true, false]); assert.deepEqual(mask(3, 4), [false, true, true, true]); assert.deepEqual(mask(4, 4), [true, true, true, true]); assert.deepEqual(mask(3, 1), [false]); });
test('chain mode hides earlier verses halfway and leaves the new verse open', () => { assert.equal(effectiveLevel(4, true, 0, 1), 0); assert.equal(effectiveLevel(4, true, 0, 2), 2); assert.equal(effectiveLevel(4, true, 1, 2), 0); assert.equal(effectiveLevel(4, false, 0, 2), 4); });
test('reject invalid chapter ranges', () => { for (const [s, e, m] of [[0, 5, 7], [3, 2, 7], [1, 8, 7], [1.5, 2, 7], [NaN, 2, 7]])
    assert.equal(validRange(s, e, m), false); assert.equal(validRange(255, 255, 286), true); });
test('every surah is indexed with canonical id and verse count', () => { assert.equal(chapters.length, 114); assert.equal(chapters.reduce((n: number, c: {
    verseCount: number;
}) => n + c.verseCount, 0), 6236); chapters.forEach((c: {
    id: number;
    name: string;
    arabicName: string;
}, i: number) => { assert.equal(c.id, i + 1); assert.ok(c.name && c.arabicName); }); });
test('all 26 embedded selections have complete verse and word layers', () => { const selections = [[1, 1, 7], [2, 255, 255], [2, 285, 286], [59, 22, 24], ...chapters.filter((c: {
        id: number;
    }) => c.id >= 93).map((c: {
        id: number;
        verseCount: number;
    }) => [c.id, 1, c.id === 96 ? 5 : c.verseCount])]; assert.equal(selections.length, 26); for (const [id, start, end] of selections) {
    for (let n = start; n <= end; n++) {
        const v = data[id].verses.find((v: {
            number: number;
        }) => v.number === n);
        assert.ok(v, `${id}:${n}`);
        assert.ok(v.arabic && v.reading && v.meaning && v.words.length);
        for (const w of v.words)
            assert.ok(w.arabic && (w.reading || v.reading) && w.meaning, `${id}:${n}: incomplete word`);
    }
} });
test('eight complete prayer texts have aligned phrase layers', () => { assert.equal(Object.keys(prayers).length, 8); for (const prayer of Object.values(prayers)) {
    assert.equal(prayer.verses.length, 1);
    for (const w of prayer.verses[0].words)
        assert.ok(w.arabic && w.reading && w.meaning);
} });
test('recitation urls preserve surah and ayah ids', () => { assert.equal(verseAudio(2, 255), 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3'); assert.equal(verseAudio(114, 6), 'https://everyayah.com/data/Alafasy_128kbps/114006.mp3'); });
import { stripBasmala } from '../lib/hifz/core.ts';
test('non-numbered basmala does not enter first ayah alignment', () => { const text = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ يسٓ'; assert.equal(stripBasmala(text, 36, 1), 'يسٓ'); assert.equal(stripBasmala(text, 1, 1), text); assert.equal(stripBasmala('يسٓ', 36, 1), 'يسٓ'); });
import { readableTurkish, sourceGroups, withTurkishSource } from '../lib/hifz/readings.ts';
const turkish=JSON.parse(fs.readFileSync(new URL('../lib/hifz/turkish.json',import.meta.url),'utf8'));
test('all 6236 verses have complete source Turkish reading and meaning',()=>{let count=0;for(const c of chapters){assert.equal(Object.keys(turkish[c.id]).length,c.verseCount);for(let n=1;n<=c.verseCount;n++){const row=turkish[c.id][n];assert.ok(row.reading&&row.meaning);count++;}}assert.equal(count,6236);});
test('Fatiha restores Allah and sun-letter word onsets without English fragments',()=>{assert.deepEqual(data[1].verses[0].words.map((w:{reading:string})=>w.reading),['Bismi','Allâhi','Errahmâni','Errahîm']);assert.equal(data[1].verses[0].reading,'Bismillâhirrahmânirrahîm.');assert.ok(!/l-lahi|l-rahm/i.test(JSON.stringify(data[1].verses)));});
test('source transcription keeps connected reading and normalizes only typography',()=>{assert.equal(readableTurkish('bismi-llâhi-rraḥmâni-rraḥîm.'),'Bismillâhirrahmânirrahîm.');});
test('uncertain word alignment preserves Arabic masking and intact source reading',()=>{const words=[{arabic:'أ',reading:'unrelated',meaning:'A'},{arabic:'ب',reading:'different',meaning:'B'}];const result=sourceGroups(words,'Doğru kaynak okunuşu.','Kaynak meal');assert.equal(result.length,2);assert.deepEqual(result.map(w=>w.arabic),['أ','ب']);assert.ok(result.every(w=>w.reading===''));const lesson=withTurkishSource({verses:[{number:1,arabic:'أ ب',reading:'broken',meaning:'wrong',words}],source:'fixture'},2,{'1':{reading:'Doğru kaynak okunuşu.',meaning:'Kaynak meal'}});assert.equal(lesson.verses[0].reading,'Doğru kaynak okunuşu.');assert.equal(lesson.verses[0].meaning,'Kaynak meal');});
import { plain } from '../lib/hifz/core.ts';
test('translation cleanup removes footnote markers without deleting text',()=>{assert.equal(plain('Anlam<sup foot_note="1">1</sup>&nbsp;ve&nbsp;devam.'),'Anlam ve devam.');});
test('Yasin verse meanings come from the aligned individual verse source',()=>{assert.equal(turkish[36][2].meaning,"Hikmet dolu Kur'an hakkı için,");});
