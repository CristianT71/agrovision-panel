import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../axios'
import { reglasZonaService } from './reglas-zona.service'

afterEach(() => vi.restoreAllMocks())

const id = '44444444-4444-4444-8444-444444444444'

describe('servicio de reglas de zona contra el contrato', () => {
  it('lista con filtros tipo/estado y omite los vacíos', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] })
    await reglasZonaService.listar({ tipo: ' roya ', estado: 'activa' })
    await reglasZonaService.listar({ tipo: '' })
    expect(get).toHaveBeenNthCalledWith(1, '/reglas-zona', { params: { tipo: 'roya', estado: 'activa' }, signal: undefined })
    expect(get).toHaveBeenNthCalledWith(2, '/reglas-zona', { params: {}, signal: undefined })
  })

  it('crea con POST y edita con PATCH solo notas y filas', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} })
    const filas = [{ orden: 1, sevMax: 100, incMax: 100, radioMinM: 0, radioMaxM: 5 }]
    await reglasZonaService.crear({ tipoEnfermedad: 'roya', notas: null, filas })
    await reglasZonaService.editar(id, { filas })
    expect(post).toHaveBeenCalledWith('/reglas-zona', { tipoEnfermedad: 'roya', notas: null, filas })
    expect(patch).toHaveBeenCalledWith(`/reglas-zona/${id}`, { filas })
  })

  it.each(['duplicar', 'activar', 'archivar'] as const)('%s usa POST /reglas-zona/:id/%s sin cuerpo', async (accion) => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    await reglasZonaService[accion](id)
    expect(post).toHaveBeenCalledWith(`/reglas-zona/${id}/${accion}`)
  })

  it('aprueba y simula con los cuerpos del contrato', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} })
    await reglasZonaService.aprobar(id, { calibrada: true, nota: 'Validada en campo' })
    await reglasZonaService.simular(id, { severidadPct: 70, incidenciaPct: 55, plantasPorHa: 5000 })
    expect(post).toHaveBeenNthCalledWith(1, `/reglas-zona/${id}/aprobar`, { calibrada: true, nota: 'Validada en campo' })
    expect(post).toHaveBeenNthCalledWith(2, `/reglas-zona/${id}/simular`, { severidadPct: 70, incidenciaPct: 55, plantasPorHa: 5000 })
  })

  it('elimina con DELETE y acepta 204 sin cuerpo', async () => {
    const borrar = vi.spyOn(api, 'delete').mockResolvedValue({ status: 204 })
    await expect(reglasZonaService.eliminar(id)).resolves.toBeUndefined()
    expect(borrar).toHaveBeenCalledExactlyOnceWith(`/reglas-zona/${id}`)
  })
})
