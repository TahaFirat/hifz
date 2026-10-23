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
    {id:'coach',label:'1. Osmanlı 3+3 & Rabt',description:'Yüzünden 3 okuma → bakmadan 3 hatırlama → önceki ayetlerle 2 bağlama. Görsel kodlama ve aktif geri çağırma, ayet geçişlerini tekrar etmeni sağlar. Bu uygulamadaki 3+3 düzeni, geleneksel yüzünden/ezberden okuma ve rabt çalışmalarından esinlenen bir çalışma akışıdır.'},
    {id:'reverse',label:'2. Sondan Başa Zincir',description:'Son ayetle başla; önceki ayeti ekleyerek sona doğru oku. Yeni bölümü daha önce çalıştığın sona bağlamak, son ayetleri de sık tekrar etmeni sağlar. Kelimeleri ters sırayla açarken okuma yönü değişmez.'},
    {id:'bridge',label:'3. Ayet Başı-Sonu Köprüsü',description:'Ayetin başı ve sonu açık, ortası gizli kalır. Bir ayetin son kelimesini sonraki ayetin ilk kelimesiyle birlikte çalış. Bu geçiş ipuçları, ayetler arasındaki bağlantıyı geri çağırmayı destekler.'},
    {id:'standard',label:'4. İlk Harf Ateşlemesi',description:'İpuçlarını açık → aralıklı → ilk harf/hece → kapalı sırasıyla azalt. Önce zihninden söyle, sonra dokunup kontrol et. Kademeli ipucu azaltma ve geri çağırma alıştırması, bildiğini sınamaya yardım eder.'},
    {id:'quiz',label:'5. Kelime Dizme & Semâ-Arz',description:'Karışık kelimelerden sıradakini seçerek ayeti kur. Yanlış seçilen yerler zorlandıklarına eklenir. 🔁 ile dinle (semâ), 4 saniye yüksek sesle tekrar et (arz), ardından tekrar dinleyip karşılaştır. Mikrofon kaydı veya otomatik telaffuz değerlendirmesi yapılmaz.'},
] as const;
