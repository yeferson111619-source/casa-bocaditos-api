import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';

test('Interfaz Vue compilada: sesión, CRUD, búsqueda, conflictos y offline (DOM simulado)',async()=>{
 const window=new Window({url:'http://localhost:3000/#/',settings:{enableJavaScriptEvaluation:true,suppressInsecureJavaScriptEnvironmentWarning:true}});
 window.document.body.innerHTML='<div id="app"></div>';
 let signed=false,rows=[],nextId=1;
 const events=[];
 window.EventSource=class {constructor(){events.push(this);}close(){} addEventListener(name,fn){this[name]=fn;}};
 window.fetch=async(url,options={})=>{
  const method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
  const result=(status,data)=>({status,ok:status<400,json:async()=>data});
  if(url==='/api/sesion'&&method==='POST'){signed=body.token==='clave-de-demostracion';return signed?result(201,{data:{expiresIn:1800}}):result(401,{error:{message:'Credenciales inválidas'}});}
  if(!signed)return result(401,{error:{message:'Inicie sesión'}});
  if(url==='/api/sesion'&&method==='DELETE'){signed=false;return result(204);}
  if(url==='/api/reservas'&&method==='GET')return result(200,{data:structuredClone(rows)});
  if(url==='/api/reservas'&&method==='POST'){if(rows.some(r=>r.fecha===body.fecha))return result(409,{error:{message:'La fecha ya está reservada'}});const row={id:nextId++,...body};rows.push(row);return result(201,{data:row});}
  const id=Number(url.split('/').at(-1));
  if(method==='PUT'){rows=rows.map(r=>r.id===id?{id,...body}:r);return result(200,{data:rows.find(r=>r.id===id)});}
  if(method==='DELETE'){rows=rows.filter(r=>r.id!==id);return result(204);}
  throw Error('Petición inesperada: '+url);
 };
 const js=(await readdir('dist/assets')).find(n=>n.endsWith('.js'));
 window.eval(await readFile('dist/assets/'+js,'utf8'));
 const tick=()=>new Promise(r=>setTimeout(r,30));
 const input=(selector,value)=>{const el=window.document.querySelector(selector);assert.ok(el,selector);el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));};
 const button=(text)=>{const el=[...window.document.querySelectorAll('button')].find(e=>e.textContent.trim().startsWith(text));assert.ok(el,text);el.click();};
 const submit=()=>window.document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 const text=()=>window.document.body.textContent;
 await tick();input('#token','clave-de-demostracion');submit();await tick();assert.match(text(),/Próximas celebraciones/);
 input('#cliente','Ana Pérez');input('#fecha','2027-02-20');input('#personas','60');submit();await tick();assert.match(text(),/60 invitados/);assert.equal(window.document.querySelector('#cliente').value,'');
 button('Editar');await tick();input('#personas','80');submit();await tick();assert.match(text(),/80 invitados/);
 input('#cliente','Otra persona');input('#fecha','2027-02-20');submit();await tick();assert.match(text(),/La fecha ya está reservada/);
 input('#buscar','nadie');await tick();assert.match(text(),/No hay reservas para mostrar/);input('#buscar','');await tick();
 // A server notification must trigger a fresh list request.
 rows.push({id:nextId++,cliente:'Luis Romero',fecha:'2027-03-15',personas:30});events.at(-1).reserva();await tick();assert.match(text(),/Luis Romero/);
 button('Eliminar');await tick();button('Conservar');await tick();assert.equal(rows.length,2);button('Eliminar');await tick();button('Sí, eliminar');await tick();assert.equal(rows.length,1);
 Object.defineProperty(window.navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new window.Event('offline'));await tick();assert.doesNotMatch(text(),/Luis Romero/);assert.match(text(),/Sin conexión/);
 Object.defineProperty(window.navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new window.Event('online'));await tick();assert.match(text(),/Luis Romero/);button('Cerrar sesión');await tick();assert.ok(window.document.querySelector('#token'));
 await window.happyDOM.close();
});

test('Service worker: shell completo, sin intercepción de API ni escrituras',async()=>{
 const code=await readFile('dist/sw.js','utf8');const handlers={};const cached=[];
 const fake={self:{location:{origin:'http://localhost:3000'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn},caches:{open:async()=>({addAll:async list=>cached.push(...list)}),keys:async()=>[],match:async()=>({ok:true})},URL,fetch:async()=>({ok:true})};
 vm.runInNewContext(code,fake);
 let promise;handlers.install({waitUntil:p=>promise=p});await promise;
 assert.ok(cached.includes('/index.html'));assert.ok(cached.some(p=>p.endsWith('.js')));assert.ok(cached.some(p=>p.endsWith('.css')));assert.ok(!cached.some(p=>p.startsWith('/api/')));
 for(const [path,method] of [['/api/reservas','GET'],['/api/sesion','POST'],['/api/eventos','GET']]){let intercepted=false;handlers.fetch({request:{url:'http://localhost:3000'+path,method},respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
 fake.fetch=async()=>{throw Error('offline')};let fallback;handlers.fetch({request:{url:'http://localhost:3000/',method:'GET',mode:'navigate'},respondWith:p=>fallback=p});assert.ok((await fallback).ok);
});
