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

/* ---------- Administrador ---------- */

export type AjustesAdmin = {
  // Idioma y región
  idioma: string
  zonaHoraria: string
  // Notificaciones propias del admin
  pushNavegador: boolean
  correo: boolean
  casosSinAsignar: boolean
  alertaPlagaNueva: boolean
  despliegues: boolean
  fallosOTA: boolean
  // Operación
  umbralPlagaNueva: string
  asignacionAutomatica: boolean
  cargaMaximaAgronomo: string
  // Modelos IA
  canalPorDefecto: string
  requiereJustificacionKillSwitch: boolean
  anonimizarExportaciones: boolean
  // Seguridad
  expiracionSesion: string
  // Datos
  retencionSolicitudes: string
}

export const UMBRALES_PLAGA = ['3 casos/semana', '5 casos/semana', '8 casos/semana', '10 casos/semana']
export const CARGAS_MAXIMAS = ['5 casos', '10 casos', '15 casos', 'Sin límite']
export const CANALES_DESPLIEGUE = ['Borrador', 'Interno', 'Canario', 'Producción']
export const EXPIRACIONES = ['15 minutos', '30 minutos', '1 hora', '4 horas']

// TODO: reemplazar por GET /ajustes/admin cuando exista el endpoint
export const AJUSTES_ADMIN: AjustesAdmin = {
  idioma: 'Español (Colombia)',
  zonaHoraria: 'Bogotá (UTC−5)',
  pushNavegador: true,
  correo: true,
  casosSinAsignar: true,
  alertaPlagaNueva: true,
  despliegues: true,
  fallosOTA: true,
  umbralPlagaNueva: '5 casos/semana', // RF-06.7
  asignacionAutomatica: false,
  cargaMaximaAgronomo: '10 casos', // RF-08.4
  canalPorDefecto: 'Borrador', // RF-09.5
  requiereJustificacionKillSwitch: true, // RF-09.3
  anonimizarExportaciones: true, // RNF-01.3
  expiracionSesion: '30 minutos', // RNF-02.2
  retencionSolicitudes: '90 días',
}