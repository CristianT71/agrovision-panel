# Vuelos de dron

Módulo del administrador basado en el contrato `/api/vuelos`, con React 19 y las dependencias existentes. No requiere paquetes adicionales. Las rutas del panel son `/vuelos` y `/vuelos/:id`; el API usa el cliente axios y su `VITE_API_URL` existente (con prefijo `/api`).

## Configuración

`VITE_VUELOS_MAX_ARCHIVO_MB` es un número público positivo, sin claves. El límite local predeterminado es 2048 MiB si falta o es inválido. Ajustarlo al tope real del servidor, que el contrato no especifica. La validación local admite JPG/JPEG, PNG, TIFF/TIF, DNG, MP4, MOV y SRT por extensión; el servidor sigue siendo responsable de validar MIME, firma y tamaño (413/415/422). El contrato tampoco enumera extensiones adicionales para `otro`, por lo que no se asumen formatos extra de subida; sí se muestran archivos `otro` devueltos por el API.

## Datos y privacidad

Las consultas y enlaces firmados viven solo en memoria, sin persistencia, almacenamiento web ni registros en consola. `cerrarSesion` limpia el QueryClient compartido en salida manual, inactividad, JWT vencido y HTTP 401. La prueba de sesión verifica que la purga incluye lista, traza y enlaces. La navegación desmonta y cancela peticiones y subidas del vuelo. Las consultas del módulo usan `gcTime: 0`.

Los enlaces se solicitan para las tarjetas de la página actual que entran en la zona visible (margen 150 px), no para todo el vuelo. Se renuevan 30 segundos antes de `expiraEn` y al volver a la pestaña si vencieron. La galería solicita 60 archivos por página. No descarga originales para crear miniaturas. Si la captura seleccionada en el mapa está en otra página, se muestra una tarjeta destacada obteniendo únicamente ese archivo; el contrato no permite consultar la página que contiene un id.

El servidor debe enviar `Cache-Control: private, no-store` en respuestas privadas, enlaces y medios firmados para impedir también la caché HTTP persistente del navegador; las etiquetas de imagen/video no permiten imponer esa cabecera desde React. No se añade Service Worker ni caché persistente. Las descargas usan `fetch` sin caché y `descargarBlob`; para medios alojados en otro origen, este debe permitir CORS. El visor de video admite Range mediante su URL firmada. Una descarga se prepara en memoria como Blob, siguiendo la utilidad del proyecto.

La hora usa siempre `America/Bogota`. RTK fijo requiere `rtkFlag === 50`; otros valores presentes se muestran como flotante y la ausencia como sin dato. El porcentaje fijo usa fijo / (fijo + otro + sinDato), con denominador visible. La altitud absoluta no se etiqueta como msnm porque su referencia depende de `tipoAltitud`.

## Verificación

`npx tsc --noEmit`, `npx tsc --noEmit -p tsconfig.app.json`, `npx vitest run` y `npx vite build`. Las pruebas cubren la cola (concurrencia, errores, duplicados, cancelación y reintento mientras el aborto termina), formatos, RTK, servicio, purga al cerrar sesión y renderizado de lista vacía/403. Los endpoints, la extracción de metadatos y los enlaces reales requieren el backend del contrato para una prueba de integración.
