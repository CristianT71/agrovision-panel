import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { agronomosService, clavesAgronomos, type PerfilAgronomo } from '../../api/agronomos/agronomos.service'
import { reglasZonaService, type ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import DialogoAprobar from './DialogoAprobar'

// Igual que EliminarFichaModal.test: SSR sin DOM; solo se sustituye el estado inicial de los campos.
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>()
  return { ...react, useState: vi.fn(react.useState) }
})
vi.mock('@tanstack/react-query', async (original) => {
  const query = await original<typeof import('@tanstack/react-query')>()
  return { ...query, useMutation: vi.fn(query.useMutation) }
})

const regla: ReglaZona = {
  id: '44444444-4444-4444-8444-444444444444', tipoEnfermedad: 'roya', version: 1, estado: 'borrador', calibrada: false,
  notas: 'Valores de EJEMPLO.', filas: [{ orden: 1, sevMax: 100, incMax: 100, radioMinM: 0, radioMaxM: 5 }],
  creadaPor: null, creadaEn: '2026-01-01T00:00:00Z', aprobadaPor: null, aprobadaEn: null, activadaEn: null,
}
const perfil = { nombre: 'Ana Pérez', tarjetaProfesional: 'TP-123', estado: 'activo' } as PerfilAgronomo

let cliente: QueryClient
beforeEach(() => {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  cliente.setQueryData(clavesAgronomos.miPerfil, perfil)
  vi.clearAllMocks()
})
afterEach(() => {
  cliente.clear()
  vi.restoreAllMocks()
})

function dialogo(calibrada?: boolean, nota?: string) {
  if (calibrada !== undefined) vi.mocked(useState).mockReturnValueOnce([calibrada, vi.fn()]).mockReturnValueOnce([nota ?? '', vi.fn()])
  return renderToStaticMarkup(
    <QueryClientProvider client={cliente}>
      <DialogoAprobar regla={regla} cerrar={vi.fn()} />
    </QueryClientProvider>,
  )
}
const botonAprobar = (html: string) => html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0] ?? ''

describe('diálogo de aprobación', () => {
  it('muestra nombre y tarjeta del agrónomo, casilla calibrada sin marcar y permite aprobar sin nota', () => {
    const html = dialogo()
    expect(html).toContain('Ana Pérez · Tarjeta profesional TP-123')
    expect(html).toMatch(/<input type="checkbox"(?![^>]*checked)[^>]*>/)
    expect(html).toContain('Nota de aprobación (opcional)')
    expect(botonAprobar(html)).not.toContain('disabled=""')
  })

  it('calibrada sin nota: muestra el aviso y bloquea el envío', () => {
    const html = dialogo(true, '   ')
    expect(html).toContain('Nota de calibración (obligatoria)')
    expect(html).toContain('Para marcar la regla como calibrada se requiere una nota.')
    expect(botonAprobar(html)).toContain('disabled=""')
  })

  it('calibrada con nota: habilita el envío', () => {
    const html = dialogo(true, 'Validada en 3 fincas')
    expect(html).not.toContain('se requiere una nota')
    expect(botonAprobar(html)).not.toContain('disabled=""')
  })

  it('avisa y bloquea el envío si la cuenta del agrónomo no está validada', () => {
    cliente.setQueryData(clavesAgronomos.miPerfil, { ...perfil, estado: 'pendiente' })
    const html = dialogo()
    expect(html).toContain('Tu cuenta aún no está validada')
    expect(botonAprobar(html)).toContain('disabled=""')
  })

  it('bloquea el envío mientras el perfil no está cargado', () => {
    cliente.removeQueries({ queryKey: clavesAgronomos.miPerfil })
    vi.spyOn(agronomosService, 'miPerfil').mockReturnValue(new Promise(() => {}))
    const html = dialogo()
    expect(html).toContain('Cargando tus datos…')
    expect(botonAprobar(html)).toContain('disabled=""')
  })

  it('envía el cuerpo del contrato y muestra un mensaje claro ante el 403 sin código del guard de roles', async () => {
    const aprobar = vi.spyOn(reglasZonaService, 'aprobar').mockRejectedValue({ isAxiosError: true, response: { status: 403, data: { mensaje: 'Forbidden resource' } } })
    dialogo()
    const opciones = vi.mocked(useMutation).mock.calls[0][0]
    const mutacion = cliente.getMutationCache().build(cliente, opciones)
    await expect(mutacion.execute({ calibrada: true, nota: 'ok' })).rejects.toBeDefined()
    expect(aprobar).toHaveBeenCalledExactlyOnceWith(regla.id, { calibrada: true, nota: 'ok' })

    vi.mocked(useMutation).mockReturnValueOnce({ ...mutacion.state, isError: true, isPending: false } as unknown as ReturnType<typeof useMutation>)
    const html = dialogo()
    expect(html).toContain('Solo un agrónomo validado puede aprobar una regla de zona.')
    expect(html).not.toContain('Forbidden resource')
  })
})
