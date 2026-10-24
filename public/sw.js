const CACHE='hifz-shell-v12';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/calis','/favicon.svg','/fonts/Amiri-Regular.ttf','/fonts/Manrope.ttf','/fonts/NotoNaskhArabic.ttf']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hifz-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.includes('signin')||url.pathname.includes('signout')||url.pathname.includes('callback')||request.headers.has('RSC')||(url.search&&request.mode!=='navigate'))return;
 if(request.mode==='navigate'&&['/','/calis'].includes(url.pathname)){const key=url.pathname+url.search;event.respondWith(fetch(request).then(response=>{if(response.ok&&new URL(response.url).origin===self.location.origin&&['/','/calis'].includes(new URL(response.url).pathname)){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy)));}return response;}).catch(async()=>await caches.match(key)||await caches.match(url.pathname)||await caches.match('/')));return;}
 if(/\.(js|css|ttf|woff2|svg)$/.test(url.pathname))event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;})));
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_ASSETS'||!Array.isArray(event.data.urls))return;
 const urls=event.data.urls.filter(u=>{try{const url=new URL(u);return url.origin===self.location.origin&&/\.(js|css|ttf|svg)$/.test(url.pathname)&&!url.pathname.startsWith('/api/');}catch{return false;}}).slice(0,150);
 event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(urls.map(u=>cache.add(u)))));
});
