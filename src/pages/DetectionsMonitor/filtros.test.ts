import { describe, expect, it } from 'vitest'
import { FILTROS_VACIOS, aParametros, hayFiltros } from './filtros'

describe('filtro de precisión del GPS', () => {
  it('sin precisión no envía el parámetro', () => {
    expect(aParametros(FILTROS_VACIOS)).not.toHaveProperty('precisionMaxMetros')
    expect(hayFiltros(FILTROS_VACIOS)).toBe(false)
  })

  it('envía la precisión máxima y cuenta como filtro activo', () => {
    const filtros = { ...FILTROS_VACIOS, precisionMaxMetros: 50 }

    expect(aParametros(filtros)).toEqual({ precisionMaxMetros: 50 })
    expect(hayFiltros(filtros)).toBe(true)
  })

  it('cero metros es un filtro válido, no se descarta', () => {
    expect(aParametros({ ...FILTROS_VACIOS, precisionMaxMetros: 0 })).toEqual({ precisionMaxMetros: 0 })
  })
})
