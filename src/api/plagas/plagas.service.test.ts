import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../axios'
import { componerProtocolo, descomponerProtocolo, plagasService } from './plagas.service'

afterEach(() => vi.restoreAllMocks())

describe('eliminar ficha según el contrato', () => {
  const id = '1d26b11a-57c8-4c88-972d-7beb7dd08ca5'

  it('usa DELETE /plagas/:id y acepta un 204 sin cuerpo', async () => {
    const borrar = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204 })
    await expect(plagasService.eliminar(id)).resolves.toBeUndefined()
    expect(borrar).toHaveBeenCalledExactlyOnceWith(`/plagas/${id}`)
  })

  it.each([400, 401, 403, 404, 409])('propaga el error HTTP %s al panel', async (status) => {
    const error = { isAxiosError: true, response: { status } }
    vi.spyOn(api, 'delete').mockRejectedValue(error)
    await expect(plagasService.eliminar(id)).rejects.toBe(error)
  })
})

describe('protocolo químico', () => {
  it('conserva líneas extra al descomponer y volver a componer', () => {
    const texto = 'Nota previa\nIngrediente activo: Cobre\nmezclar con agua\nDosis: 3 g/L\nPeriodo de carencia: 21 días\nrevisar etiqueta'
    const protocolo = descomponerProtocolo(texto)
    expect(protocolo.dosis).toBe('3 g/L')
    const recompuesto = componerProtocolo(protocolo)
    for (const parte of ['Nota previa', 'Cobre', 'mezclar con agua', '3 g/L', '21 días', 'revisar etiqueta']) {
      expect(recompuesto).toContain(parte)
    }
    expect(descomponerProtocolo(recompuesto)).toEqual(protocolo)
  })
})
