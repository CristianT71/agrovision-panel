import { mensajeDeError } from '../../api/axios'
import type { ArchivoVuelo, OpcionesSubida } from '../../api/vuelos/vuelos.service'

export const EXTENSIONES_VUELO = '.jpg,.jpeg,.png,.tif,.tiff,.dng,.mp4,.mov,.srt'
export function limiteArchivoMb(valor: unknown): number {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : 2048
}
export const MAX_ARCHIVO_MB = limiteArchivoMb(import.meta.env.VITE_VUELOS_MAX_ARCHIVO_MB)
export function validarArchivo(archivo: Pick<File, 'name' | 'size'>, maxMb = MAX_ARCHIVO_MB): string | null {
  if (!/\.(jpe?g|png|tiff?|dng|mp4|mov|srt)$/i.test(archivo.name)) return 'Tipo no permitido. Usa JPG, PNG, TIFF, DNG, MP4, MOV o SRT.'
  if (archivo.size === 0) return 'El archivo está vacío.'
  if (archivo.size > maxMb * 1024 * 1024) return `Supera el límite de ${maxMb} MiB por archivo.`
  return null
}
export type EstadoSubida = 'pendiente' | 'subiendo' | 'subido' | 'duplicado' | 'error' | 'cancelado'
export interface ElementoSubida {
  id: number
  archivo: File
  estado: EstadoSubida
  cargados: number
  error: string | null
  reintentable: boolean
}
type Subir = (archivo: File, opciones: OpcionesSubida) => Promise<{ archivo: ArchivoVuelo; duplicado: boolean }>
// La petición no tiene timeout (archivos de GiB), así que la cola vigila la inactividad: una subida sin progreso
// o sin respuesta tras enviar todo se aborta y queda reintentable, para no ocupar un cupo indefinidamente.
// Reintentar es seguro: el servidor responde 200 (duplicado) si ya la había recibido.
export const SEGUNDOS_SIN_PROGRESO = 120
export const MINUTOS_ESPERA_RESPUESTA = 10

// Máquina de estados independiente de React. Una cancelación conserva el cupo hasta que
// termina la petición: reintentar mientras se aborta nunca excede las tres conexiones.
export class ColaSubidas {
  private elementos: ElementoSubida[] = []
  private oyentes = new Set<() => void>()
  private controladores = new Map<number, AbortController>()
  private siguienteId = 1
  private subir: Subir

  constructor(subir: Subir) {
    this.subir = subir
  }
  snapshot = () => this.elementos
  suscribir = (oyente: () => void) => {
    this.oyentes.add(oyente)
    return () => { this.oyentes.delete(oyente) }
  }
  private emitir() { this.oyentes.forEach(oyente => oyente()) }
  private cambiar(id: number, cambios: Partial<ElementoSubida>) {
    this.elementos = this.elementos.map(e => e.id === id ? { ...e, ...cambios } : e)
    this.emitir()
  }
  agregar(archivos: File[]) {
    this.elementos = [...this.elementos, ...archivos.map(archivo => {
      const error = validarArchivo(archivo)
      return { id: this.siguienteId++, archivo, estado: error ? 'error' as const : 'pendiente' as const, cargados: 0, error, reintentable: !error }
    })]
    this.emitir()
    this.procesar()
  }
  cancelar(id: number) {
    const elemento = this.elementos.find(e => e.id === id)
    if (!elemento || !['pendiente', 'subiendo'].includes(elemento.estado)) return
    this.controladores.get(id)?.abort()
    this.cambiar(id, { estado: 'cancelado', cargados: 0 })
  }
  cancelarTodas = () => {
    this.elementos.filter(e => e.estado === 'pendiente' || e.estado === 'subiendo').forEach(e => this.cancelar(e.id))
  }
  reintentar(id: number) {
    const elemento = this.elementos.find(e => e.id === id)
    if (!elemento?.reintentable || !['error', 'cancelado'].includes(elemento.estado)) return
    this.cambiar(id, { estado: 'pendiente', cargados: 0, error: null })
    this.procesar()
  }
  reintentarFallidos() {
    this.elementos.filter(e => e.estado === 'error' && e.reintentable).forEach(e => this.reintentar(e.id))
  }
  private procesar() {
    while (this.controladores.size < 3) {
      const elemento = this.elementos.find(e => e.estado === 'pendiente' && !this.controladores.has(e.id))
      if (!elemento) return
      void this.ejecutar(elemento)
    }
  }
  private async ejecutar(elemento: ElementoSubida) {
    const controlador = new AbortController()
    this.controladores.set(elemento.id, controlador)
    this.cambiar(elemento.id, { estado: 'subiendo' })
    let vigia: ReturnType<typeof setTimeout> | undefined
    const vigilar = (ms: number) => {
      clearTimeout(vigia)
      vigia = setTimeout(() => {
        if (controlador.signal.aborted) return
        controlador.abort()
        this.cambiar(elemento.id, { estado: 'error', error: 'La subida se detuvo sin respuesta del servidor. Puedes reintentarla.' })
      }, ms)
    }
    vigilar(SEGUNDOS_SIN_PROGRESO * 1000)
    try {
      const resultado = await this.subir(elemento.archivo, {
        signal: controlador.signal,
        onUploadProgress: evento => {
          if (controlador.signal.aborted) return
          const enviado = evento.loaded >= (evento.total ?? elemento.archivo.size)
          vigilar(enviado ? MINUTOS_ESPERA_RESPUESTA * 60_000 : SEGUNDOS_SIN_PROGRESO * 1000)
          this.cambiar(elemento.id, { cargados: Math.min(elemento.archivo.size, evento.loaded) })
        },
      })
      if (!controlador.signal.aborted) {
        this.cambiar(elemento.id, { estado: resultado.duplicado ? 'duplicado' : 'subido', cargados: elemento.archivo.size })
      }
    } catch (error) {
      if (!controlador.signal.aborted) this.cambiar(elemento.id, { estado: 'error', error: mensajeDeError(error, 'No se pudo subir el archivo.') })
    } finally {
      clearTimeout(vigia)
      this.controladores.delete(elemento.id)
      this.procesar()
    }
  }
}

export function resumenSubidas(elementos: ElementoSubida[]) {
  const contar = (estado: EstadoSubida) => elementos.filter(e => e.estado === estado).length
  const totalBytes = elementos.reduce((total, e) => total + e.archivo.size, 0)
  const cargados = elementos.reduce((total, e) => total + e.cargados, 0)
  return {
    subidos: contar('subido'), duplicados: contar('duplicado'), errores: contar('error'), cancelados: contar('cancelado'),
    enCurso: elementos.some(e => e.estado === 'pendiente' || e.estado === 'subiendo'),
    progreso: totalBytes ? Math.round(100 * cargados / totalBytes) : 0,
    totalBytes, cargados,
  }
}
