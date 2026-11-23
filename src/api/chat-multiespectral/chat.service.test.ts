import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../axios'
import * as descargas from '../descargas'
import { codigoInforme, descargarInforme, enviarMensajeChat, ErrorAsistente } from './chat.service'

const fallo = (status: number, data: unknown = {}) =>
  new AxiosError('fallo', 'ERR', undefined, undefined, { status, data, statusText: '', headers: {}, config: { headers: new AxiosHeaders() } })
const codigo = `1999999999-${'a'.repeat(48)}`

afterEach(() => vi.restoreAllMocks())
describe('chat de análisis multiespectral', () => {
  it('envía el mensaje a la API con la sesión del panel y el vuelo en la ruta', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { output: ' Respuesta del asistente ' } })
    const signal = new AbortController().signal
    await expect(enviarMensajeChat('vuelo-1', 'sesion-1', '¿Qué es NDVI?', signal)).resolves.toBe('Respuesta del asistente')
    expect(post).toHaveBeenCalledWith('/vuelos/vuelo-1/chat', { sessionId: 'sesion-1', chatInput: '¿Qué es NDVI?' }, { signal, timeout: 245_000 })
  })
  it('admite la respuesta en arreglo y rechaza respuestas inválidas', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: [{ output: 'Hola' }] }).mockResolvedValueOnce({ data: {} })
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).resolves.toBe('Hola')
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toThrow()
  })
  it('explica que el asistente está ocupado cuando el servidor responde con error 5xx o 429', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(fallo(500)).mockRejectedValueOnce(fallo(429)).mockRejectedValueOnce(fallo(504, { mensaje: 'El asistente tardó demasiado en responder.' }))
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toThrow(/ocupado.*límite de uso/)
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toBeInstanceOf(ErrorAsistente)
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toThrow(/tardó demasiado/)
  })
  it('muestra el mensaje de la API ante 404 y deja pasar la cancelación', async () => {
    const cancelado = new CanceledError()
    vi.spyOn(api, 'post').mockRejectedValueOnce(fallo(404, { mensaje: 'El vuelo no existe.' })).mockRejectedValueOnce(cancelado)
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toThrow('El vuelo no existe.')
    await expect(enviarMensajeChat('v', 'sesion', 'hola')).rejects.toBe(cancelado)
  })
})

describe('informe en PDF', () => {
  it('reconoce el enlace del informe y extrae su código', () => {
    expect(codigoInforme(`https://n8n.agrovision.sbs/webhook/informe?t=${codigo}`)).toBe(codigo)
    expect(codigoInforme(`http://localhost:5679/webhook/informe?t=${codigo}.pdf`)).toBe(codigo)
    expect(codigoInforme('http://localhost:5679/webhook/informe?t=../../x')).toBeNull()
    expect(codigoInforme('https://agrovision.sbs/otra')).toBeNull()
  })
  it('lo descarga por la API con la sesión y explica el enlace vencido', async () => {
    const blob = new Blob(['%PDF'])
    const get = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: blob }).mockRejectedValueOnce(fallo(410))
    const descargar = vi.spyOn(descargas, 'descargarBlob').mockImplementation(() => {})
    await descargarInforme('vuelo-1', codigo)
    expect(get).toHaveBeenCalledWith('/vuelos/vuelo-1/informe', { params: { t: codigo }, responseType: 'blob', timeout: 60_000 })
    expect(descargar).toHaveBeenCalledWith(blob, 'informe-agrovision.pdf')
    await expect(descargarInforme('vuelo-1', codigo)).rejects.toThrow(/venció/)
  })
})
