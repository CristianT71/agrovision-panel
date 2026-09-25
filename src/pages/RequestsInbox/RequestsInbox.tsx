import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ESTADOS_SOLICITUD,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  solicitudesService,
  type EstadoSolicitud,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { haceCuanto } from '../../utils/fechas'

type Filtro = 'Todas' | 'Mis asignadas' | EstadoSolicitud

const FILTROS: Filtro[] = ['Todas', 'Mis asignadas', ...ESTADOS_SOLICITUD]

export default function RequestsInbox() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')

  const consulta = useQuery({
    queryKey: clavesSolicitudes.lista(),
    queryFn: () => solicitudesService.listar(),
  })

  // "Mis asignadas" compara con el id de la ficha del agrónomo, no con el del usuario
  const perfil = useQuery({
    queryKey: clavesAgronomos.miPerfil,
    queryFn: () => agronomosService.miPerfil(),
  })
  const miId = perfil.data?.id

  const solicitudes = useMemo(() => consulta.data ?? [], [consulta.data])

  // RF-03.4 — conteos calculados sobre lo que devolvió la API
  const conteos = useMemo(() => {
    const c: Record<string, number> = { Todas: solicitudes.length }
    c['Mis asignadas'] = miId ? solicitudes.filter((s) => s.agronomoId === miId).length : 0
    for (const estado of ESTADOS_SOLICITUD) {
      c[estado] = solicitudes.filter((s) => s.estado === estado).length
    }
    return c
  }, [solicitudes, miId])

  // RF-03.2, RF-03.3, RF-03.5 — filtros y búsqueda
  const visibles = useMemo(() => {
    let lista = solicitudes

    if (filtro === 'Mis asignadas') lista = lista.filter((s) => miId && s.agronomoId === miId)
    else if (filtro !== 'Todas') lista = lista.filter((s) => s.estado === filtro)

    const q = busqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter((s) =>
        [s.finca, s.vereda, s.municipio, codigoSolicitud(s.id), s.id].some((t) =>
          t.toLowerCase().includes(q),
        ),
      )
    }
    return lista
  }, [solicitudes, filtro, busqueda, miId])

  const pendientes = conteos['Pendiente'] ?? 0
  const asignadas = conteos['Asignada'] ?? 0

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
        <div className="flex shrink-0 gap-2">
          <span className="rounded-lg bg-[#eaf4ee] px-3 py-1.5 text-xs font-medium text-agro-green">
            {pendientes} pendientes
          </span>
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            {asignadas} asignadas
          </span>
        </div>
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
          placeholder="Buscar por finca, municipio o ID..."
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
              {conteos[f] ?? 0}
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
        ) : solicitudes.length === 0 ? (
          <div className="rounded-xl bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-gray-600">Aún no hay solicitudes</p>
            <p className="mt-1 text-sm text-gray-400">
              Aparecerán cuando los productores las envíen desde la app
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
              {/* La API aún no expone las fotos: marcador en su lugar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                <IconoHoja className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">{codigoSolicitud(s.id)}</span>
                  <StatusBadge estado={s.estado} />
                  {s.plagaIdentificada && <PlagaBadge plaga={s.plagaIdentificada} />}
                </div>

                <p className="mt-1 font-semibold text-gray-900">{s.finca}</p>
                <p className="text-sm text-gray-500">
                  {s.vereda} · {s.municipio}
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
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 opacity-0 transition hover:border-agro-green hover:text-agro-green focus:opacity-100 group-hover:opacity-100"
                >
                  Ver detalle
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

function IconoHoja({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19l8-8" strokeLinecap="round" />
    </svg>
  )
}
