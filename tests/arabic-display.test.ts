import test from 'node:test';
import assert from 'node:assert/strict';
import {displayArabic} from '../lib/hifz/arabic-display.ts';

test('zkr display convention renders alif-wasla as ordinary alif',()=>{
    assert.equal(displayArabic('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'),'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ');
});
test('display keeps hamza, vowels, shadda, sukun and Quranic reading signs',()=>{
    const reading='أَ إِ آ ء ئ ؤ بْ بّ بً بٌ بٍ رَحْمَٰنِ ۚ ۛ ۖ ۗ ۙ ۘ';
    assert.equal(displayArabic(reading),reading);
    assert.equal(displayArabic('ٱهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'),'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ');
});
