export type CoachState={verse:number;phase:'read'|'recall'|'link';count:number;complete:boolean};
export const initialCoach=():CoachState=>({verse:0,phase:'read',count:0,complete:false});
export function restoreCoach(value:unknown):CoachState {
    if(!value || typeof value!=='object') return initialCoach();
    const v=value as Partial<CoachState>;
    return {verse:Number.isInteger(v.verse) && v.verse!>=0 && v.verse!<20?v.verse!:0,phase:v.phase==='recall'||v.phase==='link'?v.phase:'read',count:Number.isInteger(v.count)&&v.count!>=0&&v.count!<=3?Math.min(v.count!,v.phase==='link'?2:3):0,complete:v.complete===true};
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
    {id:'list',label:'📜 Tam Liste Görünümü',description:'Ayetleri sırayla gör; ipucunu azaltarak her satırı zihninden tamamla.'},
    {id:'coach',label:'🕌 Osmanlı Hafızlık Koçu',description:'Her ayeti üç kez yüzünden, üç kez ezberden oku; sonra önceki ayetlerle iki kez bağla.'},
    {id:'reverse',label:'🔄 Sondan Başa Ayet Zinciri',description:'Son ayetten başla; her adımda bir önceki ayeti ekleyip ezberlediğin bölüme bağla.'},
    {id:'shadow',label:'🎙️ Semâ & Arz',description:'Tilaveti dinle, dört saniyelik arada ayetin tamamını sesli tekrar et, sonra ikinci dinleyişte kontrol et.'},
] as const;

export const ayahLevels=[
    {id:0,label:'1. Tam Açık'},
    {id:1,label:'2. Ayet Başı İpucu'},
    {id:2,label:'3. Baş ve Son İpucu'},
    {id:3,label:'4. Sıralı Ayet Testi'},
    {id:4,label:'5. Tam Gizli'},
] as const;

/** Divide a display line only at whitespace to create one continuous hint and one continuous mask. */
export function ayahCue(text:string, level:1|2):{start:string;middle:string;end:string} {
    const parts=text.trim().split(/\s+/u).filter(Boolean);
    if(!parts.length)return {start:'',middle:'',end:''};
    if(level===1)return {start:parts.slice(0,Math.min(2,parts.length)).join(' '),middle:parts.slice(2).join(' '),end:''};
    return {start:parts[0],middle:parts.slice(1,-1).join(' '),end:parts.length>1?parts.at(-1)!:''};
}
