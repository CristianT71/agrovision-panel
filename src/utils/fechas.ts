// La API envía las fechas en ISO 8601; el panel las muestra con el formato de Colombia

const SIN_FECHA = '—'
const esFechaValida = (iso: string | null | undefined): iso is string => Boolean(iso) && !Number.isNaN(Date.parse(iso as string))

export function formatearFecha(iso: string): string {
  if (!esFechaValida(iso)) return SIN_FECHA
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatearFechaHora(iso: string, opciones: Intl.DateTimeFormatOptions = {}): string {
  if (!esFechaValida(iso)) return SIN_FECHA
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...opciones,
  })
}

// "Ahora", "Hace 5 min", "Hace 3 h", "Ayer", "Hace 4 d"
export function haceCuanto(iso: string): string {
  if (!esFechaValida(iso)) return SIN_FECHA
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`

  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} d`
}
