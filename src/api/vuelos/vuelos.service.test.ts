import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../axios'
import { vuelosService } from './vuelos.service'

afterEach(() => vi.restoreAllMocks())
describe('servicio de vuelos contra el contrato', () => {
  it.each([200, 201])('sube un archivo con timeout ilimitado, cancelación y progreso (HTTP %s)', async status => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ status, data: { id: 'archivo' } })
    const archivo = new File(['contenido'], 'foto.jpg')
    const signal = new AbortController().signal
    const onUploadProgress = vi.fn()
    const resultado = await vuelosService.subirArchivo('vuelo', archivo, { signal, onUploadProgress })
    expect(post).toHaveBeenCalledWith('/vuelos/vuelo/archivos', expect.any(FormData), { signal, onUploadProgress, timeout: 0 })
    expect((post.mock.calls[0][1] as FormData).getAll('archivo')).toHaveLength(1)
    expect(resultado.duplicado).toBe(status === 200)
    expect(resultado.archivo).toEqual({ id: 'archivo' })
  })
  it('envía los filtros exactos y AbortSignal, sin pedir todos los archivos', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { datos: [], total: 0, pagina: 2, limite: 60 } })
    const signal = new AbortController().signal
    const filtros = { pagina: 2, limite: 60, tipo: 'banda_multiespectral' as const, banda: 'nir' as const }
    await vuelosService.listarArchivos('vuelo', filtros, signal)
    expect(get).toHaveBeenCalledWith('/vuelos/vuelo/archivos', { params: filtros, signal })
  })
  it('pide el enlace mediante POST y obtiene los metadatos solo en el detalle', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { urlContenido: '/firmado', urlMiniatura: null, expiraEn: 'ISO' } })
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { metadatosCrudos: {} } })
    await vuelosService.pedirEnlace('v', 'a')
    await vuelosService.obtenerArchivo('v', 'a')
    expect(post).toHaveBeenCalledWith('/vuelos/v/archivos/a/enlace', undefined, { signal: undefined })
    expect(get).toHaveBeenCalledWith('/vuelos/v/archivos/a', { signal: undefined })
  })
})
