import { describe, expect, it } from 'vitest'
import { tiempoParaRenovar } from './enlaces'

describe('renovación de enlaces firmados', () => {
  const ahora = Date.parse('2026-11-12T15:00:00Z')
  it('renueva un enlace de cinco minutos a los cuatro minutos y medio', () => {
    expect(tiempoParaRenovar('2026-11-12T15:05:00Z', ahora)).toBe(270_000)
  })
  it('tiene en cuenta lo que resta del vencimiento dado por el servidor', () => {
    expect(tiempoParaRenovar('2026-11-12T15:05:00Z', ahora + 260_000)).toBe(10_000)
  })
  it('considera vencidos los enlaces sin fecha válida o dentro del margen', () => {
    for (const fecha of [undefined, 'incorrecta', '2026-11-12T14:59:00Z', '2026-11-12T15:00:20Z']) expect(tiempoParaRenovar(fecha, ahora)).toBe(0)
  })
})
