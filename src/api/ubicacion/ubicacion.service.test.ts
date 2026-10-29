import { describe, expect, it } from 'vitest'
import { desdeDelDia, hastaDelDia } from './ubicacion.service'

describe('fechas del filtro del mapa', () => {
  it('"hasta" va como fin de día UTC para no dejar fuera ese día', () => {
    expect(hastaDelDia('2026-03-15')).toBe('2026-03-15T23:59:59Z')
  })

  it('"desde" va como inicio de día UTC', () => {
    expect(desdeDelDia('2026-03-15')).toBe('2026-03-15T00:00:00Z')
  })

  it('sin fecha no se envía nada', () => {
    expect(desdeDelDia('')).toBeUndefined()
    expect(hastaDelDia('')).toBeUndefined()
  })
})
