import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { clavesSolicitudes, codigoSolicitud, solicitudesService } from '../../api/solicitudes/solicitudes.service'
import { mensajeDeError } from '../../api/axios'
import { PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import MiniaturaSolicitud from '../../components/FotoSolicitud/MiniaturaSolicitud'

// RF-04.3 — expedientes ya resueltos con mayor similitud con el caso que se revisa
export default function CasosSimilares({ solicitudId }: { solicitudId: string }) {
  const navigate = useNavigate()
  const similares = useQuery({
    queryKey: clavesSolicitudes.similares(solicitudId),
    queryFn: () => solicitudesService.similares(solicitudId),
  })

  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">Casos similares</h2>
      {/* La API compara el contexto del caso; cuando reciba los embeddings del modelo comparará imágenes */}
      <p className="mt-0.5 text-xs text-gray-400">
        Casos resueltos parecidos por órgano afectado, cultivo, cercanía y fecha
      </p>

      {similares.isPending ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : similares.isError ? (
        <p className="mt-4 text-sm text-red-600">
          {mensajeDeError(similares.error, 'No se pudieron cargar los casos similares.')}
        </p>
      ) : similares.data.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">Aún no hay casos resueltos con los que comparar.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {similares.data.map((caso) => (
            <button
              key={caso.id}
              type="button"
              onClick={() => navigate(`/solicitudes/${caso.id}`)}
              className="flex gap-3 rounded-xl border border-gray-100 p-3 text-left transition hover:border-agro-green"
            >
              <MiniaturaSolicitud solicitudId={caso.id} />
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-gray-400">{codigoSolicitud(caso.id)}</p>
                {caso.plagaIdentificada && (
                  <div className="mt-1">
                    <PlagaBadge plaga={caso.plagaIdentificada} />
                  </div>
                )}
                <p className="mt-1 truncate text-xs text-gray-500">{caso.municipio}</p>
                <p className="text-xs font-semibold text-agro-green">Similitud {caso.similitud}%</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
