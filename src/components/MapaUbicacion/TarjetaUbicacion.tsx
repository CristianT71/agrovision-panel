import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { mensajeDeError } from '../../api/axios'
import { clavesUbicacion, ubicacionService } from '../../api/ubicacion/ubicacion.service'
import { AccionesUbicacion, ResumenCoordenadas } from './AccionesUbicacion'

// Leaflet pesa: el mapa se descarga solo cuando hay una ubicación que dibujar
const MapaUbicacion = lazy(() => import('./MapaUbicacion'))

// "Ubicación de la captura" — la API decide quién la ve (administrador o agrónomo asignado);
// el panel no lo adivina: un 403/404 o un null se muestran como "Sin ubicación disponible".
export default function TarjetaUbicacion({
  solicitudId,
  tieneUbicacion,
}: {
  solicitudId: string
  // De la solicitud (GET /solicitudes/:id o la bandeja): sin ella no se pide /ubicacion
  tieneUbicacion: boolean
}) {
  const consulta = useQuery({
    queryKey: clavesUbicacion.detalle(solicitudId),
    queryFn: () => ubicacionService.obtenerUbicacion(solicitudId),
    enabled: Boolean(solicitudId) && tieneUbicacion,
  })

  const estado = axios.isAxiosError(consulta.error) ? consulta.error.response?.status : undefined
  const sinUbicacion = !tieneUbicacion || (consulta.isSuccess && !consulta.data) || estado === 403 || estado === 404
  const ubicacion = consulta.data

  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">Ubicación de la captura</h2>

      {tieneUbicacion && consulta.isPending ? (
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-gray-100" />
      ) : sinUbicacion || !ubicacion ? (
        consulta.isError && !sinUbicacion ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <p>{mensajeDeError(consulta.error, 'No se pudo cargar la ubicación.')}</p>
            <button
              type="button"
              onClick={() => consulta.refetch()}
              className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition hover:border-red-300"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-400">Sin ubicación disponible</p>
        )
      ) : (
        <div className="mt-4 space-y-3">
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-gray-100" />}>
            <MapaUbicacion puntos={[ubicacion]} className="h-48 w-full" />
          </Suspense>
          <div className="text-sm text-gray-700">
            <ResumenCoordenadas ubicacion={ubicacion} />
          </div>
          <AccionesUbicacion ubicacion={ubicacion} />
        </div>
      )}
    </section>
  )
}
