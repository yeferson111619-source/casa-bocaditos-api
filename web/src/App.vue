<script setup>
import {onMounted,onUnmounted,ref} from 'vue';
const online=ref(navigator.onLine),install=ref(null);
function update(){online.value=navigator.onLine;}
function promptInstall(event){event.preventDefault();install.value=event;}
async function installApp(){await install.value.prompt();install.value=null;}
onMounted(()=>{window.addEventListener('online',update);window.addEventListener('offline',update);window.addEventListener('beforeinstallprompt',promptInstall);});
onUnmounted(()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);window.removeEventListener('beforeinstallprompt',promptInstall);});
</script>
<template><a class="skip" href="#main">Saltar al contenido</a><header><div class="brand"><span class="monogram" aria-hidden="true">CB</span><div>CASA BOCADITOS<small>El sabor de cada celebración</small></div></div><nav aria-label="Principal"><RouterLink to="/">Reservas</RouterLink><RouterLink to="/ayuda">Ayuda</RouterLink><button v-if="install" class="light" @click="installApp">Instalar</button></nav></header><div v-if="!online" class="offline" role="status">Sin conexión. Puedes consultar la ayuda; las reservas requieren conexión y no se guardan en este dispositivo.</div><main id="main"><RouterView :online="online"/></main><footer>Casa Bocaditos · Agenda de eventos <span>Aplicaciones Web · Unidad 3</span></footer></template>
