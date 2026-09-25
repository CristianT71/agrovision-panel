import { api } from '../axios'

// RF-02.5 / RF-02.6 — la API no permite borrar notificaciones, solo marcarlas como leídas
export type ReferenciaNotificacion = 'solicitud' | 'plaga' | 'agronomo' | 'productor'

export interface Notificacion {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  referenciaTipo: ReferenciaNotificacion | null
  referenciaId: string | null
  leida: boolean
  fecha: string
}

export interface PaginaNotificaciones {
  items: Notificacion[]
  total: number
  pagina: number
  limite: number
}

export const notificacionesService = {
  listar: (limite = 20) =>
    api.get<PaginaNotificaciones>('/notificaciones', { params: { limite } }).then((r) => r.data),
  noLeidas: () => api.get<{ total: number }>('/notificaciones/no-leidas').then((r) => r.data),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leida`).then((r) => r.data),
  marcarTodas: () => api.patch('/notificaciones/leidas').then((r) => r.data),
}

export const clavesNotificaciones = {
  todas: ['notificaciones'] as const,
  lista: ['notificaciones', 'lista'] as const,
  noLeidas: ['notificaciones', 'no-leidas'] as const,
}
