import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {studyUnits,splitLongVerseIntoWaqfSegments,arabicWordCount,arabicTokens,orderChoices,unitCue} from '../lib/hifz/segments.ts';
import {restoreUnitStudy} from '../lib/hifz/study.ts';
import {prayers} from '../lib/hifz/prayers.ts';
import {quranSegments} from '../lib/hifz/segments-data.ts';
import {advanceCoach,initialCoach,reverseFrame} from '../lib/hifz/methods.ts';
import type {Content,Lesson,Verse} from '../lib/hifz/types.ts';
const offline=JSON.parse(fs.readFileSync(new URL('../lib/hifz/offline.json',import.meta.url),'utf8')) as Record<string,Lesson>;
const content=(chapter:number,key='fixture',kind:Content['kind']='surah'):Content=>({chapter,key,kind,name:key,start:1,end:286});
const verse=(n:number,arabic:string):Verse=>({number:n,arabic,reading:'Kaynaktaki bütün okunuş.',meaning:'Kaynaktaki bütün meal.',words:[]});
const normalized=(s:string)=>s.trim().replace(/\s+/gu,' ');

test('Arabic annotations do not inflate length or split letters inside ordinary words',()=>{
 assert.equal(arabicWordCount('مُحَمَّدٌ جَعَلَ طَيِّبٌۚ قَمَرٌ'),4);
 assert.equal(arabicWordCount('قٓ وَالْقُرْآنِ الْمَجِيدِ'),3);
 assert.equal(arabicWordCount('اللَّهُ ۚ لَا إِلَهَ إِلَّا هُوَ'),5);
 assert.equal(arabicTokens('عِلْمٌ ج نُورٌ')[0].text,'عِلْمٌ ج');
});
test('short verses remain intact and medium verses become exactly two complete phrases',()=>{
 for(let count=1;count<=14;count++){
  const source=verse(1,Array(count).fill('كَلِمَةٌ').join(' '));const units=studyUnits([source],content(99));
  assert.equal(units.length,count<8?1:2);assert.equal(normalized(units.map(v=>v.arabic).join(' ')),source.arabic);
 }
 const fatiha=splitLongVerseIntoWaqfSegments(offline['1'].verses.find(v=>v.number===7)!,content(1));
 assert.deepEqual(fatiha.map(v=>arabicWordCount(v.arabic)),[4,5]);
 const short=studyUnits(offline['1'].verses,content(1));assert.equal(unitCue(short.find(v=>v.number===3)!,'reading',1).start,'Errahmâni');assert.equal(unitCue(short.find(v=>v.number===6)!,'reading',1).start,'İhdinâ');
});
test('Ayat al-Kursi has nine aligned story stops and retains every source word and sign',()=>{
 const source=offline['2'].verses.find(v=>v.number===255)!;const units=studyUnits([source],content(2));
 assert.equal(units.length,9);assert.equal(arabicWordCount(source.arabic),50);
 assert.deepEqual(units.map(v=>v.anchor),['Tevhid','Uyku Tutmaz','Mülk O’nun','Şefaat İzni','Mutlak İlim','İlimden Nasip','Kürsü’nün Genişliği','Korumak Yormaz','Yüce ve Azîm']);
 assert.equal(normalized(units.map(v=>v.arabic).join(' ')),normalized(source.arabic));
 assert.ok(units.every(v=>v.reading&&v.meaning&&v.aligned&&v.parent===source&&!v.audio));
 assert.equal(unitCue(units[0],'reading',1).start,'Allâhü lâ');
});
test('all curated Quran plans cover their full source exactly once',()=>{
 for(const key of Object.keys(quranSegments)){const [chapter,number]=key.split(':').map(Number),source=offline[String(chapter)].verses.find(v=>v.number===number)!;
  const units=studyUnits([source],content(chapter));assert.equal(units.length,quranSegments[key].length,key);
  assert.equal(normalized(units.map(v=>v.arabic).join(' ')),normalized(source.arabic),key);
  assert.equal(new Set(units.map(v=>v.id)).size,units.length);assert.ok(units.every(v=>v.reading&&v.meaning),key);
 }
 assert.match(offline['2'].verses.find(v=>v.number===286)!.meaning,/Sen bizim Mevlâmızsın/);
});
test('all eight prayers retain the original Arabic, source reading and meaning across their sections',()=>{
 for(const [key,lesson] of Object.entries(prayers)){const units=studyUnits(lesson.verses,content(0,key,'prayer')),source=lesson.verses[0];
  assert.ok(units.length>1,key);for(const field of ['arabic','reading','meaning'] as const)assert.equal(normalized(units.map(v=>v[field]).join(' ')),normalized(source[field]),`${key}:${field}`);
  assert.ok(units.every(v=>v.aligned&&v.anchor));
 }
});
test('automatic sections preserve no-stop signs and do not invent a matching translation',()=>{
 const source=verse(4,Array.from({length:21},(_,i)=>'كَلِمَةٌ'+(i===5?'ۙ':'')).join(' '));const units=studyUnits([source],content(99));
 assert.ok(units.length>=3);assert.ok(units.every(v=>arabicWordCount(v.arabic)<=7));
 assert.ok(units.slice(0,-1).every(v=>!v.arabic.endsWith('ۙ')));
 assert.ok(units.every(v=>!v.reading&&!v.meaning&&!v.aligned&&v.parent===source));
 assert.equal(normalized(units.map(v=>v.arabic).join(' ')),source.arabic);
 const medium=verse(2,Array.from({length:10},(_,i)=>'كَلِمَةٌ'+(i===4?'ۙ':'')).join(' '));assert.ok(!studyUnits([medium],content(99))[0].arabic.endsWith('ۙ'));
});
test('punctuation alignment is only used for source-marked boundaries with matching clause counts',()=>{
 const source={...verse(1,'كَلِمَةٌ كَلِمَةٌ كَلِمَةٌ كَلِمَةٌ ۚ كَلِمَةٌ كَلِمَةٌ كَلِمَةٌ كَلِمَةٌ'),reading:'Birinci cümle. İkinci cümle.',meaning:'Birinci anlam. İkinci anlam.'};
 const units=studyUnits([source],content(99));assert.deepEqual(units.map(v=>v.reading),['Birinci cümle.','İkinci cümle.']);assert.ok(units.every(v=>v.aligned));
 const full=studyUnits([source],content(99),false);assert.equal(full.length,1);assert.equal(full[0].arabic,source.arabic);assert.equal(full[0].reading,source.reading);
});
test('coach and reverse chaining advance through more than twenty study units',()=>{
 let coach=initialCoach();let transitions=0;while(!coach.complete&&transitions<300){coach=advanceCoach(coach,30);transitions++}assert.equal(coach.verse,29);assert.equal(coach.complete,true);
 assert.deepEqual(reverseFrame(3,30),[27,28,29]);
 const state=restoreUnitStudy({schema:4,mode:'coach',coach:{verse:29,phase:'link',count:1},step:30,cursor:29,reveals:{'255.9':true,'255:9':true,'__proto__':true}});
 assert.equal(state.coach.verse,29);assert.equal(state.cursor,29);assert.deepEqual(state.reveals,{'255.9':true});
 assert.deepEqual(restoreUnitStudy({schema:3,reveals:{'1':true},coach:{verse:5}}).reveals,{});
});
test('ordering choices are stable, unique and exclude already learned sections',()=>{
 const source=offline['2'].verses.find(v=>v.number===255)!,units=studyUnits([source],content(2));
 for(let i=0;i<units.length;i++){const options=orderChoices(units,i,42);assert.ok(options.some(v=>v.id===units[i].id));assert.ok(options.every(v=>units.indexOf(v)>=i));assert.equal(new Set(options.map(v=>v.arabic)).size,options.length);assert.deepEqual(options,orderChoices(units,i,42));assert.ok(options.length<=3)}
 assert.deepEqual(orderChoices(units,units.length,42),[]);
});
