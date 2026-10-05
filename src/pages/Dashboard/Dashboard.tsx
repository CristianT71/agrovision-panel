import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clavesTelemetria, telemetriaService } from '../../api/telemetria/telemetria.service'
import { clavesModelos, modelosService } from '../../api/modelos/modelos.service'
import {
  clavesSolicitudes,
  codigoSolicitud,
  solicitudesService,
} from '../../api/solicitudes/solicitudes.service'
import { mensajeDeError } from '../../api/axios'
import { formatearFecha } from '../../utils/fechas'
import {
  COLORES_VERSION,
  META_RESOLUCION,
  RANGOS,
  UMBRAL_PLAGAS_SEMANA,
  correccionesPorTramo,
  diferenciaEnPuntos,
  plagasNuevasDe,
  porcentajeDe,
  resolucionesDe,
  resumirModelos,
  resumirOta,
  serieTasaPorVersion,
  tendenciaPlagas,
  ventanaAnterior,
  ventanaDeRango,
  type Rango,
} from './metricas'

const VERDE = '#2f7d4f'
const NARANJA = '#f0972b'

const EJE = { fontSize: 11, fill: '#9ca3af' }

const SIN_TELEMETRIA = 'No hay telemetría en este periodo. Aparecerá cuando la app reporte escaneos.'

export default function Dashboard() {
  const [rango, setRango] = useState<Rango>('mes')
  const [verPlagas, setVerPlagas] = useState(false)

  // RF-06.1 — la ventana se calcula en cada consulta para que el refresco avance con el reloj
  const telemetria = useQuery({
    queryKey: clavesTelemetria.resumen(rango),
    queryFn: async () => {
      const ventana = ventanaDeRango(rango, new Date())
      const [actual, anterior] = await Promise.all([
        telemetriaService.resumen(ventana),
        telemetriaService.resumen(ventanaAnterior(ventana)),
      ])
      return { ventana, actual, anterior }
    },
    refetchInterval: 60_000,
  })

  // RF-09.1 — adopción de cada modelo en los últimos 30 días
  const modelos = useQuery({
    queryKey: clavesModelos.lista,
    queryFn: () => modelosService.listar(),
  })

  // RF-06.5 — el administrador recibe todas las solicitudes
  const solicitudes = useQuery({
    queryKey: clavesSolicitudes.lista(),
    queryFn: () => solicitudesService.listar(),
    refetchInterval: 60_000,
  })

  /* ---------- Telemetría ---------- */

  const t = telemetria.data
  const indicadores = useMemo(() => {
    if (!t) return null
    const actual = resumirModelos(t.actual.porModelo)
    const previo = resumirModelos(t.anterior.porModelo)
    return {
      actual,
      delta: diferenciaEnPuntos(actual.tasaNoReconocido, previo.tasaNoReconocido),
      ota: resumirOta(t.actual.actualizaciones),
      tasa: serieTasaPorVersion(t.actual.serie, t.ventana.desde, t.ventana.hasta),
      correcciones: correccionesPorTramo(t.actual.serie, t.ventana.desde, t.ventana.hasta, rango),
    }
  }, [t, rango])

  const sinTelemetria = !!indicadores && indicadores.actual.escaneos === 0 && t!.actual.serie.length === 0

  /* ---------- Adopción ---------- */

  const mayorAdopcion = useMemo(() => {
    const conAdopcion = (modelos.data ?? []).filter((m) => m.adopcion)
    if (conAdopcion.length === 0) return null
    return conAdopcion.reduce((mejor, m) =>
      m.adopcion!.porcentaje > mejor.adopcion!.porcentaje ? m : mejor,
    )
  }, [modelos.data])

  /* ---------- Resoluciones ---------- */

  const resoluciones = useMemo(() => {
    if (!solicitudes.data) return null
    const ventana = ventanaDeRango(rango, new Date(solicitudes.dataUpdatedAt))
    const plagasNuevas = plagasNuevasDe(solicitudes.data, ventana)
    return {
      ...resolucionesDe(solicitudes.data, ventana),
      plagasNuevas,
      tendencia: tendenciaPlagas(plagasNuevas, ventana, rango),
    }
  }, [solicitudes.data, solicitudes.dataUpdatedAt, rango])

  const semanal = rango !== 'semana'
  const superaUmbral = !!resoluciones && resoluciones.tendencia.picoSemanal >= UMBRAL_PLAGAS_SEMANA

  // Valor de una tarjeta mientras carga o si falló su consulta
  const valorTelemetria = (valor: () => React.ReactNode) =>
    indicadores ? valor() : telemetria.isError ? '—' : '…'

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de telemetría</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas en tiempo real del sistema AgroVisión
          </p>
        </div>

        <div className="inline-flex gap-1 rounded-xl bg-[#eef4f0] p-1">
          {RANGOS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRango(r.id)}
              className={`rounded-lg px-4 py-1.5 text-sm transition ${
                rango === r.id
                  ? 'bg-white font-medium text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Métricas del modelo — RF-06.2 ---------- */}
      <Seccion>Métricas del modelo</Seccion>

      {telemetria.isError && (
        <ErrorSeccion
          error={telemetria.error}
          porDefecto="No se pudo cargar la telemetría."
          onReintentar={() => telemetria.refetch()}
        />
      )}
      {modelos.isError && (
        <ErrorSeccion
          error={modelos.error}
          porDefecto="No se pudo cargar la adopción de los modelos."
          onReintentar={() => modelos.refetch()}
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          fondo="bg-red-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="h-5 w-5">
              <path d="M3 8l6 6 4-4 8 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 13v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          etiqueta="Tasa no reconocido"
          valor={valorTelemetria(() => {
            const p = porcentajeDe(indicadores!.actual.tasaNoReconocido)
            return p === '—' ? p : `${p}%`
          })}
          pie={
            indicadores &&
            (indicadores.delta === null ? (
              'Sin periodo anterior para comparar'
            ) : (
              <span
                className={
                  indicadores.delta < 0
                    ? 'text-emerald-600'
                    : indicadores.delta > 0
                      ? 'text-red-600'
                      : 'text-gray-400'
                }
              >
                {indicadores.delta > 0 ? '+' : ''}
                {indicadores.delta.toFixed(1)} pts vs periodo anterior
              </span>
            ))
          }
        />

        <Tarjeta
          fondo="bg-amber-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="9" cy="8" r="3" />
              <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
              <path d="M16 5a3 3 0 0 1 0 6" strokeLinecap="round" />
            </svg>
          }
          etiqueta="Correcciones de productores"
          valor={valorTelemetria(() => indicadores!.actual.correcciones.toLocaleString('es-CO'))}
          pie="En el periodo seleccionado"
        />

        {/* Son eventos de actualización, no dispositivos distintos */}
        <Tarjeta
          fondo="bg-blue-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" className="h-5 w-5">
              <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
              <path d="M11 18.5h2" strokeLinecap="round" />
            </svg>
          }
          etiqueta="Actualizaciones exitosas"
          valor={valorTelemetria(() => indicadores!.ota.exitos.toLocaleString('es-CO'))}
          pie={
            indicadores &&
            (indicadores.ota.tasaExito === null
              ? 'Sin intentos en el periodo'
              : `${porcentajeDe(indicadores.ota.tasaExito)}% de éxito`)
          }
        />

        <Tarjeta
          fondo="bg-[#e8f3ec]"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="1.7" className="h-5 w-5">
              <rect x="7" y="7" width="10" height="10" rx="2" />
              <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
            </svg>
          }
          etiqueta="Mayor adopción"
          valor={
            modelos.isPending ? '…' : mayorAdopcion ? `v${mayorAdopcion.version}` : '—'
          }
          pie={
            mayorAdopcion
              ? `${mayorAdopcion.adopcion!.porcentaje}% de productores (30 días)`
              : modelos.isSuccess && 'Sin datos de adopción'
          }
        />
      </div>

      {/* ---------- Gráficas — RF-06.3 ---------- */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel
          titulo='Tasa de "no reconocido" por versión'
          subtitulo="Porcentaje diario por versión de modelo"
        >
          {!indicadores ? (
            <EstadoGrafica cargando={telemetria.isPending} />
          ) : sinTelemetria || indicadores.tasa.versiones.length === 0 ? (
            <Vacio>{SIN_TELEMETRIA}</Vacio>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={indicadores.tasa.filas} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={EJE}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<TooltipTasa />} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {indicadores.tasa.versiones.map((version, i) => {
                  const color = COLORES_VERSION[i % COLORES_VERSION.length]
                  return (
                    <Line
                      key={version}
                      type="monotone"
                      dataKey={`s${i}`}
                      name={version}
                      stroke={color}
                      strokeWidth={1.8}
                      dot={{ r: 2, fill: color, strokeWidth: 0 }}
                      connectNulls
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          titulo="Correcciones por productores"
          subtitulo={`Total de diagnósticos corregidos ${semanal ? 'por semana' : 'por día'}`}
        >
          {!indicadores ? (
            <EstadoGrafica cargando={telemetria.isPending} />
          ) : sinTelemetria ? (
            <Vacio>{SIN_TELEMETRIA}</Vacio>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={indicadores.correcciones} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f7faf8' }} content={<TooltipPersonalizado />} />
                <Bar dataKey="total" name="Correcciones" fill={VERDE} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* ---------- Estado OTA — RF-06.4 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="font-semibold text-gray-900">Estado de actualización de modelo en dispositivos</h2>
        <p className="mt-1 text-sm text-gray-500">Eventos de actualización reportados por la app</p>

        {!t ? (
          <EstadoGrafica cargando={telemetria.isPending} alto={120} />
        ) : t.actual.actualizaciones.length === 0 ? (
          <Vacio>{SIN_TELEMETRIA}</Vacio>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 font-medium">Versión</th>
                  <th className="pb-3 font-medium">Intentos</th>
                  <th className="pb-3 font-medium">Exitosos</th>
                  <th className="pb-3 font-medium">Fallidos</th>
                  <th className="pb-3 font-medium">Tasa de éxito</th>
                </tr>
              </thead>
              <tbody>
                {t.actual.actualizaciones.map((f) => (
                  <tr key={f.versionDestino} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 font-mono text-xs text-gray-700">{f.versionDestino}</td>
                    <td className="py-4 text-gray-700">{(f.exitos + f.fallos).toLocaleString('es-CO')}</td>
                    <td className="py-4 font-medium text-emerald-600">{f.exitos.toLocaleString('es-CO')}</td>
                    <td className={`py-4 font-medium ${f.fallos > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {f.fallos.toLocaleString('es-CO')}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(f.tasaExito ?? 0) * 100}%`,
                              backgroundColor: f.tasaExito === 1 ? VERDE : NARANJA,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {f.tasaExito === null ? '—' : `${porcentajeDe(f.tasaExito)}%`}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------- Resoluciones del agrónomo — RF-06.5 ---------- */}
      <Seccion subtitulo="Cómo clasifican los agrónomos los diagnósticos — independiente de las métricas internas del modelo">
        Resoluciones del agrónomo
      </Seccion>

      {solicitudes.isError ? (
        <ErrorSeccion
          error={solicitudes.error}
          porDefecto="No se pudieron cargar las resoluciones."
          onReintentar={() => solicitudes.refetch()}
        />
      ) : !resoluciones ? (
        <p className="rounded-2xl bg-white px-5 py-10 text-center text-sm text-gray-400">…</p>
      ) : resoluciones.total === 0 ? (
        <Vacio fondo>
          Ningún agrónomo resolvió solicitudes en este periodo.
        </Vacio>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {resoluciones.filas.map((r) => {
            const meta = META_RESOLUCION[r.tipo]
            const esPlagaNueva = r.tipo === 'Plaga nueva'
            return (
              <article
                key={r.tipo}
                className={`rounded-2xl bg-white p-5 ${esPlagaNueva ? 'border border-amber-200' : ''}`}
              >
                <h3 className="font-semibold text-gray-900">{meta.titulo}</h3>

                <p className="mt-3">
                  <span className="text-3xl font-bold text-gray-900">{r.casos}</span>
                  <span className="ml-1.5 text-xs uppercase tracking-wide text-gray-400">casos</span>
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${meta.barra}`} style={{ width: `${r.porcentaje}%` }} />
                </div>

                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-xs leading-relaxed text-gray-500">{meta.descripcion}</p>
                  <span className={`shrink-0 text-sm font-semibold ${meta.texto}`}>{r.porcentaje}%</span>
                </div>

                {/* RF-06.6 — aislar los casos de "Plaga nueva" */}
                {esPlagaNueva && (
                  <button
                    type="button"
                    disabled={r.casos === 0}
                    onClick={() => setVerPlagas(true)}
                    className="mt-3 flex items-center gap-1.5 text-left text-xs font-medium text-amber-600 enabled:hover:underline disabled:text-gray-300"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0">
                      <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
                      <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
                    </svg>
                    Ver casos para reentrenamiento
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* ---------- Tendencia de plagas nuevas — RF-06.7 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="font-semibold text-gray-900">Tendencia de plagas nuevas</h2>
        <p className="mt-1 text-sm text-gray-500">
          Casos resueltos como "Plaga nueva" {semanal ? 'por semana' : 'por día'} — señal de alerta
          para reentrenamiento cuando aparecen clases que el modelo no conoce
        </p>

        {superaUmbral && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
              <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
            </svg>
            ≥ {UMBRAL_PLAGAS_SEMANA} casos en una semana sugiere reentrenamiento urgente
          </div>
        )}

        {solicitudes.isError ? (
          <div className="mt-5">
            <ErrorSeccion
              error={solicitudes.error}
              porDefecto="No se pudo cargar la tendencia."
              onReintentar={() => solicitudes.refetch()}
            />
          </div>
        ) : !resoluciones ? (
          <EstadoGrafica cargando alto={280} />
        ) : (
          <div className="mt-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={resoluciones.tendencia.puntos} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="etiqueta" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={EJE}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={semanal ? [0, (max: number) => Math.max(max, UMBRAL_PLAGAS_SEMANA + 1)] : [0, 'auto']}
                />
                <Tooltip content={<TooltipPersonalizado etiqueta="Plaga nueva" sufijo=" casos" />} />
                {/* El umbral es semanal: solo tiene sentido cuando cada punto es una semana */}
                {semanal && (
                  <ReferenceLine
                    y={UMBRAL_PLAGAS_SEMANA}
                    stroke={NARANJA}
                    strokeDasharray="4 4"
                    label={{ value: 'Umbral', position: 'right', fontSize: 10, fill: NARANJA }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Plaga nueva"
                  stroke={NARANJA}
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: NARANJA, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {verPlagas && resoluciones && (
        <ModalPlagasNuevas casos={resoluciones.plagasNuevas} onClose={() => setVerPlagas(false)} />
      )}
    </div>
  )
}

/* ---------- Casos para reentrenamiento — RF-06.6 ---------- */

// El administrador no tiene acceso a /solicitudes/:id (es ruta del profesional): solo se listan
function ModalPlagasNuevas({
  casos,
  onClose,
}: {
  casos: ReturnType<typeof plagasNuevasDe>
  onClose: () => void
}) {
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Casos para reentrenamiento</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {casos.length} {casos.length === 1 ? 'caso resuelto' : 'casos resueltos'} como plaga nueva en el periodo
          </p>
        </div>

        <ul className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {casos.map((s) => (
            <li key={s.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{codigoSolicitud(s.id)}</span>
                {s.plagaIdentificada && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {s.plagaIdentificada}
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">{formatearFecha(s.fechaResolucion)}</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{s.productorNombre ?? s.finca}</p>
              <p className="text-xs text-gray-500">
                {s.finca} · {s.vereda} · {s.municipio}
              </p>
              {s.respuestaProfesional && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{s.respuestaProfesional}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Piezas reutilizables ---------- */

function Seccion({ children, subtitulo }: { children: React.ReactNode; subtitulo?: string }) {
  return (
    <div className="mb-4 mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{children}</h2>
      {subtitulo && <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>}
    </div>
  )
}

function Tarjeta({
  fondo,
  icono,
  etiqueta,
  valor,
  pie,
}: {
  fondo: string
  icono: React.ReactNode
  etiqueta: string
  valor: React.ReactNode
  pie: React.ReactNode
}) {
  return (
    <article className="rounded-2xl bg-white p-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${fondo}`}>
          {icono}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase leading-tight tracking-wide text-gray-500">
            {etiqueta}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{valor}</p>
          <p className="mt-0.5 text-xs text-gray-400">{pie}</p>
        </div>
      </div>
    </article>
  )
}

function ErrorSeccion({
  error,
  porDefecto,
  onReintentar,
}: {
  error: unknown
  porDefecto: string
  onReintentar: () => void
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
      <p>{mensajeDeError(error, porDefecto)}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
      >
        Reintentar
      </button>
    </div>
  )
}

// Marcador de una gráfica que aún carga o cuya consulta falló (el error se muestra arriba)
function EstadoGrafica({ cargando, alto = 260 }: { cargando: boolean; alto?: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: alto }}>
      {cargando ? '…' : 'Sin datos'}
    </div>
  )
}

function Vacio({ children, fondo = false }: { children: React.ReactNode; fondo?: boolean }) {
  return (
    <p
      className={`px-5 py-10 text-center text-sm text-gray-400 ${fondo ? 'rounded-2xl bg-white' : 'mt-5'}`}
    >
      {children}
    </p>
  )
}

type TooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  etiqueta?: string
  sufijo?: string
}

function TooltipPersonalizado({ active, payload, label, etiqueta, sufijo = '' }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 text-sm text-gray-800">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: p.color }}
          />
          {etiqueta ?? p.name}: <strong>{p.value}{sufijo}</strong>
        </p>
      ))}
    </div>
  )
}

type TooltipTasaProps = {
  active?: boolean
  label?: string
  payload?: Array<{
    name: string
    value: number | null
    color: string
    dataKey: string
    payload: Record<string, string | number | null>
  }>
}

// Cada versión con su tasa y los escaneos del día (nN, guardado junto a sN en la fila)
function TooltipTasa({ active, payload, label }: TooltipTasaProps) {
  if (!active || !payload?.length) return null
  const conDato = payload.filter((p) => p.value !== null && p.value !== undefined)
  if (conDato.length === 0) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {conDato.map((p) => {
        const escaneos = p.payload[`n${p.dataKey.slice(1)}`]
        return (
          <p key={p.dataKey} className="mt-1 text-sm text-gray-800">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: p.color }}
            />
            {p.name}: <strong>{p.value}%</strong>
            {typeof escaneos === 'number' && (
              <span className="text-xs text-gray-400"> ({escaneos.toLocaleString('es-CO')} escaneos)</span>
            )}
          </p>
        )
      })}
    </div>
  )
}

function Panel({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-sm text-gray-500">{subtitulo}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
