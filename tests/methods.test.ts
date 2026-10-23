import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {arabicWordToTurkishTranslit,alignArabicWords,splitArabicWords} from '../lib/hifz/transliteration.ts';
import {displayWords,withTurkishSource} from '../lib/hifz/readings.ts';
import {prayers} from '../lib/hifz/prayers.ts';
import {initialCoach,advanceCoach,restoreCoach,reverseFrame,cueMask,bridgeMask} from '../lib/hifz/methods.ts';
import {restoreStudy} from '../lib/hifz/study.ts';
import {createShadowSession} from '../lib/hifz/shadowing.ts';
import type {Lesson} from '../lib/hifz/types.ts';

test('legacy alignment retains one token per Arabic word in embedded ayahs and prayers',()=>{
    const offline=JSON.parse(fs.readFileSync(new URL('../lib/hifz/offline.json',import.meta.url),'utf8')) as Record<string,Lesson>;
    let count=0;
    for(const lesson of [...Object.values(offline),...Object.values(prayers)]) for(const verse of lesson.verses){
        const result=displayWords(verse);assert.equal(result.length,splitArabicWords(verse.words.map(w=>w.arabic).join(' ')).length);
        assert.ok(result.every(w=>w.arabic&&!/\s/u.test(w.arabic)&&w.reading));
        assert.deepEqual(displayWords({...verse,words:result}),result);count++;
    }
    assert.ok(count>=164);
});
test('word alignment uses exact source tokens or Arabic resolver, never duplicates phrase meaning',()=>{
    const words=[{arabic:'مِنْ شَرِّ',reading:'Min şerri',meaning:'Kötülüğünden'}];
    const result=alignArabicWords(words,'Min şerri');assert.deepEqual(result.map(w=>w.reading),['Min','şerri']);assert.ok(result.every(w=>w.meaning===''));
    assert.ok(alignArabicWords(words,'Birleşik')[0].readingSource==='calculated');
    assert.equal(alignArabicWords([{arabic:'مِنْ',reading:'Min',meaning:'-den'}],'farklı kaynak')[0].meaning,'-den');
});
test('Fatiha retains verified isolated readings even if a provider supplies a single phrase',()=>{
    const arabic='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
    const lesson=withTurkishSource({source:'fixture fallback',verses:[{number:1,arabic,reading:'',meaning:'',words:[{arabic,reading:'',meaning:''}]}]},1,{'1':{reading:'Bismillâhirrahmânirrahîm.',meaning:'Meal'}});
    assert.deepEqual(lesson.verses[0].words.map(w=>w.reading),['Bismi','Allâhi','Errahmâni','Errahîm']);assert.ok(lesson.verses[0].words.every(w=>w.readingSource==='source'));
});
test('deterministic Arabic resolver handles short/long vowels, shadda, tanwin and isolated letters',()=>{
    assert.equal(arabicWordToTurkishTranslit('بِسْمِ'),'Bismi');assert.equal(arabicWordToTurkishTranslit('مِنْ'),'Min');
    assert.equal(arabicWordToTurkishTranslit('بَبِّ'),'Bebbi');assert.equal(arabicWordToTurkishTranslit('بَابِ'),'Bâbi');
    assert.equal(arabicWordToTurkishTranslit('فِي'),'Fî');assert.equal(arabicWordToTurkishTranslit('نُورِ'),'Nûri');
    assert.equal(arabicWordToTurkishTranslit('بٌ'),'Bün');assert.equal(arabicWordToTurkishTranslit('يسٓ'),'Yâ sîn');
    assert.equal(arabicWordToTurkishTranslit('ٱللَّهِ'),'Allâhi');assert.deepEqual(splitArabicWords('مِنْ ۖ شَرِّ'),['مِنْۖ','شَرِّ']);
    assert.equal(arabicWordToTurkishTranslit('لَآ'),'Lâ');assert.equal(arabicWordToTurkishTranslit('ٱلْحَىُّ'),'El-hayyü');
    assert.equal(arabicWordToTurkishTranslit('ٱلَّذِينَ'),'Ellezîne');assert.equal(arabicWordToTurkishTranslit('نَعْبُدُ'),'Na‘büdü');
});
test('coach enforces 3 read, 3 recall, then 2 links with terminal completion',()=>{
    let s=initialCoach();for(let i=0;i<3;i++) s=advanceCoach(s,2);assert.equal(s.phase,'recall');
    for(let i=0;i<3;i++) s=advanceCoach(s,2);assert.equal(s.verse,1);assert.equal(s.phase,'read');
    for(let i=0;i<6;i++) s=advanceCoach(s,2);assert.equal(s.phase,'link');assert.equal(s.count,0);
    s=advanceCoach(s,2);assert.equal(s.count,1);s=advanceCoach(s,2);assert.equal(s.complete,true);assert.deepEqual(advanceCoach(s,2),s);
    let one=initialCoach();for(let i=0;i<6;i++) one=advanceCoach(one,1);assert.equal(one.complete,true);
});
test('reverse chains preserve reading order; bridge and alternating masks stay deterministic',()=>{
    assert.deepEqual([1,2,3].map(s=>reverseFrame(s,3)),[[2],[1,2],[0,1,2]]);assert.deepEqual(reverseFrame(99,1),[0]);assert.deepEqual(reverseFrame(1,0),[]);
    assert.deepEqual([0,1,2,3].map(i=>bridgeMask(i,4)),[false,true,true,false]);assert.equal(bridgeMask(0,1),false);
    assert.deepEqual([0,1,2,3].map(i=>cueMask(1,i)),[false,true,false,true]);
});
test('new coach state restores safely with legacy study records still accepted',()=>{
    assert.deepEqual(restoreCoach({verse:99,count:99,phase:'invalid'}),initialCoach());
    assert.equal(restoreStudy({mode:'reverse'}).mode,'reverse');assert.equal(restoreStudy({mode:'bridge'}).mode,'bridge');
    const coach={verse:1,phase:'link' as const,count:1,complete:false};assert.deepEqual(restoreStudy({mode:'coach',coach}).coach,coach);
});
test('sema-arz session waits exactly four seconds when explicitly configured',t=>{
    const previous=globalThis.Audio;const audios:any[]=[];
    class FakeAudio{duration=10;onended:null|(()=>void)=null;onerror=null;constructor(){audios.push(this);}pause(){}play(){return Promise.resolve();}}
    globalThis.Audio=FakeAudio as unknown as typeof Audio;t.mock.timers.enable({apis:['setTimeout']});
    try{const session=createShadowSession({number:1,arabic:'مِنْ',reading:'Min',meaning:'',words:[],audio:'fixture'},true,()=>{},4);audios[0].onended();t.mock.timers.tick(3999);assert.equal(audios.length,1);t.mock.timers.tick(1);assert.equal(audios.length,2);session.cancel();}finally{globalThis.Audio=previous;t.mock.timers.reset();}
});
