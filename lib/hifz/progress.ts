export type Rating='again'|'learning'|'solid';
export type Review={id:string;key:string;category:string;name:string;verse:number;rating:Rating;interval:number;due:number;updated:number;verifiedAt?:number;lastTest?:number;nextTest?:number};
const validTime=(time:unknown):time is number=>typeof time==='number'&&Number.isFinite(time)&&time>0&&time<=8640000000000000;
const daysAfter=(time:number,days:number)=>{const date=new Date(time);date.setDate(date.getDate()+days);return date.getTime()};
export type Reviews=Record<string,Review>;
export const progressKey='hifz:reviews:v1';
export function restoreReviews(raw:unknown):Reviews {
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 return Object.fromEntries(Object.entries(raw).slice(0,10000).filter(([id,r])=>{
  const v=r as Review;return v&&v.id===id&&/^(quran:\d+:\d+|prayer:[\w-]+:\d+)$/.test(id)&&id.split(':').at(-1)===String(v.verse)&&(id.startsWith('prayer:')?id===`prayer:${v.key}:${v.verse}`:Number(id.split(':')[1])>=1&&Number(id.split(':')[1])<=114)&&typeof v.key==='string'&&/^[\w-]{1,40}$/.test(v.key)&&['basics','all','prayers'].includes(v.category)&&typeof v.name==='string'&&v.name.length<100&&Number.isInteger(v.verse)&&v.verse>0&&v.verse<=286&&['again','learning','solid'].includes(v.rating)&&Number.isInteger(v.interval)&&v.interval>=0&&v.interval<=180&&Number.isFinite(v.due)&&v.due>0&&Number.isFinite(v.updated)&&v.updated>0;
 }).map(([id,raw])=>{const {verifiedAt,lastTest,nextTest,...rest}=raw as Review;return [id,{...rest,...(validTime(verifiedAt)?{verifiedAt}:{}),...(validTime(lastTest)?{lastTest}:{}),...(validTime(nextTest)?{nextTest}:{})}]})) as Reviews;
}
export function review(previous:Review|undefined,details:Omit<Review,'rating'|'interval'|'due'|'updated'>,rating:Rating,now=Date.now()):Review {
 const interval=rating==='again'?0:rating==='learning'?1:Math.min(180,Math.max(3,(previous?.interval||1)*2));
 const date=new Date(now);date.setDate(date.getDate()+interval);
 return {...details,rating,interval,updated:now,due:rating==='again'?now+10*60*1000:date.getTime(),...(rating==='solid'?{nextTest:previous?.rating==='solid'?previous.nextTest??daysAfter(now,1):daysAfter(now,1),...(previous?.rating==='solid'&&previous.verifiedAt?{verifiedAt:previous.verifiedAt}:{}),...(previous?.lastTest?{lastTest:previous.lastTest}:{})}:{})};
}
export function canChallenge(record:Review|undefined,now=Date.now()):record is Review{
 return !!record&&record.rating==='solid'&&record.updated<=now&&localDay(record.updated)!==localDay(now)&&(!record.lastTest||localDay(record.lastTest)!==localDay(now))&&(record.nextTest??daysAfter(record.updated,1))<=now;
}
/** A self-assessment after an unaided attempt; no speech correctness is inferred. */
export function assessReview(record:Review|undefined,passed:boolean,now=Date.now()):Review|null{
 if(!canChallenge(record,now))return null;
 if(!passed){const {verifiedAt,nextTest,...rest}=record;return {...rest,rating:'again',interval:0,updated:now,due:now+600000,lastTest:now}}
 const interval=Math.max(3,record.interval),due=daysAfter(now,interval);
 return {...record,rating:'solid',updated:now,due,interval,verifiedAt:now,lastTest:now,nextTest:due};
}
export function dailyQueue(records:Reviews,minutes:number,now=Date.now()):Review[]{
 return Object.values(records).filter(r=>r.due<=now).sort((a,b)=>a.due-b.due||a.id.localeCompare(b.id)).slice(0,minutes===10?10:5);
}
export function dailyPlan(records:Reviews,candidates:Omit<Review,'rating'|'interval'|'due'|'updated'>[],minutes:number,now=Date.now()){
 const items:Omit<Review,'rating'|'interval'|'due'|'updated'>[]=dailyQueue(records,minutes,now),seen=new Set(items.map(r=>r.id)),limit=minutes===10?10:5;
 for(const item of candidates){if(items.length>=limit)break;if(!records[item.id]&&!seen.has(item.id)){items.push(item);seen.add(item.id)}}
 return items;
}
export function reviewHref(r:Pick<Review,'key'|'category'|'verse'>){return `/calis?kategori=${encodeURIComponent(r.category)}&icerik=${encodeURIComponent(r.key)}&baslangic=${r.verse}&bitis=${r.verse}`;}
export function localDay(time:number){const d=new Date(time);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;}
