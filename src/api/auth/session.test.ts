import { afterEach, expect, it, vi } from 'vitest'
import { cerrarSesion } from './session'
import { queryClient } from '../queryClient'

afterEach(() => { queryClient.clear(); vi.unstubAllGlobals() })
it('purga consultas de vuelos, traza y enlaces firmados al cerrar cualquier sesión', () => {
  const removeItem = vi.fn()
  vi.stubGlobal('localStorage', { removeItem })
  for (const clave of [['vuelos', 'lista'], ['vuelos', 'id', 'traza'], ['vuelos', 'id', 'enlace', 'archivo']]) queryClient.setQueryData(clave, { privado: true })
  cerrarSesion()
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  expect(removeItem).toHaveBeenCalledWith('token')
  expect(removeItem).toHaveBeenCalledWith('agrovision_sesion')
})
