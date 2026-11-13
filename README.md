# Casa Bocaditos · Aplicación de reservas SPA/PWA

**Estudiante:** Yeferson Parra  
**Carrera:** Software  
**Asignatura:** Aplicaciones Web  
**Unidad 3:** Programación del lado del cliente

## Descripción

Aplicación de una sola página desarrollada con Vue 3 que consume la API REST de reservas creada en la Unidad 2. Permite administrar reservas de catering de Casa Bocaditos mediante una interfaz adaptable a escritorio y móvil. Incluye instalación como PWA y acceso limitado sin conexión.

**Repositorio:** https://github.com/yeferson111619-source/casa-bocaditos-api  
**Demostración local:** http://127.0.0.1:3000

La demostración requiere ejecutar el proyecto en el equipo. La dirección local no corresponde a un despliegue público.

## Tecnologías

- Vue 3 y Vue Router: componentes reactivos y navegación SPA.
- Vite: desarrollo y compilación de la interfaz.
- Node.js 24 y servidor HTTP nativo: API y publicación local de la interfaz compilada.
- SQLite: persistencia de reservas.
- Server-Sent Events (SSE): actualización de la lista entre ventanas conectadas.
- Web App Manifest y service worker: instalación y caché de recursos públicos.
- Node Test Runner y Happy DOM: pruebas automatizadas.

## Requisitos y ejecución en Windows

Instalar **Node.js 24 o superior**, descargar o clonar el repositorio y abrir **Símbolo del sistema (CMD)** en la carpeta que contiene `package.json`.

Ejecutar los siguientes comandos, uno por uno:

```cmd
npm ci
npm test
set ADMIN_TOKEN=clave-de-demostracion
npm start
```

Abrir **http://127.0.0.1:3000** en Chrome o Edge e ingresar la clave:

```text
clave-de-demostracion
```

Mantener el servidor encendido durante la demostración. La clave es de ejemplo para uso académico local y puede cambiarse mediante `ADMIN_TOKEN` (mínimo 16 caracteres).

`npm test` compila la interfaz y ejecuta las tres pruebas automatizadas. También se puede compilar sin ejecutar pruebas mediante:

```cmd
npm run build
```

Después de instalar dependencias y compilar, `INICIAR_WINDOWS.bat` permite iniciar el servidor con la clave de demostración. No se debe abrir `web/index.html` directamente.

## Funcionalidades

- Inicio y cierre de sesión de administrador.
- Creación, consulta, edición y eliminación de reservas.
- Confirmación y cancelación antes de eliminar.
- Búsqueda por cliente o fecha.
- Totales de reservas e invitados.
- Estados de carga, éxito, lista vacía y error.
- Actualización entre pestañas mediante SSE.
- Diseño adaptable a escritorio y móvil.
- Instalación como aplicación PWA.
- Ayuda disponible sin conexión después de una carga inicial completa.

Cada reserva contiene cliente, fecha e invitados. Se valida un nombre de 2 a 100 caracteres, una fecha real y un número entero de invitados entre 1 y 1000. Solo se admite una reserva por fecha; una fecha ocupada produce un error HTTP 409.

## Organización y componentes

```text
src/                         API de la Unidad 2 y servidor de archivos compilados
test/api.test.js             Prueba de integración de la API
tests/client.test.js         Pruebas del cliente y del service worker
scripts/build-shell.js       Preparación de la caché de la interfaz compilada
web/
  index.html
  public/                    Manifest, iconos y plantilla del service worker
  src/
    App.vue                  Estructura, navegación, conectividad e instalación
    main.js                  Arranque y configuración del router
    api.js                   Servicio HTTP centralizado
    session.js               Indicador reactivo compartido de sesión
    components/
      LoginForm.vue          Captura de clave; evento login
      ReservaForm.vue        Formulario; eventos save y cancel
      ReservaList.vue        Listado; eventos edit y delete
    views/
      ReservasView.vue       Coordinación de reservas, API, estados y SSE
      AyudaView.vue          Guía de uso disponible offline
```

Los componentes reciben datos mediante props y notifican acciones mediante eventos. El formulario utiliza una copia del registro y no modifica las props. Las filas usan `reserva.id` como clave estable. El estado de reservas y borradores pertenece a `ReservasView`; solo el indicador de sesión se comparte.

## Consumo de API y control de peticiones

`api.js` centraliza `fetch`, envía las cookies del mismo origen, comprueba `response.ok`, interpreta errores y maneja respuestas 204 sin cuerpo. Las respuestas de la API no se guardan en caché.

Las consultas anteriores se cancelan con `AbortController`; un contador evita que respuestas antiguas sustituyan resultados recientes. Los botones de escritura se deshabilitan durante las operaciones. Un error 401 limpia la sesión visible y un conflicto 409 conserva el borrador para corregirlo.

SSE provoca una nueva consulta al conectar, reconectar y recibir cambios. Esto permite recuperar el estado actual aunque el servidor no conserve eventos anteriores. Al abandonar la vista se cancela la consulta y se cierra la conexión SSE.

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/sesion` | Iniciar sesión |
| DELETE | `/api/sesion` | Cerrar sesión |
| GET | `/api/reservas` | Listar reservas |
| POST | `/api/reservas` | Crear reserva |
| GET | `/api/reservas/:id` | Consultar reserva |
| PUT | `/api/reservas/:id` | Actualizar todos los campos de una reserva |
| DELETE | `/api/reservas/:id` | Eliminar reserva |
| GET | `/api/eventos` | Recibir notificaciones SSE |

La sesión utiliza una cookie `HttpOnly`, `SameSite=Strict` y una duración fija de 30 minutos. El servidor valida cada petición. La clave no se persiste en el almacenamiento del cliente.

## PWA y estrategia de caché

El manifest incluye nombre, URL de inicio, alcance, colores, modo `standalone` e iconos PNG de 192 y 512 píxeles.

La compilación incorpora los nombres versionados de JS y CSS al service worker. Se precargan de forma atómica únicamente HTML, JS, CSS, manifest e iconos:

- **Navegación:** primero red y, si falla, HTML precargado.
- **Recursos incluidos de la interfaz:** primero caché.
- **API y SSE:** no se interceptan ni se almacenan.
- **Escrituras:** no se cachean ni se encolan.

Al desconectarse se vacía la lista visible y se deshabilitan las operaciones. La ayuda permanece disponible. Al recuperar la conexión se consulta nuevamente al servidor. Las cachés antiguas propias se eliminan al activar una versión nueva.

La instalación y el service worker requieren HTTPS o localhost. La experiencia offline necesita una primera carga completa con conexión. Las reservas permanecen en SQLite en el servidor; no se almacenan para consulta offline en el navegador.

## Diseño y accesibilidad

La interfaz utiliza tonos crema, verde y dorado. El formulario y el listado pasan de dos columnas en escritorio a una columna en móvil. Incluye etiquetas asociadas a campos, controles nativos, foco visible, enlace para saltar al contenido y mensajes con `role="status"` o `role="alert"`.

Se revisaron visualmente la cabecera, el formulario, el listado y los botones en la vista móvil de Chrome. No se realizó una auditoría completa de accesibilidad ni pruebas con lector de pantalla.

## Pruebas y resultados

### Automatizadas

`npm test` finalizó con **3 pruebas aprobadas y 0 fallos**, también en el equipo Windows utilizado para la demostración:

1. Integración HTTP real de la API: autenticación, CRUD, validación, conflictos, SSE, sesiones y persistencia.
2. Interfaz Vue compilada en Happy DOM con API simulada: sesión, CRUD, búsqueda, conflictos y cambios de conectividad.
3. Service worker en entorno simulado: recursos de la interfaz, exclusión de API y escrituras, y respuesta de navegación offline.

`EVIDENCIA_U3.txt` contiene el resultado de la ejecución automatizada en el entorno de preparación. Las pruebas simuladas no sustituyen las comprobaciones manuales en navegador.

### Manuales en Chrome

Durante la demostración se verificaron:

| Comprobación | Resultado |
|---|---|
| Crear reserva de Ana Pérez, 60 invitados | Reserva creada y totales actualizados |
| Editar a 80 invitados | Lista y total actualizados |
| Intentar otra reserva en la misma fecha | Mensaje «La fecha ya está reservada»; sin duplicación |
| Crear Luis Romero en otra fecha con dos pestañas abiertas | Apareció en la segunda pestaña sin recarga manual; 2 reservas y 110 invitados |
| Buscar un cliente inexistente | Mensaje de lista vacía |
| Eliminar Luis Romero | Quedó Ana Pérez; 1 reserva y 80 invitados |
| Revisar vista móvil | Formulario, listado y botones visibles en una columna |
| Instalar PWA | Aplicación abierta en ventana independiente |
| Activar modo Offline | Ayuda visible con aviso «Sin conexión» |
| Restablecer conexión | Aviso retirado y reserva de Ana Pérez recuperada |

Estas verificaciones se documentaron con capturas durante la demostración. Los resultados no implican pruebas de carga ni una auditoría completa de seguridad.

## Desarrollo

Con la API ejecutándose en el puerto 3000, abrir otra ventana CMD en la raíz y ejecutar:

```cmd
npm run dev
```

Abrir http://127.0.0.1:5173. Vite utiliza un proxy para `/api`, manteniendo el mismo origen para las peticiones del navegador. No se habilita CORS en la API.

El service worker se registra únicamente en la compilación de producción. Para comprobar instalación y offline, usar `npm run build` y el servidor del puerto 3000.

## Alcance

Proyecto académico con administrador único, sesiones en memoria y demostración local. Las reservas se guardan en SQLite y sobreviven al reinicio; las sesiones no. Para uso comercial se requieren medidas adicionales como usuarios, roles, limitación de intentos y sesiones persistentes.

No incluir `node_modules`, archivos SQLite, cookies ni archivos `.env` en el repositorio. La carpeta `dist` se genera con los comandos de compilación.

## Referencias técnicas

- Vue.js. Props: https://vuejs.org/guide/components/props
- Vue.js. Component Events: https://vuejs.org/guide/components/events
- Vite. Server Options: https://vite.dev/config/server-options
- MDN Web Docs. Progressive web apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
