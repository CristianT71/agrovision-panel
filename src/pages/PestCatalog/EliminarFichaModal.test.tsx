import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider, QueryObserver, useMutation } from '@tanstack/react-query'
import { clavesPlagas, plagasService, type Plaga } from '../../api/plagas/plagas.service'
import EliminarFichaModal from './EliminarFichaModal'
import PestDrawer from './PestDrawer'

// El proyecto prueba las pantallas con SSR, sin dependencias de DOM.
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>()
  return { ...react, useState: vi.fn(react.useState) }
})
vi.mock('@tanstack/react-query', async (original) => {
  const query = await original<typeof import('@tanstack/react-query')>()
  return { ...query, useMutation: vi.fn(query.useMutation) }
})

const ficha: Plaga = {
  id: '1d26b11a-57c8-4c88-972d-7beb7dd08ca5',
  nombreComun: 'Plaga de prueba', nombreCientifico: null, tipo: 'plaga',
  descripcion: 'Descripción', sintomas: 'Daño en hojas', cultivo: 'Café',
  organosAfectados: ['hojas'], hospederos: [], medidasContencion: 'Control cultural',
  protocoloQuimico: null, fotoUrl: null, sinonimos: [], avales: [],
}

let cliente: QueryClient
beforeEach(() => {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  vi.clearAllMocks()
})
afterEach(() => {
  cliente.clear()
  vi.restoreAllMocks()
})

function modal(texto: string, onEliminada = vi.fn()) {
  // Solo sustituye el estado del campo; las consultas y mutaciones son reales.
  vi.mocked(useState).mockReturnValueOnce([texto, vi.fn()])
  return renderToStaticMarkup(
    <QueryClientProvider client={cliente}>
      <EliminarFichaModal ficha={ficha} onClose={vi.fn()} onEliminada={onEliminada} />
    </QueryClientProvider>,
  )
}

function botonConfirmar(html: string) {
  return html.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0] ?? ''
}

describe('confirmación de eliminación de ficha', () => {
  it.each(['', 'E', 'ELIMINA', 'eliminar', 'Eliminar', ' ELIMINAR', 'ELIMINAR ', 'ELIMINAR\n'])(
    'deshabilita la confirmación para %j', (texto) => {
      expect(botonConfirmar(modal(texto))).toContain('disabled=""')
    },
  )

  it('solo habilita el botón con ELIMINAR exacto y muestra el aviso rojo del contrato', () => {
    const html = modal('ELIMINAR')
    expect(botonConfirmar(html)).not.toContain('disabled=""')
    expect(html).toContain('Eliminar definitivamente')
    expect(html).toMatch(/<p[^>]*text-red-600[^>]*>Esta acción no se puede deshacer\. La ficha desaparecerá también de las aplicaciones móviles en su próxima sincronización\.<\/p>/)
  })

  it.each([true, false, undefined])('oculta el botón de eliminar únicamente si protegida es true (%s)', (protegida) => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={cliente}>
        <PestDrawer ficha={{ ...ficha, protegida }} onClose={vi.fn()} onGuardada={vi.fn()} onEliminada={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(html.includes('Eliminar ficha')).toBe(protegida !== true)
  })

  it('no muestra la eliminación al crear una ficha', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={cliente}>
        <PestDrawer onClose={vi.fn()} onGuardada={vi.fn()} onEliminada={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(html).not.toContain('Eliminar ficha')
  })

  it('llama al servicio, limpia las cachés y refresca la lista activa después del éxito', async () => {
    const otra = { ...ficha, id: 'otra-ficha', nombreComun: 'Otra ficha' }
    const lista = clavesPlagas.lista({})
    const filtrada = clavesPlagas.lista({ tipo: 'plaga' })
    const detalle = [...clavesPlagas.todas, 'detalle', ficha.id]
    cliente.setQueryData(lista, [ficha, otra])
    cliente.setQueryData(filtrada, [ficha])
    cliente.setQueryData(detalle, ficha)
    cliente.setQueryData(['ajena'], 'conservar')
    const listar = vi.spyOn(plagasService, 'listar').mockResolvedValue([otra])
    const eliminar = vi.spyOn(plagasService, 'eliminar').mockResolvedValue(undefined)
    const observador = new QueryObserver(cliente, { queryKey: lista, queryFn: () => plagasService.listar({}) })
    const cambios: Plaga[][] = []
    const dejarDeObservar = observador.subscribe((resultado) => { if (resultado.data) cambios.push(resultado.data) })
    const onEliminada = vi.fn()
    modal('ELIMINAR', onEliminada)
    const opciones = vi.mocked(useMutation).mock.calls[0][0]

    try {
      // Ejecuta el mismo ciclo de mutación y sus callbacks en TanStack Query.
      await cliente.getMutationCache().build(cliente, opciones).execute(undefined)
      expect(eliminar).toHaveBeenCalledExactlyOnceWith(ficha.id)
      expect(listar).toHaveBeenCalledExactlyOnceWith({})
      expect(cambios.length).toBeGreaterThan(0)
      expect(cambios.every((fichas) => fichas.every((actual) => actual.id !== ficha.id))).toBe(true)
      expect(cliente.getQueryData(lista)).toEqual([otra])
      expect(cliente.getQueryData(filtrada)).toBeUndefined()
      expect(cliente.getQueryData(detalle)).toBeUndefined()
      expect(cliente.getQueryData(['ajena'])).toBe('conservar')
      expect(onEliminada).toHaveBeenCalledOnce()
    } finally {
      dejarDeObservar()
    }
  })

  it.each([
    [403, 'No tienes permiso para eliminar fichas. Solo puede hacerlo un agrónomo.'],
    [404, 'La ficha ya no existe. Cierra el panel y actualiza el catálogo.'],
    [409, 'Esta ficha está protegida y no se puede eliminar.'],
  ])('muestra un mensaje claro para HTTP %s y conserva la ficha', async (status, mensaje) => {
    cliente.setQueryData(clavesPlagas.lista({}), [ficha])
    vi.spyOn(plagasService, 'eliminar').mockRejectedValue({ isAxiosError: true, response: { status } })
    const onEliminada = vi.fn()
    modal('ELIMINAR', onEliminada)
    const opciones = vi.mocked(useMutation).mock.calls[0][0]
    const mutacion = cliente.getMutationCache().build(cliente, opciones)
    await expect(mutacion.execute(undefined)).rejects.toBeDefined()

    vi.mocked(useMutation).mockReturnValueOnce({ ...mutacion.state, isError: true, isPending: false } as unknown as ReturnType<typeof useMutation>)
    expect(modal('ELIMINAR')).toContain(mensaje)
    expect(cliente.getQueryData(clavesPlagas.lista({}))).toEqual([ficha])
    expect(onEliminada).not.toHaveBeenCalled()
  })
})
