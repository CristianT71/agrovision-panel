import { describe, expect, it } from 'vitest'
import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { opcionesGuardado } from './useAjustes'

type Ajustes = { minutosInactividad: number; mantenimiento: boolean }
const clave = ['ajustes', 'sistema'] as const
const inicial: Ajustes = { minutosInactividad: 30, mantenimiento: false }

function diferida<T>() {
  let resolver!: (valor: T) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<T>((resolve, reject) => { resolver = resolve; rechazar = reject })
  return { promesa, resolver, rechazar }
}
const avanzar = () => new Promise((resolve) => setTimeout(resolve, 0))

function preparar() {
  const queryClient = new QueryClient()
  queryClient.setQueryData(clave, inicial)
  const servidor = { ...inicial }
  const llamadas: ReturnType<typeof diferida<void>>[] = []
  const guardar = async (cambios: Partial<Ajustes>) => {
    const llamada = diferida<void>()
    llamadas.push(llamada)
    await llamada.promesa
    Object.assign(servidor, cambios)
    return { ...servidor }
  }
  const mutar = (cambios: Partial<Ajustes>) =>
    new MutationObserver(queryClient, opcionesGuardado<Ajustes>(queryClient, { clave, guardar })).mutate(cambios).catch(() => {})
  return { queryClient, llamadas, mutar, datos: () => queryClient.getQueryData<Ajustes>(clave) }
}

describe('guardado de ajustes', () => {
  it('envía los cambios de una misma pantalla de uno en uno', async () => {
    const { llamadas, mutar } = preparar()
    void mutar({ mantenimiento: true }); void mutar({ minutosInactividad: 15 })
    await avanzar()
    expect(llamadas).toHaveLength(1)
  })
  it('el rechazo de un cambio no revierte otro que sí se guardó', async () => {
    const { llamadas, mutar, datos } = preparar()
    const primero = mutar({ mantenimiento: true }); const segundo = mutar({ minutosInactividad: 15 })
    await avanzar()
    llamadas[0].rechazar(new Error('rechazado')); await primero
    expect(datos()).toEqual({ minutosInactividad: 15, mantenimiento: false })
    await avanzar()
    llamadas[1].resolver(); await segundo
    expect(datos()).toEqual({ minutosInactividad: 15, mantenimiento: false })
  })
  it('una respuesta anterior no pisa un cambio posterior', async () => {
    const { llamadas, mutar, datos } = preparar()
    const primero = mutar({ minutosInactividad: 15 }); const segundo = mutar({ minutosInactividad: 60 })
    await avanzar()
    llamadas[0].resolver(); await primero; await avanzar()
    llamadas[1].resolver(); await segundo
    expect(datos()?.minutosInactividad).toBe(60)
  })
})
