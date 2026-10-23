import test from 'node:test';
import assert from 'node:assert/strict';
import { isLesson, restoreDisplay } from '../lib/hifz/validation.ts';
import { lessonSelection } from '../lib/hifz/study.ts';
import { createShadowSession } from '../lib/hifz/shadowing.ts';
const verse = {number:1,arabic:'أ',reading:'A',meaning:'Anlam',words:[{arabic:'أ',reading:'',meaning:''}],audio:'fixture.mp3'};
test('lesson validation rejects cache holes, reordered verses and malformed word layers',()=>{
    const valid={source:'fixture',verses:[verse,{...verse,number:2}]};assert.equal(isLesson(valid,1,2),true);
    for(const bad of [null, {source:'x',verses:[null,null]}, {...valid,verses:[verse,verse]}, {...valid,verses:[{...verse,words:[null]},{...verse,number:2}]}, {...valid,verses:[{...verse,reading:''},{...verse,number:2}]}]) assert.equal(isLesson(bad,1,2),false);
    assert.equal(isLesson(valid,2,3),false);
});
test('display settings recover corrupt/all-hidden preferences without a blank page',()=>{
    assert.deepEqual(restoreDisplay({font:'2',arabic:false,reading:false,meaning:false}),{font:0,arabic:true,reading:false,meaning:false});
    assert.deepEqual(restoreDisplay({font:2,arabic:false,reading:false,meaning:true}),{font:2,arabic:false,reading:false,meaning:true});
    assert.deepEqual(restoreDisplay([]),{font:0,arabic:true,reading:true,meaning:true});
});
test('offline shell selection recovers the actual catalog, prayer and validated range',()=>{
    const a={key:'s1',name:'Fatiha',chapter:1,start:1,end:7,kind:'surah' as const}, b={...a,key:'all2',chapter:2,end:286}, p={...a,key:'dua',chapter:0,end:1,kind:'prayer' as const};
    const lists={basics:[a],all:[b],prayers:[p]};
    assert.deepEqual(lessonSelection({category:'all',key:'all2',start:'285',end:'286'},lists),{category:'all',content:b,range:[285,286]});
    assert.equal(lessonSelection({category:'prayers',key:'dua'},lists).content,p);
    assert.deepEqual(lessonSelection({category:'invalid',key:'wrong',start:'0',end:'999'},lists),{category:'basics',content:a,range:[1,7]});
});
test('cancelled and already-ended audio callbacks cannot clear a newer playback state',()=>{
    const original=globalThis.Audio;const instances: any[]=[];
    class FakeAudio {duration=2;onended:any=null;onerror:any=null;constructor(){instances.push(this);}pause(){}removeAttribute(){}load(){}async play(){}}
    globalThis.Audio=FakeAudio as unknown as typeof Audio;
    try {
        const states:unknown[]=[];const first=createShadowSession(verse,true,s=>states.push(s));
        const staleError=instances[0].onerror,staleEnd=instances[0].onended;
        first.cancel();createShadowSession(verse,false,s=>states.push(s));
        staleError();staleEnd();assert.deepEqual(states,['listen','listen']);
        instances[1].onended();assert.equal(states.at(-1),null);
    }finally{globalThis.Audio=original;}
});
test('synchronous audio startup failure ends quietly instead of throwing into the UI',()=>{
    const original=globalThis.Audio;globalThis.Audio=class {constructor(){throw Error('device failure');}} as unknown as typeof Audio;
    try{const states:unknown[]=[];assert.doesNotThrow(()=>createShadowSession(verse,true,s=>states.push(s)));assert.deepEqual(states,['listen',null]);}finally{globalThis.Audio=original;}
});
test('speech shadowing isolates ended utterances and cancels the checking voice',t=>{
    const speech=globalThis.speechSynthesis, Utterance=globalThis.SpeechSynthesisUtterance;
    const utterances:any[]=[];let cancels=0;
    class FakeUtterance {onend:any=null;onerror:any=null;voice:any=null;rate=1;constructor(){utterances.push(this);}}
    globalThis.SpeechSynthesisUtterance=FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
    globalThis.speechSynthesis={getVoices:()=>[{lang:'ar'}],speak:()=>{},cancel:()=>{cancels++;}} as unknown as SpeechSynthesis;
    t.mock.timers.enable({apis:['setTimeout']});
    try {
        const states:unknown[]=[];const session=createShadowSession({...verse,audio:undefined},true,s=>states.push(s));
        const lateError=utterances[0].onerror;utterances[0].onend();lateError();
        assert.deepEqual(states,['listen','pause']);t.mock.timers.tick(10000);
        assert.equal(states.at(-1),'check');const lateEnd=utterances[1].onend;session.cancel();lateEnd();
        assert.equal(cancels,1);assert.deepEqual(states,['listen','pause','check']);
    } finally {globalThis.speechSynthesis=speech;globalThis.SpeechSynthesisUtterance=Utterance;t.mock.timers.reset();}
});
