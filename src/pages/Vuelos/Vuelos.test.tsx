import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Vuelos from './Vuelos'

vi.mock('@tanstack/react-query', async original => ({ ...await original<object>(), useQuery: vi.fn() }))
const consulta = vi.mocked(useQuery)
beforeEach(() => consulta.mockReset())
describe('pantalla de vuelos', () => {
  it('muestra una lista vacía y la acción de crear', () => {
    consulta.mockReturnValue({ isPending: false, isError: false, data: { datos: [], total: 0 }, isFetching: false } as ReturnType<typeof useQuery>)
    const html = renderToStaticMarkup(<MemoryRouter><Vuelos /></MemoryRouter>)
    expect(html).toContain('No hay vuelos para estos filtros')
    expect(html).toContain('Nuevo vuelo')
  })
  it('muestra el estado 403 sin exponer la respuesta del servidor', () => {
    consulta.mockReturnValue({ isPending: false, isError: true, error: { isAxiosError: true, response: { status: 403, data: { mensaje: 'dato interno' } } }, refetch: vi.fn() } as unknown as ReturnType<typeof useQuery>)
    const html = renderToStaticMarkup(<MemoryRouter><Vuelos /></MemoryRouter>)
    expect(html).toContain('Acceso denegado (403)')
    expect(html).not.toContain('dato interno')
    expect(html).not.toContain('<table')
  })
})
