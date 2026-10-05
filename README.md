# AgroVision Panel

Panel web administrativo del ecosistema **AgroVision**. Lo usan dos roles:

- **Profesional (agrónomo):** revisa las solicitudes de diagnóstico que envían los productores desde la app móvil
  y mantiene el catálogo de plagas.
- **Administrador:** coordina casos, supervisa los modelos de IA y gestiona las cuentas.

Proyecto de formación — SENA, Análisis y Desarrollo de Software (ADSO), ficha 3225853.
Consume la API [agrovision-api](https://github.com/CristianT71/agrovision-api).

## Stack

- **React 19** + TypeScript + **Vite**
- **Tailwind CSS 4**
- **TanStack Query** para datos del servidor y caché
- React Router, Axios y Recharts

## Puesta en marcha

1. Levanta la API (ver su README): base de datos, migraciones y `npm run start:dev`.
2. Crea el archivo `.env` a partir de `.env.example`:

   ```
   VITE_API_URL=http://localhost:3000/api
   ```

3. Instala y ejecuta:

   ```bash
   npm i
   npm run dev      # http://localhost:5173
   ```

   El panel debe correr en el puerto **5173**: es el origen que la API tiene habilitado en CORS.

## Probar el flujo completo

1. **Crear el administrador** directamente en la base (la API no permite crearlo por seguridad):

   ```sql
   INSERT INTO usuarios (id, telefono, rol, estado, fecha_registro)
   VALUES (gen_random_uuid(), '+573001234567', 'admin', 'activo', now());
   ```

2. **Registrar un agrónomo** desde **"¿Eres nuevo? Solicitar acceso"** (no desde el login). Pide al menos un
   documento de acreditación. La cuenta queda pendiente.
3. **Validar al agrónomo.** Entra como administrador y ve a **Cuentas → pestaña Agrónomos**. Revisa sus soportes
   con **Ver documentos** y pulsa **Validar** en su fila.

4. **Iniciar sesión**: elige el rol, escribe el número y usa el código OTP que aparece en la **consola de la API**
   (en desarrollo no se envían SMS).

La sesión se cierra tras **30 minutos sin actividad** (y a las 12 horas como máximo); entonces el panel vuelve al
login con el aviso *"Tu sesión expiró"*. Al pulsar **Cerrar sesión** también se invalida el token en la API.

## Estado de los módulos

| Módulo | Rol | Estado |
|---|---|---|
| Login OTP y sesión | Ambos | ✅ Conectado a la API |
| Solicitar acceso | Público | ✅ Conectado (con documentos) |
| Catálogo de plagas | Profesional | ✅ Conectado (fichas, aval, manejo químico y foto) |
| Mi perfil | Ambos | ✅ Conectado |
| Solicitudes, detalle y resolución | Profesional | ✅ Conectado (fotos de la app, búsqueda por productor, casos similares, anexos y canal con administración) |
| Cuentas | Administrador | ✅ Conectado (validar, desactivar, reactivar, documentos y consentimiento) |
| Bandeja de casos | Administrador | ✅ Conectado (asignación y chat de coordinación) |
| Notificaciones | Ambos | ✅ Conectado |
| Dashboard | Administrador | ✅ Conectado (RF-06: telemetría de la app por ventana con comparación contra el periodo anterior, tasa de "no reconocido" por versión, correcciones, OTA, adopción de modelos y resoluciones de agrónomos con casos de plaga nueva para reentrenamiento) |
| Modelos IA | Administrador | ✅ Conectado (subida con etiquetas y calibración, métricas, pipeline de canales, kill-switch, auditoría y adopción) — la exportación del dataset (RF-09.6) espera a que la app envíe las imágenes |
| Ajustes | Ambos | 🟡 Datos de ejemplo — la API no tiene endpoint de ajustes |
| Contacto directo con productor | Ambos | ✅ Conectado (el administrador lo habilita por caso; el agrónomo asignado ve el teléfono en el detalle) |

Los archivos `mock*.ts` de cada página contienen los datos de ejemplo; se eliminan al conectar la página.

## Estructura

```
src/
├── api/                    # Comunicación con la API
│   ├── axios.ts            # Cliente HTTP: token, cierre de sesión en 401 y mensajes de error
│   ├── descargas.ts        # Descarga de archivos privados (blob) y conversión a data URL
│   ├── auth/               # Login OTP y sesión (rol, vencimiento del token)
│   ├── agronomos/          # Registro, perfil y gestión del administrador
│   ├── productores/        # Gestión del administrador y consentimiento
│   ├── solicitudes/        # Bandeja, detalle, fotos, resolución y asignación
│   ├── mensajes/           # Canal de coordinación por caso
│   ├── notificaciones/     # Menú de notificaciones
│   ├── modelos/            # Inventario, subida, métricas, canales y kill-switch
│   ├── permisos-contacto/  # Contacto directo productor-agrónomo por caso
│   └── plagas/             # Catálogo
├── components/             # Piezas reutilizables (Button, Input, Sidebar, TagInput...)
├── layouts/
│   ├── AuthLayout/         # Pantallas de acceso
│   ├── PanelLayout/        # Menú lateral y barra superior
│   └── RutaProtegida/      # Exige sesión y, si aplica, el rol de la ruta
├── pages/                  # Una carpeta por pantalla
└── utils/                  # Formato de fechas y archivos
```

### Convenciones

- Cada recurso de la API tiene su **servicio** en `src/api/<recurso>/` con sus tipos, funciones y claves de
  consulta (`claves...`). Las páginas lo usan con `useQuery` y `useMutation` de TanStack Query.
- Los errores se muestran con `mensajeDeError(error)`, que lee el mensaje que devuelve la API.
- Las rutas de cada rol se protegen en `App.tsx` con `<RutaProtegida rol="...">` (RF-02).
- Las fotos del catálogo se muestran con `urlArchivo(ruta)`, porque se sirven fuera de `/api`.
- Las fotos de las solicitudes son privadas: se muestran con el componente `FotoSolicitud`, que las descarga con el token.

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # verificación de tipos y compilación
npm run lint      # ESLint
npm run preview   # sirve la compilación
```
