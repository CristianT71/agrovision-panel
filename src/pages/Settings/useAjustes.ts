import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { mensajeDeError } from '../../api/axios'
import { generacionSesion } from '../../api/auth/session'
import {
  ajustesService,
  clavesAjustes,
  type AjustesPersonales,
  type AjustesSistema,
} from '../../api/ajustes/ajustes.service'

type Fuente<T> = {
  clave: readonly string[]
  obtener: () => Promise<T>
  guardar: (cambios: Partial<T>) => Promise<T>
}

// Cola de cambios pendientes por fuente: el valor visible es siempre lo último confirmado por el servidor
// más los cambios que siguen en vuelo. Así un rechazo no restaura un valor optimista de otro cambio fallido.
type Cola<T> = { confirmado: T | undefined; pendientes: Set<Partial<T>>; huboError: boolean }
const colas = new WeakMap<QueryClient, Map<string, Cola<object>>>()

// Cada cambio se guarda al instante: se refleja de inmediato y, si el servidor lo rechaza, vuelve al valor anterior.
// Los cambios de una misma fuente se envían en fila (scope): una respuesta vieja no pisa a una posterior,
// y un rechazo solo revierte sus propios campos, no los que otro cambio ya guardó.
// Las respuestas que llegan después de cerrar sesión se ignoran: no repueblan la caché del siguiente usuario.
export function opcionesGuardado<T extends object>(queryClient: QueryClient, { clave, guardar }: Pick<Fuente<T>, 'clave' | 'guardar'>) {
  type Contexto = { generacion: number; cola: Cola<T> }
  const id = clave.join('.')
  const vigente = (contexto?: Contexto) => !!contexto && contexto.generacion === generacionSesion()
  const reconciliar = (cola: Cola<T>) => {
    if (!cola.confirmado) return
    const visible = [...cola.pendientes].reduce<T>((acc, cambios) => ({ ...acc, ...cambios }), cola.confirmado)
    queryClient.setQueryData<T>(clave, visible)
  }

  return {
    mutationFn: guardar,
    scope: { id },
    onMutate: async (cambios: Partial<T>): Promise<Contexto> => {
      await queryClient.cancelQueries({ queryKey: clave })
      const generacion = generacionSesion()
      const llave = `${generacion}:${id}`
      if (!colas.has(queryClient)) colas.set(queryClient, new Map())
      const mapa = colas.get(queryClient)!
      let cola = mapa.get(llave) as Cola<T> | undefined
      if (!cola) {
        cola = { confirmado: queryClient.getQueryData<T>(clave), pendientes: new Set(), huboError: false }
        mapa.set(llave, cola as Cola<object>)
      }
      cola.pendientes.add(cambios)
      queryClient.setQueryData<T>(clave, (actual) => (actual ? { ...actual, ...cambios } : actual))
      return { generacion, cola }
    },
    onError: (_error: unknown, cambios: Partial<T>, contexto?: Contexto) => {
      if (!contexto || !vigente(contexto)) return
      contexto.cola.pendientes.delete(cambios)
      contexto.cola.huboError = true
      reconciliar(contexto.cola)
    },
    onSuccess: (guardado: T, cambios: Partial<T>, contexto?: Contexto) => {
      if (!contexto || !vigente(contexto)) return
      contexto.cola.confirmado = guardado
      contexto.cola.pendientes.delete(cambios)
      reconciliar(contexto.cola)
    },
    // Al vaciarse la fila se descarta; si algo falló, se recarga lo que de verdad quedó en el servidor
    onSettled: (_datos: unknown, _error: unknown, _cambios: unknown, contexto?: Contexto) => {
      if (!contexto || contexto.cola.pendientes.size > 0) return
      const mapa = colas.get(queryClient)
      const llave = `${contexto.generacion}:${id}`
      if (mapa?.get(llave) === contexto.cola) mapa.delete(llave)
      if (vigente(contexto) && contexto.cola.huboError) void queryClient.invalidateQueries({ queryKey: clave })
    },
  }
}

function useAjustesRemotos<T extends object>({ clave, obtener, guardar }: Fuente<T>) {
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: clave, queryFn: obtener })

  const mutacion = useMutation(opcionesGuardado<T>(queryClient, { clave, guardar }))

  return {
    datos: consulta.data,
    cargando: consulta.isPending,
    errorCarga: consulta.isError ? mensajeDeError(consulta.error, 'No se pudieron cargar los ajustes.') : null,
    errorGuardado: mutacion.isError ? mensajeDeError(mutacion.error, 'No se pudo guardar el cambio.') : null,
    cambiar: <C extends keyof T>(campo: C, valor: T[C]) =>
      mutacion.mutate({ [campo]: valor } as unknown as Partial<T>),
    reintentar: () => void consulta.refetch(),
  }
}

// La API devuelve solo los ajustes del rol de quien consulta: cada pantalla indica cuáles espera
export const useAjustesPersonales = <T extends Partial<AjustesPersonales>>() =>
  useAjustesRemotos<T>({
    clave: clavesAjustes.mios,
    obtener: () => ajustesService.obtenerMios() as Promise<T>,
    guardar: (cambios) => ajustesService.guardarMios(cambios) as Promise<T>,
  })

export const useAjustesSistema = () =>
  useAjustesRemotos<AjustesSistema>({
    clave: clavesAjustes.sistema,
    obtener: ajustesService.obtenerSistema,
    guardar: ajustesService.guardarSistema,
  })
