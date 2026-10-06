import { api } from '../axios'

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
  fecha: string
  recibidaEn: string
  // RF-07.4 — la inferencia devolvió confianza cero
  defectuosa: boolean
  revision: RevisionDeteccion
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

export const deteccionesService = {
  listar: (parametros: ParametrosDetecciones) =>
    api.get<PaginaDetecciones>('/detecciones', { params: parametros }).then((r) => r.data),
  // Sin pagina ni limite: la API los rechaza en el resumen
  resumen: (parametros: ParametrosDetecciones) =>
    api.get<ResumenDetecciones>('/detecciones/resumen', { params: parametros }).then((r) => r.data),
}

export const clavesDetecciones = {
  todas: ['detecciones'] as const,
  lista: (parametros: ParametrosDetecciones) => ['detecciones', 'lista', parametros] as const,
  resumen: (parametros: ParametrosDetecciones) => ['detecciones', 'resumen', parametros] as const,
}
