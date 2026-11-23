import { describe, expect, it } from 'vitest'
import {
  construirEnlaceGoogleEarth,
  construirEnlaceGoogleMapsSatelite,
  formatearAltitud,
  formatearCoordenada,
  formatearPrecision,
} from './ubicacion'

describe('construirEnlaceGoogleEarth', () => {
  it('arma la URL con 6 decimales y la altitud', () => {
    expect(construirEnlaceGoogleEarth(2.9273, -75.2819, 1650)).toBe(
      'https://earth.google.com/web/@2.927300,-75.281900,1650a,1500d,35y,0h,0t,0r',
    )
  })

  it('usa altitud 0 cuando no hay dato', () => {
    const esperado = 'https://earth.google.com/web/@2.927300,-75.281900,0a,1500d,35y,0h,0t,0r'
    expect(construirEnlaceGoogleEarth(2.9273, -75.2819, null)).toBe(esperado)
    expect(construirEnlaceGoogleEarth(2.9273, -75.2819, undefined)).toBe(esperado)
    expect(construirEnlaceGoogleEarth(2.9273, -75.2819, Number.NaN)).toBe(esperado)
  })

  it('redondea la altitud a metros enteros y conserva el signo de las coordenadas', () => {
    expect(construirEnlaceGoogleEarth(-0.1, 10.1234567, 1650.6)).toContain('@-0.100000,10.123457,1651a')
  })
})

describe('construirEnlaceGoogleMapsSatelite', () => {
  it('apunta al punto en vista satelital', () => {
    expect(construirEnlaceGoogleMapsSatelite(2.9273, -75.2819)).toBe(
      'https://www.google.com/maps/@?api=1&map_action=map&center=2.927300,-75.281900&zoom=18&basemap=satellite',
    )
  })
})

describe('formatos', () => {
  it('coordenadas con 6 decimales', () => {
    expect(formatearCoordenada(2.9)).toBe('2.900000')
  })

  it('altitud en msnm o n/d', () => {
    expect(formatearAltitud(1650.4)).toBe('1650 msnm')
    expect(formatearAltitud(0)).toBe('0 msnm')
    expect(formatearAltitud(null)).toBe('n/d')
  })

  it('precisión con ± o n/d', () => {
    expect(formatearPrecision(4.6)).toBe('±5 m')
    expect(formatearPrecision(null)).toBe('n/d')
  })
})
