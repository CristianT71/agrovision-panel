import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_COMPUERTA,
  LIMITE_DETECCIONES,
  clavesDetecciones,
  deteccionesService,
  type Categoria,
  type Deteccion,
  type EstadoRevision,
} from '../../api/detecciones/detecciones.service'
import { clavesModelos, modelosService } from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'
import Paginacion from '../../components/Paginacion/Paginacion'
import { usePaginaDeFiltros } from '../../utils/usePaginaDeFiltros'
import { formatearFechaHora } from '../../utils/fechas'
import {
  FILTROS_VACIOS,
  aParametros,
  alternarCategoria,
  categoriasSeleccionadas,
  estadoDeCategoria,
  hayFiltros,
  rangoInvalido,
  sumarResumen,
  type FiltrosMonitor,
} from './filtros'
import { porcentajeConfianza, porcentajeDeTotal } from './formato'
import { BadgeCategoria, BadgeRevision } from './insignias'
import DeteccionDrawer from './DeteccionDrawer'

const OPCIONES_REVISION: { valor: EstadoRevision | undefined; texto: string }[] = [
  { valor: undefined, texto: 'Todas' },
  { valor: 'divergente', texto: 'Divergentes' },
  { valor: 'coincide', texto: 'Coinciden' },
  { valor: 'sin_revision', texto: 'Sin revisión' },
]

const CAMPO =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-agro-green focus:outline-none'

export default function DetectionsMonitor() {
  const [filtros, setFiltros] = useState<FiltrosMonitor>(FILTROS_VACIOS)
  // El municipio es igualdad exacta: se aplica al salir del campo o con Enter, no en cada tecla
  const [municipio, setMunicipio] = useState('')
  const [seleccionada, setSeleccionada] = useState<Deteccion | null>(null)

  const cambiar = (cambios: Partial<FiltrosMonitor>) => setFiltros((f) => ({ ...f, ...cambios }))
  const aplicarMunicipio = () => cambiar({ municipio: municipio.trim() || undefined })

  const invalido = rangoInvalido(filtros)
  const parametros = aParametros(filtros)
  const [pagina, setPagina] = usePaginaDeFiltros(JSON.stringify(parametros))

  // RF-07.1 — listado paginado en el servidor
  const parametrosLista = { ...parametros, pagina, limite: LIMITE_DETECCIONES }
  const lista = useQuery({
    queryKey: clavesDetecciones.lista(parametrosLista),
    queryFn: () => deteccionesService.listar(parametrosLista),
    enabled: !invalido,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

  // El resumen va sin incluir/excluir (ni paginación, que la API rechaza): así cada categoría
  // conserva su conteo y se puede reactivar. Las tarjetas suman solo las seleccionadas.
  const parametrosResumen = aParametros({ ...filtros, incluir: [], excluir: [] })
  const resumen = useQuery({
    queryKey: clavesDetecciones.resumen(parametrosResumen),
    queryFn: () => deteccionesService.resumen(parametrosResumen),
    enabled: !invalido,
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })

  const modelos = useQuery({
    queryKey: clavesModelos.lista,
    queryFn: () => modelosService.listar(),
  })

  const versiones = useMemo(
    () =>
      [...new Set((modelos.data ?? []).map((m) => m.version))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true }),
      ),
    [modelos.data],
  )

  const porCategoria = resumen.data?.porCategoria ?? []
  const conteoCategoria = (c: Categoria) => porCategoria.find((f) => f.categoria === c)?.total ?? 0
  const totales = resumen.data ? sumarResumen(porCategoria, categoriasSeleccionadas(CATEGORIAS, filtros)) : null

  const conFiltros = hayFiltros(filtros)

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS)
    setMunicipio('')
  }

  const valorTarjeta = (valor: (t: NonNullable<typeof totales>) => React.ReactNode) =>
    invalido ? '—' : totales ? valor(totales) : resumen.isError ? '—' : '…'

  return (
    <div>
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitor de detecciones</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cada diagnóstico que las apps hicieron en campo, con la predicción del modelo y la revisión humana
        </p>
      </div>

      {/* ---------- Tarjetas ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Tarjeta
          etiqueta="Detecciones"
          valor={valorTarjeta((t) => t.total.toLocaleString('es-CO'))}
          pie="Con los filtros aplicados"
          fondo="bg-[#e8f3ec]"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#2f7d4f" strokeWidth="1.7" className="h-5 w-5">
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 12l6-6" strokeLinecap="round" />
            </svg>
          }
        />
        {/* RF-07.3 */}
        <Tarjeta
          etiqueta="Divergentes"
          valor={valorTarjeta((t) => t.divergentes.toLocaleString('es-CO'))}
          pie={totales && !invalido && `${porcentajeDeTotal(totales.divergentes, totales.total)}% del total`}
          pieClase="text-orange-600"
          fondo="bg-orange-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="1.8" className="h-5 w-5">
              <path d="M7 4v16M17 4v16M7 8h10M7 16h10" strokeLinecap="round" />
            </svg>
          }
        />
        {/* RF-07.4 */}
        <Tarjeta
          etiqueta="Datos defectuosos"
          valor={valorTarjeta((t) => t.defectuosas.toLocaleString('es-CO'))}
          pie={
            totales && !invalido && `${porcentajeDeTotal(totales.defectuosas, totales.total)}% con confianza cero`
          }
          pieClase="text-red-600"
          fondo="bg-red-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" className="h-5 w-5">
              <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
              <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {resumen.isError && !invalido && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <p>{mensajeDeError(resumen.error, 'No se pudo cargar el resumen.')}</p>
          <button
            type="button"
            onClick={() => resumen.refetch()}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ---------- Filtros ---------- */}
      <section className="mt-5 rounded-2xl bg-white p-6">
        {/* RF-07.2 — categorías biológicas */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Categorías biológicas</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Un clic incluye la categoría, otro la excluye y un tercero quita el filtro. Sin ninguna incluida se
              muestran todas.
            </p>
          </div>
          {conFiltros && (
            <button type="button" onClick={limpiar} className="text-sm font-medium text-agro-green hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => {
            const estado = estadoDeCategoria(c, filtros)
            return (
              <button
                key={c}
                type="button"
                aria-pressed={estado !== 'neutral'}
                title={
                  estado === 'neutral' ? 'Incluir' : estado === 'incluida' ? 'Excluir' : 'Quitar filtro'
                }
                onClick={() => cambiar(alternarCategoria(c, filtros))}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
                  estado === 'incluida'
                    ? 'border-agro-green bg-[#e8f3ec] font-medium text-agro-green'
                    : estado === 'excluida'
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {estado === 'incluida' && <span aria-hidden>✓</span>}
                {estado === 'excluida' && <span aria-hidden>✕</span>}
                <span className={estado === 'excluida' ? 'line-through' : ''}>{ETIQUETAS_CATEGORIA[c]}</span>
                <span className="rounded-full bg-white/70 px-1.5 text-xs text-gray-500">
                  {resumen.data ? conteoCategoria(c).toLocaleString('es-CO') : '…'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* RF-07.3 */}
          <div className="md:col-span-2 xl:col-span-3">
            <span className="text-xs font-medium text-gray-500">Revisión humana</span>
            <div className="mt-1.5 inline-flex flex-wrap gap-1 rounded-xl bg-[#eef4f0] p-1">
              {OPCIONES_REVISION.map((o) => (
                <button
                  key={o.texto}
                  type="button"
                  onClick={() => cambiar({ revision: o.valor })}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    filtros.revision === o.valor
                      ? 'bg-white font-medium text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {o.texto}
                </button>
              ))}
            </div>
          </div>

          {/* RF-07.4 */}
          <label className="block">
            <span className="text-xs font-medium text-gray-500">Datos</span>
            <select
              value={filtros.defectuosas === undefined ? '' : String(filtros.defectuosas)}
              onChange={(e) =>
                cambiar({ defectuosas: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
              className={`mt-1.5 ${CAMPO}`}
            >
              <option value="">Todos</option>
              <option value="true">Solo defectuosos</option>
              <option value="false">Sin defectuosos</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">Versión del modelo</span>
            <select
              value={filtros.modeloVersion ?? ''}
              onChange={(e) => cambiar({ modeloVersion: e.target.value || undefined })}
              className={`mt-1.5 ${CAMPO}`}
            >
              <option value="">{modelos.isPending ? 'Cargando versiones…' : 'Todas las versiones'}</option>
              {versiones.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">
              Municipio <span className="text-gray-400">(nombre exacto)</span>
            </span>
            <input
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              onBlur={aplicarMunicipio}
              onKeyDown={(e) => {
                if (e.key === 'Enter') aplicarMunicipio()
              }}
              placeholder="Ej: Jardín"
              className={`mt-1.5 ${CAMPO} placeholder:text-gray-400`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">Desde</span>
            <input
              type="date"
              value={filtros.desde ?? ''}
              onChange={(e) => cambiar({ desde: e.target.value || undefined })}
              className={`mt-1.5 ${CAMPO}`}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-500">Hasta</span>
            <input
              type="date"
              value={filtros.hasta ?? ''}
              onChange={(e) => cambiar({ hasta: e.target.value || undefined })}
              className={`mt-1.5 ${CAMPO}`}
            />
          </label>
        </div>

        {invalido && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            La fecha "Desde" es posterior a "Hasta". Corrige el rango para ver resultados.
          </p>
        )}
      </section>

      {/* ---------- Tabla — RF-07.1 ---------- */}
      <section className="mt-5 overflow-hidden rounded-2xl bg-white">
        {invalido ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Corrige el rango de fechas.</p>
        ) : lista.isPending ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Cargando…</p>
        ) : lista.isError ? (
          <div className="bg-red-50 px-5 py-10 text-center text-sm text-red-600">
            <p>{mensajeDeError(lista.error, 'No se pudieron cargar las detecciones.')}</p>
            <button
              type="button"
              onClick={() => lista.refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
            >
              Reintentar
            </button>
          </div>
        ) : lista.data.datos.length === 0 ? (
          <div className="px-5 py-10 text-center">
            {conFiltros ? (
              <p className="text-sm text-gray-400">No hay detecciones que coincidan con los filtros.</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">Aún no hay detecciones.</p>
                <p className="mt-1 text-sm text-gray-400">Aparecerán cuando las apps envíen sus capturas.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 font-medium">Capturada</th>
                  <th className="px-5 py-3 font-medium">Productor</th>
                  <th className="px-5 py-3 font-medium">Predicción</th>
                  <th className="px-5 py-3 font-medium">Confianza</th>
                  <th className="px-5 py-3 font-medium">Modelo</th>
                  <th className="px-5 py-3 font-medium">Revisión</th>
                </tr>
              </thead>
              <tbody>
                {lista.data.datos.map((d) => (
                  <tr
                    key={d.id}
                    tabIndex={0}
                    onClick={() => setSeleccionada(d)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSeleccionada(d)
                    }}
                    className="cursor-pointer border-b border-gray-50 transition last:border-0 hover:bg-[#f7faf8] focus:bg-[#f7faf8] focus:outline-none"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{formatearFechaHora(d.fecha)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{d.productorNombre ?? 'Sin perfil'}</p>
                      <p className="text-xs text-gray-500">{d.municipio}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <BadgeCategoria categoria={d.categoria} />
                        {d.defectuosa && (
                          <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                            Defectuosa
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {d.clasePredicha ?? ETIQUETAS_COMPUERTA[d.resultadoCompuerta]}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.confianza === null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-agro-green"
                              style={{ width: `${Math.min(100, d.confianza * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {porcentajeConfianza(d.confianza)}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{d.modeloVersion}</td>
                    <td className="px-5 py-3.5">
                      <BadgeRevision revision={d.revision} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!invalido && lista.data && lista.data.total > 0 && (
        <Paginacion
          total={lista.data.total}
          pagina={pagina}
          limite={LIMITE_DETECCIONES}
          cargando={lista.isPlaceholderData}
          onCambiar={setPagina}
        />
      )}

      {seleccionada && <DeteccionDrawer deteccion={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  )
}

function Tarjeta({
  etiqueta,
  valor,
  pie,
  pieClase = 'text-gray-400',
  fondo,
  icono,
}: {
  etiqueta: string
  valor: React.ReactNode
  pie: React.ReactNode
  pieClase?: string
  fondo: string
  icono: React.ReactNode
}) {
  return (
    <article className="rounded-2xl bg-white p-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fondo}`}>{icono}</div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-gray-500">{etiqueta}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{valor}</p>
          <p className={`mt-0.5 text-xs ${pieClase}`}>{pie}</p>
        </div>
      </div>
    </article>
  )
}
