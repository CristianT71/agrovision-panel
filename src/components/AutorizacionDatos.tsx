import { useQuery } from '@tanstack/react-query'
import { clavesSolicitudes, solicitudesService } from '../api/solicitudes/solicitudes.service'
import { formatearFechaHora } from '../utils/fechas'

// Habeas data (Ley 1581): muestra si el productor autorizó el tratamiento de sus datos.
// Usa el detalle de la solicitud, que es donde la API incluye la autorización.
export default function AutorizacionDatos({ solicitudId }: { solicitudId: string }) {
  const consulta = useQuery({
    queryKey: clavesSolicitudes.detalle(solicitudId),
    queryFn: () => solicitudesService.obtener(solicitudId),
    enabled: Boolean(solicitudId),
  })

  const autorizacion = consulta.data?.autorizacionDatos

  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">Autorización de datos</h2>
      <div className="mt-3 text-sm">
        {consulta.isPending ? (
          <span className="text-gray-500">Consultando…</span>
        ) : consulta.isError ? (
          <span className="text-gray-500">No se pudo consultar la autorización.</span>
        ) : autorizacion ? (
          <>
            <span className="font-semibold text-agro-green">Autorizó el tratamiento de sus datos</span>
            <span className="block text-gray-500">
              Política v{autorizacion.version}
              {autorizacion.fecha ? ` · ${formatearFechaHora(autorizacion.fecha)}` : ''}
            </span>
          </>
        ) : (
          <span className="font-semibold text-amber-600">Sin autorización vigente (la revocó o no la dio)</span>
        )}
      </div>
    </section>
  )
}
