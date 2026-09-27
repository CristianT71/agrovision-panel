import { api } from '../axios'

// RF-03 — estados tal como los guarda la API
export const ESTADOS_SOLICITUD = ['Pendiente', 'Enviada', 'Asignada', 'Resuelta', 'Descartada'] as const
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]

// RF-04.5 — clasificación de la evaluación humana
export const TIPOS_RESULTADO = [
  'Confirma diagnóstico IA',
  'Corrige diagnóstico IA',
  'Plaga nueva',
  'Imagen no diagnosticable',
  'Planta sana',
] as const
export type TipoResultado = (typeof TIPOS_RESULTADO)[number]

export interface Solicitud {
  id: string
  productorId: string
  // La API lo agrega uniendo con productores (la tabla solicitudes solo guarda el id)
  productorNombre: string | null
  agronomoId: string | null
  estado: EstadoSolicitud
  fecha: string
  municipio: string
  vereda: string
  finca: string
  confianzaIa: number
  modeloVersionId: string | null
  respuestaProfesional: string | null
  tipoResultado: TipoResultado | null
  plagaIdentificada: string | null
  fechaResolucion: string | null
}

// RF-04.2 — ángulo con el que la app tomó cada foto
export type AnguloFoto = 'GENERAL' | 'HAZ' | 'ENVES' | 'DETALLE'

export const ETIQUETAS_ANGULO: Record<AnguloFoto, string> = {
  GENERAL: 'Vista general',
  HAZ: 'Haz foliar',
  ENVES: 'Envés foliar',
  DETALLE: 'Detalle',
}

// La API nunca expone la ruta del archivo: solo sus datos y si la app ya terminó de subirlo
export interface FotoSolicitud {
  id: string
  angulo: AnguloFoto
  orden: number
  tipoMime: string | null
  subida: boolean
}

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitud
  agronomoId?: string
  soloMias?: boolean
  // RF-03.5 — la API busca por productor, finca, vereda, municipio o código SOL-…
  busqueda?: string
}

// RF-04.7 — la API rechaza respuestas de menos de 10 caracteres
export interface DatosResolucion {
  tipoResultado: TipoResultado
  plagaIdentificada: string
  respuestaProfesional: string
}

export const solicitudesService = {
  listar: (filtros: FiltrosSolicitudes = {}) =>
    api.get<Solicitud[]>('/solicitudes', { params: filtros }).then((r) => r.data),
  obtener: (id: string) => api.get<Solicitud>(`/solicitudes/${id}`).then((r) => r.data),
  resolver: (id: string, datos: DatosResolucion) =>
    api.patch<Solicitud>(`/solicitudes/${id}/resolver`, datos).then((r) => r.data),
  // RF-04.1 — fotos de la captura, en el orden en que las tomó la app
  listarFotos: (id: string) =>
    api
      .get<FotoSolicitud[]>(`/solicitudes/${id}/fotos`)
      .then((r) => [...r.data].sort((a, b) => a.orden - b.orden)),
  // Las fotos son privadas: se piden con el token y llegan como archivo (blob), no como URL pública
  descargarFoto: (id: string, fotoId: string) =>
    api.get<Blob>(`/solicitudes/${id}/fotos/${fotoId}`, { responseType: 'blob' }).then((r) => r.data),
  // RF-08.3 — solo administrador. La API notifica al agrónomo y responde 409 si otra persona asignó a la vez.
  asignar: (id: string, agronomoId: string) =>
    api
      .patch<{ message: string; solicitud: Solicitud }>(`/solicitudes/${id}/asignar`, { agronomoId })
      .then((r) => r.data),
}

// La API solo acepta asignar (o reasignar) solicitudes en estos estados
export function puedeAsignarse(estado: EstadoSolicitud): boolean {
  return estado === 'Enviada' || estado === 'Asignada'
}

export const clavesSolicitudes = {
  todas: ['solicitudes'] as const,
  lista: (filtros: FiltrosSolicitudes = {}) => ['solicitudes', 'lista', filtros] as const,
  detalle: (id: string) => ['solicitudes', 'detalle', id] as const,
  fotos: (id: string) => ['solicitudes', 'fotos', id] as const,
  foto: (id: string, fotoId: string) => ['solicitudes', 'fotos', id, fotoId] as const,
}

// La API puede enviar la confianza como fracción (0.87) o como porcentaje (87)
export function porcentajeConfianza(valor: number): number {
  return Math.round(valor <= 1 ? valor * 100 : valor)
}

// "SOL-3F2A9C1B" — identificador corto para mostrar en pantalla
export function codigoSolicitud(id: string): string {
  return `SOL-${id.slice(0, 8).toUpperCase()}`
}

// El id de la versión del modelo es un UUID: en pantalla basta con el inicio
export function versionModeloCorta(modeloVersionId: string | null): string {
  return modeloVersionId ? `v-${modeloVersionId.slice(0, 8)}` : 'Sin versión'
}
