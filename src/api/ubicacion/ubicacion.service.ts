import { api } from '../axios'
import { descargarBlob } from '../descargas'
import { codigoSolicitud, type EstadoSolicitud } from '../solicitudes/solicitudes.service'

// RNF-04.1 — ubicación de la captura (dato sensible: nunca se registra en consola ni se guarda en el navegador).
// La API decide quién la ve: administrador y agrónomo asignado. El resto recibe 403/404.

export interface UbicacionCaptura {
  solicitudId: string
  estado: EstadoSolicitud
  municipio: string
  vereda: string
  latitud: number
  longitud: number
  // Metros sobre el nivel del mar; null si el GPS no la entregó
  altitudMsnm: number | null
  // Radio de error del GPS en metros; null si no se conoce
  precisionMetros: number | null
  // La captura se hizo con una ubicación de prueba (no es la real)
  simulada: boolean
  // Momento de la captura (ISO 8601)
  capturadaEn: string | null
}

export interface FiltrosMapa {
  estado?: EstadoSolicitud
  // ISO 8601
  desde?: string
  hasta?: string
  municipio?: string
  // Solicitudes "Enviada" sin agrónomo
  sinAsignar?: boolean
}

// Tope de puntos que devuelve la API; si llega, hay más casos de los que se dibujan
export const MAX_PUNTOS_MAPA = 500

export interface RespuestaMapa {
  datos: UbicacionCaptura[]
  // Casos que cumplen el filtro (puede ser mayor que datos.length)
  total: number
  // true si la API recortó la lista al tope
  truncado: boolean
}

// Se omiten los filtros vacíos: la API rechaza con 400 los parámetros que no conoce o vienen mal formados
function limpiarFiltros(filtros: FiltrosMapa): FiltrosMapa {
  const limpios: FiltrosMapa = {}
  if (filtros.estado) limpios.estado = filtros.estado
  if (filtros.desde) limpios.desde = filtros.desde
  if (filtros.hasta) limpios.hasta = filtros.hasta
  if (filtros.municipio?.trim()) limpios.municipio = filtros.municipio.trim()
  if (filtros.sinAsignar) limpios.sinAsignar = true
  return limpios
}

export const ubicacionService = {
  obtenerUbicacion: (id: string) =>
    api.get<UbicacionCaptura | null>(`/solicitudes/${id}/ubicacion`).then((r) => r.data),
  // Solo administrador
  listarMapa: (filtros: FiltrosMapa = {}) =>
    api
      .get<RespuestaMapa>('/solicitudes/mapa', { params: { ...limpiarFiltros(filtros), limite: MAX_PUNTOS_MAPA } })
      .then((r) => r.data),
  // La ruta exige JWT: no sirve un <a href>, se pide como blob con el token y se descarga con un enlace temporal
  descargarKml: async (id: string) => {
    const respuesta = await api.get<Blob>(`/solicitudes/${id}/ubicacion/kml`, { responseType: 'blob' })
    descargarBlob(respuesta.data, `${codigoSolicitud(id)}.kml`)
  },
  descargarKmlMapa: async (filtros: FiltrosMapa = {}) => {
    const respuesta = await api.get<Blob>('/solicitudes/mapa/kml', {
      params: { ...limpiarFiltros(filtros), limite: MAX_PUNTOS_MAPA },
      responseType: 'blob',
    })
    descargarBlob(respuesta.data, 'mapa-de-casos.kml')
  },
}

export const clavesUbicacion = {
  todas: ['ubicacion'] as const,
  detalle: (id: string) => ['ubicacion', 'detalle', id] as const,
  mapa: (filtros: FiltrosMapa) => ['ubicacion', 'mapa', filtros] as const,
}
