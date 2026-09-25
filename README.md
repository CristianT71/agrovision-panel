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
3. **Validar al agrónomo.** Mientras la página *Cuentas* no esté conectada, se hace en la base:

   ```sql
   UPDATE agronomos SET estado = 'activo' WHERE telefono = '+573009876543';
   UPDATE usuarios  SET estado = 'activo' WHERE telefono = '+573009876543';
   ```

4. **Iniciar sesión**: elige el rol, escribe el número y usa el código OTP que aparece en la **consola de la API**
   (en desarrollo no se envían SMS).

La sesión dura 30 minutos; al vencer, el panel vuelve al login con el aviso *"Tu sesión expiró"*.

## Estado de los módulos

| Módulo | Rol | Estado |
|---|---|---|
| Login OTP y sesión | Ambos | ✅ Conectado a la API |
| Solicitar acceso | Público | ✅ Conectado (con documentos) |
| Catálogo de plagas | Profesional | ✅ Conectado (fichas, aval, manejo químico y foto) |
| Mi perfil | Ambos | ✅ Conectado |
| Solicitudes y detalle | Profesional | 🟡 Datos de ejemplo — la API aún no recibe solicitudes de la app |
| Cuentas | Administrador | 🟡 Datos de ejemplo — la API ya está lista para conectarla |
| Dashboard, Bandeja de casos, Modelos IA | Administrador | 🟡 Datos de ejemplo — faltan sus módulos en la API |
| Ajustes y notificaciones | Ambos | 🟡 Datos de ejemplo |

Los archivos `mock*.ts` de cada página contienen los datos de ejemplo; se eliminan al conectar la página.

## Estructura

```
src/
├── api/                    # Comunicación con la API
│   ├── axios.ts            # Cliente HTTP: token, cierre de sesión en 401 y mensajes de error
│   ├── auth/               # Login OTP y sesión (rol, vencimiento del token)
│   ├── agronomos/          # Registro y perfil
│   └── plagas/             # Catálogo
├── components/             # Piezas reutilizables (Button, Input, Sidebar, TagInput...)
├── layouts/
│   ├── AuthLayout/         # Pantallas de acceso
│   ├── PanelLayout/        # Menú lateral y barra superior
│   └── RutaProtegida/      # Exige sesión y, si aplica, el rol de la ruta
└── pages/                  # Una carpeta por pantalla
```

### Convenciones

- Cada recurso de la API tiene su **servicio** en `src/api/<recurso>/` con sus tipos, funciones y claves de
  consulta (`claves...`). Las páginas lo usan con `useQuery` y `useMutation` de TanStack Query.
- Los errores se muestran con `mensajeDeError(error)`, que lee el mensaje que devuelve la API.
- Las rutas de cada rol se protegen en `App.tsx` con `<RutaProtegida rol="...">` (RF-02).
- Las fotos del catálogo se muestran con `urlArchivo(ruta)`, porque se sirven fuera de `/api`.

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm run build     # verificación de tipos y compilación
npm run lint      # ESLint
npm run preview   # sirve la compilación
```
