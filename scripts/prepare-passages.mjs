import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readableTurkish} from '../lib/hifz/readings.ts';
import {plain,stripBasmala,verseAudio} from '../lib/hifz/core.ts';
const root=new URL('../lib/hifz/',import.meta.url);
const read=async name=>JSON.parse(await fs.readFile(new URL(name,root),'utf8'));
const [passages,offline,turkish]=await Promise.all(['passages.json','offline.json','turkish.json'].map(read));
const notes=await read('passage-source-notes.json');
async function json(url){for(let attempt=0;attempt<3;attempt++){try{const response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error(`HTTP ${response.status}`);return await response.json()}catch(error){if(attempt===2)throw Error(`${url}: ${error.message}`)}}}
const sha=text=>createHash('sha256').update(text).digest('hex');
// Ignore annotation/spacing differences only for the independent witness check.
const letters=text=>text.normalize('NFC').replace(/[\u0654\u0655]/gu,'ء').replace(/ٱ/gu,'ا').replace(/[^\u0621-\u063a\u0641-\u064a]/gu,'');
const verified=[];
for(const chapter of [...new Set(passages.map(p=>p.chapter))]){
 const cloudUrl=`https://api.alquran.cloud/v1/surah/${chapter}/editions/quran-uthmani,tr.transliteration,tr.vakfi`;
 const cloud=await json(cloudUrl);assert.equal(cloud.code,200);assert.equal(cloud.data.length,3);
 const [ar,tr,meaning]=['quran-uthmani','tr.transliteration','tr.vakfi'].map(id=>cloud.data.find(e=>e.edition.identifier===id));
 assert.ok(ar&&tr&&meaning);for(const edition of [ar,tr,meaning])assert.equal(edition.number,chapter);
 const numbers=[...new Set(passages.filter(p=>p.chapter===chapter).flatMap(p=>Array.from({length:p.end-p.start+1},(_,i)=>p.start+i)))].sort((a,b)=>a-b);
 const rows=await Promise.all(numbers.map(async number=>{
  const id=`${chapter}:${number}`,api=`https://api.quran.com/api/v4/verses/by_key/${id}?fields=text_uthmani`;
  const result=(await json(api)).verse;assert.equal(result.verse_key,id);assert.equal(result.verse_number,number);assert.ok(result.text_uthmani);
  const a=ar.ayahs.find(v=>v.numberInSurah===number),r=tr.ayahs.find(v=>v.numberInSurah===number),m=meaning.ayahs.find(v=>v.numberInSurah===number);
  assert.ok(a?.text&&r?.text&&m?.text,`${id}: missing source`);
  const arabic=stripBasmala(result.text_uthmani,chapter,number);
  assert.equal(letters(arabic),letters(stripBasmala(a.text,chapter,number)),`${id}: Arabic sources disagree`);
  assert.equal(turkish[chapter][number].reading,r.text,`${id}: transcription changed`);
  const storedMeaning=turkish[chapter][number].meaning,note=notes[id];
  if(storedMeaning!==m.text){assert.ok(note&&sha(storedMeaning)===note.meaningSha256&&storedMeaning.startsWith(m.text),`${id}: unreviewed translation difference`)}
  const reading=readableTurkish(r.text),translation=plain(storedMeaning),old=offline[chapter]?.verses.find(v=>v.number===number);
  if(old){assert.equal(letters(old.arabic),letters(arabic),`${id}: embedded Arabic differs`);assert.equal(old.reading,reading,`${id}: embedded reading differs`);assert.equal(old.meaning,translation,`${id}: embedded translation differs`)}
  // An intact ayah is the source layer. No generated word reading or translation.
  const verse=old||{number,arabic,reading,meaning:translation,words:[{arabic,reading,meaning:translation,readingSource:'source'}],audio:verseAudio(chapter,number),approximate:false};
  return {verse,proof:{id,arabicSha256:sha(verse.arabic),readingSha256:sha(reading),meaningSha256:sha(translation),arabicSource:api,comparisonSource:cloudUrl,...(note?{translationReference:note.reference,note:note.note}:{})}};
 }));
 const existing=offline[chapter]||{source:'Quran.com · Arapça; Muhammet Abay · Türkçe çeviriyazı; Diyanet Vakfı · meal',verses:[]};
 const merged=new Map(existing.verses.map(v=>[v.number,v]));for(const row of rows){merged.set(row.verse.number,row.verse);verified.push(row.proof)}
 offline[chapter]={...existing,verses:[...merged.values()].sort((a,b)=>a.number-b.number)};
 console.log(`${chapter}: ${rows.length} ayet iki Arapça kaynak ve Türkçe kaynaklarla karşılaştırıldı`);
}
// All checks finish before either authored data file is changed.
await fs.writeFile(new URL('offline.json',root),JSON.stringify(offline));
await fs.writeFile(new URL('passage-provenance.json',root),JSON.stringify({retrievedAt:new Date().toISOString(),comparison:'Arabic base letters compared across Quran.com and AlQuran Cloud; source reading and meaning compared exactly. This is data-integrity verification, not scholarly certification.',verses:verified},null,2));
console.log(`${verified.length} benzersiz ayet doğrulandı.`);
