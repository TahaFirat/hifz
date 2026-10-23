export type CoachState={verse:number;phase:'read'|'recall'|'link';count:number;complete:boolean};
export const initialCoach=():CoachState=>({verse:0,phase:'read',count:0,complete:false});
export function restoreCoach(value:unknown,maxUnits=20):CoachState {
    if(!value || typeof value!=='object') return initialCoach();
    const v=value as Partial<CoachState>;
    return {verse:Number.isInteger(v.verse) && v.verse!>=0 && v.verse!<maxUnits?v.verse!:0,phase:v.phase==='recall'||v.phase==='link'?v.phase:'read',count:Number.isInteger(v.count)&&v.count!>=0&&v.count!<=3?Math.min(v.count!,v.phase==='link'?2:3):0,complete:v.complete===true};
}
export function advanceCoach(state:CoachState,total:number):CoachState {
    if(!total || state.complete) return state;
    const target=state.phase==='link'?2:3;
    if(state.count+1<target) return {...state,count:state.count+1};
    if(state.phase==='read') return {...state,phase:'recall',count:0};
    if(state.phase==='recall' && state.verse>0) return {...state,phase:'link',count:0};
    if(state.verse+1>=total) return {...state,count:target,complete:true};
    return {verse:state.verse+1,phase:'read',count:0,complete:false};
}
export function reverseFrame(step:number,total:number):number[] {
    const start=Math.max(0,total-Math.max(1,Math.min(step,total)));
    return Array.from({length:total-start},(_,i)=>start+i);
}
export function cueMask(level:number,index:number):boolean {return level===0?false:level===1?index%2===1:true;}
export function bridgeMask(index:number,count:number):boolean {return index>0&&index<count-1;}
export const methods=[
    {id:'list',label:'📜 Duraklı Liste',description:'Kısa ayetleri bütün, uzun metinleri anlamlı bölümler hâlinde çalış.'},
    {id:'coach',label:'🕌 Hafız Koçu · 3+3',description:'Üç kez bakarak, üç kez ezberden oku; öğrendiğin bölümleri iki kez birbirine bağla.'},
    {id:'reverse',label:'🔄 Sondan Başa Zincir',description:'Son bölümden başla; her adımda bir öncekini ekleyip öğrendiklerinle birleştir.'},
    {id:'order',label:'🧩 Sıralama ve Köprü',description:'Karışık seçeneklerden sıradaki ayeti veya durağı seçerek metni tamamla.'},
] as const;

export const ayahLevels=[
    {id:0,label:'1. Tam Açık'},
    {id:1,label:'2. Başlangıç İpucu'},
    {id:2,label:'3. Baş ve Son İpucu'},
    {id:3,label:'4. Sıralı Test'},
    {id:4,label:'5. Sadece Anlam Çapası'},
] as const;

/** Divide a display line only at whitespace to create one continuous hint and one continuous mask. */
export function ayahCue(text:string, level:1|2):{start:string;middle:string;end:string} {
    const parts=text.trim().split(/\s+/u).filter(Boolean);
    if(!parts.length)return {start:'',middle:'',end:''};
    if(level===1)return {start:parts.slice(0,Math.min(2,parts.length)).join(' '),middle:parts.slice(2).join(' '),end:''};
    return {start:parts[0],middle:parts.slice(1,-1).join(' '),end:parts.length>1?parts.at(-1)!:''};
}
