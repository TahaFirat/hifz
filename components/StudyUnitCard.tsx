'use client';
import {Eye,EyeOff,Play,Pause,Repeat2,Target} from 'lucide-react';
import {displayArabic} from '@/lib/hifz/arabic-display';
import {unitCue,unitLabel,type StudyUnit} from '@/lib/hifz/segments';

type Props={unit:StudyUnit;stage:number;opened:boolean;active:boolean;blocked:boolean;hard:boolean;arabic:boolean;reading:boolean;meaning:boolean;canPlay:boolean;playing:{repeat:boolean;phase:string}|null;onReveal:()=>void;onMark:()=>void;onPlay:(repeat:boolean)=>void};
export default function StudyUnitCard(p:Props){
 const {unit,stage,opened}=p,hidden=!opened,pausing=p.playing?.phase==='pause',onlyAnchor=hidden&&(stage===4||stage===0);
 const line=(kind:'arabic'|'reading')=>{
  const text=kind==='arabic'?unit.arabic:unit.reading;if(!text)return null;
  if(!hidden)return kind==='arabic'?displayArabic(text):text;
  if(stage===3)return <span className="masked-block" aria-hidden="true"/>;
  const cue=unitCue(unit,kind,stage===2?2:1);
  return <><span>{kind==='arabic'?displayArabic(cue.start):cue.start}</span>{cue.masked&&<span className="masked-block cue-mask" aria-hidden="true"/>}{cue.end&&<span>{kind==='arabic'?displayArabic(cue.end):cue.end}</span>}</>;
 };
 const label=unitLabel(unit);
 return <article className={`verse-card unit-card ${p.hard?'difficult':''} ${p.active?'ayah-active':''} ${onlyAnchor?'anchor-only':''}`} aria-label={`${label} · ${unit.anchor}`}>
  <div className="verse-header">
   <button className="meaning-anchor" disabled={p.blocked} onClick={p.onReveal} aria-label={`${label}: ${unit.anchor}; ${hidden?'aç':'gizle'}`}><span>{unit.total>1?unit.part:unit.number}.</span> {unit.anchor}</button>
   <div className="verse-actions">
    <button className="icon-button" aria-label={p.playing&&!p.playing.repeat?'Durdur':unit.total>1?'Bölümü seslendir':'Ayeti dinle'} disabled={!p.canPlay} onClick={()=>p.onPlay(false)}>{p.playing&&!p.playing.repeat?<Pause size={18}/>:<Play size={18}/>}</button>
    <button className="icon-button" aria-label="Dinle ve tekrar et" aria-pressed={!!p.playing?.repeat} disabled={!p.canPlay} onClick={()=>p.onPlay(true)}><Repeat2 size={19}/></button>
    <button className="icon-button" aria-label={hidden?'Aç':'Gizle'} disabled={p.blocked} onClick={p.onReveal}>{hidden?<EyeOff size={19}/>:<Eye size={19}/>}</button>
    <button className={`icon-button ${p.hard?'active':''}`} aria-label={p.hard?'Zor işaretini kaldır':'Zorlandım'} aria-pressed={p.hard} onClick={p.onMark}><Target size={19}/></button>
   </div>
  </div>
  {pausing&&<span className="shadow-cue" role="status">🎙️ Şimdi Sen Oku</span>}
  {onlyAnchor?<button className="unit-recall" disabled={p.blocked} aria-label={`${label} aç`} onClick={p.onReveal}/>:<button className="ayah-lines" disabled={p.blocked} onClick={p.onReveal} aria-label={`${label} ${hidden?'aç':'gizle'}`}>
   {p.arabic&&<span className="ayah-arabic" lang="ar" dir="rtl">{line('arabic')}</span>}
   {p.reading&&unit.reading&&<span className="ayah-reading" lang="tr" dir="ltr">{line('reading')}</span>}
   {p.meaning&&unit.meaning&&<span className="ayah-meaning" lang="tr" dir="ltr">{hidden?<span className="masked-block" aria-hidden="true"/>:unit.meaning}</span>}
  </button>}
 </article>;
}
