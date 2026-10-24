'use client';
import {useCallback,useEffect,useState} from 'react';
import {progressKey,restoreReviews,review,assessReview,type Review,type Reviews,type Rating} from '@/lib/hifz/progress';
export function loadReviews():Reviews{try{return restoreReviews(JSON.parse(localStorage.getItem(progressKey)||'null'))}catch{return {}}}
export default function useReviews(){
 const [records,setRecords]=useState<Reviews>({}),[ready,setReady]=useState(false),[storageError,setStorageError]=useState(false);
 useEffect(()=>{const refresh=()=>setRecords(loadReviews());refresh();setReady(true);window.addEventListener('storage',refresh);window.addEventListener('hifz-review',refresh);return()=>{window.removeEventListener('storage',refresh);window.removeEventListener('hifz-review',refresh)}},[]);
 const rate=useCallback((details:Omit<Review,'rating'|'interval'|'due'|'updated'>,rating:Rating)=>{
  const latest=loadReviews();const next={...latest,[details.id]:review(latest[details.id],details,rating)};setRecords(next);
  try{localStorage.setItem(progressKey,JSON.stringify(next));setStorageError(false);window.dispatchEvent(new Event('hifz-review'))}catch{setStorageError(true)}
 },[]);
 const assess=useCallback((id:string,passed:boolean)=>{const latest=loadReviews(),record=assessReview(latest[id],passed);if(!record)return false;const next={...latest,[id]:record};try{localStorage.setItem(progressKey,JSON.stringify(next));setRecords(next);setStorageError(false);window.dispatchEvent(new Event('hifz-review'));return true}catch{setStorageError(true);return false}},[]);
 return {records,ready,rate,assess,storageError};
}
