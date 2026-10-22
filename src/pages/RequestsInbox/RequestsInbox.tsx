import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  LIMITE_SOLICITUDES,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  solicitudesService,
  type EstadoSolicitud,
  type FiltrosSolicitudes,
} from '../../api/solicitudes/solicitudes.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import MiniaturaSolicitud from '../../components/FotoSolicitud/MiniaturaSolicitud'
import { haceCuanto } from '../../utils/fechas'
import { useValorRetrasado } from '../../utils/useValorRetrasado'
import { usePaginaDeFiltros } from '../../utils/usePaginaDeFiltros'
import Paginacion from '../../components/Paginacion/Paginacion'

// La API solo le entrega al agrónomo las solicitudes que el administrador le asignó,
// así que nunca llegan en "Pendiente" ni "Enviada"
type Filtro = 'Todas' | 'Por resolver' | 'Resueltas' | 'Descartadas'

const ESTADO_FILTRO: Record<Exclude<Filtro, 'Todas'>, EstadoSolicitud> = {
  'Por resolver': 'Asignada',
  Resueltas: 'Resuelta',
  Descartadas: 'Descartada',
}

const FILTROS: Filtro[] = ['Todas', 'Por resolver', 'Resueltas', 'Descartadas']

export default function RequestsInbox() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')

  // RF-03.5 — la búsqueda la hace la API (incluye el nombre del productor)
  const busquedaAplicada = useValorRetrasado(busqueda.trim())
  const [pagina, setPagina] = usePaginaDeFiltros(`${filtro}|${busquedaAplicada}`)

  // RF-03.2, RNF-03.1 — filtro, búsqueda y paginación en el servidor
  const filtros: FiltrosSolicitudes = {
    estado: filtro === 'Todas' ? undefined : ESTADO_FILTRO[filtro],
    busqueda: busquedaAplicada || undefined,
    pagina,
    limite: LIMITE_SOLICITUDES,
  }

  const consulta = useQuery({
    queryKey: clavesSolicitudes.lista(filtros),
    queryFn: () => solicitudesService.listar(filtros),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

  // RF-03.4 — conteos de cada pestaña calculados por la API
  const contadores = useQuery({
    queryKey: clavesSolicitudes.contadores,
    queryFn: () => solicitudesService.contadores(),
    refetchInterval: 30_000,
  })

  const porEstado = contadores.data?.porEstado
  const conteos: Record<Filtro, number | undefined> = {
    Todas: contadores.data?.total,
    'Por resolver': porEstado?.Asignada,
    Resueltas: porEstado?.Resuelta,
    Descartadas: porEstado?.Descartada,
  }

  const visibles = consulta.data?.datos ?? []
  const sinAsignadas = contadores.data?.total === 0 && consulta.data?.total === 0

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de revisión</h1>
          <p className="mt-1 text-sm text-gray-500">
            Diagnósticos enviados por productores que requieren validación
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          {conteos['Por resolver'] ?? '…'} por resolver
        </span>
      </div>

      {/* Búsqueda — RF-03.5 */}
      <div className="relative mt-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por productor, finca, municipio o código..."
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* Filtros — RF-03.2 */}
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-[#eef4f0] p-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
              filtro === f
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
            <span className="rounded-md bg-gray-100 px-1.5 text-xs text-gray-600">
              {conteos[f] ?? '…'}
            </span>
          </button>
        ))}
      </div>

      {/* Listado — RF-03.6 */}
      <div className="mt-5 space-y-3">
        {consulta.isPending ? (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            Cargando solicitudes...
          </p>
        ) : consulta.isError ? (
          <div className="rounded-xl bg-red-50 px-5 py-10 text-center text-sm text-red-600">
            <p>{mensajeDeError(consulta.error, 'No se pudieron cargar las solicitudes.')}</p>
            <button
              type="button"
              onClick={() => consulta.refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
            >
              Reintentar
            </button>
          </div>
        ) : sinAsignadas ? (
          <div className="rounded-xl bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">No tienes solicitudes asignadas.</p>
            <p className="mt-1 text-sm text-gray-400">
              Aparecerán aquí cuando el administrador te asigne una.
            </p>
          </div>
        ) : visibles.length === 0 ? (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            No hay solicitudes que coincidan con el filtro.
          </p>
        ) : (
          visibles.map((s) => (
            <article
              key={s.id}
              className="group flex items-center gap-4 rounded-xl bg-white p-4 transition hover:shadow-sm"
            >
              {/* RF-03.6 — imagen de evidencia */}
              <MiniaturaSolicitud solicitudId={s.id} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{codigoSolicitud(s.id)}</span>
                  <StatusBadge estado={s.estado} />
                  {s.plagaIdentificada && <PlagaBadge plaga={s.plagaIdentificada} />}
                </div>

                <p className="mt-1 font-semibold text-gray-900">{s.productorNombre ?? 'Productor sin perfil'}</p>
                <p className="text-sm text-gray-500">
                  {s.finca} · {s.vereda} · {s.municipio}
                </p>

                {/* Puntaje de inferencia IA */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Confianza IA</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-agro-green"
                      style={{ width: `${porcentajeConfianza(s.confianzaIa)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {porcentajeConfianza(s.confianzaIa)}%
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-gray-400">{haceCuanto(s.fecha)}</span>
                <button
                  type="button"
                  onClick={() => navigate(`/solicitudes/${s.id}`)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:border-agro-green hover:text-agro-green"
                >
                  Ver detalle
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {consulta.data && consulta.data.total > 0 && (
        <Paginacion
          total={consulta.data.total}
          pagina={pagina}
          limite={LIMITE_SOLICITUDES}
          cargando={consulta.isPlaceholderData}
          onCambiar={setPagina}
        />
      )}
    </div>
  )
}
