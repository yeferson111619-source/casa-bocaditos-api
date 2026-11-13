<script setup>
import {ref} from 'vue';
defineProps({busy:Boolean,error:String,online:Boolean});
const emit=defineEmits(['login']);const token=ref('');
function submit(){emit('login',token.value);token.value='';}
</script>
<template><section class="login card"><span class="eyebrow">BIENVENIDO A TU AGENDA</span><h1>Cada celebración<br>empieza aquí.</h1><p>Organiza tus reservas y prepara el próximo gran momento.</p><form @submit.prevent="submit"><label for="token">Clave de administrador</label><input id="token" v-model="token" type="password" required minlength="16" autocomplete="current-password" :disabled="busy" aria-describedby="login-error"><p v-if="error" id="login-error" class="error" role="alert">{{error}}</p><button :disabled="busy||!online">{{busy?'Ingresando…':'Ingresar a la agenda'}}</button></form><small>Acceso privado · Sesiones de 30 minutos</small></section></template>
