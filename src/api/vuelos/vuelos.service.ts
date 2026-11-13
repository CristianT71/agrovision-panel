import type { AxiosProgressEvent } from 'axios'
import { api } from '../axios'

// Contrato /api/vuelos. Los valores desconocidos se conservan como null, nunca como cero.
export type TipoArchivo = 'foto_rgb' | 'banda_multiespectral' | 'video' | 'srt' | 'otro'
export type Banda = 'green' | 'red' | 'rededge' | 'nir'
export type EstadoGps = 'normal' | 'rtk' | 'invalido' | null
export type TipoAltitud = 'RtkAlt' | 'GPSFusionAlt' | 'PressureAlt' | null
export interface RangoAltura { min: number | null; max: number | null; media: number | null }
export interface ResumenVuelo {
  totalArchivos: number | null
  porTipo: Record<TipoArchivo, number> | null
  tamanoTotalBytes: number | null
  primeraCapturaEn: string | null
  ultimaCapturaEn: string | null
  duracionSegundos: number | null
  altitudAbsolutaM: RangoAltura | null
  alturaRelativaM: RangoAltura | null
  caja: { sur: number; oeste: number; norte: number; este: number } | null
  centro: { latitud: number; longitud: number } | null
  rtk: { fijo: number; otro: number; sinDato: number } | null
  dron: { modelo: string | null; serie: string | null } | null
}
export interface Vuelo {
  id: string
  nombre: string
  lote: string | null
  notas: string | null
  creadoEn: string
  resumen: ResumenVuelo | null
}
type ClasificacionArchivo =
  | { tipo: 'banda_multiespectral'; banda: Banda | null }
  | { tipo: Exclude<TipoArchivo, 'banda_multiespectral'>; banda: null }

interface ArchivoVueloBase {
  id: string
  vueloId: string
  nombreOriginal: string
  mime: string
  tamanoBytes: number
  sha256: string
  capturadoEn: string | null
  ubicacion: {
    latitud: number | null; longitud: number | null
    altitudAbsolutaM: number | null; alturaRelativaM: number | null; tipoAltitud: TipoAltitud
  } | null
  gps: {
    estado: EstadoGps; rtkFlag: number | null; rtkFijo: boolean | null
    desviacion: { longitud: number | null; latitud: number | null; altura: number | null } | null
  } | null
  camara: {
    marca: string | null; modelo: string | null; exposicionS: number | null; iso: number | null
    distanciaFocalMm: number | null; ancho: number | null; alto: number | null
  } | null
  orientacion: {
    gimbalRollGrados: number | null; gimbalPitchGrados: number | null; gimbalYawGrados: number | null
    vueloRollGrados: number | null; vueloPitchGrados: number | null; vueloYawGrados: number | null
  } | null
  multiespectral: {
    irradiancia: number | null; ganancia: number | null; nivelNegro: number | null; frecuenciaBanda: string | null
  } | null
  dron: { serie: string | null } | null
}
export type ArchivoVuelo = ArchivoVueloBase & ClasificacionArchivo
export type DetalleArchivoVuelo = ArchivoVuelo & { metadatosCrudos: Record<string, unknown> }
export interface Pagina<T> { datos: T[]; total: number; pagina: number; limite: number }
export interface DatosVuelo { nombre: string; lote?: string; notas?: string }
export interface FiltrosVuelos { pagina?: number; limite?: number; lote?: string; desde?: string; hasta?: string }
export interface FiltrosArchivos { pagina?: number; limite?: number; tipo?: TipoArchivo; banda?: Banda }
export interface EnlaceArchivo { urlContenido: string; urlMiniatura: string | null; expiraEn: string }
export interface PuntoTraza {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] | [number, number, number] }
  properties: ClasificacionArchivo & { archivoId: string; capturadoEn: string | null; altitudAbsolutaM: number | null }
}
export interface LineaTraza {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: number[][] }
  properties: Record<string, unknown> | null
}
export interface TrazaVuelo { type: 'FeatureCollection'; features: (PuntoTraza | LineaTraza)[]; truncado?: boolean }
export interface OpcionesSubida { signal?: AbortSignal; onUploadProgress?: (evento: AxiosProgressEvent) => void }

const ruta = (id: string) => `/vuelos/${encodeURIComponent(id)}`
const rutaArchivo = (id: string, archivoId: string) => `${ruta(id)}/archivos/${encodeURIComponent(archivoId)}`

export const vuelosService = {
  listar: (params: FiltrosVuelos = {}, signal?: AbortSignal) =>
    api.get<Pagina<Vuelo>>('/vuelos', { params, signal }).then(r => r.data),
  crear: (datos: DatosVuelo) => api.post<Vuelo>('/vuelos', datos).then(r => r.data),
  obtener: (id: string, signal?: AbortSignal) => api.get<Vuelo>(ruta(id), { signal }).then(r => r.data),
  editar: (id: string, datos: Partial<DatosVuelo>) => api.patch<Vuelo>(ruta(id), datos).then(r => r.data),
  borrar: (id: string) => api.delete<void>(ruta(id)).then(() => undefined),
  subirArchivo: async (id: string, archivo: File, opciones: OpcionesSubida = {}) => {
    const datos = new FormData()
    datos.append('archivo', archivo)
    const respuesta = await api.post<ArchivoVuelo>(`${ruta(id)}/archivos`, datos, { ...opciones, timeout: 0 })
    return { archivo: respuesta.data, duplicado: respuesta.status === 200 }
  },
  listarArchivos: (id: string, params: FiltrosArchivos = {}, signal?: AbortSignal) =>
    api.get<Pagina<ArchivoVuelo>>(`${ruta(id)}/archivos`, { params, signal }).then(r => r.data),
  obtenerArchivo: (id: string, archivoId: string, signal?: AbortSignal) =>
    api.get<DetalleArchivoVuelo>(rutaArchivo(id, archivoId), { signal }).then(r => r.data),
  pedirEnlace: (id: string, archivoId: string, signal?: AbortSignal) =>
    api.post<EnlaceArchivo>(`${rutaArchivo(id, archivoId)}/enlace`, undefined, { signal }).then(r => r.data),
  traza: (id: string, signal?: AbortSignal) => api.get<TrazaVuelo>(`${ruta(id)}/traza`, { signal }).then(r => r.data),
}

export const clavesVuelos = {
  todas: ['vuelos'] as const,
  lista: (filtros: FiltrosVuelos) => ['vuelos', 'lista', filtros] as const,
  detalle: (id: string) => ['vuelos', id] as const,
  archivos: (id: string, filtros: FiltrosArchivos) => ['vuelos', id, 'archivos', filtros] as const,
  archivo: (id: string, archivoId: string) => ['vuelos', id, 'archivo', archivoId] as const,
  enlace: (id: string, archivoId: string) => ['vuelos', id, 'enlace', archivoId] as const,
  traza: (id: string) => ['vuelos', id, 'traza'] as const,
}
