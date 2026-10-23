import test from 'node:test';
import assert from 'node:assert/strict';
import { stageHidden, firstArabic, firstReading, chainFrame, choicesFor, shadowDelay } from '../lib/hifz/learning.ts';
import { displayWords } from '../lib/hifz/readings.ts';
import { createShadowSession } from '../lib/hifz/shadowing.ts';
const words = ['مِنْ', 'شَرِّ', 'مَا', 'خَلَقَ'].map((arabic, i) => ({ arabic, reading: ['Min','Şerri','Mâ','Halak'][i], meaning: '' }));
test('cue stages encode, conceal last two, preserve explicit particles and hide all', () => {
    const mask = (n: number) => words.map((_, i) => stageHidden(n, words, i));
    assert.deepEqual(mask(0), [false,false,false,false]);
    assert.deepEqual(mask(1), [false,false,true,true]);
    assert.deepEqual(mask(2), [false,true,false,true]);
    assert.deepEqual(mask(3), [true,true,true,true]);
    assert.deepEqual(mask(4), [true,true,true,true]);
    assert.equal(stageHidden(1, words.slice(0,1), 0), true);
    assert.equal(stageHidden(2, [{...words[0], arabic:'وَخَلَقَ'}],0),true);
});
test('first-letter hints omit marks and retain Turkish letters', () => {
    assert.equal(firstArabic('ٱلرَّحْمَٰنِ'), 'ا'); assert.equal(firstArabic('مِنْ'), 'م');
    assert.equal(firstReading('İyyâke'), 'İy…'); assert.equal(firstReading('Şerri'), 'Şe…');
});
test('chain frames learn individual verses before cumulative links, including end bounds', () => {
    assert.deepEqual([1,2,3,4,5].map(s => chainFrame(s,3).indices), [[0],[1],[0,1],[2],[0,1,2]]);
    assert.deepEqual(chainFrame(3,3).levels,[3,1]); assert.deepEqual(chainFrame(5,3).levels,[3,3,1]);
    assert.deepEqual(chainFrame(9,1).indices,[0]); assert.equal(chainFrame(5,3).last,5);
    assert.deepEqual(chainFrame(1,0).indices,[]);
});
test('quiz presents exactly three distinct real source words and rotates correct answer', () => {
    for(let seed=0;seed<8;seed++) {const c=choicesFor(words[1],words,seed);assert.equal(c.length,3);assert.equal(new Set(c.map(w=>w.arabic)).size,3);assert.equal(c.filter(w=>w===words[1]).length,1);assert.ok(c.every(w=>words.includes(w)));}
});
test('missing word transcription uses the intact canonical phrase inside the tile', () => {
    const v={number:1,arabic:'أ ب',reading:'Kaynak ifade',meaning:'Meal',words:[{arabic:'أ',reading:'',meaning:''},{arabic:'ب',reading:'',meaning:''}]};
    assert.deepEqual(displayWords(v),[{arabic:'أ ب',reading:'Kaynak ifade',meaning:'Meal'}]);
    assert.equal(displayWords({...v,words}),words);
});
test('shadowing plays, pauses for duration, checks once, and cancels stale timers', async t => {
    const originalAudio=globalThis.Audio;
    const audios: {duration:number;onended:null|(()=>void);onerror:null|(()=>void);pause:()=>void;play:()=>Promise<void>}[]=[];
    class FakeAudio {duration=2;onended=null;onerror=null;constructor(){audios.push(this);}pause(){} async play(){}}
    globalThis.Audio=FakeAudio as unknown as typeof Audio;
    t.mock.timers.enable({apis:['setTimeout']});
    try {
        const states: unknown[]=[];const verse={number:1,arabic:'أ',reading:'A',meaning:'A',words:[],audio:'fixture.mp3'};
        createShadowSession(verse,true,s=>states.push(s));
        audios[0].onended?.(); assert.deepEqual(states,['listen','pause']);
        t.mock.timers.tick(1999);assert.equal(audios.length,1);
        t.mock.timers.tick(1);assert.equal(audios.length,2);assert.equal(states.at(-1),'check');
        audios[1].onended?.();assert.equal(states.at(-1),null);
        const cancelStates:unknown[]=[];const session=createShadowSession(verse,true,s=>cancelStates.push(s));
        audios[2].onended?.();session.cancel();t.mock.timers.tick(10000);assert.equal(audios.length,3);
        assert.deepEqual(cancelStates,['listen','pause']);
        createShadowSession(verse,false,()=>{});audios[3].onended?.();t.mock.timers.tick(10000);assert.equal(audios.length,4);
        assert.equal(shadowDelay(NaN),4000);assert.equal(shadowDelay(0),4000);assert.equal(shadowDelay(3),3000);
    } finally {globalThis.Audio=originalAudio;t.mock.timers.reset();}
});
