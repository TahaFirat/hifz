// A cancelled permission request must never leave a microphone stream running.
export function createRecorder(onFinish:(blob:Blob)=>void,onError:()=>void,onStart:()=>void,media:Pick<MediaDevices,'getUserMedia'>=navigator.mediaDevices,Recorder:typeof MediaRecorder=MediaRecorder){
 let cancelled=false,stream:MediaStream|null=null,recorder:MediaRecorder|null=null,timer:ReturnType<typeof setTimeout>|undefined;
 const release=()=>{if(timer)clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());stream=null};
 const stop=()=>{try{if(recorder&&recorder.state!=='inactive')recorder.stop()}finally{release()}};
 return {
  async start(){try{
   const incoming=await media.getUserMedia({audio:true});
   if(cancelled){incoming.getTracks().forEach(t=>t.stop());return}
   stream=incoming;recorder=new Recorder(stream);const chunks:Blob[]=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onstop=()=>{release();if(!cancelled){if(chunks.length)onFinish(new Blob(chunks,{type:recorder?.mimeType||chunks[0].type}));else onError()}};
   recorder.onerror=()=>{cancelled=true;stop();onError()};
   recorder.start();onStart();timer=setTimeout(stop,180000);
  }catch{release();if(!cancelled)onError()}},
  stop,
  cancel(){cancelled=true;stop()}
 };
}
