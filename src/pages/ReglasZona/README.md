# Reglas de zona

Pantalla `/reglas-zona` para los roles admin (`administrador` en el panel) y agrónomo (`profesional`). Sirve para crear, editar, aprobar, activar, archivar y simular las tablas versionadas que convierten severidad % e incidencia % en un radio en metros. Usa el contrato `/api/reglas-zona` con el cliente axios existente (`VITE_API_URL`) y TanStack Query. No agrega dependencias.

## Archivos

- `src/api/reglas-zona/reglas-zona.service.ts`: tipos del contrato, servicio y claves de caché.
- `logica.ts`: lógica pura que se prueba sin DOM. Incluye la validación de la tabla (copia exacta de `validarFilas` del API, con los mismos mensajes), las acciones disponibles según rol y estado, la validación de la aprobación y del simulador, la traducción de los códigos de error y la agrupación por tipo.
- `useReglasZona.ts`: consultas y mutaciones. Cada cambio de estado invalida todas las reglas, porque activar una regla archiva la que estaba activa.
- `ReglasZona.tsx` (lista por tipo con el historial de versiones), `DetalleRegla.tsx`, `EditorFilas.tsx`, `DialogoAprobar.tsx`, `DialogoConfirmar.tsx`, `DialogoNuevaRegla.tsx`, `Simulador.tsx`.

## Comportamiento

- Solo el borrador se puede editar: filas, notas, Guardar y Eliminar. Las demás versiones son de solo lectura y ofrecen Duplicar. El PATCH envía únicamente `notas` y `filas`, con las filas numeradas 1..n según su posición. El tipo de enfermedad se elige solo al crear la regla.
- El botón Aprobar aparece solo para el agrónomo y solo en el borrador. Si el guard de roles responde 403 sin `codigo`, se muestra "Solo un agrónomo validado puede aprobar una regla de zona.".
- El diálogo de aprobación muestra el nombre y la tarjeta profesional del agrónomo (`GET /agronomos/me`). Si se marca "calibrada", la nota es obligatoria y el envío queda bloqueado sin ella. La nota se ve dentro de las notas de la regla ("Nota de calibración:" / "Nota de aprobación:"), resaltada.
- Activar y Archivar piden confirmación. Activar avisa que "Esto reemplaza la regla activa actual". Archivar se ofrece desde aprobada o activa.
- Mientras `calibrada` sea false se ve fijo el aviso "Estimación sin calibrar", tanto en el detalle como en el resultado del simulador.

## Prueba de punta a punta (con el API real)

1. Como admin, crear un borrador y editar sus filas. La validación en vivo bloquea Guardar si la tabla es inválida, y el botón Aprobar no aparece. Llamar a `POST /api/reglas-zona/:id/aprobar` como admin devuelve 403.
2. Como agrónomo validado, aprobar sin marcar calibrada: la regla queda aprobada y el aviso "Estimación sin calibrar" sigue visible. Duplicar, aprobar la copia marcando calibrada (sin nota el botón está bloqueado; con nota se aprueba) y activarla. La activa anterior pasa a archivada.
3. Simular la semilla `roya` v1 con severidad 70, incidencia 55 y 5000 plantas/ha. Resultado esperado: fila 4, 15–30 m, 353–1414 plantas.
4. `GET /api/public/v1/zone-rules?tipo=roya` responde 200 con `ETag`. Repetir la petición con `If-None-Match: <etag>` responde 304. Si no hay una regla activa de ese tipo, responde 204.

## Verificación

`npx tsc -b`, `npm run lint` y `npm test`. Las pruebas cubren el servicio contra el contrato, la validación de la tabla, la visibilidad de los botones por rol y estado, los mensajes de error y el diálogo de aprobación (renderizado SSR, igual que las demás pruebas del repo).
