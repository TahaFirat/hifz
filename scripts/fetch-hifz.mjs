import fs from 'node:fs/promises';
import {withTurkishSource} from '../lib/hifz/readings.ts';
const out = new URL('../lib/hifz/', import.meta.url);
async function json(url) {
  for (let attempt=0; attempt<3; attempt++) {
    try { const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok) throw Error(`${r.status} ${url}`);return await r.json(); }
    catch(e) { if(attempt===2) throw e; }
  }
}
const names='Fâtiha|Bakara|Âl-i İmrân|Nisâ|Mâide|En’âm|A’râf|Enfâl|Tevbe|Yûnus|Hûd|Yûsuf|Ra’d|İbrâhim|Hicr|Nahl|İsrâ|Kehf|Meryem|Tâhâ|Enbiyâ|Hac|Mü’minûn|Nûr|Furkân|Şuarâ|Neml|Kasas|Ankebût|Rûm|Lokmân|Secde|Ahzâb|Sebe|Fâtır|Yâsîn|Sâffât|Sâd|Zümer|Mü’min|Fussilet|Şûrâ|Zuhruf|Duhân|Câsiye|Ahkâf|Muhammed|Fetih|Hucurât|Kâf|Zâriyât|Tûr|Necm|Kamer|Rahmân|Vâkıa|Hadîd|Mücâdele|Haşr|Mümtehine|Saf|Cuma|Münâfikûn|Tegâbün|Talâk|Tahrîm|Mülk|Kalem|Hâkka|Meâric|Nûh|Cin|Müzzemmil|Müddessir|Kıyâme|İnsân|Mürselât|Nebe|Nâziât|Abese|Tekvîr|İnfitâr|Mutaffifîn|İnşikâk|Bürûc|Târık|A’lâ|Gâşiye|Fecr|Beled|Şems|Leyl|Duhâ|İnşirâh|Tîn|Alak|Kadir|Beyyine|Zilzâl|Âdiyât|Kâria|Tekâsür|Asr|Hümeze|Fîl|Kureyş|Mâûn|Kevser|Kâfirûn|Nasr|Tebbet|İhlâs|Felak|Nâs'.split('|');
const directory=(await json('https://api.alquran.cloud/v1/surah')).data.map((s,i)=>({id:s.number,name:names[i],arabicName:s.name,verseCount:s.numberOfAyahs,revelation:s.revelationType==='Meccan'?'Mekkî':'Medenî'}));
if(directory.length!==114 || names.length!==114)throw Error('Incomplete directory');
await fs.writeFile(new URL('chapters.json',out),JSON.stringify(directory));
const corpus={};
const [trSource,mealSource]=await Promise.all(['tr.transliteration','tr.vakfi'].map(async e=>(await json('https://api.alquran.cloud/v1/quran/'+e)).data.surahs));
for(const s of trSource){corpus[s.number]={};const meal=mealSource.find(m=>m.number===s.number);for(const v of s.ayahs){const m=meal.ayahs.find(a=>a.numberInSurah===v.numberInSurah);if(!v.text||!m?.text)throw Error('Incomplete Turkish source');corpus[s.number][v.numberInSurah]={reading:v.text,meaning:m.text};}}
await fs.writeFile(new URL('turkish.json',out),JSON.stringify(corpus));
const ids=[1,2,59,...Array.from({length:22},(_,i)=>93+i)];
const data={};
const clean=s=>s.replace(/<[^>]*>/g,'').trim();
const reading=s=>s.replace(/sh/g,'ş').replace(/th/g,'s').replace(/dh/g,'z').replace(/kh/g,'h').replace(/gh/g,'ğ').replace(/ḥ/g,'h').replace(/ṣ/g,'s').replace(/ḍ/g,'d').replace(/ṭ/g,'t').replace(/ẓ/g,'z').replace(/ā/g,'â').replace(/ī/g,'î').replace(/ū/g,'û').replace(/ʿ/g,'‘').replace(/ʾ/g,'’').replace(/w/g,'v');
let cursor=0;
await Promise.all(Array.from({length:3},async()=>{
  while(cursor<ids.length){ const id=ids[cursor++];
    const tr=(await json(`https://api.alquran.cloud/v1/surah/${id}/tr.transliteration`)).data.ayahs;
    let verses=[],page=1;
    do {
      const response=await json(`https://api.quran.com/api/v4/verses/by_chapter/${id}?language=tr&words=true&word_fields=text_uthmani&translations=77&per_page=50&page=${page}`);
      verses.push(...response.verses);page=response.pagination.next_page;
    }while(page);
    if(id===2)verses=verses.filter(v=>[255,285,286].includes(v.verse_number));
    if(id===59)verses=verses.filter(v=>v.verse_number>=22);
    if(id===96)verses=verses.filter(v=>v.verse_number<=5);
    data[id]={source:'Quran.com (Türkçe kelime anlamı, Diyanet meali); AlQuran Cloud (tam Türkçe okunuş). Kelime okunuşları fonetik dönüşümdür.',verses:verses.map(v=>({number:v.verse_number,arabic:v.words.filter(w=>w.char_type_name==='word').map(w=>w.text_uthmani).join(' '),reading:tr.find(a=>a.numberInSurah===v.verse_number).text,meaning:clean(v.translations[0].text),audio:`https://everyayah.com/data/Alafasy_128kbps/${String(id).padStart(3,'0')}${String(v.verse_number).padStart(3,'0')}.mp3`,approximate:true,words:v.words.filter(w=>w.char_type_name==='word').map(w=>({arabic:w.text_uthmani,reading:reading(w.transliteration.text||''),meaning:clean(w.translation.text)}))}))};
    console.log(`${id}: ${data[id].verses.length} ayet`);
  }
}));
for(const [id,lesson] of Object.entries(data))data[id]=withTurkishSource(lesson,Number(id),corpus[id]);
await fs.writeFile(new URL('offline.json',out),JSON.stringify(data));
await fs.mkdir(new URL('../public/fonts/',import.meta.url),{recursive:true});
for(const [name,url] of [
 ['Amiri-Regular.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf'],
 ['NotoNaskhArabic.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf'],
 ['NotoNaskhArabic-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/OFL.txt'],
 ['Manrope.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf'],
 ['Amiri-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/OFL.txt'],
 ['Manrope-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt']]){
 const r=await fetch(url);if(!r.ok)throw Error(`Font ${name}: ${r.status}`);await fs.writeFile(new URL(`../public/fonts/${name}`,import.meta.url),Buffer.from(await r.arrayBuffer()));
}
await fs.writeFile(new URL('provenance.json',out),JSON.stringify({retrievedAt:new Date().toISOString(),sources:['https://api.quran.com/api/v4','https://api.alquran.cloud/v1'],chapters:ids,verses:Object.values(data).reduce((n,s)=>n+s.verses.length,0),wordReading:'Turkish source transcription; exact phrase alignment or intact full reading. Fatiha independent onsets curated.',acikkuran:'DNS resolution failed during initial retrieval.'},null,2));
