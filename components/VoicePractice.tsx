'use client';
import {useEffect,useRef,useState} from 'react';
import {createRecorder} from '@/lib/hifz/recorder';
export default function VoicePractice({onStopReference,referencePlaying}:{onStopReference:()=>void;referencePlaying:boolean}){
 const [status,setStatus]=useState<'idle'|'requesting'|'recording'|'error'|'unsupported'>('idle'),[url,setUrl]=useState('');
 const recorder=useRef<ReturnType<typeof createRecorder>|null>(null),objectUrl=useRef(''),audio=useRef<HTMLAudioElement|null>(null);
 const releaseUrl=()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=''};
 useEffect(()=>{const stop=(event?:Event)=>{recorder.current?.cancel();if(!(event instanceof CustomEvent&&event.detail===audio.current))audio.current?.pause();setStatus(s=>s==='recording'||s==='requesting'?'idle':s)};const cleanup=()=>{stop();releaseUrl();setUrl('')};window.addEventListener('pagehide',cleanup);window.addEventListener('hifz-stop-recording',stop);return()=>{window.removeEventListener('pagehide',cleanup);window.removeEventListener('hifz-stop-recording',stop);cleanup()}},[]);
 useEffect(()=>{if(referencePlaying){audio.current?.pause();recorder.current?.cancel();setStatus(s=>s==='recording'||s==='requesting'?'idle':s)}},[referencePlaying]);
 function start(){
  window.dispatchEvent(new Event('hifz-stop-recording'));
  onStopReference();audio.current?.pause();
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setStatus('unsupported');return}
  recorder.current?.cancel();setStatus('requesting');
  recorder.current=createRecorder(blob=>{releaseUrl();objectUrl.current=URL.createObjectURL(blob);setUrl(objectUrl.current);setStatus('idle')},()=>setStatus('error'),()=>setStatus('recording'));
  void recorder.current.start();
 }
 return <div className="voice-practice"><button onClick={()=>{if(status==='requesting'){recorder.current?.cancel();setStatus('idle')}else if(status==='recording'){recorder.current?.stop();setStatus('idle')}else start()}}>{status==='recording'?'■ Kaydı bitir':status==='requesting'?'İptal':'🎙 Kendini kaydet'}</button>{status==='recording'&&<span role="status">Kayıt · en fazla 3 dk</span>}{status==='error'&&<span role="status">Mikrofon açılamadı. İzni kontrol edip tekrar dene.</span>}{status==='unsupported'&&<span role="status">Bu tarayıcıda ses kaydı desteklenmiyor.</span>}{url&&<><audio ref={audio} controls src={url} aria-label="Kendi okuyuşum" onPlay={()=>{window.dispatchEvent(new CustomEvent('hifz-stop-recording',{detail:audio.current}));onStopReference()}}/><button onClick={()=>{audio.current?.pause();releaseUrl();setUrl('')}} aria-label="Ses kaydını sil">Sil</button></>}<small>Örnek için ayetin ▶ düğmesini kullan. Kayıt yalnızca bu sayfada tutulur.</small></div>;
}
