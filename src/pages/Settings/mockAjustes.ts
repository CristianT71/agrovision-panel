export type Ajustes = {
  idioma: string
  zonaHoraria: string
  pushNavegador: boolean
  correo: boolean
  nuevasSolicitudes: boolean
  retencionSolicitudes: string
}

export const IDIOMAS = ['Español (Colombia)', 'Español (México)', 'English (US)']

export const ZONAS_HORARIAS = [
  'Bogotá (UTC−5)',
  'Ciudad de México (UTC−6)',
  'Lima (UTC−5)',
  'Quito (UTC−5)',
]

export const RETENCIONES = ['30 días', '90 días', '180 días', '1 año']

// RNF-01.2 — la retención de auditoría es fija, no configurable
export const RETENCION_AUDITORIA = '2 años (fijo por norma)'

// TODO: reemplazar por GET /ajustes cuando el backend exponga el endpoint
export const AJUSTES: Ajustes = {
  idioma: 'Español (Colombia)',
  zonaHoraria: 'Bogotá (UTC−5)',
  pushNavegador: true,
  correo: false,
  nuevasSolicitudes: true,
  retencionSolicitudes: '90 días',
}

export const SISTEMA = [
  { etiqueta: 'Versión del panel', valor: '1.4.2' },
  { etiqueta: 'Última actualización', valor: '1 sep 2026' },
  { etiqueta: 'Entorno', valor: 'Producción' },
  { etiqueta: 'Soporte técnico', valor: 'soporte@agrovision.co' },
]