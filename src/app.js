import http from 'node:http';
import {randomBytes, timingSafeEqual} from 'node:crypto';
import {repository} from './repository.js';
import {validate,normalize} from './domain.js';
const TTL=30*60*1000;
export function createApp({dbPath='reservas.sqlite',token,secure=false}={}) {
  if (!token || token.length<16) throw Error('ADMIN_TOKEN debe tener al menos 16 caracteres');
  const repo=repository(dbPath), sessions=new Map(), clients=new Map();
  const timer=setInterval(()=>{
    for(const [id,expires] of sessions) if(expires<=Date.now()) {
      sessions.delete(id); for(const res of clients.get(id)||[]) res.end(); clients.delete(id);
    }
    for(const set of clients.values()) for(const res of set) res.write(': heartbeat\n\n');
  },1000); timer.unref();
  const cookie=(id,age)=>`sid=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure?'; Secure':''}`;
  const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(data===undefined?undefined:JSON.stringify(data));};
  const fail=(res,status,code,message)=>send(res,status,{error:{code,message}});
  const event=(type,id)=>{for(const set of clients.values())for(const res of set)res.write(`event: reserva\ndata: ${JSON.stringify({type,id})}\n\n`);};
  async function body(req) {
    if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')) throw Object.assign(Error('Use application/json'),{status:415,code:'MEDIA_TYPE'});
    let raw='',size=0;
    for await(const chunk of req){size+=chunk.length;if(size>16384)throw Object.assign(Error('Máximo 16 KiB'),{status:413,code:'BODY_TOO_LARGE'});raw+=chunk;}
    try{return JSON.parse(raw);}catch{throw Object.assign(Error('JSON inválido'),{status:400,code:'INVALID_JSON'});}
  }
  const server=http.createServer(async(req,res)=>{
    try {
      const path=new URL(req.url,'http://localhost').pathname, method=req.method;
      const sid=/(?:^|;\s*)sid=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
      if(path==='/api/sesion'&&method==='POST') {
        const x=await body(req), value=typeof x?.token==='string'?Buffer.from(x.token):Buffer.alloc(0), expected=Buffer.from(token);
        if(value.length!==expected.length||!timingSafeEqual(value,expected)) return fail(res,401,'UNAUTHORIZED','Credenciales inválidas');
        if(sid) sessions.delete(sid);
        const id=randomBytes(32).toString('hex');sessions.set(id,Date.now()+TTL);
        return send(res,201,{data:{expiresIn:1800}},{'Set-Cookie':cookie(id,1800)});
      }
      if(!sid||!sessions.has(sid)||sessions.get(sid)<=Date.now())return fail(res,401,'UNAUTHORIZED','Inicie sesión');
      // Cliente de mismo origen: no se habilita CORS. SameSite=Strict protege la cookie.
      if(path==='/api/sesion'&&method==='DELETE') {
        sessions.delete(sid);for(const client of clients.get(sid)||[])client.end();clients.delete(sid);
        return send(res,204,undefined,{'Set-Cookie':cookie('',0)});
      }
      if(path==='/api/eventos'&&method==='GET'){
        res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
        res.write(': conectado\n\n');if(!clients.has(sid))clients.set(sid,new Set());clients.get(sid).add(res);
        res.on('close',()=>clients.get(sid)?.delete(res));return;
      }
      if(path==='/api/reservas'){
        if(method==='GET')return send(res,200,{data:repo.all()});
        if(method==='POST'){
          const x=await body(req),error=validate(x);if(error)return fail(res,422,'VALIDATION',error);
          const row=repo.create(normalize(x));event('created',row.id);
          return send(res,201,{data:row},{Location:`/api/reservas/${row.id}`});
        }
        return send(res,405,{error:{code:'METHOD_NOT_ALLOWED',message:'Método no permitido'}},{Allow:'GET, POST'});
      }
      const match=/^\/api\/reservas\/([1-9]\d*)$/.exec(path);
      if(match){
        const id=Number(match[1]);if(!Number.isSafeInteger(id))return fail(res,400,'INVALID_ID','ID inválido');
        if(!['GET','PUT','DELETE'].includes(method))return send(res,405,{error:{code:'METHOD_NOT_ALLOWED',message:'Método no permitido'}},{Allow:'GET, PUT, DELETE'});
        if(!repo.get(id))return fail(res,404,'NOT_FOUND','Reserva inexistente');
        if(method==='GET')return send(res,200,{data:repo.get(id)});
        if(method==='PUT'){
          const x=await body(req),error=validate(x);if(error)return fail(res,422,'VALIDATION',error);
          repo.update(id,normalize(x));event('updated',id);return send(res,200,{data:repo.get(id)});
        }
        repo.delete(id);event('deleted',id);return send(res,204);
      }
      return fail(res,404,'NOT_FOUND','Ruta inexistente');
    } catch(error){
      if(error.code?.startsWith('ERR_SQLITE')&&/UNIQUE constraint failed/.test(error.message))return fail(res,409,'CONFLICT','La fecha ya está reservada');
      if(error.status)return fail(res,error.status,error.code,error.message);
      console.error(error);return fail(res,500,'INTERNAL','Error interno');
    }
  });
  return {server,close:async()=>{clearInterval(timer);for(const set of clients.values())for(const res of set)res.end();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));repo.close();}};
}
