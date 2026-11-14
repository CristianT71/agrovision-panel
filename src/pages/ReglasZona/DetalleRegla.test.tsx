import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { EstadoRegla, ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import DetalleRegla from './DetalleRegla'
import { aEditables, type FilaEditable } from './logica'

// Igual que DialogoAprobar.test: SSR sin DOM; solo se sustituye el estado inicial del editor.
vi.mock('react', async (original) => {
  const react = await original<typeof import('react')>()
  return { ...react, useState: vi.fn(react.useState) }
})

const regla = (estado: EstadoRegla): ReglaZona => ({
  id: '44444444-4444-4444-8444-444444444444', tipoEnfermedad: 'roya', version: 1, estado, calibrada: false,
  notas: 'Valores de EJEMPLO.', filas: [{ orden: 1, sevMax: 100, incMax: 100, radioMinM: 0, radioMaxM: 5 }],
  creadaPor: null, creadaEn: '2026-01-01T00:00:00Z', aprobadaPor: null, aprobadaEn: null, activadaEn: null,
})
const modificadas: FilaEditable[] = [{ sevMax: '100', incMax: '100', radioMinM: '0', radioMaxM: '77' }]
const invalidas: FilaEditable[] = [{ sevMax: '90', incMax: '100', radioMinM: '0', radioMaxM: '5' }]

let cliente: QueryClient
beforeEach(() => {
  cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  vi.clearAllMocks()
})
afterEach(() => {
  cliente.clear()
  vi.restoreAllMocks()
})

// Orden de useState en DetalleRegla: filas, notas, diálogo, base
function detalle(estado: EstadoRegla, estadoInicial: { filas?: FilaEditable[]; base?: string } = {}) {
  const r = regla(estado)
  const real = vi.mocked(useState).getMockImplementation() as unknown as (inicial: unknown) => ReturnType<typeof useState>
  vi.mocked(useState)
    .mockImplementationOnce(() => real(estadoInicial.filas ?? aEditables(r.filas)))
    .mockImplementationOnce(() => real(r.notas ?? ''))
    .mockImplementationOnce(() => real(null))
  if (estadoInicial.base !== undefined) vi.mocked(useState).mockImplementationOnce(() => real(estadoInicial.base))
  return renderToStaticMarkup(
    <QueryClientProvider client={cliente}>
      <DetalleRegla regla={r} rol="profesional" seleccionar={vi.fn()} />
    </QueryClientProvider>,
  )
}
const boton = (html: string, texto: string) => html.match(new RegExp(`<button\\b[^>]*>${texto}</button>`))?.[0] ?? ''

describe('detalle de la regla', () => {
  it('borrador guardado: Aprobar y Simular habilitados, sin aviso de conflicto', () => {
    const html = detalle('borrador')
    expect(boton(html, 'Aprobar')).not.toContain('disabled=""')
    expect(boton(html, 'Simular')).not.toContain('disabled=""')
    expect(html).not.toContain('cambió mientras la editabas')
  })

  it('con cambios sin guardar bloquea Aprobar y Simular y pide guardar', () => {
    const html = detalle('borrador', { filas: modificadas })
    expect(boton(html, 'Aprobar')).toContain('disabled=""')
    expect(html).toContain('Guarda los cambios antes de aprobar')
    expect(boton(html, 'Simular')).toContain('disabled=""')
    expect(html).toContain('Guarda los cambios de la tabla antes de simular')
  })

  it('con errores de validación bloquea Aprobar', () => {
    const html = detalle('borrador', { filas: invalidas })
    expect(boton(html, 'Aprobar')).toContain('disabled=""')
    expect(html).toContain('Corrige los errores de la tabla y guarda antes de aprobar.')
  })

  it('si lo guardado cambió mientras el editor estaba modificado, avisa del conflicto y conserva lo local', () => {
    const html = detalle('borrador', { filas: modificadas, base: 'huella anterior' })
    expect(html).toContain('Esta regla cambió mientras la editabas')
    expect(html).toContain('value="77"')
  })

  it('en solo lectura muestra las filas guardadas, no el estado del editor', () => {
    const html = detalle('aprobada', { filas: modificadas })
    expect(html).toContain('Solo lectura')
    expect(html).not.toContain('77')
    expect(html).toContain('<span class="text-gray-800">5</span>')
  })

  it('el campo de notas editable tiene nombre accesible', () => {
    const html = detalle('borrador')
    const id = html.match(/<textarea[^>]*\bid="([^"]+)"/)?.[1]
    expect(id).toBeTruthy()
    expect(html).toContain(`<label for="${id}">Notas</label>`)
  })
})
