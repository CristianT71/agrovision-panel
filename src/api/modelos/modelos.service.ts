import { api } from '../axios'

// RF-09.5 — pipeline de liberación tal como lo guarda la API
export type Canal = 'borrador' | 'interno' | 'canario' | 'produccion' | 'descontinuado'

export const ETIQUETAS_CANAL: Record<Canal, string> = {
  borrador: 'Borrador',
  interno: 'Interno',
  canario: 'Canario',
  produccion: 'Producción',
  descontinuado: 'Descontinuado',
}

// Siguiente paso del pipeline; descontinuar es posible desde cualquiera
export const SIGUIENTE_CANAL: Record<Canal, Canal | null> = {
  borrador: 'interno',
  interno: 'canario',
  canario: 'produccion',
  produccion: null,
  descontinuado: null,
}

// RF-09.2 — valores de 0 a 1; clase null es la métrica global
export interface Metrica {
  clase: string | null
  precision: number
  recall: number
  f1: number
}

export interface Modelo {
  id: string
  version: string
  formato: 'tflite' | 'pt'
  canal: Canal
  // Publicado en canario o producción y sin kill-switch
  activo: boolean
  versionMinApp: string
  notas: string | null
  tamanoBytes: number
  sha256: string
  firmado: boolean
  numeroClases: number | null
  creadoPor: string
  fechaCreacion: string
  fechaPublicacion: string | null
  porcentajeCanario: number | null
  killSwitch: boolean
  motivoKillSwitch: string | null
  fechaKillSwitch: string | null
  metricas: Metrica[]
  // RF-09.1 — penetración instalada en los últimos 30 días
  adopcion?: { porcentaje: number; productores: number }
}

// RF-09.4 — registro inmutable
export type AccionAuditoria = 'subida' | 'metricas' | 'cambio_canal' | 'kill_switch'

export interface EventoAuditoria {
  id: string
  accion: AccionAuditoria
  actorUsuarioId: string
  motivo: string | null
  detalle: Record<string, unknown> | null
  fecha: string
}

export interface DatosSubida {
  version: string
  versionMinApp: string
  notas: string
  modelo: File
  etiquetas: File | null
  calibracion: File | null
}

export interface DatosMetricas {
  global: Omit<Metrica, 'clase'>
  porClase: (Omit<Metrica, 'clase'> & { clase: string })[]
}

// Deben coincidir con los límites de la API
export const MAX_MB_MODELO = 100
export const MAX_MB_JSON = 5
export const MIN_JUSTIFICACION = 20
export const MIN_PORCENTAJE_CANARIO = 1
export const MAX_PORCENTAJE_CANARIO = 50
export const FORMATO_VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/

export const modelosService = {
  listar: () => api.get<Modelo[]>('/modelos').then((r) => r.data),
  auditoria: (id: string) => api.get<EventoAuditoria[]>(`/modelos/${id}/auditoria`).then((r) => r.data),
  // RF-09.5 — multipart; el modelo entra al pipeline como borrador
  subir: (datos: DatosSubida) => {
    const formulario = new FormData()
    formulario.append('version', datos.version)
    formulario.append('versionMinApp', datos.versionMinApp)
    if (datos.notas) formulario.append('notas', datos.notas)
    formulario.append('modelo', datos.modelo)
    if (datos.etiquetas) formulario.append('etiquetas', datos.etiquetas)
    if (datos.calibracion) formulario.append('calibracion', datos.calibracion)
    return api.post<Modelo>('/modelos', formulario).then((r) => r.data)
  },
  registrarMetricas: (id: string, datos: DatosMetricas) =>
    api.put<Modelo>(`/modelos/${id}/metricas`, datos).then((r) => r.data),
  cambiarCanal: (id: string, canal: Canal, porcentajeCanario?: number) =>
    api
      .patch<{ modelo: Modelo; retirado: Modelo | null }>(`/modelos/${id}/canal`, { canal, porcentajeCanario })
      .then((r) => r.data),
  // RF-09.3 — la justificación queda como causa en la auditoría
  activarKillSwitch: (id: string, justificacion: string) =>
    api.patch<{ modelo: Modelo }>(`/modelos/${id}/kill-switch`, { justificacion }).then((r) => r.data.modelo),
}

export const clavesModelos = {
  todos: ['modelos'] as const,
  lista: ['modelos', 'lista'] as const,
  auditoria: (id: string) => ['modelos', id, 'auditoria'] as const,
}

// 0.9924 -> "99.2"
export function porcentaje(valor: number): string {
  return (valor * 100).toFixed(1)
}
