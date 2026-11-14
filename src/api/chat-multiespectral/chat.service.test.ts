import { afterEach, describe, expect, it, vi } from 'vitest'
import { enviarMensajeChat } from './chat.service'

afterEach(() => vi.unstubAllGlobals())
describe('chat de análisis multiespectral', () => {
  it('envía el mensaje y la sesión al webhook y lee su respuesta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ output: 'Respuesta del asistente' }) })
    vi.stubGlobal('fetch', fetchMock)
    await expect(enviarMensajeChat('https://n8n.example/webhook/chat', 'sesion-1', '¿Qué es NDVI?')).resolves.toBe('Respuesta del asistente')
    expect(fetchMock).toHaveBeenCalledWith('https://n8n.example/webhook/chat', expect.objectContaining({
      method: 'POST', credentials: 'omit', body: JSON.stringify({ action: 'sendMessage', sessionId: 'sesion-1', chatInput: '¿Qué es NDVI?' }),
    }))
  })
  it('admite la respuesta en arreglo y rechaza respuestas inválidas o fallidas', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [{ output: 'Hola' }] }).mockResolvedValueOnce({ ok: true, json: async () => ({}) }).mockResolvedValueOnce({ ok: false })
    vi.stubGlobal('fetch', fetchMock)
    await expect(enviarMensajeChat('url', 'sesion', 'hola')).resolves.toBe('Hola')
    await expect(enviarMensajeChat('url', 'sesion', 'hola')).rejects.toThrow()
    await expect(enviarMensajeChat('url', 'sesion', 'hola')).rejects.toThrow()
  })
})
