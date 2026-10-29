import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../src/app.js';
const token='test-only-token-123456';
test('Contrato HTTP, validación, conflictos, SSE, sesiones y persistencia',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'reservas-'));let app;
 async function boot(){app=createApp({token,dbPath:join(dir,'db.sqlite')});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${app.server.address().port}`;}
 let base=await boot();let cookie='';
 const call=(path,method='GET',data)=>fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async()=>{const r=await call('/api/sesion','POST',{token});assert.equal(r.status,201);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly/);};
 try {
 assert.equal((await call('/api/reservas')).status,401);
 assert.equal((await call('/api/sesion','POST',{token:'wrong'})).status,401);
 await login();
 const stream=await fetch(base+'/api/eventos',{headers:{Cookie:cookie}});assert.equal(stream.status,200);const reader=stream.body.getReader();await reader.read();
 const data={cliente:' Ana ',fecha:'2027-02-20',personas:60};
 let r=await call('/api/reservas','POST',data);assert.equal(r.status,201);assert.equal(r.headers.get('location'),'/api/reservas/1');assert.equal((await r.json()).data.cliente,'Ana');
 const evt=await Promise.race([reader.read(),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('SSE timeout')),3000);t.unref();})]);assert.match(new TextDecoder().decode(evt.value),/"type":"created"/);await reader.cancel();
 assert.equal((await call('/api/reservas','POST',data)).status,409);
 for(const bad of [{...data,personas:0},{...data,fecha:'2027-02-30'},{...data,extra:true},null])assert.equal((await call('/api/reservas','POST',bad)).status,422);
 r=await fetch(base+'/api/reservas',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{'});assert.equal(r.status,400);assert.equal((await r.json()).error.code,'INVALID_JSON');
 r=await fetch(base+'/api/reservas',{method:'POST',headers:{Cookie:cookie},body:'x'});assert.equal(r.status,415);
 r=await fetch(base+'/api/reservas',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({x:'a'.repeat(17000)})});assert.equal(r.status,413);
 assert.equal((await call('/api/reservas/999')).status,404);
 assert.equal((await call('/api/reservas','PATCH',data)).status,405);
 assert.equal((await call('/desconocida')).status,404);
 assert.equal((await call('/api/reservas/1','PUT',{...data,personas:80})).status,200);
 assert.equal((await (await call('/api/reservas/1')).json()).data.personas,80);
 await app.close();base=await boot();assert.equal((await call('/api/reservas')).status,401);await login();
 assert.equal((await (await call('/api/reservas')).json()).data.length,1);
 assert.equal((await call('/api/reservas/1','DELETE')).status,204);
 assert.equal((await call('/api/reservas/1')).status,404);
 assert.equal((await call('/api/sesion','DELETE')).status,204);
 assert.equal((await call('/api/reservas')).status,401);
 } finally{await app.close();await rm(dir,{recursive:true,force:true});}
});
