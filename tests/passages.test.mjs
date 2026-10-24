import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {basics,allChapters,allSelections,memorizationPassages,chapters} from '../outputs/catalog-test.mjs';
import {searchContents} from '../lib/hifz/search.ts';
import {lessonSelection} from '../lib/hifz/study.ts';
import {readableTurkish} from '../lib/hifz/readings.ts';
import {plain} from '../lib/hifz/core.ts';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../lib/hifz/${name}`,import.meta.url),'utf8'));
const metadata=read('passages.json'),offline=read('offline.json'),turkish=read('turkish.json'),proof=read('passage-provenance.json');
const sha=text=>createHash('sha256').update(text).digest('hex');
test('fixture-tested: ready passages have valid unambiguous ranges and retain legacy keys',()=>{
 assert.equal(allChapters.length,114);assert.equal(new Set(basics.map(c=>c.key)).size,basics.length);
 for(const p of memorizationPassages){const chapter=chapters.find(c=>c.id===p.chapter);assert.ok(chapter);assert.ok(p.start>=1&&p.end>=p.start&&p.end<=chapter.verseCount&&p.end-p.start<20);assert.ok(metadata.find(v=>v.key===p.key).reference.startsWith('https://'));}
 assert.deepEqual(['k255','k285','h22'].map(key=>memorizationPassages.find(p=>p.key===key).start),[255,285,22]);
 assert.deepEqual(memorizationPassages.filter(p=>['n31','d51'].includes(p.key)).map(p=>[p.chapter,p.start,p.end]),[[78,31,40],[44,51,59]]);
});
test('fixture-tested: typed variants and chapter references find the exact ready selection',()=>{
 for(const catalog of [basics,allSelections])for(const [query,key] of [['amenarrasulu','k285'],['ÂMENER RESÛLÜ','k285'],['innelil müttegın','n31'],['inne lil müttakine','n31'],['innel muttakin','d51'],['Bakara 285-286','k285'],['Nebe 31 40','n31'],['78:31-40','n31'],['lev enzelna','h21'],['lekad caekum','t128'],['muhammedun resulullah','f29']]){
  const result=searchContents(catalog,query,metadata,chapters);assert.ok(result.some(c=>c.key===key),query);
 }
 assert.deepEqual(searchContents(basics,'innelil müttegın',metadata,chapters).map(c=>c.key),['n31']);
 assert.deepEqual(searchContents(basics,'olmayan-kelime',metadata,chapters),[]);
 assert.ok(searchContents(allSelections,'2',metadata,chapters).every(c=>c.chapter===2));
});
test('fixture-tested: chapter view and offline recovery open complete passage, never first five verses',()=>{
 const lists={basics,all:allSelections,prayers:[]};
 for(const category of ['basics','all'])for(const p of memorizationPassages){const selected=lessonSelection({category,key:p.key},lists);assert.equal(selected.content.key,p.key);assert.deepEqual(selected.range,[p.start,p.end]);}
});
test('fixture-tested: every ready ayah is embedded and matches live-verified integrity hashes',()=>{
 const ids=new Set();for(const p of memorizationPassages)for(let number=p.start;number<=p.end;number++){
  const id=`${p.chapter}:${number}`,v=offline[p.chapter]?.verses.find(v=>v.number===number),e=proof.verses.find(r=>r.id===id);assert.ok(v&&e,id);ids.add(id);
  assert.equal(sha(v.arabic),e.arabicSha256,id);assert.equal(sha(v.reading),e.readingSha256,id);assert.equal(sha(v.meaning),e.meaningSha256,id);
  assert.equal(v.reading,readableTurkish(turkish[p.chapter][number].reading),id);assert.equal(v.meaning,plain(turkish[p.chapter][number].meaning),id);
  assert.ok(/[\u0621-\u064a]/u.test(v.arabic));assert.ok(!/[A-Za-z]/u.test(v.arabic));assert.match(v.audio,new RegExp(`${String(p.chapter).padStart(3,'0')}${String(number).padStart(3,'0')}\\.mp3$`));
 }
 assert.equal(ids.size,proof.verses.length);
});
test('fixture-tested: verified complete Bakara 286 translation cannot regress to truncated upstream text',()=>{
 const v=offline[2].verses.find(v=>v.number===286),note=read('passage-source-notes.json')['2:286'];
 assert.equal(sha(v.meaning),note.meaningSha256);assert.match(v.meaning,/Bize acı!/u);assert.match(v.meaning,/topluluğuna karşı bize yardım et\.$/u);
 assert.ok(proof.verses.find(v=>v.id==='2:286').translationReference.includes('diyanet.gov.tr'));
});
test('fixture-tested: complete Turkish corpus is bound to the recorded live audit',()=>{
 const audit=read('corpus-audit.json'),raw=fs.readFileSync(new URL('../lib/hifz/turkish.json',import.meta.url),'utf8');assert.equal(sha(raw),audit.corpusSha256);
 assert.equal(audit.results.find(r=>r.edition==='tr.transliteration').exactMatches,6236);
 const meaning=audit.results.find(r=>r.edition==='tr.vakfi');assert.equal(meaning.checked,6236);assert.deepEqual(meaning.exceptions.map(e=>e.id),['2:286']);assert.equal(meaning.exactMatches+meaning.exceptions.length,6236);
});
