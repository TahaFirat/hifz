import type { Content, Verse } from './types';
import { quranSegments, prayerSegments } from './segments-data.ts';

export type StudyUnit = Verse & {
 id:string; parent:Verse; part:number; total:number; anchor:string;
 boundary:'ayah'|'waqf'|'study'; aligned:boolean; readingStart?:string;readingEnd?:string;
};
type Token={text:string;stop:boolean;forbidden:boolean};
const letters=/[ء-غف-يٱ]/u;
const standalone=/^(?:ج|ط|م|قف|قلى|صلى)$/u;
const allowed=/[ۖۗۘۚ]/u;
/** Only annotation codepoints or complete standalone signs, never letters inside words. */
export function arabicTokens(arabic:string):Token[] {
 const tokens:Token[]=[];let paired=false;
 for(const text of arabic.trim().split(/\s+/u)){
  if(!text)continue;
  const annotation=!letters.test(text)||(tokens.length>0&&standalone.test(text));
  if(annotation&&tokens.length){const previous=tokens.at(-1)!;previous.text+=' '+text;previous.stop ||= allowed.test(text)||standalone.test(text);previous.forbidden ||= /ۙ|^لا$/u.test(text);if(text.includes('ۛ')){paired=!paired;previous.stop ||= paired}continue}
  let stop=allowed.test(text);if(text.includes('ۛ')){paired=!paired;stop ||= paired}
  tokens.push({text,stop,forbidden:/ۙ/u.test(text)});
 }
 return tokens;
}
export const arabicWordCount=(text:string)=>arabicTokens(text).length;
const anchorFrom=(meaning:string,fallback:string)=>meaning.replace(/\([^)]*\)/gu,'').replace(/[!?:;.,“”"()]/gu,'').trim().split(/\s+/u).filter(Boolean).slice(0,3).join(' ')||fallback;
const ayahAnchors:Record<string,string>={'1:1':'Allah’ın Adıyla','1:2':'Hamd','1:3':'Rahmet','1:4':'Hesap Günü','1:5':'Kulluk ve Yardım','1:6':'Doğru Yol','1:7':'Lütuf Yolu','2:255':'Tevhid','2:285':'İman ve Teslimiyet','2:286':'Dua ve Bağışlanma','59:22':'İlim ve Rahmet','59:23':'Esmâ ve Tevhid','59:24':'Yaratılış ve Tesbih'};
const connectedCues:Record<string,[string,string]>={'1:1':['Bismillâhi','rahîm.'],'1:3':['Errahmâni','rahîm.'],'1:6':['İhdinâ','müstekîm.']};
const whole=(v:Verse,content?:Content):StudyUnit=>{const key=`${content?.chapter}:${v.number}`,cues=connectedCues[key];return{...v,id:String(v.number),parent:v,part:1,total:1,anchor:ayahAnchors[key]||anchorFrom(v.meaning,'Ayet'),boundary:'ayah',aligned:true,readingStart:cues?.[0],readingEnd:cues?.[1]}};
const clauses=(text:string,count:number):string[]=>{
 for(const pattern of [/(?<=[.;!?])\s+/u,/(?<=[,;.!?])\s+/u]){const rows=text.trim().split(pattern).filter(Boolean);if(rows.length===count)return rows}
 return [];
};
function boundaries(tokens:Token[]):number[]{
 const count=tokens.length;if(count<8)return[count];
 if(count<15){const candidates=tokens.map((t,i)=>({t,end:i+1})).filter(x=>x.end>=3&&x.end<=count-3&&!x.t.forbidden).sort((a,b)=>Number(b.t.stop)-Number(a.t.stop)||Math.abs(a.end-count/2)-Math.abs(b.end-count/2));return candidates.length?[candidates[0].end,count]:[count]}
 const cuts:number[]=[];let start=0;
 // Preserve source stops. Oversized spans become study sections, not invented waqf signs.
 for(let end=1;end<=count;end++)if(tokens[end-1].stop||end===count){
  const size=end-start,parts=Math.ceil(size/7);
  for(let part=1;part<parts;part++){let at=start+Math.round(size*part/parts);while(at<end-1&&tokens[at-1].forbidden)at++;if(at>(cuts.at(-1)??0))cuts.push(at)}
  if(end>(cuts.at(-1)??0))cuts.push(end);start=end;
 }
 return cuts;
}
/** Adaptive presentation; no source verse or word-layer object is mutated. */
export function splitLongVerseIntoWaqfSegments(v:Verse,content:Content):StudyUnit[]{
 const tokens=arabicTokens(v.arabic);if(tokens.length<=7)return[whole(v,content)];
 const prayerPlan=content.kind==='prayer'?prayerSegments[content.key]:undefined;
 if(prayerPlan&&prayerPlan.at(-1)?.end===v.words.length){
  let previous=0;return prayerPlan.map((p,i)=>{const rows=v.words.slice(previous,p.end);previous=p.end;return {...v,id:`${v.number}.${i+1}`,parent:v,part:i+1,total:prayerPlan.length,anchor:p.anchor,boundary:'waqf' as const,aligned:true,arabic:rows.map(w=>w.arabic).join(' '),reading:rows.map(w=>w.reading).join(' '),meaning:rows.map(w=>w.meaning).join(' '),words:[],audio:undefined}});
 }
 const plan=content.kind!=='prayer'?quranSegments[`${content.chapter}:${v.number}`]:undefined;
 if(plan?.at(-1)?.end===tokens.length){
  let previous=0;return plan.map((p,i)=>{const arabic=tokens.slice(previous,p.end).map(w=>w.text).join(' ');previous=p.end;return {...v,id:`${v.number}.${i+1}`,parent:v,part:i+1,total:plan.length,anchor:p.anchor,boundary:'waqf' as const,aligned:true,arabic,reading:p.reading,meaning:p.meaning,words:[],audio:undefined}});
 }
 const ends=boundaries(tokens),natural=ends.slice(0,-1).every(end=>tokens[end-1].stop);
 const readings=natural?clauses(v.reading,ends.length):[],meanings=natural?clauses(v.meaning,ends.length):[];let previous=0;
 return ends.map((end,i)=>{const start=previous;previous=end;return {...v,id:`${v.number}.${i+1}`,parent:v,part:i+1,total:ends.length,anchor:anchorFrom(meanings[i]||'',i===0?'Başlangıç':i===ends.length-1?'Tamamlama':'Devam'),boundary:tokens[end-1].stop||end===tokens.length?'waqf':'study',aligned:readings.length===ends.length&&meanings.length===ends.length,arabic:tokens.slice(start,end).map(w=>w.text).join(' '),reading:readings[i]||'',meaning:meanings[i]||'',words:[],audio:undefined}});
}
export function studyUnits(verses:Verse[],content:Content,split=true):StudyUnit[]{return verses.flatMap(v=>split?splitLongVerseIntoWaqfSegments(v,content):[whole(v,content)])}
export const unitLabel=(unit:StudyUnit)=>unit.total===1?`${unit.number}. Ayet`:`${unit.part}. ${unit.boundary==='study'?'Bölüm':'Durak'}`;
export function unitCue(unit:StudyUnit,kind:'arabic'|'reading',stage:1|2){
 const text=kind==='arabic'?unit.arabic:unit.reading;
 const parts=kind==='arabic'?arabicTokens(text).map(t=>t.text):text.trim().split(/\s+/u).filter(Boolean);
 if(!parts.length)return{start:'',end:'',masked:true};
 if(kind==='reading'&&unit.readingStart)return{start:unit.readingStart,end:stage===2?unit.readingEnd||'':'',masked:true};
 if(kind==='reading'&&parts.length===1)return{start:Array.from(text).slice(0,3).join('')+'…',end:'',masked:true};
 const n=stage===1?Math.min(2,parts.length-1):1;
 return{start:parts.slice(0,n).join(' '),end:stage===2&&parts.length>1?parts.at(-1)!:'',masked:parts.length>(stage===1?n:2)};
}
/** Seeded choices keep the answer position stable across rerenders and exclude learned units. */
export function orderChoices(units:StudyUnit[],index:number,seed:number):StudyUnit[]{
 const remaining=units.slice(index+1).map((unit,i)=>({unit,rank:Math.sin((i+1)*9283+seed)*10000})).sort((a,b)=>a.rank-b.rank);
 const target=units[index];if(!target)return[];
 const seen=new Set([target.arabic.trim()]),distractors:StudyUnit[]=[];
 for(const {unit} of remaining){const text=unit.arabic.trim();if(!seen.has(text)){seen.add(text);distractors.push(unit)}if(distractors.length===2)break}
 return[target,...distractors].map((unit,i)=>({unit,rank:Math.sin((i+1)*721+seed+index)*10000})).sort((a,b)=>a.rank-b.rank).map(x=>x.unit);
}
