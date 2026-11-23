import type { ArchivoVuelo, TipoArchivo } from '../api/vuelos/vuelos.service'
import { formatearCoordenada } from './ubicacion'
import { formatearFechaHora } from './fechas'
export { desdeDelDia, hastaDelDia } from '../api/ubicacion/ubicacion.service'

export const TIPOS_ARCHIVO: TipoArchivo[] = ['foto_rgb', 'banda_multiespectral', 'video', 'srt', 'otro']
export const ETIQUETAS_TIPO: Record<TipoArchivo, string> = {
  foto_rgb: 'Foto RGB', banda_multiespectral: 'Banda multiespectral', video: 'Video', srt: 'SRT', otro: 'Otro',
}
export const BANDAS = ['green', 'red', 'rededge', 'nir'] as const
export const hayNumero = (valor: number | null | undefined): valor is number => typeof valor === 'number' && Number.isFinite(valor)
export const coordenadaVuelo = (valor: number | null | undefined) => hayNumero(valor) ? formatearCoordenada(valor) : '—'
export const numeroVuelo = (valor: number | null | undefined, decimales = 2) => hayNumero(valor) ? valor.toLocaleString('es-CO', { maximumFractionDigits: decimales }) : '—'
export const altitudVuelo = (valor: number | null | undefined, decimales = 2) => hayNumero(valor) ? `${numeroVuelo(valor, decimales)} m` : '—'

export function bytesVuelo(bytes: number | null | undefined): string {
  if (!hayNumero(bytes) || bytes < 0) return '—'
  if (bytes === 0) return '0 B'
  const indice = Math.max(0, Math.min(4, Math.floor(Math.log(bytes) / Math.log(1024))))
  return `${numeroVuelo(bytes / 1024 ** indice, 1)} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][indice]}`
}
export function duracionVuelo(segundos: number | null | undefined): string {
  if (!hayNumero(segundos) || segundos < 0) return '—'
  const total = Math.floor(segundos)
  return `${Math.floor(total / 3600).toString().padStart(2, '0')}:${Math.floor(total % 3600 / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}
// Zona explícita: se conserva la hora colombiana incluso en equipos configurados en otra zona.
export function fechaVuelo(iso: string | null | undefined): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return '—'
  return formatearFechaHora(iso, {
    timeZone: 'America/Bogota', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  })
}
// El contrato define fijo exclusivamente mediante rtkFlag === 50; no se deduce del estado GPS.
export function etiquetaRtk(gps: ArchivoVuelo['gps']): string {
  if (!hayNumero(gps?.rtkFlag)) return 'RTK sin dato'
  return gps.rtkFlag === 50 ? 'RTK fijo' : 'RTK flotante'
}
export const requiereMiniatura = (archivo: ArchivoVuelo) => /\.(tiff?|dng)$/i.test(archivo.nombreOriginal) || /tiff|dng/i.test(archivo.mime)
