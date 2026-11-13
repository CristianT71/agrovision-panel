import { useQuery } from '@tanstack/react-query'
import { clavesVuelos, vuelosService } from '../../api/vuelos/vuelos.service'
import axios from 'axios'
import { tiempoParaRenovar } from './enlaces'

export function useEnlaceArchivo(vueloId: string, archivoId: string, visible = true) {
  return useQuery({
    queryKey: clavesVuelos.enlace(vueloId, archivoId),
    queryFn: ({ signal }) => vuelosService.pedirEnlace(vueloId, archivoId, signal),
    enabled: visible,
    gcTime: 0,
    staleTime: consulta => tiempoParaRenovar(consulta.state.data?.expiraEn, consulta.state.dataUpdatedAt),
    refetchInterval: consulta => {
      const estado = axios.isAxiosError(consulta.state.error) ? consulta.state.error.response?.status : undefined
      if (!visible || !consulta.state.data || (estado && estado >= 400 && estado < 500)) return false
      return Math.max(10_000, tiempoParaRenovar(consulta.state.data.expiraEn))
    },
    refetchOnWindowFocus: true,
  })
}
