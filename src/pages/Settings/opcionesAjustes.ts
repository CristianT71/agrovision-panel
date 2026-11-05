export const IDIOMAS = ['Español (Colombia)', 'Español (México)', 'English (US)']

export const ZONAS_HORARIAS = [
  'Bogotá (UTC−5)',
  'Ciudad de México (UTC−6)',
  'Lima (UTC−5)',
  'Quito (UTC−5)',
]

// RNF-01.2 — la retención de auditoría es fija, no configurable
export const RETENCION_AUDITORIA = '2 años (fijo por norma)'

// Datos informativos fijos: la API aún no expone versión ni entorno
export const SISTEMA = [
  { etiqueta: 'Versión del panel', valor: '1.4.2' },
  { etiqueta: 'Última actualización', valor: '1 sep 2026' },
  { etiqueta: 'Entorno', valor: 'Producción' },
  { etiqueta: 'Soporte técnico', valor: 'soporte@agrovision.co' },
]

export const UMBRALES_PLAGA = ['3 casos/semana', '5 casos/semana', '8 casos/semana', '10 casos/semana']
export const CARGAS_MAXIMAS = ['5 casos', '10 casos', '15 casos', 'Sin límite']
export const EXPIRACIONES = ['15 minutos', '30 minutos', '1 hora', '4 horas']

// "10 casos" -> 10; "Sin límite" -> null
export function cargaMaximaComoNumero(valor: string): number | null {
  const numero = parseInt(valor, 10)
  return Number.isNaN(numero) ? null : numero
}
