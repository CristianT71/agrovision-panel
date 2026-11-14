import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  clavesReglasZona,
  reglasZonaService,
  type CambiosRegla,
  type DatosAprobacion,
  type DatosSimulacion,
  type FiltrosReglas,
  type NuevaRegla,
  type ReglaZona,
} from '../../api/reglas-zona/reglas-zona.service'

export const useReglas = (filtros: FiltrosReglas) =>
  useQuery({
    queryKey: clavesReglasZona.lista(filtros),
    queryFn: ({ signal }) => reglasZonaService.listar(filtros, signal),
  })

// La activa del tipo se consulta aparte (y de nuevo al montar): la lista puede estar filtrada sin incluirla
export const useReglaActiva = (tipo: string) =>
  useQuery({
    queryKey: clavesReglasZona.lista({ tipo, estado: 'activa' }),
    queryFn: ({ signal }) => reglasZonaService.listar({ tipo, estado: 'activa' }, signal),
    refetchOnMount: 'always',
    select: (reglas) => reglas.find((r) => r.tipoEnfermedad === tipo && r.estado === 'activa') ?? null,
  })

// Cualquier cambio de estado puede tocar otras versiones (activar archiva la activa anterior): se recarga todo
function useMutacionRegla<V>(mutationFn: (variables: V) => Promise<ReglaZona | undefined>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: clavesReglasZona.todas }),
  })
}

export const useCrearRegla = () => useMutacionRegla((datos: NuevaRegla) => reglasZonaService.crear(datos))
export const useEditarRegla = (id: string) =>
  useMutacionRegla((cambios: CambiosRegla) => reglasZonaService.editar(id, cambios))
export const useEliminarRegla = (id: string) => useMutacionRegla(() => reglasZonaService.eliminar(id))
export const useDuplicarRegla = (id: string) => useMutacionRegla(() => reglasZonaService.duplicar(id))
export const useAprobarRegla = (id: string) =>
  useMutacionRegla((datos: DatosAprobacion) => reglasZonaService.aprobar(id, datos))
export const useActivarRegla = (id: string) => useMutacionRegla(() => reglasZonaService.activar(id))
export const useArchivarRegla = (id: string) => useMutacionRegla(() => reglasZonaService.archivar(id))

// Simular no cambia la regla: no invalida la lista
export const useSimularRegla = (id: string) =>
  useMutation({ mutationFn: (datos: DatosSimulacion) => reglasZonaService.simular(id, datos) })
