import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ESTADOS_SOLICITUD,
  LIMITE_SOLICITUDES,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  puedeAsignarse,
  solicitudesService,
  versionModeloCorta,
  type EstadoSolicitud,
  type FiltrosSolicitudes,
  type Solicitud,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { haceCuanto } from '../../utils/fechas'
import { useValorRetrasado } from '../../utils/useValorRetrasado'
import { usePaginaDeFiltros } from '../../utils/usePaginaDeFiltros'
import Paginacion from '../../components/Paginacion/Paginacion'
import AssignModal from './AssignModal'
import CaseChatDrawer from './CaseChatDrawer'
import ResolucionModal from './ResolucionModal'
import { iniciales } from './iniciales'
import MiniaturaSolicitud from '../../components/FotoSolicitud/MiniaturaSolicitud'

type Filtro = 'Todas' | EstadoSolicitud

const FILTROS: Filtro[] = ['Todas', ...ESTADOS_SOLICITUD]

export default function CasesInbox() {
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [asignando, setAsignando] = useState<Solicitud | null>(null)
  // RF-08.2 — filtro de las "Enviada" sin agrónomo, activado desde la insignia
  const [soloSinAsignar, setSoloSinAsignar] = useState(false)
  // Se guarda el caso abierto para que el chat siga visible aunque cambie la página
  const [chat, setChat] = useState<Solicitud | null>(null)
  const [verResolucion, setVerResolucion] = useState<Solicitud | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // RF-03.5 — la búsqueda la hace la API (incluye el nombre del productor)
  const busquedaAplicada = useValorRetrasado(busqueda.trim())
  const [pagina, setPagina] = usePaginaDeFiltros(`${filtro}|${soloSinAsignar}|${busquedaAplicada}`)

  // RF-08.1, RNF-03.1 — repositorio maestro paginado y filtrado en el servidor
  const filtros: FiltrosSolicitudes = {
    estado: filtro === 'Todas' ? undefined : filtro,
    sinAsignar: soloSinAsignar || undefined,
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

  // RF-08.1, RF-08.2 — conteos por estado y casos huérfanos calculados por la API
  const contadores = useQuery({
    queryKey: clavesSolicitudes.contadores,
    queryFn: () => solicitudesService.contadores(),
    refetchInterval: 30_000,
  })

  // RF-08.4 — agrónomos activos con su carga de trabajo
  const agronomos = useQuery({
    queryKey: clavesAgronomos.lista({ estado: 'activo' }),
    queryFn: () => agronomosService.listar({ estado: 'activo' }),
  })

  const nombres = useMemo(
    () => new Map((agronomos.data ?? []).map((a) => [a.id, a.nombre])),
    [agronomos.data],
  )

  const visibles = useMemo(() => consulta.data?.datos ?? [], [consulta.data])

  // La versión más reciente del caso abierto si está en la página; si no, la que se abrió
  const casoEnChat = chat ? (visibles.find((s) => s.id === chat.id) ?? chat) : null

  const conteo = (f: Filtro): number | undefined =>
    f === 'Todas' ? contadores.data?.total : contadores.data?.porEstado[f]
  const sinAsignar = contadores.data?.sinAsignar ?? 0
  const sinCasos = contadores.data?.total === 0 && consulta.data?.total === 0

  // Cada pestaña de estado reemplaza el filtro de "sin asignar" (son solo "Enviada")
  const elegirFiltro = (f: Filtro) => {
    setFiltro(f)
    setSoloSinAsignar(false)
  }

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

        {/* RF-08.2 — déficit de recursos humanos; al hacer clic filtra esos casos */}
        {sinAsignar > 0 && (
          <button
            type="button"
            title="Ver solo los casos sin asignar"
            onClick={() => {
              setFiltro('Todas')
              setSoloSinAsignar(true)
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 ${
              soloSinAsignar ? 'ring-1 ring-red-300' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {sinAsignar} sin asignar
          </button>
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
          placeholder="Buscar por productor, finca, vereda, municipio o código..."
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* RF-08.1 — filtro por ciclo de vida */}
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-[#eef4f0] p-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => elegirFiltro(f)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
              filtro === f && !soloSinAsignar
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
            <span className="rounded-md bg-gray-100 px-1.5 text-xs text-gray-600">
              {conteo(f) ?? '…'}
            </span>
          </button>
        ))}
      </div>

      {soloSinAsignar && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">
            Sin asignar
            <button
              type="button"
              title="Quitar filtro"
              onClick={() => setSoloSinAsignar(false)}
              className="text-red-400 hover:text-red-700"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Listado en tabla */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-5 py-4 font-medium">Caso</th>
                <th className="px-5 py-4 font-medium">Productor / Finca</th>
                <th className="px-5 py-4 font-medium">Ubicación</th>
                <th className="px-5 py-4 font-medium">Modelo IA</th>
                <th className="px-5 py-4 font-medium">Agrónomo</th>
                <th className="px-5 py-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {consulta.isPending ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    Cargando casos...
                  </td>
                </tr>
              ) : consulta.isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-red-600">
                    <p>{mensajeDeError(consulta.error, 'No se pudieron cargar los casos.')}</p>
                    <button
                      type="button"
                      onClick={() => consulta.refetch()}
                      className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : sinCasos ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-gray-600">Aún no hay casos</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Aparecerán cuando los productores envíen solicitudes desde la app
                    </p>
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                    No hay casos que coincidan con el filtro.
                  </td>
                </tr>
              ) : (
                visibles.map((s) => {
                  const nombreAgronomo = s.agronomoId ? (nombres.get(s.agronomoId) ?? null) : null
                  const confianza = porcentajeConfianza(s.confianzaIa)
                  return (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]">
                      {/* Caso: evidencia (RF-03.6), código, estado y plaga */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <MiniaturaSolicitud solicitudId={s.id} />
                          <div className="min-w-0 space-y-1">
                            <p className="font-mono text-xs text-gray-400">{codigoSolicitud(s.id)}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <StatusBadge estado={s.estado} />
                              {s.plagaIdentificada && <PlagaBadge plaga={s.plagaIdentificada} />}
                            </div>
                            <p className="text-xs text-gray-400">{haceCuanto(s.fecha)}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{s.productorNombre ?? 'Productor sin perfil'}</p>
                        <p className="text-xs text-gray-500">{s.finca}</p>
                      </td>

                      {/* Dónde se tomó la captura: con GPS, al hacer clic abre el mapa de casos en ese punto */}
                      <td className="px-5 py-4 text-gray-600">
                        {s.tieneUbicacion ? (
                          <Link
                            to={`/mapa?caso=${s.id}`}
                            title="Ver este caso en el mapa"
                            className="group -mx-2 -my-1 block rounded-lg px-2 py-1 transition hover:bg-[#e8f7ee]"
                          >
                            <p>{s.vereda}</p>
                            <p className="text-xs text-gray-400">{s.municipio}</p>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-agro-green group-hover:underline">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
                                <circle cx="12" cy="10" r="2.5" />
                              </svg>
                              Ver en el mapa
                            </span>
                          </Link>
                        ) : (
                          <>
                            <p>{s.vereda}</p>
                            <p className="text-xs text-gray-400">{s.municipio}</p>
                            <span className="mt-1 block text-xs text-gray-300">Sin GPS</span>
                          </>
                        )}
                      </td>

                      {/* Modelo de IA que analizó y su confianza */}
                      <td className="px-5 py-4">
                        <p className="inline-flex items-center gap-1.5 text-gray-700">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5 text-gray-400">
                            <rect x="7" y="7" width="10" height="10" rx="2" />
                            <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
                          </svg>
                          {versionModeloCorta(s.modeloVersionId)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-agro-green" style={{ width: `${confianza ?? 0}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {confianza === null ? 'Sin dato' : `${confianza}%`}
                          </span>
                        </div>
                      </td>

                      {/* Agrónomo vinculado */}
                      <td className="px-5 py-4">
                        {s.agronomoId ? (
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-green text-[10px] font-semibold text-white">
                              {nombreAgronomo ? iniciales(nombreAgronomo) : 'AG'}
                            </span>
                            <span className="font-medium text-gray-800">{nombreAgronomo ?? 'Agrónomo no activo'}</span>
                          </div>
                        ) : (
                          <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                            Sin asignar
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* RF-08.6 — canal de coordinación */}
                          <button
                            type="button"
                            title="Abrir comunicación"
                            onClick={() => setChat(s)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-agro-green hover:text-agro-green"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                              <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
                            </svg>
                          </button>

                          {(s.estado === 'Resuelta' || s.estado === 'Descartada') && (
                            <button
                              type="button"
                              onClick={() => setVerResolucion(s)}
                              className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-agro-green hover:text-agro-green"
                            >
                              {s.estado === 'Resuelta' ? 'Ver resolución' : 'Ver descarte'}
                            </button>
                          )}

                          {puedeAsignarse(s.estado) && (
                            <button
                              type="button"
                              onClick={() => setAsignando(s)}
                              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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

      {verResolucion && (
        <ResolucionModal
          solicitud={verResolucion}
          nombreAgronomo={verResolucion.agronomoId ? (nombres.get(verResolucion.agronomoId) ?? null) : null}
          onClose={() => setVerResolucion(null)}
        />
      )}

      {casoEnChat && (
        <CaseChatDrawer
          solicitud={casoEnChat}
          nombreAgronomo={casoEnChat.agronomoId ? (nombres.get(casoEnChat.agronomoId) ?? null) : null}
          onClose={() => setChat(null)}
        />
      )}
    </div>
  )
}
