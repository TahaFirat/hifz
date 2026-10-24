'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronLeft,Play,Pause,Eye,EyeOff,ArrowRight} from 'lucide-react';
import {displayArabic} from '@/lib/hifz/arabic-display';
import type {Verse} from '@/lib/hifz/types';
type Props={verses:Verse[];startNumber:number;arabic:boolean;reading:boolean;meaning:boolean;canSpeak:boolean;playing:{id:string;phase:string}|null;challenge:boolean;onPlay:(verse:Verse,id:string)=>void;onStop:()=>void;onExit:()=>void;onAssess:(passed:boolean)=>boolean};
export default function FocusPractice(p:Props){
 const [index,setIndex]=useState(()=>Math.max(0,p.verses.findIndex(v=>v.number===p.startNumber))),[opened,setOpened]=useState(!p.challenge),[checked,setChecked]=useState(false),[result,setResult]=useState<boolean|null>(null),[error,setError]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null),submitted=useRef(false);
 const verse=p.verses[index],id=`focus:${verse?.number}`,isPlaying=p.playing?.id===id;
 useEffect(()=>{heading.current?.focus()},[index,result]);
 useEffect(()=>()=>p.onStop(),[p.onStop]);
 if(!verse)return <p role="status">Çalışılacak ayet bulunamadı.</p>;
 const reveal=()=>{setOpened(!opened);if(p.challenge)setChecked(true)};
 const move=(next:number)=>{p.onStop();setIndex(next);setOpened(true)};
 const grade=(passed:boolean)=>{if(submitted.current||!checked)return;submitted.current=true;if(p.onAssess(passed)){setResult(passed);setError(false)}else{submitted.current=false;setError(true)}};
 return <section className="focus-practice" aria-label={p.challenge?'Sağlamlık sınaması':'Odak çalışması'}>
  <div className="focus-progress"><h2 ref={heading} tabIndex={-1}>{verse.number}. Ayet</h2>{!p.challenge&&<span>{index+1} / {p.verses.length}</span>}</div>
  <article className="verse-card focus-card">
   {opened?<div className="ayah-lines">{p.arabic&&<p className="ayah-arabic" lang="ar" dir="rtl">{displayArabic(verse.arabic)}</p>}{p.reading&&<p className="ayah-reading">{verse.reading}</p>}{p.meaning&&<p className="ayah-meaning">{verse.meaning}</p>}</div>:<div className="focus-recall" role="status"><strong>{p.challenge?'Ezberden oku':'Ayet gizli'}</strong>{p.challenge&&<p>Okuduktan sonra metinle karşılaştır.</p>}</div>}
  </article>
  {p.challenge?<div className="challenge-controls">{result===null?<>{!checked?<button className="focus-primary" onClick={reveal}>Kontrol et</button>:<><p>Kendi okuyuşunu değerlendir.</p><div><button disabled={submitted.current} onClick={()=>grade(false)}>Takıldım</button><button disabled={submitted.current} onClick={()=>grade(true)}>Hatırladım</button></div></>}{error&&<p role="status">Sonuç kaydedilemedi veya sınama artık geçerli değil. Çıkıp tekrar dene.</p>}</>:<><p role="status">{result?'Sınama kaydedildi · Sağlam':'Tekrar planlandı · 10 dk sonra'}</p><button onClick={p.onExit}>Çalışmaya dön</button></>}</div>:<>
   <div className="focus-previous"><button disabled={index===0} onClick={()=>move(index-1)}><ChevronLeft size={17}/> Önceki</button></div>
   <nav className="focus-dock" aria-label="Odak kontrolleri"><button disabled={!verse.audio&&!p.canSpeak} onClick={()=>p.onPlay(verse,id)}>{isPlaying?<Pause size={20}/>:<Play size={20}/>}<span>{isPlaying?'Durdur':'Dinle'}</span></button><button onClick={reveal}>{opened?<EyeOff size={20}/>:<Eye size={20}/>}<span>{opened?'Gizle':'Aç'}</span></button><button onClick={()=>index+1<p.verses.length?move(index+1):p.onExit()}><ArrowRight size={20}/><span>{index+1<p.verses.length?'Sonraki':'Bitir'}</span></button></nav>
  </>}
 </section>;
}
