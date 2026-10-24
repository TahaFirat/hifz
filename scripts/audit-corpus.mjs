import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=new URL('../lib/hifz/',import.meta.url),raw=await fs.readFile(new URL('turkish.json',root),'utf8'),local=JSON.parse(raw),notes=JSON.parse(await fs.readFile(new URL('passage-source-notes.json',root),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const results=[];
for(const [edition,field] of [['tr.transliteration','reading'],['tr.vakfi','meaning']]){
 const source=`https://api.alquran.cloud/v1/quran/${edition}`,response=await fetch(source,{signal:AbortSignal.timeout(30000)});
 assert.ok(response.ok,`${source}: HTTP ${response.status}`);const remote=await response.json();assert.equal(remote.data.edition.identifier,edition);assert.equal(remote.data.surahs.length,114);
 const exceptions=[],seen=new Set();let matches=0;
 for(const chapter of remote.data.surahs)for(const ayah of chapter.ayahs){
  const id=`${chapter.number}:${ayah.numberInSurah}`;assert.ok(!seen.has(id));seen.add(id);
  const text=local[chapter.number]?.[ayah.numberInSurah]?.[field];assert.ok(text&&ayah.text,`${id}: missing ${field}`);
  if(text===ayah.text){matches++;continue}
  const note=notes[id];assert.ok(field==='meaning'&&note&&sha(text)===note.meaningSha256&&text.startsWith(ayah.text),`${id}: unreviewed source difference`);
  exceptions.push({id,reference:note.reference,localLength:text.length,upstreamLength:ayah.text.length});
 }
 assert.equal(seen.size,6236);results.push({edition,source,checked:seen.size,exactMatches:matches,exceptions});
}
await fs.writeFile(new URL('corpus-audit.json',root),JSON.stringify({checkedAt:new Date().toISOString(),corpusSha256:sha(raw),scope:'Exact source-data comparison, not a linguistic or theological certification.',results},null,2));
console.log(JSON.stringify(results.map(({edition,checked,exactMatches,exceptions})=>({edition,checked,exactMatches,exceptions}))));
