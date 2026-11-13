import {createApp} from 'vue';
import {createRouter,createWebHashHistory} from 'vue-router';
import App from './App.vue';
import ReservasView from './views/ReservasView.vue';
import AyudaView from './views/AyudaView.vue';
import './style.css';
const router=createRouter({history:createWebHashHistory(),routes:[{path:'/',component:ReservasView},{path:'/ayuda',component:AyudaView},{path:'/:pathMatch(.*)*',redirect:'/'}]});
createApp(App).use(router).mount('#app');
if(import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(console.error);
