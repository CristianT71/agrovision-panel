import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { mensajeDeError } from '../../api/axios'
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

// Cada cambio se guarda al instante: se refleja de inmediato y, si el servidor lo rechaza, vuelve al valor anterior.
// Los cambios de una misma fuente se envían en fila (scope): una respuesta vieja no pisa a una posterior,
// y un rechazo solo revierte sus propios campos, no los que otro cambio ya guardó.
export function opcionesGuardado<T extends object>(queryClient: QueryClient, { clave, guardar }: Pick<Fuente<T>, 'clave' | 'guardar'>) {
  return {
    mutationFn: guardar,
    scope: { id: clave.join('.') },
    onMutate: async (cambios: Partial<T>) => {
      await queryClient.cancelQueries({ queryKey: clave })
      const anterior = queryClient.getQueryData<T>(clave)
      queryClient.setQueryData<T>(clave, (actual) => (actual ? { ...actual, ...cambios } : actual))
      return { anterior }
    },
    onError: (_error: unknown, cambios: Partial<T>, contexto?: { anterior?: T }) => {
      const anterior = contexto?.anterior
      if (!anterior) return
      const revertidos = Object.fromEntries(Object.keys(cambios).map((campo) => [campo, anterior[campo as keyof T]]))
      queryClient.setQueryData<T>(clave, (actual) => (actual ? { ...actual, ...revertidos } : actual))
    },
    onSuccess: (guardado: T) => queryClient.setQueryData(clave, guardado),
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
