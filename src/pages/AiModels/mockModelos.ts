export type Canal = 'Producción' | 'Canario' | 'Interno' | 'Borrador' | 'Descontinuado'

export type Metricas = {
  precision: number
  recall: number
  f1: number
}

export type Modelo = {
  id: string
  version: string
  canal: Canal
  publicado: string
  appMinima: string
  penetracion: number // RF-09.1 — penetración instalada
  activo: boolean
  notas: string
  metricas?: Metricas // RF-09.2
  motivoDesactivacion?: string
}

// RF-09.4 — registro inmutable del log de auditoría
export type EventoAuditoria = {
  id: string
  version: string
  operador: string
  fecha: string
  motivo: string
}

export const CANALES: Canal[] = ['Borrador', 'Interno', 'Canario', 'Producción']

export const MODELOS: Modelo[] = [
  {
    id: 'm1',
    version: 'v2.3.1',
    canal: 'Producción',
    publicado: '2024-07-18',
    appMinima: '3.2.0',
    penetracion: 78,
    activo: true,
    notas:
      'Mejora en detección de broca en frutos verdes. Reducción de falsos negativos en roya temprana.',
    metricas: { precision: 92.4, recall: 91.8, f1: 92.1 },
  },
  {
    id: 'm2',
    version: 'v2.4.0-beta',
    canal: 'Canario',
    publicado: '2024-08-10',
    appMinima: '3.4.0',
    penetracion: 12,
    activo: true,
    notas:
      'Backbone actualizado y nuevas clases de deficiencias nutricionales. En validación con productores piloto.',
    metricas: { precision: 94.1, recall: 90.3, f1: 92.2 },
  },
  {
    id: 'm3',
    version: 'v2.2.0',
    canal: 'Descontinuado',
    publicado: '2024-04-22',
    appMinima: '3.0.0',
    penetracion: 8,
    activo: false,
    notas: 'Versión retirada tras la publicación de v2.3.1. Soporte finalizado.',
    metricas: { precision: 88.6, recall: 86.2, f1: 87.4 },
    motivoDesactivacion: 'Reemplazada por v2.3.1 en el canal de producción.',
  },
  {
    id: 'm4',
    version: 'v2.5.0-draft',
    canal: 'Borrador',
    publicado: '2024-08-25',
    appMinima: '3.5.0',
    penetracion: 0,
    activo: false,
    notas:
      'En desarrollo. Incorpora backbone EfficientNet-v2S. Pendiente de validación con dataset de campo.',
  },
  {
    id: 'm5',
    version: 'v2.3.0',
    canal: 'Interno',
    publicado: '2024-06-30',
    appMinima: '3.2.0',
    penetracion: 2,
    activo: true,
    notas: 'Build interna para pruebas del equipo técnico. No distribuida a productores.',
    metricas: { precision: 90.2, recall: 89.5, f1: 89.8 },
  },
]

export const AUDITORIA: EventoAuditoria[] = [
  {
    id: 'e1',
    version: 'v2.2.0',
    operador: 'Mario Zapata C.',
    fecha: '2024-07-18, 10:42 a. m.',
    motivo: 'Reemplazada por v2.3.1 en el canal de producción.',
  },
]