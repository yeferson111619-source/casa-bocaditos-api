# Casa Bocaditos · Reservas SPA/PWA

Aplicaciones Web, Unidad 3. Yeferson Parra, carrera Software.
Continuación de la API REST de Unidad 2: Node.js 24, SQLite y SSE.
Cliente Vue 3 con Vue Router, Vite, componentes y PWA de caché pública limitada.

## Ejecutar en Windows

Requiere Node.js 24 o superior. Extraer el proyecto y abrir CMD en su carpeta.

```cmd
npm ci
npm test
set ADMIN_TOKEN=clave-de-demostracion
npm start
```

Abrir **http://127.0.0.1:3000** y escribir la misma clave. Mantener el servidor encendido.
Alternativa tras compilar: `INICIAR_WINDOWS.bat`.
`npm test` compila y ejecuta todas las pruebas; `npm run build` solo compila.
La clave de ejemplo es únicamente para demostración local.

## Desarrollo

Con la API encendida en 3000, abrir otra CMD y ejecutar `npm run dev`.
Visitar http://127.0.0.1:5173. Vite redirige `/api` al backend;
las cookies y SSE conservan el mismo origen para el navegador. No se habilita CORS.
El service worker solo se registra en la compilación de producción.
Para probar PWA usar el servidor en 3000, después de `npm run build`.
La API original ahora sirve `dist/` antes de exigir autenticación a las rutas privadas.

## Componentes y responsabilidades

- `App.vue`: estructura, navegación, estado de red y botón de instalación.
- `ReservasView.vue`: coordina API, SSE, borradores y operaciones.
- `LoginForm.vue`: captura clave y emite `login`; no persiste credenciales.
- `ReservaForm.vue`: copia de la reserva en formulario; emite `save` y `cancel`.
- `ReservaList.vue`: lista con `:key="reserva.id"`, edición y confirmación de eliminación.
- `AyudaView.vue`: guía disponible offline.
- `api.js`: único servicio HTTP; comprueba `response.ok`, interpreta errores y maneja 204.
- `session.js`: solo comparte el indicador reactivo de sesión; el servidor sigue validando cada petición.

Las props no se mutan. La vista conserva reservas, carga, éxito, error, búsqueda y borrador.
Las consultas anteriores se cancelan con AbortController; un contador descarta resultados obsoletos.
Las escrituras se bloquean mientras otra operación está en curso. SSE consulta de nuevo la lista
al conectar, al reconectar y al recibir eventos, porque el backend no reproduce eventos pasados.
Al salir de la vista se cancela la consulta y se cierra EventSource.

## API

| Método | Ruta | Uso |
|---|---|---|
| POST / DELETE | /api/sesion | Entrar / salir |
| GET / POST | /api/reservas | Listar / crear |
| GET / PUT / DELETE | /api/reservas/:id | Leer / sustituir / eliminar |
| GET | /api/eventos | Notificaciones SSE |

Login JSON: `{"token":"clave-de-demostracion"}`.
Reserva JSON: `{"cliente":"Ana Pérez","fecha":"2027-02-20","personas":60}`.
Cliente de 2 a 100 caracteres, fecha válida, invitados enteros de 1 a 1000.
Una reserva por fecha; conflicto 409. PUT requiere todos los campos.
Cookie HttpOnly, SameSite=Strict, sesión de 30 minutos. La clave nunca se escribe en almacenamiento local.
No se envían campos de decoración, precios o menú porque no forman parte del contrato de Unidad 2.

## PWA y caché

Manifest con nombre, inicio, colores e iconos PNG de 192 y 512.
El paso de build inserta los nombres reales de JS/CSS en `dist/sw.js`.
Instalación atómica de toda la interfaz mediante `cache.addAll`.
HTML: red primero y copia offline si falla; recursos versionados: caché primero.
Solo se cachean archivos de la interfaz explícitamente incluidos. Nunca se interceptan API,
SSE, POST, PUT o DELETE; no se guardan respuestas privadas ni reservas. No hay cola offline.
Al desconectarse se borra la lista visible y se deshabilitan operaciones; se conserva la guía.
Al reconectarse se consulta al servidor. Cachés antiguas propias se eliminan al activar el nuevo worker.
Una actualización puede esperar al cierre de las pestañas previas. HTTPS o localhost obligatorio.
Instalar y usar offline requiere al menos una primera carga completa con conexión.

## Pruebas y límites

`npm test` ejecuta la integración real de API, flujos de la interfaz compilada con Happy DOM
(API simulada) y lógica del service worker mediante VM. No equivale a pruebas en navegador.
Ver `EVIDENCIA_U3.txt` y `docs/GUIA_EVIDENCIAS.md`.
No se pudo ejecutar Chromium en el entorno de preparación; quedan pendientes revisión visual,
instalación real, offline en navegador y accesibilidad manual. No se adjuntan capturas ficticias.
La demostración es local, sin despliegue público. Antes de entregar, subir los archivos a GitHub,
revisar el informe y añadir evidencias. No subir base SQLite, cookies, `.env` ni node_modules.
La API sigue siendo una demostración académica con administrador único y sesiones en memoria.

## Referencias técnicas

- Vue: https://vuejs.org/guide/components/props y https://vuejs.org/guide/components/events
- Vite: https://vite.dev/config/server-options
- PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
