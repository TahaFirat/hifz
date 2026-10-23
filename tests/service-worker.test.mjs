import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function fixture() {
    const origin='https://fixture.invalid', handlers={}, entries=new Map();let online=true;
    const cache={put:async(k,r)=>entries.set(k,r.clone()),addAll:async()=>{}};
    const caches={open:async()=>cache,match:async k=>entries.get(k)?.clone()};
    const self={location:{origin},addEventListener:(name,handler)=>handlers[name]=handler};
    const fetch=async request=>{if(!online)throw Error('offline');const response=new Response('HTML:'+new URL(request.url).search);Object.defineProperty(response,'url',{value:request.url});return response;};
    vm.runInNewContext(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,caches,fetch,URL,Promise});
    async function navigate(path,headers=new Headers()) {let response;const pending=[];handlers.fetch({request:{method:'GET',url:origin+path,mode:'navigate',headers},respondWith:p=>response=p,waitUntil:p=>pending.push(p)});if(!response)return undefined;const result=await response;await Promise.all(pending);return result;}
    return {navigate,entries,offline:()=>online=false};
}
test('fixture-tested: offline visits to different query selections retain their own HTML',async()=>{
    const f=fixture();await f.navigate('/calis?icerik=s1');await f.navigate('/calis?icerik=s112');f.offline();
    assert.equal(await(await f.navigate('/calis?icerik=s1')).text(),'HTML:?icerik=s1');
    assert.equal(await(await f.navigate('/calis?icerik=s112')).text(),'HTML:?icerik=s112');
});
test('fixture-tested: an uncached query uses only the generic shell, not another selection',async()=>{
    const f=fixture();f.entries.set('/calis',new Response('GENERIC'));await f.navigate('/calis?icerik=s112');f.offline();
    assert.equal(await(await f.navigate('/calis?icerik=s114')).text(),'GENERIC');
});
test('fixture-tested: API and RSC requests stay outside navigation cache handling',async()=>{
    const f=fixture();assert.equal(await f.navigate('/api/lesson?chapter=1'),undefined);assert.equal(await f.navigate('/calis',new Headers({RSC:'1'})),undefined);
});
