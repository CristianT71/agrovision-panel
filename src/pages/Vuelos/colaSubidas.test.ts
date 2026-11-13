import { describe, expect, it, vi } from 'vitest'
import type { ArchivoVuelo, OpcionesSubida } from '../../api/vuelos/vuelos.service'
import { ColaSubidas, limiteArchivoMb, MINUTOS_ESPERA_RESPUESTA, resumenSubidas, SEGUNDOS_SIN_PROGRESO, validarArchivo } from './colaSubidas'

const archivo = () => new File(['captura'], 'DJI.JPG', { type: 'image/jpeg' })
const resultado = (duplicado = false) => ({ archivo: { id: 'archivo' } as ArchivoVuelo, duplicado })
function control() {
  let resolver!: (valor: ReturnType<typeof resultado>) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<ReturnType<typeof resultado>>((resolve, reject) => { resolver = resolve; rechazar = reject })
  return { promesa, resolver, rechazar }
}
const avanzar = async () => { await Promise.resolve(); await Promise.resolve() }

describe('cola de subidas de vuelos', () => {
  it('mantiene un máximo de tres peticiones y termina toda la cola', async () => {
    const pendientes: ReturnType<typeof control>[] = []
    let activas = 0, maximo = 0
    const subir = vi.fn(() => {
      activas++; maximo = Math.max(maximo, activas)
      const pendiente = control(); pendientes.push(pendiente)
      return pendiente.promesa.finally(() => { activas-- })
    })
    const cola = new ColaSubidas(subir)
    cola.agregar(Array.from({ length: 8 }, archivo))
    expect(subir).toHaveBeenCalledTimes(3)
    for (let i = 0; i < 8; i++) { pendientes[i].resolver(resultado()); await avanzar(); await avanzar() }
    expect(maximo).toBe(3)
    expect(subir).toHaveBeenCalledTimes(8)
    expect(resumenSubidas(cola.snapshot())).toMatchObject({ subidos: 8, enCurso: false, progreso: 100 })
  })
  it('cuenta los HTTP 200 idempotentes como duplicados, sin error', async () => {
    const cola = new ColaSubidas(async () => resultado(true))
    cola.agregar([archivo()]); await avanzar()
    expect(resumenSubidas(cola.snapshot())).toMatchObject({ duplicados: 1, errores: 0, subidos: 0, progreso: 100 })
  })
  it('reintenta un fallo sin duplicar entradas ni repetir archivos completados', async () => {
    const subir = vi.fn().mockRejectedValueOnce(new Error('red')).mockResolvedValue(resultado())
    const cola = new ColaSubidas(subir)
    cola.agregar([archivo()]); await avanzar()
    expect(cola.snapshot()[0].estado).toBe('error')
    cola.reintentarFallidos(); await avanzar()
    cola.reintentar(1)
    expect(subir).toHaveBeenCalledTimes(2)
    expect(cola.snapshot()).toHaveLength(1)
    expect(cola.snapshot()[0].estado).toBe('subido')
  })
  it('cancela peticiones activas mediante AbortSignal y no inicia las pendientes', async () => {
    const opciones: OpcionesSubida[] = []
    const subir = vi.fn((_archivo: File, config: OpcionesSubida) => {
      opciones.push(config)
      return new Promise<ReturnType<typeof resultado>>((_resolve, reject) => config.signal?.addEventListener('abort', () => reject(new Error('cancelado'))))
    })
    const cola = new ColaSubidas(subir)
    cola.agregar(Array.from({ length: 6 }, archivo))
    cola.cancelarTodas(); await avanzar()
    expect(opciones.every(o => o.signal?.aborted)).toBe(true)
    expect(subir).toHaveBeenCalledTimes(3)
    expect(resumenSubidas(cola.snapshot())).toMatchObject({ cancelados: 6, enCurso: false, errores: 0 })
  })
  it('reintentar una cancelación antes de terminar el aborto conserva el límite', async () => {
    const pendientes: ReturnType<typeof control>[] = []
    const cola = new ColaSubidas(() => { const p = control(); pendientes.push(p); return p.promesa })
    cola.agregar(Array.from({ length: 4 }, archivo))
    cola.cancelar(1); cola.reintentar(1)
    expect(pendientes).toHaveLength(3)
    pendientes[0].resolver(resultado()); await avanzar()
    expect(pendientes).toHaveLength(4)
    expect(cola.snapshot()[0].estado).toBe('subiendo')
    pendientes[3].resolver(resultado(true)); pendientes[1].resolver(resultado()); pendientes[2].resolver(resultado()); await avanzar()
    pendientes[4].resolver(resultado()); await avanzar()
    expect(resumenSubidas(cola.snapshot())).toMatchObject({ duplicados: 1, subidos: 3, errores: 0 })
  })
  it('ignora resultados y eventos de progreso posteriores a cancelar', async () => {
    const p = control()
    let opciones!: OpcionesSubida
    const cola = new ColaSubidas((_a, config) => { opciones = config; return p.promesa })
    cola.agregar([archivo()]); cola.cancelar(1)
    opciones.onUploadProgress?.({ loaded: 100 } as Parameters<NonNullable<OpcionesSubida['onUploadProgress']>>[0])
    p.resolver(resultado()); await avanzar()
    expect(cola.snapshot()[0]).toMatchObject({ estado: 'cancelado', cargados: 0 })
  })
  it('limita el progreso al tamaño real del archivo y pondera por bytes', async () => {
    const p = control()
    const cola = new ColaSubidas((a, config) => {
      config.onUploadProgress?.({ loaded: a.size + 100 } as Parameters<NonNullable<OpcionesSubida['onUploadProgress']>>[0])
      return p.promesa
    })
    cola.agregar([archivo()])
    expect(resumenSubidas(cola.snapshot()).progreso).toBe(100)
    p.resolver(resultado()); await avanzar()
  })
  it('aborta las subidas sin progreso ni respuesta y libera sus cupos para la cola', async () => {
    vi.useFakeTimers()
    try {
      const opciones: OpcionesSubida[] = []
      const subir = vi.fn((_archivo: File, config: OpcionesSubida) => {
        opciones.push(config)
        return new Promise<ReturnType<typeof resultado>>((_resolve, reject) => config.signal?.addEventListener('abort', () => reject(new Error('abortada'))))
      })
      const cola = new ColaSubidas(subir)
      cola.agregar(Array.from({ length: 4 }, archivo))
      type Progreso = Parameters<NonNullable<OpcionesSubida['onUploadProgress']>>[0]
      // La primera envía todo el cuerpo y espera la respuesta: tiene más margen que una transferencia detenida
      opciones[0].onUploadProgress?.({ loaded: 10, total: 10 } as Progreso)
      vi.advanceTimersByTime(SEGUNDOS_SIN_PROGRESO * 1000); await avanzar()
      expect(cola.snapshot().map(e => e.estado)).toEqual(['subiendo', 'error', 'error', 'subiendo'])
      expect(cola.snapshot()[1]).toMatchObject({ reintentable: true, error: expect.stringContaining('se detuvo') })
      expect(subir).toHaveBeenCalledTimes(4)
      vi.advanceTimersByTime(MINUTOS_ESPERA_RESPUESTA * 60_000); await avanzar()
      expect(cola.snapshot()[0].estado).toBe('error')
    } finally {
      vi.useRealTimers()
    }
  })
  it('rechaza tipo o tamaño inválidos antes de contactar al servidor', () => {
    const subir = vi.fn()
    const cola = new ColaSubidas(subir)
    cola.agregar([new File(['texto'], 'mal.exe'), new File([], 'vacio.SRT')])
    cola.reintentarFallidos()
    expect(subir).not.toHaveBeenCalled()
    expect(resumenSubidas(cola.snapshot()).errores).toBe(2)
    expect(validarArchivo({ name: 'banda.TIFF', size: 1024 ** 2 }, 1)).toBeNull()
    expect(validarArchivo({ name: 'video.MP4', size: 1024 ** 2 + 1 }, 1)).toContain('Supera')
    expect(limiteArchivoMb('512')).toBe(512)
    for (const valor of [undefined, '', 'no', 0, -1, Infinity]) expect(limiteArchivoMb(valor)).toBe(2048)
  })
})
