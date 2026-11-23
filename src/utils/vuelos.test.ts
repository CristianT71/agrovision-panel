import { describe, expect, it } from 'vitest'
import type { ArchivoVuelo } from '../api/vuelos/vuelos.service'
import { altitudVuelo, bytesVuelo, coordenadaVuelo, desdeDelDia, duracionVuelo, etiquetaRtk, fechaVuelo, hastaDelDia, requiereMiniatura } from './vuelos'

describe('formatos de vuelos', () => {
  it('muestra coordenadas con seis decimales, incluyendo cero y negativas', () => {
    expect(coordenadaVuelo(1.85512349)).toBe('1.855123')
    expect(coordenadaVuelo(-76.0551236)).toBe('-76.055124')
    expect(coordenadaVuelo(0)).toBe('0.000000')
    for (const valor of [null, undefined, NaN, Infinity]) expect(coordenadaVuelo(valor)).toBe('—')
  })
  it('nunca etiqueta la altitud del dron como msnm', () => {
    expect(altitudVuelo(0)).toBe('0 m')
    expect(altitudVuelo(-2)).toBe('-2 m')
    expect(altitudVuelo(1350.1)).not.toContain('msnm')
    expect(altitudVuelo(null)).toBe('—')
    expect(altitudVuelo(0.0098, 4)).toBe('0,0098 m')
  })
  it('formatea bytes en base 1024 y diferencia cero de dato ausente', () => {
    expect(bytesVuelo(0)).toBe('0 B')
    expect(bytesVuelo(1024)).toBe('1 KiB')
    expect(bytesVuelo(1024 ** 3)).toBe('1 GiB')
    expect(bytesVuelo(null)).toBe('—')
    expect(bytesVuelo(-10)).toBe('—')
  })
  it('formatea duraciones incluso más largas de un día', () => {
    expect(duracionVuelo(0)).toBe('00:00:00')
    expect(duracionVuelo(3661.9)).toBe('01:01:01')
    expect(duracionVuelo(90000)).toBe('25:00:00')
    expect(duracionVuelo(null)).toBe('—')
    expect(duracionVuelo(-1)).toBe('—')
  })
  it('convierte fechas a Bogotá y los filtros incluyen los bordes del día', () => {
    expect(fechaVuelo('2026-11-12T14:01:00Z')).toContain('09:01:00')
    expect(fechaVuelo('2026-11-12T14:01:00-05:00')).toContain('14:01:00')
    expect(fechaVuelo('incorrecta')).toBe('—')
    expect(fechaVuelo(null)).toBe('—')
    expect(desdeDelDia('2026-11-12')).toBe('2026-11-12T00:00:00-05:00')
    expect(hastaDelDia('2026-11-12')).toBe('2026-11-12T23:59:59.999-05:00')
    expect(desdeDelDia('')).toBeUndefined()
  })
  it('usa miniaturas para TIFF/DNG por extensión o MIME', () => {
    for (const nombreOriginal of ['foto.TIFF', 'banda.tif', 'foto.DNG']) expect(requiereMiniatura({ nombreOriginal, mime: 'application/octet-stream' } as ArchivoVuelo)).toBe(true)
    expect(requiereMiniatura({ nombreOriginal: 'foto', mime: 'image/tiff' } as ArchivoVuelo)).toBe(true)
    expect(requiereMiniatura({ nombreOriginal: 'foto.JPG', mime: 'image/jpeg' } as ArchivoVuelo)).toBe(false)
  })
})
describe('mapeo RTK según el contrato', () => {
  const gps = (rtkFlag: number | null, rtkFijo: boolean | null = false): ArchivoVuelo['gps'] => ({ estado: 'rtk', rtkFlag, rtkFijo, desviacion: null })
  it('solo el indicador 50 significa fijo', () => {
    expect(etiquetaRtk(gps(50))).toBe('RTK fijo')
    for (const flag of [0, 16, 34, 49, 51]) expect(etiquetaRtk(gps(flag, true))).toBe('RTK flotante')
  })
  it('sin indicador no deduce RTK fijo del estado GPS', () => {
    expect(etiquetaRtk(null)).toBe('RTK sin dato')
    expect(etiquetaRtk(gps(null, true))).toBe('RTK sin dato')
    expect(etiquetaRtk(gps(NaN))).toBe('RTK sin dato')
  })
})
