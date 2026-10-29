import {createApp} from './app.js';
const app=createApp({token:process.env.ADMIN_TOKEN,dbPath:process.env.DB_PATH||'reservas.sqlite',secure:process.env.NODE_ENV==='production'});
app.server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('API en http://127.0.0.1:'+(process.env.PORT||3000)));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await app.close();process.exit(0);});
