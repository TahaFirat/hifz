import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultStudy, restoreStudy, lessonRange } from '../lib/hifz/study.ts';
test('saved study resumes cue stage, chaining position, focus and individual reveals', () => {
    const state={level:3,mode:'chain',step:7,cursor:3,spotlight:true,reveals:{'1:0':true,'2:2':false}};
    assert.deepEqual(restoreStudy(JSON.parse(JSON.stringify(state))),state);
});
test('corrupt and older storage cannot inject unsupported modes, indices or reveal values', () => {
    for(const value of [null,[],false,'broken']) assert.deepEqual(restoreStudy(value),defaultStudy());
    assert.deepEqual(restoreStudy({level:9,mode:'unknown',step:Infinity,cursor:-2,spotlight:'true',reveals:{'1:0':true,unexpected:true,'1:1':'true','1:meaning':false}}),{...defaultStudy(),reveals:{'1:0':true}});
    assert.equal(restoreStudy({level:2.5,step:0,cursor:20}).cursor,0);
});
test('resume ranges stay within the lesson and twenty-verse limit', () => {
    const content={start:1,end:286};assert.deepEqual(lessonRange('11','15',content),[11,15]);
    for(const [s,e] of [[0,5],[1,21],[10,9],[280,300],[NaN,5],[1.5,3]]) assert.deepEqual(lessonRange(s,e,content),[1,5]);
    assert.deepEqual(lessonRange(undefined,undefined,{start:255,end:255}),[255,255]);
    assert.deepEqual(lessonRange(1,5,{start:22,end:24}),[22,24]);
});
