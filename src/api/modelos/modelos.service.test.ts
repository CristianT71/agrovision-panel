import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../axios'
import { MINUTOS_SUBIDA_MODELO, modelosService } from './modelos.service'

afterEach(() => vi.restoreAllMocks())
it('sube el modelo con un tiempo límite propio, mayor que el global de 30 s', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { id: 'modelo' } })
  await modelosService.subir({ version: '1.0.0', versionMinApp: '1.0.0', modelo: new File(['x'], 'modelo.tflite') } as Parameters<typeof modelosService.subir>[0])
  expect(post).toHaveBeenCalledWith('/modelos', expect.any(FormData), { timeout: MINUTOS_SUBIDA_MODELO * 60_000 })
  expect(MINUTOS_SUBIDA_MODELO * 60_000).toBeGreaterThan(30_000)
})
