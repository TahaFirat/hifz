'use client';
import {useEffect,useState} from 'react';
import {allSelections,basics,prayerCatalog} from '@/lib/hifz/catalog';
import {reviewHref} from '@/lib/hifz/progress';
type Item={key:string;category:string;verse:number};
type Session={items:Item[];index:number;minutes:number;started:number};
export default function DailySession({contentKey,verse,updated}:{contentKey:string;verse:number;updated:number}){
 const [session,setSession]=useState<Session|null>(null),[done,setDone]=useState(false);
 useEffect(()=>{if(new URLSearchParams(location.search).get('gunluk')!=='1')return;try{const s=JSON.parse(sessionStorage.getItem('hifz:daily:v1')||'null');if(!s||!Array.isArray(s.items)||!s.items.length||s.items.length>10||!Number.isInteger(s.index)||s.index<0||s.index>=s.items.length||![5,10].includes(s.minutes)||!Number.isFinite(s.started)||Date.now()-s.started>86400000||s.started>Date.now())return;for(const item of s.items){const c=(item.category==='prayers'?prayerCatalog:item.category==='all'?allSelections:basics).find(c=>c.key===item.key);if(!c||!Number.isInteger(item.verse)||item.verse<c.start||item.verse>c.end)return}setSession(s)}catch{}},[]);
 if(!session||session.items[session.index].key!==contentKey||session.items[session.index].verse!==verse)return null;
 function next(){if(!session)return;if(session.index+1===session.items.length){try{sessionStorage.removeItem('hifz:daily:v1')}catch{}setDone(true);return}const s={...session,index:session.index+1};try{sessionStorage.setItem('hifz:daily:v1',JSON.stringify(s));location.assign(reviewHref(s.items[s.index])+'&gunluk=1')}catch{location.assign(reviewHref(s.items[s.index]))}}
 const rated=updated>=session.started;
 return <section className="daily-session" aria-label="Günlük çalışma"><strong>{done?'Bugünkü çalışma tamamlandı':`Bugünün çalışması · ${session.index+1}/${session.items.length}`}</strong>{done?<a href="/">Ana sayfa →</a>:<button onClick={()=>{if(rated){next();return}const panel=document.querySelector<HTMLDetailsElement>('.verse-review');if(panel){panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'center'})}}}>{rated?'Sonraki →':'Değerlendir ↓'}</button>}</section>;
}
