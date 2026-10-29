# API de reservas — Casa Bocaditos

Proyecto de Aplicaciones Web, Unidad 2. Permite crear, consultar, actualizar y eliminar reservas de catering.

## Tecnologías

- Node.js 24 o superior.
- Servidor HTTP nativo de Node.js.
- SQLite para persistencia.
- Server-Sent Events (SSE) para notificaciones en tiempo real.
- Pruebas con el ejecutor integrado de Node.js.

## Ejecución en Windows

Descargar el repositorio y abrir una ventana de Símbolo del sistema (cmd) en la carpeta que contiene package.json.

Ejecutar:

```cmd
set ADMIN_TOKEN=mi-clave-para-la-tarea-2026
npm start
```

La API estará disponible en http://127.0.0.1:3000.

La clave mostrada es de ejemplo para la demostración local.

## Pruebas

En otra ventana de cmd, dentro de la misma carpeta:

```cmd
npm test
```

La prueba de integración verifica autenticación, CRUD, validaciones, conflictos, eventos SSE y persistencia tras reiniciar el servidor.

## Estructura

- src/domain.js: validación y normalización.
- src/repository.js: consultas parametrizadas y persistencia SQLite.
- src/app.js: rutas HTTP, sesiones y eventos.
- src/server.js: configuración y arranque.
- test/api.test.js: prueba de integración.
- EVIDENCIA.txt: resultado de las pruebas.

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| POST | /api/sesion | Iniciar sesión |
| DELETE | /api/sesion | Cerrar sesión |
| GET | /api/reservas | Listar reservas |
| POST | /api/reservas | Crear reserva |
| GET | /api/reservas/:id | Consultar reserva |
| PUT | /api/reservas/:id | Actualizar reserva |
| DELETE | /api/reservas/:id | Eliminar reserva |
| GET | /api/eventos | Recibir eventos SSE |

Todas las rutas, excepto el inicio de sesión, requieren la cookie de sesión.

## Ejemplos en Windows (cmd)

Iniciar sesión y guardar la cookie:

```cmd
curl -i -c cookies.txt -H "Content-Type: application/json" -d "{\"token\":\"mi-clave-para-la-tarea-2026\"}" http://127.0.0.1:3000/api/sesion
```

Respuesta: 201 Created y cookie de sesión.

Crear una reserva:

```cmd
curl -i -b cookies.txt -H "Content-Type: application/json" -d "{\"cliente\":\"Ana Perez\",\"fecha\":\"2027-02-20\",\"personas\":60}" http://127.0.0.1:3000/api/reservas
```

Ejemplo de respuesta en una base nueva:

```json
{"data":{"id":1,"cliente":"Ana Perez","fecha":"2027-02-20","personas":60}}
```

Consultar reservas:

```cmd
curl -i -b cookies.txt http://127.0.0.1:3000/api/reservas
```

Actualizar la reserva con ID 1:

```cmd
curl -i -b cookies.txt -X PUT -H "Content-Type: application/json" -d "{\"cliente\":\"Ana Perez\",\"fecha\":\"2027-02-20\",\"personas\":80}" http://127.0.0.1:3000/api/reservas/1
```

Eliminarla:

```cmd
curl -i -b cookies.txt -X DELETE http://127.0.0.1:3000/api/reservas/1
```

Respuesta: 204 No Content.

## Tiempo real

En otra ventana de cmd, con una sesión activa:

```cmd
curl -N -b cookies.txt http://127.0.0.1:3000/api/eventos
```

Las operaciones realizadas después de abrir la conexión generan eventos como:

```text
event: reserva
data: {"type":"updated","id":1}
```

## Validación y errores

Cada reserva requiere cliente, fecha y personas.

- Cliente: entre 2 y 100 caracteres.
- Fecha: día válido en formato AAAA-MM-DD.
- Personas: entero entre 1 y 1000.
- Solo se permite una reserva por fecha.
- No se aceptan campos adicionales.

Códigos principales: 400, 401, 404, 405, 409, 413, 415 y 422.

Ejemplo de conflicto:

```json
{"error":{"code":"CONFLICT","message":"La fecha ya está reservada"}}
```

## Persistencia y sesiones

Las reservas se guardan en reservas.sqlite y permanecen al reiniciar. Las sesiones duran 30 minutos, se almacenan en memoria y se invalidan al reiniciar.

La cookie utiliza HttpOnly y SameSite=Strict. En producción se activa Secure y se requiere HTTPS.

## Alcance

Demostración académica local con un administrador. Para uso comercial se requieren usuarios, roles, limitación de intentos y almacenamiento persistente de sesiones. Los eventos SSE no se conservan para reproducirlos tras una desconexión.
