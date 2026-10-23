import test from 'node:test';
import assert from 'node:assert/strict';
import {requestLesson} from '../lib/hifz/client.ts';
import {choicesFor,hasArabicVoice} from '../lib/hifz/learning.ts';
import {withTurkishSource} from '../lib/hifz/readings.ts';
const verse={number:1,arabic:'أ',reading:'Kaynak',meaning:'Meal',words:[{arabic:'أ',reading:'A',meaning:'Anlam'}]};
const lesson={source:'fixture',verses:[verse]};
test('client request validates a complete response and rejects malformed/non-OK content',async()=>{
    const original=globalThis.fetch;
    try {
        globalThis.fetch=async()=>Response.json(lesson);assert.deepEqual(await requestLesson(1,1,1,new AbortController().signal),lesson);
        for(const response of [Response.json({verses:[null]}),new Response('',{status:503}),new Response('invalid json')]) {
            globalThis.fetch=async()=>response;await assert.rejects(requestLesson(1,1,1,new AbortController().signal));
        }
    } finally{globalThis.fetch=original;}
});
test('client timeout aborts a hung request at 30 seconds without cancelling the parent',async t=>{
    const original=globalThis.fetch;let inner:AbortSignal|undefined;t.mock.timers.enable({apis:['setTimeout']});
    try {
        globalThis.fetch=async(_url,options)=>new Promise((_resolve,reject)=>{inner=options!.signal as AbortSignal;inner.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});
        const parent=new AbortController(), pending=requestLesson(1,1,1,parent.signal), rejected=assert.rejects(pending);
        t.mock.timers.tick(29999);assert.equal(inner!.aborted,false);t.mock.timers.tick(1);await rejected;assert.equal(inner!.aborted,true);assert.equal(parent.signal.aborted,false);
    }finally{globalThis.fetch=original;t.mock.timers.reset();}
});
test('navigation cancellation propagates and an already-cancelled request makes no network call',async()=>{
    const original=globalThis.fetch;let calls=0,inner:AbortSignal|undefined;
    try {
        globalThis.fetch=async(_url,options)=>{calls++;return new Promise((_resolve,reject)=>{inner=options!.signal as AbortSignal;inner.addEventListener('abort',()=>reject(Error('aborted')),{once:true});});};
        const parent=new AbortController(), pending=requestLesson(1,1,1,parent.signal), rejected=assert.rejects(pending);parent.abort();await rejected;assert.equal(inner!.aborted,true);
        await assert.rejects(requestLesson(1,1,1,parent.signal));assert.equal(calls,1);
    }finally{globalThis.fetch=original;}
});
test('deadline also settles a transport that never responds and ignores abort',async t=>{
    const original=globalThis.fetch;t.mock.timers.enable({apis:['setTimeout']});
    try {globalThis.fetch=()=>new Promise(()=>{});const pending=assert.rejects(requestLesson(1,1,1,new AbortController().signal));t.mock.timers.tick(30000);await pending;}
    finally{globalThis.fetch=original;t.mock.timers.reset();}
});
test('client rejects a late body even if a transport ignores cancellation',async()=>{
    const original=globalThis.fetch;const parent=new AbortController();let finish:(v:unknown)=>void=()=>{};
    try {
        globalThis.fetch=async()=>({ok:true,json:()=>new Promise(resolve=>{finish=resolve;})}) as Response;
        const pending=requestLesson(1,1,1,parent.signal);await Promise.resolve();parent.abort();finish(lesson);await assert.rejects(pending);
    }finally{globalThis.fetch=original;}
});
test('reading-only quiz choices stay distinct by the label the learner actually sees',()=>{
    const words=[{arabic:'أ',reading:'Aynı',meaning:''},{arabic:'ب',reading:'aynı',meaning:''},{arabic:'ج',reading:'Farklı',meaning:''},{arabic:'د',reading:'Başka',meaning:''}];
    const choices=choicesFor(words[0],words,1,true);assert.equal(choices.length,3);assert.equal(new Set(choices.map(w=>w.reading.toLocaleLowerCase('tr'))).size,3);assert.ok(choices.includes(words[0]));
});
test('Arabic speech capability handles delayed/missing/erroring voice inventories',()=>{
    assert.equal(hasArabicVoice(),false);
    assert.equal(hasArabicVoice({getVoices:()=>[]}),false);
    assert.equal(hasArabicVoice({getVoices:()=>{throw Error('device');}}),false);
    assert.equal(hasArabicVoice({getVoices:()=>[{lang:'en-US'}] as SpeechSynthesisVoice[]}),false);
    assert.equal(hasArabicVoice({getVoices:()=>[{lang:'AR-SA'}] as SpeechSynthesisVoice[]}),true);
});
test('native Turkish verseparts survive a different connected source phrase without guessed boundaries',()=>{
    const source={'1':{reading:'Birleşik kaynak.',meaning:'Kaynak meal'}};
    const native=withTurkishSource({...lesson,source:'Açık Kuran · Türkçe kelime'},2,source);
    assert.equal(native.verses[0].words[0].reading,'A');assert.equal(native.verses[0].reading,'Birleşik kaynak.');assert.equal(native.verses[0].meaning,'Kaynak meal');
    const fallback=withTurkishSource({...lesson,source:'Quran.com',verses:[{...verse,approximate:true}]},2,source);
    assert.equal(fallback.verses[0].words[0].reading,'');
});
