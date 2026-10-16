import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
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
import { mensajeDeError } from '../../api/axios'
import { clavesTelemetria, etiquetaVersion, telemetriaService } from '../../api/telemetria/telemetria.service'
import { clavesModelos, modelosService } from '../../api/modelos/modelos.service'
import { clavesSolicitudes, codigoSolicitud, solicitudesService } from '../../api/solicitudes/solicitudes.service'
import { formatearFecha } from '../../utils/fechas'
import {
  RANGOS,
  UMBRAL_PLAGAS_SEMANA,
  actualizacionesPorVersion,
  calcularTramos,
  casosPlagaNueva,
  correccionesPorTramo,
  resolucionesDelPeriodo,
  sumarTotales,
  tasaPorVersion,
  tendenciaPlagas,
  type Rango,
} from './calculos'

const VERDE = '#2f7d4f'
const GRIS = '#6b7280'
const NARANJA = '#f0972b'
// Una por versión del modelo; si hay más versiones que colores se repiten
const COLORES_SERIE = [GRIS, VERDE, NARANJA, '#2563eb', '#9333ea', '#0891b2']

const EJE = { fontSize: 11, fill: '#9ca3af' }

export default function Dashboard() {
  const [rango, setRango] = useState<Rango>('mes')
  // Momento de la consulta: fijo hasta que el administrador actualiza, para que las claves de caché no cambien solas
  const [ahora, setAhora] = useState(() => Date.now())
  const [verPlagasNuevas, setVerPlagasNuevas] = useState(false)

  // RF-06.1 — métricas delimitadas a la ventana de tiempo
  const { ventana, tramos, anterior } = useMemo(() => calcularTramos(rango, ahora), [rango, ahora])

  // La API no entrega series por día: se consulta el resumen de cada tramo y del periodo anterior
  const consultas = useQueries({
    queries: [...tramos, anterior].map((t) => ({
      queryKey: clavesTelemetria.tramo(t.desde.getTime(), t.hasta.getTime()),
      queryFn: () => telemetriaService.resumen(t.desde, t.hasta),
    })),
  })
  const modelos = useQuery({ queryKey: clavesModelos.lista, queryFn: () => modelosService.listar() })
  const solicitudes = useQuery({ queryKey: clavesSolicitudes.lista(), queryFn: () => solicitudesService.listar() })

  const cargando = consultas.some((c) => c.isPending)
  const falla = consultas.find((c) => c.isError)

  const datos = useMemo(() => {
    const resumenes = consultas.slice(0, tramos.length).map((c) => c.data)
    const previo = consultas[tramos.length]?.data
    if (resumenes.some((r) => !r) || !previo) return null

    const completos = resumenes as NonNullable<(typeof resumenes)[number]>[]
    const totales = sumarTotales(completos)
    const totalesPrevios = sumarTotales([previo])
    const serie = tasaPorVersion(completos, tramos)

    return {
      totales,
      // Diferencia en puntos porcentuales frente al periodo anterior
      delta:
        totales.tasaNoReconocido !== null && totalesPrevios.tasaNoReconocido !== null
          ? Math.round((totales.tasaNoReconocido - totalesPrevios.tasaNoReconocido) * 10) / 10
          : null,
      serie,
      correcciones: correccionesPorTramo(completos, tramos),
      ota: actualizacionesPorVersion(completos),
    }
  }, [consultas, tramos])

  // RF-09.1 — la versión que más productores usan en los últimos 30 días
  const mayorAdopcion = useMemo(
    () =>
      [...(modelos.data ?? [])]
        .filter((m) => (m.adopcion?.productores ?? 0) > 0)
        .sort((a, b) => (b.adopcion?.porcentaje ?? 0) - (a.adopcion?.porcentaje ?? 0))[0],
    [modelos.data],
  )

  const resoluciones = useMemo(
    () => resolucionesDelPeriodo(solicitudes.data ?? [], ventana.desde, ventana.hasta),
    [solicitudes.data, ventana],
  )
  const totalResueltas = resoluciones.reduce((suma, r) => suma + r.casos, 0)
  const plagasNuevas = useMemo(
    () => casosPlagaNueva(solicitudes.data ?? [], ventana.desde, ventana.hasta),
    [solicitudes.data, ventana],
  )

  // RF-06.7 — la alerta mira la última semana completa, no el rango elegido
  const tendencia = useMemo(() => tendenciaPlagas(solicitudes.data ?? [], ahora), [solicitudes.data, ahora])
  const casosUltimaSemana = tendencia[tendencia.length - 1]?.casos ?? 0
  const superaUmbral = casosUltimaSemana >= UMBRAL_PLAGAS_SEMANA

  const totales = datos?.totales
  const exitosOta = datos?.ota.reduce((suma, f) => suma + f.exitos, 0) ?? 0
  const fallosOta = datos?.ota.reduce((suma, f) => suma + f.fallos, 0) ?? 0
  const tasaOta = exitosOta + fallosOta > 0 ? Math.round((exitosOta / (exitosOta + fallosOta)) * 1000) / 10 : null
  const sinTelemetria = !!datos && datos.totales.escaneos === 0 && datos.ota.length === 0

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de telemetría</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas de campo del sistema AgroVisión · actualizado a las{' '}
            {new Date(ahora).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAhora(Date.now())}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-agro-green hover:text-agro-green"
          >
            Actualizar
          </button>

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
      </div>

      {falla && (
        <div className="mt-6 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          <p>{mensajeDeError(falla.error, 'No se pudo cargar la telemetría.')}</p>
          <button
            type="button"
            onClick={() => consultas.forEach((c) => c.refetch())}
            className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
          >
            Reintentar
          </button>
        </div>
      )}

      {cargando && !falla && (
        <p className="mt-6 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">Cargando telemetría...</p>
      )}

      {sinTelemetria && (
        <p className="mt-6 rounded-xl bg-white px-5 py-4 text-sm text-gray-500">
          Aún no hay telemetría de la app en este periodo. Aparecerá cuando los teléfonos envíen sus escaneos,
          correcciones y actualizaciones de modelo.
        </p>
      )}

      {/* ---------- Métricas del modelo — RF-06.2 ---------- */}
      <Seccion>Métricas del modelo</Seccion>

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
          valor={totales?.tasaNoReconocido != null ? `${totales.tasaNoReconocido}%` : '—'}
          pie={
            datos?.delta != null ? (
              <span className={datos.delta <= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {datos.delta > 0 ? '+' : ''}
                {datos.delta} pts vs periodo anterior
              </span>
            ) : (
              'Sin periodo anterior para comparar'
            )
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
          etiqueta="Correcciones productores"
          valor={totales ? totales.correcciones.toLocaleString('es-CO') : '—'}
          pie={totales ? `De ${totales.identificados.toLocaleString('es-CO')} diagnósticos identificados` : 'En el periodo seleccionado'}
        />

        <Tarjeta
          fondo="bg-blue-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" className="h-5 w-5">
              <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
              <path d="M11 18.5h2" strokeLinecap="round" />
            </svg>
          }
          etiqueta="Actualizaciones de modelo"
          valor={datos ? exitosOta.toLocaleString('es-CO') : '—'}
          pie={tasaOta !== null ? `${tasaOta}% de éxito` : 'Sin actualizaciones en el periodo'}
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
          valor={mayorAdopcion ? etiquetaVersion(mayorAdopcion.version) : '—'}
          pie={
            modelos.isError
              ? 'No se pudo consultar'
              : mayorAdopcion?.adopcion
                ? `${mayorAdopcion.adopcion.porcentaje}% de productores (30 días)`
                : 'Sin detecciones recientes'
          }
        />
      </div>

      {/* ---------- Gráficas — RF-06.3 ---------- */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Tasa de "no reconocido" por versión */}
        <Panel
          titulo='Tasa de "no reconocido" por versión'
          subtitulo="Porcentaje por versión de modelo en cada tramo del periodo"
        >
          {datos && datos.serie.versiones.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={datos.serie.datos} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={EJE}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<TooltipPersonalizado sufijo="%" />} />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {datos.serie.versiones.map((version, i) => (
                  <Area
                    key={version}
                    type="monotone"
                    dataKey={version}
                    name={etiquetaVersion(version)}
                    stroke={COLORES_SERIE[i % COLORES_SERIE.length]}
                    strokeWidth={1.8}
                    fill="transparent"
                    dot={{ r: 2.5, strokeWidth: 0, fill: COLORES_SERIE[i % COLORES_SERIE.length] }}
                    connectNulls
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <SinDatos cargando={cargando} />
          )}
        </Panel>

        {/* Correcciones por productores */}
        <Panel titulo="Correcciones por productores" subtitulo="Diagnósticos corregidos en cada tramo del periodo">
          {datos && datos.totales.escaneos > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={datos.correcciones} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis tick={EJE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f7faf8' }} content={<TooltipPersonalizado />} />
                <Bar dataKey="total" name="Correcciones" fill={VERDE} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SinDatos cargando={cargando} />
          )}
        </Panel>
      </div>

      {/* ---------- Estado OTA — RF-06.4 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="font-semibold text-gray-900">Estado de actualización de modelo en dispositivos</h2>
        <p className="mt-1 text-sm text-gray-500">Intentos de instalación que reportan los teléfonos en el periodo</p>

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
              {(datos?.ota ?? []).map((f) => (
                <tr key={f.version} className="border-b border-gray-50 last:border-0">
                  <td className="py-4 font-mono text-xs text-gray-700">{etiquetaVersion(f.version)}</td>
                  <td className="py-4 text-gray-700">{f.intentos.toLocaleString('es-CO')}</td>
                  <td className="py-4 font-medium text-emerald-600">{f.exitos.toLocaleString('es-CO')}</td>
                  <td className={`py-4 font-medium ${f.fallos > 0 ? 'text-red-500' : 'text-gray-400'}`}>{f.fallos}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${f.tasaExito ?? 0}%`,
                            backgroundColor: f.tasaExito === 100 ? VERDE : NARANJA,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{f.tasaExito !== null ? `${f.tasaExito}%` : '—'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {datos && datos.ota.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400">Ningún teléfono reportó actualizaciones en este periodo.</p>
          )}
        </div>
      </div>

      {/* ---------- Resoluciones del agrónomo — RF-06.5 ---------- */}
      <Seccion subtitulo="Cómo clasifican los agrónomos los diagnósticos — independiente de las métricas internas del modelo">
        Resoluciones del agrónomo
      </Seccion>

      {solicitudes.isError ? (
        <p className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          {mensajeDeError(solicitudes.error, 'No se pudieron cargar las resoluciones.')}
        </p>
      ) : solicitudes.isPending ? (
        <p className="rounded-xl bg-white px-5 py-6 text-center text-sm text-gray-400">Cargando resoluciones...</p>
      ) : (
        <>
          {totalResueltas === 0 && (
            <p className="mb-4 rounded-xl bg-white px-5 py-4 text-sm text-gray-500">
              Ningún agrónomo resolvió casos en este periodo.
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {resoluciones.map((r) => {
              const esPlagaNueva = r.tipo === 'Plaga nueva'
              return (
                <article
                  key={r.tipo}
                  className={`rounded-2xl bg-white p-5 ${esPlagaNueva && r.casos > 0 ? 'border border-amber-200' : ''}`}
                >
                  <h3 className="font-semibold text-gray-900">{r.tipo}</h3>

                  <p className="mt-3">
                    <span className="text-3xl font-bold text-gray-900">{r.casos}</span>
                    <span className="ml-1.5 text-xs uppercase tracking-wide text-gray-400">casos</span>
                  </p>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.porcentaje}%` }} />
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-3">
                    <p className="text-xs leading-relaxed text-gray-500">{r.descripcion}</p>
                    <span className={`shrink-0 text-sm font-semibold ${r.textoColor}`}>{r.porcentaje}%</span>
                  </div>

                  {/* RF-06.6 — aislar los casos de "Plaga nueva" */}
                  {esPlagaNueva && r.casos > 0 && (
                    <button
                      type="button"
                      onClick={() => setVerPlagasNuevas((v) => !v)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:underline"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
                        <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
                      </svg>
                      {verPlagasNuevas ? 'Ocultar los casos' : 'Ver casos para reentrenamiento'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>

          {verPlagasNuevas && plagasNuevas.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-2xl bg-white p-6">
              <h3 className="font-semibold text-gray-900">Casos evaluados como "Plaga nueva"</h3>
              <table className="mt-4 w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-3 font-medium">Caso</th>
                    <th className="pb-3 font-medium">Plaga identificada</th>
                    <th className="pb-3 font-medium">Finca</th>
                    <th className="pb-3 font-medium">Resuelto</th>
                  </tr>
                </thead>
                <tbody>
                  {plagasNuevas.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-mono text-xs text-gray-700">{codigoSolicitud(s.id)}</td>
                      <td className="py-3 text-gray-800">{s.plagaIdentificada ?? '—'}</td>
                      <td className="py-3 text-gray-600">
                        {s.finca} · {s.municipio}
                      </td>
                      <td className="py-3 text-gray-500">{s.fechaResolucion ? formatearFecha(s.fechaResolucion) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ---------- Tendencia de plagas — RF-06.7 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <div>
          <h2 className="font-semibold text-gray-900">Tendencia de plagas nuevas</h2>
          <p className="mt-1 text-sm text-gray-500">
            Casos que los agrónomos resolvieron como "Plaga nueva", por semana — señal de alerta para
            reentrenamiento cuando hay clases emergentes que el modelo no reconoce
          </p>
        </div>

        {superaUmbral && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
              <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
            </svg>
            {casosUltimaSemana} casos en los últimos 7 días (umbral {UMBRAL_PLAGAS_SEMANA}): conviene reentrenar el modelo
          </div>
        )}

        <div className="mt-5">
          {solicitudes.isPending ? (
            <SinDatos cargando />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={tendencia} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
                <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis
                  tick={EJE}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.max(max, UMBRAL_PLAGAS_SEMANA + 1)]}
                />
                <Tooltip content={<TooltipPersonalizado etiqueta="Plaga nueva" sufijo=" casos" />} />
                <ReferenceLine
                  y={UMBRAL_PLAGAS_SEMANA}
                  stroke={NARANJA}
                  strokeDasharray="4 4"
                  label={{ value: 'Umbral', position: 'right', fontSize: 10, fill: NARANJA }}
                />
                <Line
                  type="monotone"
                  dataKey="casos"
                  name="Plaga nueva"
                  stroke={NARANJA}
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: NARANJA, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
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

type TooltipProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
  etiqueta?: string
  sufijo?: string
}

function TooltipPersonalizado({ active, payload, label, etiqueta, sufijo = '' }: TooltipProps) {
  // Una versión sin escaneos en el tramo llega como null: no se muestra
  const filas = payload?.filter((p) => p.value !== null)
  if (!active || !filas?.length) return null
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      {filas.map((p) => (
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

function SinDatos({ cargando }: { cargando: boolean }) {
  return (
    <p className="flex h-[200px] items-center justify-center text-sm text-gray-400">
      {cargando ? 'Cargando...' : 'Sin datos en este periodo.'}
    </p>
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
