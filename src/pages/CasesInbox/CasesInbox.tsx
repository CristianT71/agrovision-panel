import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ESTADOS_SOLICITUD,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  puedeAsignarse,
  solicitudesService,
  versionModeloCorta,
  type EstadoSolicitud,
  type Solicitud,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { haceCuanto } from '../../utils/fechas'
import AssignModal from './AssignModal'
import CaseChatDrawer from './CaseChatDrawer'
import { iniciales } from './iniciales'

type Filtro = 'Todas' | EstadoSolicitud

const FILTROS: Filtro[] = ['Todas', ...ESTADOS_SOLICITUD]

const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function CasesInbox() {
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [asignando, setAsignando] = useState<Solicitud | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // RF-08.1 — repositorio maestro de contingencias
  const consulta = useQuery({
    queryKey: clavesSolicitudes.lista(),
    queryFn: () => solicitudesService.listar(),
  })

  // RF-08.4 — agrónomos activos con su carga de trabajo
  const agronomos = useQuery({
    queryKey: clavesAgronomos.lista({ estado: 'activo' }),
    queryFn: () => agronomosService.listar({ estado: 'activo' }),
  })

  const solicitudes = useMemo(() => consulta.data ?? [], [consulta.data])

  const nombres = useMemo(
    () => new Map((agronomos.data ?? []).map((a) => [a.id, a.nombre])),
    [agronomos.data],
  )

  const casoEnChat = solicitudes.find((s) => s.id === chatId) ?? null

  const conteos = useMemo(() => {
    const c: Record<string, number> = { Todas: solicitudes.length }
    for (const estado of ESTADOS_SOLICITUD) {
      c[estado] = solicitudes.filter((s) => s.estado === estado).length
    }
    return c
  }, [solicitudes])

  // RF-08.2 — casos en estado de orfandad
  const sinAsignar = solicitudes.filter((s) => !s.agronomoId && puedeAsignarse(s.estado)).length

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return solicitudes.filter((s) => {
      if (filtro !== 'Todas' && s.estado !== filtro) return false
      if (!q) return true
      return [s.finca, s.vereda, s.municipio, codigoSolicitud(s.id), s.id].some((t) =>
        normalizar(t).includes(q),
      )
    })
  }, [solicitudes, filtro, busqueda])

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de casos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Solicitudes enviadas desde la app por productores
          </p>
        </div>

        {/* RF-08.2 — déficit de recursos humanos */}
        {sinAsignar > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {sinAsignar} sin asignar
          </span>
        )}
      </div>

      {aviso && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>{aviso}</p>
          <button type="button" onClick={() => setAviso(null)} className="shrink-0 text-amber-500 hover:text-amber-700">
            ×
          </button>
        </div>
      )}

      {/* Búsqueda */}
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
          placeholder="Buscar por finca, vereda, municipio o ID..."
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* RF-08.1 — filtro por ciclo de vida */}
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

      {/* Listado */}
      <div className="mt-5 space-y-3">
        {consulta.isPending ? (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            Cargando casos...
          </p>
        ) : consulta.isError ? (
          <div className="rounded-xl bg-red-50 px-5 py-10 text-center text-sm text-red-600">
            <p>{mensajeDeError(consulta.error, 'No se pudieron cargar los casos.')}</p>
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
            <p className="text-sm font-medium text-gray-600">Aún no hay casos</p>
            <p className="mt-1 text-sm text-gray-400">
              Aparecerán cuando los productores envíen solicitudes desde la app
            </p>
          </div>
        ) : visibles.length === 0 ? (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            No hay casos que coincidan con el filtro.
          </p>
        ) : (
          visibles.map((s) => {
            const nombreAgronomo = s.agronomoId ? (nombres.get(s.agronomoId) ?? null) : null
            return (
              <article key={s.id} className="flex items-center gap-4 rounded-xl bg-white p-4">
                {/* La API aún no expone las fotos: marcador en su lugar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
                    <path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 19l8-8" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{codigoSolicitud(s.id)}</span>
                    <StatusBadge estado={s.estado} />
                    {s.plagaIdentificada && <PlagaBadge plaga={s.plagaIdentificada} />}
                  </div>

                  <p className="mt-1 font-semibold text-gray-900">{s.finca}</p>

                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {s.vereda} · {s.municipio}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                        <rect x="7" y="7" width="10" height="10" rx="2" />
                        <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
                      </svg>
                      {versionModeloCorta(s.modeloVersionId)}
                    </span>
                    <span className="text-gray-400">{haceCuanto(s.fecha)}</span>
                  </p>

                  {/* Agrónomo vinculado */}
                  {s.agronomoId && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-green text-[10px] font-semibold text-white">
                        {nombreAgronomo ? iniciales(nombreAgronomo) : 'AG'}
                      </span>
                      Asignado a{' '}
                      <strong className="font-semibold text-gray-800">
                        {nombreAgronomo ?? 'agrónomo no activo'}
                      </strong>
                    </p>
                  )}

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

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-2">
                  {/* RF-08.6 — canal de coordinación */}
                  <button
                    type="button"
                    title="Abrir comunicación"
                    onClick={() => setChatId(s.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-agro-green hover:text-agro-green"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {puedeAsignarse(s.estado) && (
                    <button
                      type="button"
                      onClick={() => setAsignando(s)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        s.agronomoId
                          ? 'border border-gray-200 text-gray-700 hover:border-agro-green hover:text-agro-green'
                          : 'bg-agro-green text-white hover:bg-[#194b32]'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <circle cx="9" cy="8" r="3.2" />
                        <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
                        <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {s.agronomoId ? 'Reasignar' : 'Asignar'}
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      {asignando && (
        <AssignModal
          solicitud={asignando}
          onClose={() => setAsignando(null)}
          onAsignada={(texto) => {
            setAsignando(null)
            setAviso(texto)
          }}
        />
      )}

      {casoEnChat && (
        <CaseChatDrawer
          solicitud={casoEnChat}
          nombreAgronomo={casoEnChat.agronomoId ? (nombres.get(casoEnChat.agronomoId) ?? null) : null}
          onClose={() => setChatId(null)}
        />
      )}
    </div>
  )
}
