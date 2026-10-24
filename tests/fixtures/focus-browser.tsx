// Browser QA only: served on a separate loopback origin, never shipped by the app.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import HifzWorkshop from '../../components/HifzWorkshop';
import {progressKey,review} from '../../lib/hifz/progress';
function Fixture(){const [key,setKey]=useState(0);return <><aside style={{padding:12,borderBottom:'1px solid gray'}}>Test fixture · Ayrı tarayıcı kaydı <button onClick={()=>{const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);yesterday.setMinutes(yesterday.getMinutes()-1);const record=review(undefined,{id:'quran:1:1',key:'s1',category:'basics',name:'Fâtiha',verse:1},'solid',yesterday.getTime());localStorage.setItem(progressKey,JSON.stringify({[record.id]:record}));setKey(k=>k+1)}}>Dünkü sağlam kaydı yükle</button></aside>{key>0&&<HifzWorkshop key={key} initialCategory="basics" initialKey="s1" initialStart="1" initialEnd="1" initialChallenge/>}</>}
createRoot(document.getElementById('root')!).render(<Fixture/>);
