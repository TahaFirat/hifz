'use client';
import {useEffect,useState} from 'react';
import useReviews from './useReviews';
import {dailyPlan,localDay,reviewHref,canChallenge} from '@/lib/hifz/progress';
import {basics,prayerCatalog} from '@/lib/hifz/catalog';
export default function LearningHome(){
 const {records,ready}=useReviews();const [minutes,setMinutes]=useState(5),[now,setNow]=useState(0),[open,setOpen]=useState(false),[filter,setFilter]=useState('all');
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
 const challenges=Object.values(records).filter(r=>canChallenge(r,now)).sort((a,b)=>(a.nextTest??a.updated)-(b.nextTest??b.updated));
 const all=Object.values(records),due=all.filter(r=>r.due<=now).length;
 const plan=dailyPlan(records,[...basics,...prayerCatalog].flatMap(c=>Array.from({length:c.end-c.start+1},(_,i)=>({id:c.kind==='prayer'?`prayer:${c.key}:${c.start+i}`:`quran:${c.chapter}:${c.start+i}`,key:c.key,category:c.kind==='prayer'?'prayers':'basics',name:c.name,verse:c.start+i}))),minutes,now);
 function start(){
  const items=plan;
  if(!items.length)return;
  try{sessionStorage.setItem('hifz:daily:v1',JSON.stringify({items,index:0,minutes,started:Date.now()}));location.assign(reviewHref(items[0])+'&gunluk=1')}catch{location.assign(reviewHref(items[0]))}
 }
 return <section className="learning-home" aria-label="Çalışma planım"><div className="daily-heading"><strong>Bugünün çalışması</strong><div role="group" aria-label="Çalışma süresi">{[5,10].map(n=><button key={n} aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>~{n} dk</button>)}</div></div><button className="daily-start" disabled={!ready||!plan.length} onClick={start}>Başla <span>{due?`${due} ayet tekrar bekliyor`:plan.length?plan[0].name+' ile çalış':'Bugünlük tamam'} →</span></button>{challenges.length>0&&<a className="challenge-entry" href={reviewHref(challenges[0])+'&sina=1'}>Sağlamlık sınaması <span>{challenges.length} ayet →</span></a>}<button className="map-toggle" aria-expanded={open} onClick={()=>setOpen(!open)}>Ezber haritam <span>{all.length} ayet {open?'−':'+'}</span></button>{open&&<><div className="review-calendar" aria-label="7 günlük tekrar takvimi">{Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()+i);const count=all.filter(r=>i===0?r.due<=now||localDay(r.due)===localDay(now):localDay(r.due)===localDay(d.getTime())).length;return <div key={i}><span>{i===0?'Bugün':d.toLocaleDateString('tr',{weekday:'short'})}</span><strong>{count}</strong></div>})}</div><div className="map-filters" aria-label="Ezber durumu">{[{id:'all',label:'Tümü'},{id:'learning',label:'Öğreniyorum'},{id:'again',label:'Tekrar gerekiyor'},{id:'solid',label:'Sağlam'}].map(x=><button key={x.id} aria-pressed={filter===x.id} onClick={()=>setFilter(x.id)}>{x.label}</button>)}</div><div className="review-map">{all.filter(r=>filter==='all'||r.rating===filter).sort((a,b)=>a.due-b.due).map(r=><a key={r.id} href={reviewHref(r)}><span>{r.name} · {r.verse}</span><small>{r.due<=now?'Tekrar zamanı':new Date(r.due).toLocaleDateString('tr',{day:'numeric',month:'short'})}</small><i className={`review-dot ${r.rating}`} aria-label={r.rating==='solid'?'Sağlam':r.rating==='again'?'Tekrar gerekiyor':'Öğreniyorum'}/></a>)}{!all.length&&<p>İlk çalışmandan sonra burada görünür.</p>}</div></>}</section>;
}
