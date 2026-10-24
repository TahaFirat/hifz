import test from 'node:test';
import assert from 'node:assert/strict';
import {review,restoreReviews,dailyQueue,dailyPlan,localDay,reviewHref} from '../lib/hifz/progress.ts';
import {createRecorder} from '../lib/hifz/recorder.ts';
const details={id:'quran:1:1',key:'s1',category:'basics',name:'Fâtiha',verse:1};
const now=new Date(2026,9,24,12).getTime();
test('review ratings schedule 10 minutes, tomorrow, and bounded expanding intervals',()=>{
 const again=review(undefined,details,'again',now);assert.equal(again.due,now+600000);
 const learning=review(again,details,'learning',now);assert.equal(new Date(learning.due).getDate(),25);
 const solid=review(learning,details,'solid',now);assert.equal(solid.interval,3);
 assert.equal(review(solid,details,'solid',now).interval,6);
 assert.equal(review({...solid,interval:180},details,'solid',now).interval,180);
 assert.equal(review(solid,details,'again',now).interval,0);
});
test('persisted progress rejects corrupt records and preserves valid records',()=>{
 const r=review(undefined,details,'learning',now);
 assert.deepEqual(restoreReviews(null),{});assert.deepEqual(restoreReviews([]),{});
 for(const value of [{...r,due:NaN},{...r,rating:'injected'},{...r,verse:-1},{...r,interval:181},{...r,id:'bad'}])assert.deepEqual(restoreReviews({[r.id]:value}),{});
 assert.deepEqual(restoreReviews({[r.id]:r}),{[r.id]:r});
});
test('daily queue includes only due ayets, ordered oldest first, capped at requested budget',()=>{
 const r=review(undefined,details,'learning',now),records=Object.fromEntries(Array.from({length:12},(_,i)=>[String(i),{...r,id:`quran:1:${i+1}`,due:now-i*1000}]));
 assert.equal(dailyQueue(records,5,now).length,5);assert.equal(dailyQueue(records,10,now).length,10);
 assert.equal(dailyQueue(records,5,now)[0].id,'quran:1:12');assert.equal(dailyQueue({a:{...r,due:now+1}},5,now).length,0);
 assert.equal(localDay(now),localDay(new Date(2026,9,24,23).getTime()));assert.match(reviewHref(r),/baslangic=1&bitis=1/);
});
test('daily plan prioritizes due reviews, fills with unseen ayets, and deduplicates aliases',()=>{
 const known=review(undefined,details,'solid',now),due={...known,id:'quran:1:2',verse:2,due:now-1};
 const fresh={...details,id:'quran:1:3',verse:3};
 const items=dailyPlan({[known.id]:known,[due.id]:due},[details,due,fresh,{...fresh,key:'all1'}],5,now);
 assert.deepEqual(items.map(r=>r.id),['quran:1:2','quran:1:3']);
 assert.deepEqual(dailyPlan({},[],5,now),[]);
});
function harness(){
 let stops=0,finished:Blob|undefined,errors=0,started=0;
 const stream={getTracks:()=>[{stop:()=>stops++}]} as unknown as MediaStream;
 class Recorder {
  state='inactive';mimeType='audio/webm';ondataavailable:((e:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;onerror:(()=>void)|null=null;
  start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['recording'])});this.onstop?.()}
 }
 const callbacks=[(blob:Blob)=>{finished=blob},()=>errors++,()=>started++] as const;
 return {stream,Recorder:Recorder as unknown as typeof MediaRecorder,callbacks,values:()=>({stops,finished,errors,started})};
}
test('recording finishes as a playable blob and releases the microphone',async()=>{
 const h=harness(),s=createRecorder(...h.callbacks,{getUserMedia:async()=>h.stream},h.Recorder);
 await s.start();assert.equal(h.values().started,1);s.stop();assert.ok(h.values().finished?.size);assert.equal(h.values().stops,1);assert.equal(h.values().errors,0);
});
test('cancelled microphone permission response is discarded and its tracks stopped',async()=>{
 const h=harness();let resolve!:(v:MediaStream)=>void;
 const s=createRecorder(...h.callbacks,{getUserMedia:()=>new Promise(r=>{resolve=r})},h.Recorder);
 const pending=s.start();s.cancel();resolve(h.stream);await pending;
 assert.equal(h.values().stops,1);assert.equal(h.values().started,0);assert.equal(h.values().finished,undefined);
});
test('denied permission and recorder construction errors fail cleanly',async()=>{
 const h=harness();await createRecorder(...h.callbacks,{getUserMedia:async()=>{throw Error('denied')}},h.Recorder).start();assert.equal(h.values().errors,1);
 class Broken{constructor(){throw Error('unsupported')}}
 await createRecorder(...h.callbacks,{getUserMedia:async()=>h.stream},Broken as unknown as typeof MediaRecorder).start();assert.equal(h.values().stops,1);assert.equal(h.values().errors,2);
});
test('cancel discards recording instead of saving and releases tracks',async()=>{
 const h=harness(),s=createRecorder(...h.callbacks,{getUserMedia:async()=>h.stream},h.Recorder);await s.start();s.cancel();assert.equal(h.values().finished,undefined);assert.equal(h.values().stops,1);
});
