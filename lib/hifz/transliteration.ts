import type { Word } from './types';

const letters: Record<string,string> = {'ء':'’','أ':'','إ':'','ؤ':'’','ئ':'’','ا':'','ٱ':'','ب':'b','ت':'t','ث':'s','ج':'c','ح':'h','خ':'h','د':'d','ذ':'z','ر':'r','ز':'z','س':'s','ش':'ş','ص':'s','ض':'d','ط':'t','ظ':'z','ع':'‘','غ':'ğ','ف':'f','ق':'k','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'v','ي':'y','ى':'','ة':'t','آ':'â'};
const emphatic = new Set(['خ','ص','ض','ط','ظ','غ','ق']);
const backFatha = new Set([...emphatic,'ح','ع','ر']);
const solar = new Set('تثدذرزسشصضطظلن');
const spelling = (s:string) => s.normalize('NFC').replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g,'').replace(/ٱ/g,'ا');
const isolated: Record<string,string> = {'الم':'Elif lâm mîm','الر':'Elif lâm râ','المص':'Elif lâm mîm sâd','المر':'Elif lâm mîm râ','كهيعص':'Kâf hâ yâ ayn sâd','طه':'Tâ hâ','طسم':'Tâ sîn mîm','طس':'Tâ sîn','يس':'Yâ sîn','ص':'Sâd','حم':'Hâ mîm','عسق':'Ayn sîn kâf','ق':'Kâf','ن':'Nûn'};

/** Deterministic reading aid, not a replacement for verified recitation/tajwid. */
export function arabicWordToTurkishTranslit(input:string):string {
    const raw=input.normalize('NFC').replace(/\u0640/g,''), bare=spelling(raw);
    if(isolated[bare] && !/[ًٌٍَُِّْ]/u.test(raw)) return isolated[bare];
    if(bare==='الله' || bare==='لله') {
        const ending=/ِ[\u06d6-\u06ed]*$/u.test(raw)?'i':/َ[\u06d6-\u06ed]*$/u.test(raw)?'e':/ُ[\u06d6-\u06ed]*$/u.test(raw)?'ü':'';
        return (bare==='لله'?'Lillâh':'Allâh')+ending;
    }
    const units=Array.from(raw.matchAll(/([\u0621-\u063a\u0641-\u064a\u0671])([\u064b-\u065f\u0670\u06d6-\u06ed]*)/gu),m=>({base:m[1],marks:m[2]}));
    let prefix='',start=0;
    if(units.length>2 && ['ا','ٱ','أ'].includes(units[0].base) && units[1].base==='ل' && units[1].marks.includes('ّ')) {prefix='E';start=1;}
    else if(units.length>2 && ['ا','ٱ','أ'].includes(units[0].base) && units[1].base==='ل') {
        const next=units[2].base;
        prefix=solar.has(next)?'E'+letters[next]+'-':'El-';start=2;
    }
    let result=prefix;
    for(let i=start;i<units.length;i++) {
        const {base,marks}=units[i], next=units[i+1];
        let consonant=base==='ى'&&/[َُِّ]/u.test(marks)?'y':letters[base]??'';
        if(i===start && !prefix && ['ا','ٱ','أ','إ'].includes(base) && !/[َُِ]/u.test(marks)) consonant=base==='إ'?'i':'i';
        if(marks.includes('ّ') && !(i===start && prefix.endsWith('-') && solar.has(base))) consonant+=consonant;
        let vowel=marks.includes('ً')?'en':marks.includes('ٍ')?'in':marks.includes('ٌ')?'ün':marks.includes('َ')?(backFatha.has(base)||next&&backFatha.has(next.base)?'a':'e'):marks.includes('ِ')?'i':marks.includes('ُ')?(emphatic.has(base)?'u':'ü'):'';
        if(marks.includes('ٰ')) vowel='â';
        if(next && !/[ًٌٍَُِّ]/u.test(next.marks)) {
            if(marks.includes('َ') && ['ا','آ','ى'].includes(next.base)){vowel='â';i++;}
            else if(marks.includes('ِ') && next.base==='ي' && !next.marks.includes('ْ')){vowel='î';i++;}
            else if(marks.includes('ُ') && next.base==='و' && !next.marks.includes('ْ')){vowel='û';i++;}
        }
        result+=consonant+vowel;
    }
    return result ? result[0].toLocaleUpperCase('tr')+result.slice(1) : '—';
}

export function splitArabicWords(text:string):string[] {
    // Standalone pause ornaments are not words. Keep marks attached to their Arabic token.
    const result:string[]=[];
    for(const token of text.trim().split(/\s+/u).filter(Boolean)) {
        if(/[\u0621-\u063a\u0641-\u064a\u0671]/u.test(token)) result.push(token);
        else if(result.length) result[result.length-1]+=token;
    }
    return result;
}

/** Native word readings first; exact whole-verse token count second; Arabic resolver last. */
export function alignArabicWords(words:Word[], reading:string, native=true):Word[] {
    const rows=words.flatMap(w=>splitArabicWords(w.arabic).map(arabic=>({arabic,reading:splitArabicWords(w.arabic).length===1 && native?w.reading:'',meaning:splitArabicWords(w.arabic).length===1?w.meaning:'',readingSource:w.readingSource})));
    const candidates=[reading.trim().split(/\s+/u),reading.trim().split(/[\s\-–]+/u)];
    const matched=candidates.find(c=>c.filter(Boolean).length===rows.length)?.filter(Boolean);
    return rows.map((w,i)=>{
        const source=w.reading.trim() || matched?.[i]?.replace(/[.,;:!?]+$/u,'');
        return {...w,reading:source || arabicWordToTurkishTranslit(w.arabic),readingSource:source?(w.readingSource??'source'):'calculated'};
    });
}
