import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_ACTIVIDAD, iniciarActividadSiFalta, registrarActividad, sesionInactiva } from './actividad'
import { guardarSesion } from './session'

let almacen: Map<string, string>
beforeEach(() => {
  almacen = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => almacen.get(k) ?? null,
    setItem: (k: string, v: string) => { almacen.set(k, v) },
    removeItem: (k: string) => { almacen.delete(k) },
  })
  vi.useFakeTimers({ now: new Date('2026-01-01T08:00:00Z') })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('actividad para el cierre por inactividad', () => {
  it('abrir el panel con un registro viejo no lo renueva y la sesión queda vencida', () => {
    registrarActividad()
    vi.advanceTimersByTime(31 * 60_000)
    iniciarActividadSiFalta()
    expect(sesionInactiva(30)).toBe(true)
    expect(sesionInactiva(60)).toBe(false)
  })
  it('sin registro previo empieza a contar desde ahora', () => {
    iniciarActividadSiFalta()
    expect(almacen.get(CLAVE_ACTIVIDAD)).toBe(String(Date.now()))
    vi.advanceTimersByTime(29 * 60_000)
    expect(sesionInactiva(30)).toBe(false)
  })
  it('iniciar sesión cuenta como actividad: un registro de la sesión anterior no cierra la nueva', () => {
    registrarActividad()
    vi.advanceTimersByTime(45 * 60_000)
    guardarSesion({ rol: 'profesional', nombre: 'Ana', telefono: '1' }, 'token')
    expect(sesionInactiva(30)).toBe(false)
  })
})
