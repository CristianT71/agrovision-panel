import { api } from '../axios'
import { descargarBlob } from '../descargas'
import { codigoSolicitud, type EstadoSolicitud } from '../solicitudes/solicitudes.service'

// RNF-04.1 — ubicación de la captura (dato sensible: nunca se registra en consola ni se guarda en el navegador).
// Contrato real del API (solicitudes.controller.ts, ubicacion-solicitudes.port.ts). Las fechas llegan como ISO 8601.
// Las coordenadas solo salen por estas rutas: GET /solicitudes/:id y la bandeja traen únicamente tieneUbicacion.

export type OrigenAltitud = 'servicio' | 'gps'

// Lo que necesitan el mapa y sus popups. La precisión solo viene en el detalle, no en el listado del mapa.
export interface PuntoUbicacion {
  solicitudId: string
  estado: EstadoSolicitud
  municipio: string
  vereda: string
  latitud: number
  longitud: number
  // Metros sobre el nivel del mar; null si no hay dato
  altitudMsnm: number | null
  // Ubicación que el sistema operativo marcó como simulada
  simulada: boolean
  // Radio de error del GPS en metros
  precisionMetros?: number | null
}

// GET /solicitudes/mapa — un punto por caso
export interface PuntoMapa extends PuntoUbicacion {
  fecha: string
  productorNombre: string | null
  finca: string
  cultivo: string | null
}

// GET /solicitudes/:id/ubicacion — admin siempre; agrónomo solo si la solicitud es suya.
// null cuando la solicitud no tiene ubicación; 404 si no existe o no es del agrónomo.
export interface UbicacionCaptura extends PuntoUbicacion {
  fecha: string
  productorNombre: string | null
  finca: string
  precisionMetros: number | null
  altitudOrigen: OrigenAltitud | null
}

// Filtros que acepta GET /solicitudes/mapa (y mapa.kml). El API rechaza con 400 cualquier otro parámetro.
export interface FiltrosMapa {
  estado?: EstadoSolicitud
  // Fechas ISO 8601. Una fecha sola se toma como medianoche UTC: "hasta" debe ir como fin de día.
  desde?: string
  hasta?: string
  municipio?: string
}

// Sin paginación: el API devuelve hasta `limite` puntos y avisa con `truncado` si había más
export interface RespuestaMapa {
  puntos: PuntoMapa[]
  truncado: boolean
  limite: number
}

// De un día (YYYY-MM-DD) del filtro a lo que espera el API: inicio y fin de día en UTC
export const desdeDelDia = (dia: string) => (dia ? `${dia}T00:00:00Z` : undefined)
export const hastaDelDia = (dia: string) => (dia ? `${dia}T23:59:59Z` : undefined)

// Se omiten los filtros vacíos
function limpiarFiltros(filtros: FiltrosMapa): FiltrosMapa {
  const limpios: FiltrosMapa = {}
  if (filtros.estado) limpios.estado = filtros.estado
  if (filtros.desde) limpios.desde = filtros.desde
  if (filtros.hasta) limpios.hasta = filtros.hasta
  if (filtros.municipio?.trim()) limpios.municipio = filtros.municipio.trim()
  return limpios
}

export const ubicacionService = {
  obtenerUbicacion: (id: string) =>
    api.get<UbicacionCaptura | null>(`/solicitudes/${id}/ubicacion`).then((r) => r.data),
  // Solo administrador
  listarMapa: (filtros: FiltrosMapa = {}) =>
    api.get<RespuestaMapa>('/solicitudes/mapa', { params: limpiarFiltros(filtros) }).then((r) => r.data),
  // La ruta exige JWT: no sirve un <a href>, se pide como blob con el token y se descarga con un enlace temporal
  descargarKml: async (id: string) => {
    const respuesta = await api.get<Blob>(`/solicitudes/${id}/ubicacion.kml`, { responseType: 'blob' })
    descargarBlob(respuesta.data, `${codigoSolicitud(id).toLowerCase()}.kml`)
  },
  // El KML no avisa si el API lo recortó: quien llama debe advertirlo con `truncado` del listado
  descargarKmlMapa: async (filtros: FiltrosMapa = {}) => {
    const respuesta = await api.get<Blob>('/solicitudes/mapa.kml', {
      params: limpiarFiltros(filtros),
      responseType: 'blob',
    })
    descargarBlob(respuesta.data, 'mapa-solicitudes.kml')
  },
}

export const clavesUbicacion = {
  todas: ['ubicacion'] as const,
  detalle: (id: string) => ['ubicacion', 'detalle', id] as const,
  mapa: (filtros: FiltrosMapa) => ['ubicacion', 'mapa', filtros] as const,
}
