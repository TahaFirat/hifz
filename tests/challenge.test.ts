import test from 'node:test';
import assert from 'node:assert/strict';
import {review,canChallenge,assessReview,restoreReviews} from '../lib/hifz/progress.ts';
const details={id:'quran:1:1',key:'s1',category:'basics',name:'Fâtiha',verse:1};
const day1=new Date(2026,9,24,12).getTime(),day2=new Date(2026,9,25,12).getTime();
test('new solid ratings require a later day; looking at a verse is not a passed test',()=>{
 const r=review(undefined,details,'solid',day1);assert.equal(r.verifiedAt,undefined);assert.equal(canChallenge(r,day1),false);assert.equal(canChallenge(r,day2-1),false);assert.equal(canChallenge(r,day2),true);assert.equal(assessReview(r,true,day1),null);
});
test('legacy solid records are eligible without dropping their saved progress',()=>{
 const {nextTest,...old}=review(undefined,details,'solid',day1);const restored=restoreReviews({[old.id]:old})[old.id];assert.deepEqual(restored,old);assert.equal(canChallenge(restored,day2),true);
});
test('passed unaided self-assessment is recorded once and schedules a later test',()=>{
 const r=review(undefined,details,'solid',day1),passed=assessReview(r,true,day2)!;assert.equal(passed.verifiedAt,day2);assert.equal(passed.lastTest,day2);assert.equal(passed.rating,'solid');assert.ok(passed.nextTest!>day2);assert.equal(canChallenge(passed,day2),false);assert.equal(assessReview(passed,true,day2),null);assert.equal(canChallenge(passed,passed.nextTest!),true);
});
test('a failed self-assessment removes verification and returns the ayah to ten-minute review',()=>{
 const r=review(undefined,details,'solid',day1),failed=assessReview({...r,verifiedAt:day1},false,day2)!;assert.equal(failed.rating,'again');assert.equal(failed.interval,0);assert.equal(failed.verifiedAt,undefined);assert.equal(failed.nextTest,undefined);assert.equal(failed.due,day2+600000);assert.equal(canChallenge(failed,day2+600001),false);
});
test('ordinary rating changes cannot fabricate test completion and clear stale proof on difficulty',()=>{
 const passed=assessReview(review(undefined,details,'solid',day1),true,day2)!;
 assert.equal(review(passed,details,'solid',day2).verifiedAt,day2);assert.equal(review(passed,details,'again',day2).verifiedAt,undefined);assert.equal(review(passed,details,'learning',day2).verifiedAt,undefined);
});
test('optional corrupt assessment metadata is discarded without deleting valid old ratings',()=>{
 const r=review(undefined,details,'solid',day1),clean=restoreReviews({[r.id]:{...r,verifiedAt:NaN,lastTest:'yesterday',nextTest:Infinity}})[r.id];assert.ok(clean);assert.equal(clean.verifiedAt,undefined);assert.equal(clean.lastTest,undefined);assert.equal(clean.nextTest,undefined);assert.equal(canChallenge(clean,day2),true);
 assert.equal(canChallenge(undefined,day2),false);assert.equal(canChallenge({...r,updated:day2+1},day2),false);
});
