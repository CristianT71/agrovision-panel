import { useMemo, useState } from 'react'
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
import {
  obtenerTelemetria,
  RANGOS,
  UMBRAL_PLAGAS_SEMANA,
  type Rango,
} from './mockTelemetria'

const VERDE = '#2f7d4f'
const GRIS = '#6b7280'
const NARANJA = '#f0972b'

const EJE = { fontSize: 11, fill: '#9ca3af' }

export default function Dashboard() {
  const [rango, setRango] = useState<Rango>('mes')

  // RF-06.1 — métricas delimitadas a la ventana de tiempo
  const t = useMemo(() => obtenerTelemetria(rango), [rango])

  // RF-06.7 — alerta si se supera el umbral sostenido
  const picoPlagas = Math.max(...t.tendenciaPlagas.map((p) => p.casos))
  const superaUmbral = picoPlagas >= UMBRAL_PLAGAS_SEMANA

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta
          fondo="bg-red-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="h-5 w-5">
              <path d="M3 8l6 6 4-4 8 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 13v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          etiqueta="Tasa no reconocido hoy"
          valor={`${t.metricas.tasaNoReconocido}%`}
          pie={
            <span className={t.metricas.deltaTasa < 0 ? 'text-emerald-600' : 'text-red-600'}>
              {t.metricas.deltaTasa > 0 ? '+' : ''}
              {t.metricas.deltaTasa}% vs periodo anterior
            </span>
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
          valor={t.metricas.correcciones}
          pie="En el periodo seleccionado"
        />

        <Tarjeta
          fondo="bg-blue-50"
          icono={
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" className="h-5 w-5">
              <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
              <path d="M11 18.5h2" strokeLinecap="round" />
            </svg>
          }
          etiqueta="Dispositivos actualizados"
          valor={t.metricas.dispositivosActualizados.toLocaleString('es-CO')}
          pie={`${t.metricas.tasaExitoOTA}% de éxito`}
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
          valor={t.metricas.versionMayorAdopcion}
          pie={`${t.metricas.penetracion}% de dispositivos`}
        />
      </div>

      {/* ---------- Gráficas — RF-06.3 ---------- */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Tasa de "no reconocido" por versión */}
        <Panel
          titulo='Tasa de "no reconocido" por versión'
          subtitulo="Porcentaje diario por versión de modelo"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={t.tasaPorVersion} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradGris" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRIS} stopOpacity={0.14} />
                  <stop offset="100%" stopColor={GRIS} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
              <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
              <YAxis
                tick={EJE}
                axisLine={false}
                tickLine={false}
                domain={[0, 12]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<TooltipPersonalizado sufijo="%" />} />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="v2.3.0"
                stroke={GRIS}
                strokeWidth={1.8}
                fill="url(#gradGris)"
                dot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="v2.3.1"
                stroke={VERDE}
                strokeWidth={1.8}
                fill="transparent"
                dot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="v2.4.0-beta"
                stroke={NARANJA}
                strokeWidth={1.8}
                fill="transparent"
                dot={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Correcciones por productores */}
        <Panel
          titulo="Correcciones por productores"
          subtitulo="Total de diagnósticos corregidos"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={t.correcciones} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
              <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
              <YAxis tick={EJE} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f7faf8' }} content={<TooltipPersonalizado />} />
              <Bar dataKey="total" name="Correcciones" fill={VERDE} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ---------- Estado OTA — RF-06.4 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="font-semibold text-gray-900">Estado de actualización de modelo en dispositivos</h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-3 font-medium">Versión</th>
                <th className="pb-3 font-medium">Dispositivos activos</th>
                <th className="pb-3 font-medium">Exitosos</th>
                <th className="pb-3 font-medium">Fallidos</th>
                <th className="pb-3 font-medium">Tasa de éxito</th>
              </tr>
            </thead>
            <tbody>
              {t.ota.map((f) => {
                const tasa = (f.exitosos / f.dispositivosActivos) * 100
                return (
                  <tr key={f.version} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 font-mono text-xs text-gray-700">{f.version}</td>
                    <td className="py-4 text-gray-700">
                      {f.dispositivosActivos.toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 font-medium text-emerald-600">
                      {f.exitosos.toLocaleString('es-CO')}
                    </td>
                    <td className={`py-4 font-medium ${f.fallidos > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {f.fallidos}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${tasa}%`,
                              backgroundColor: tasa === 100 ? VERDE : NARANJA,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{tasa.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Resoluciones del agrónomo — RF-06.5 ---------- */}
      <Seccion subtitulo="Cómo clasifican los agrónomos los diagnósticos — independiente de las métricas internas del modelo">
        Resoluciones del agrónomo
      </Seccion>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {t.resoluciones.map((r) => (
          <article
            key={r.id}
            className={`group rounded-2xl bg-white p-5 transition ${
              r.accion ? 'cursor-pointer border border-amber-200 hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{r.titulo}</h3>
              {r.accion && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#f0972b" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

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
            {r.accion && (
              <button
                type="button"
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
                  <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
                </svg>
                {r.accion}
              </button>
            )}
          </article>
        ))}
      </div>

      {/* ---------- Tendencia de plagas — RF-06.7 ---------- */}
      <div className="mt-5 rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Tendencia de plagas detectadas</h2>
            <p className="mt-1 text-sm text-gray-500">
              Detecciones acumuladas desde la app — señal de alerta para reentrenamiento cuando hay
              clases emergentes no reconocidas
            </p>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-agro-green hover:underline"
          >
            Ver todas
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {superaUmbral && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
              <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
              <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
            </svg>
            ≥ {UMBRAL_PLAGAS_SEMANA} casos en una semana sugiere reentrenamiento urgente
          </div>
        )}

        <div className="mt-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={t.tendenciaPlagas} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f1" vertical={false} />
              <XAxis dataKey="fecha" tick={EJE} axisLine={false} tickLine={false} />
              <YAxis tick={EJE} axisLine={false} tickLine={false} domain={[0, 8]} />
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