import { api } from '../axios'
import { descargarBlob } from '../descargas'

// RF-07 — monitor de detecciones (solo administrador). La API rechaza con 400 cualquier
// parámetro desconocido, y el resumen no acepta pagina ni limite.

// RF-07.2 — categorías biológicas en que la API agrupa cada predicción
export const CATEGORIAS = ['enfermedad', 'plaga', 'deficiencia', 'sano', 'no_reconocido', 'otra'] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const ETIQUETAS_CATEGORIA: Record<Categoria, string> = {
  enfermedad: 'Enfermedad',
  plaga: 'Plaga',
  deficiencia: 'Deficiencia',
  sano: 'Sano',
  no_reconocido: 'No reconocido',
  otra: 'Otra clase',
}

// Resultado de la compuerta de calidad y fuera de dominio que aplica la app antes de clasificar
export type ResultadoCompuerta = 'IDENTIFIED' | 'UNCERTAIN' | 'OOD' | 'QUALITY_REJECTED'

export const ETIQUETAS_COMPUERTA: Record<ResultadoCompuerta, string> = {
  IDENTIFIED: 'Identificada',
  UNCERTAIN: 'Incierta',
  OOD: 'Fuera de dominio',
  QUALITY_REJECTED: 'Foto rechazada',
}

// RF-07.3 — divergente: un humano corrigió a la máquina
export const ESTADOS_REVISION = ['divergente', 'coincide', 'sin_revision'] as const
export type EstadoRevision = (typeof ESTADOS_REVISION)[number]
export type OrigenRevision = 'agronomo' | 'productor'

export type Cultivo = 'CAFE' | 'PLATANO' | 'AGUACATE' | 'CACAO' | 'OTRO'
export type Organo = 'HOJA' | 'FRUTO' | 'TALLO' | 'RAIZ' | 'FLOR'

export const ETIQUETAS_CULTIVO: Record<Cultivo, string> = {
  CAFE: 'Café',
  PLATANO: 'Plátano',
  AGUACATE: 'Aguacate',
  CACAO: 'Cacao',
  OTRO: 'Otro cultivo',
}

export const ETIQUETAS_ORGANO: Record<Organo, string> = {
  HOJA: 'Hoja',
  FRUTO: 'Fruto',
  TALLO: 'Tallo',
  RAIZ: 'Raíz',
  FLOR: 'Flor',
}

export interface RevisionDeteccion {
  estado: EstadoRevision
  origen: OrigenRevision | null
  correccionProductor: string | null
  confirmadaProductor: boolean
  solicitudId: string | null
  resultadoAgronomo: string | null
  plagaAgronomo: string | null
}

export interface Deteccion {
  id: string
  idCliente: string
  productorId: string
  productorNombre: string | null
  municipio: string
  categoria: Categoria
  clasePredicha: string | null
  // De 0 a 1
  confianza: number | null
  puntajeOod: number
  resultadoCompuerta: ResultadoCompuerta
  modeloId: string | null
  modeloVersion: string
  cultivo: Cultivo | null
  organo: Organo | null
  latitud: number | null
  longitud: number | null
  // Margen de error del GPS en metros; null si el teléfono no lo informó
  precisionMetros: number | null
  fecha: string
  recibidaEn: string
  // RF-07.4 — la inferencia devolvió confianza cero
  defectuosa: boolean
  revision: RevisionDeteccion
}

// Las que traen coordenadas: lo único que se puede dibujar en un mapa
export type DeteccionConUbicacion = Deteccion & { latitud: number; longitud: number }

export function tieneUbicacion(d: Deteccion): d is DeteccionConUbicacion {
  return d.latitud !== null && d.longitud !== null
}

export interface PaginaDetecciones {
  datos: Deteccion[]
  total: number
  pagina: number
  limite: number
}

export interface ResumenCategoria {
  categoria: Categoria
  total: number
  divergentes: number
  defectuosas: number
}

export interface ResumenDetecciones {
  total: number
  divergentes: number
  defectuosas: number
  porCategoria: ResumenCategoria[]
}

// Ya serializados para la query (listas separadas por comas); se arman en el monitor
export type ParametrosDetecciones = Record<string, string | number | boolean>

// Deben coincidir con los de la API
export const LIMITE_DETECCIONES = 20
export const MAX_LIMITE_DETECCIONES = 100
// Tope de puntos de la capa del mapa de casos; coincide con el valor por defecto de la API
export const LIMITE_MAPA_DETECCIONES = 500

export const deteccionesService = {
  listar: (parametros: ParametrosDetecciones) =>
    api.get<PaginaDetecciones>('/detecciones', { params: parametros }).then((r) => r.data),
  // Solo las que traen coordenadas, sin paginar: alimenta la capa del mapa de casos
  listarMapa: (parametros: ParametrosDetecciones) =>
    api.get<Deteccion[]>('/detecciones/mapa', { params: parametros }).then((r) => r.data as DeteccionConUbicacion[]),
  // KML de la captura para Google Earth; la API responde 404 si no tiene ubicación
  descargarKml: async (id: string) => {
    const respuesta = await api.get<Blob>(`/detecciones/${id}/ubicacion.kml`, { responseType: 'blob' })
    descargarBlob(respuesta.data, `deteccion-${id.slice(0, 8)}.kml`)
  },
  // Sin pagina ni limite: la API los rechaza en el resumen
  resumen: (parametros: ParametrosDetecciones) =>
    api.get<ResumenDetecciones>('/detecciones/resumen', { params: parametros }).then((r) => r.data),
}

export const clavesDetecciones = {
  todas: ['detecciones'] as const,
  lista: (parametros: ParametrosDetecciones) => ['detecciones', 'lista', parametros] as const,
  resumen: (parametros: ParametrosDetecciones) => ['detecciones', 'resumen', parametros] as const,
  mapa: (parametros: ParametrosDetecciones) => ['detecciones', 'mapa', parametros] as const,
}
