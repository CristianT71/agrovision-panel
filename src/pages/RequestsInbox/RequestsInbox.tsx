import { useMemo, useState } from 'react'
import { SOLICITUDES, type EstadoSolicitud } from './mockSolicitudes'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { useNavigate } from 'react-router-dom'

type Filtro = 'Todas' | 'Mis asignadas' | EstadoSolicitud

const FILTROS: Filtro[] = [
  'Todas',
  'Mis asignadas',
  'Pendiente de subir',
  'Enviada',
  'Asignada',
  'Resuelta',
  'Descartada',
]

export default function RequestsInbox() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')

  // RF-03.4 — conteos en tiempo real
  const conteos = useMemo(() => {
    const c: Record<string, number> = { Todas: SOLICITUDES.length }
    c['Mis asignadas'] = SOLICITUDES.filter((s) => s.esMia).length
    for (const f of FILTROS) {
      if (f === 'Todas' || f === 'Mis asignadas') continue
      c[f] = SOLICITUDES.filter((s) => s.estado === f).length
    }
    return c
  }, [])

  // RF-03.2, RF-03.3, RF-03.5 — filtros y búsqueda
  const visibles = useMemo(() => {
    let lista = SOLICITUDES

    if (filtro === 'Mis asignadas') lista = lista.filter((s) => s.esMia)
    else if (filtro !== 'Todas') lista = lista.filter((s) => s.estado === filtro)

    const q = busqueda.trim().toLowerCase()
    if (q) {
      lista = lista.filter(
        (s) =>
          s.productor.toLowerCase().includes(q) ||
          s.finca.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
    }
    return lista
  }, [filtro, busqueda])

  const pendientes = conteos['Pendiente de subir'] ?? 0
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
          placeholder="Buscar por productor, finca o ID..."
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
        {visibles.length === 0 && (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            No hay solicitudes que coincidan con el filtro.
          </p>
        )}

        {visibles.map((s) => (
          <article
            key={s.id}
            className="group flex items-center gap-4 rounded-xl bg-white p-4 transition hover:shadow-sm"
          >
            <img
              src={s.imagen}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{s.id}</span>
                <StatusBadge estado={s.estado} />
                {s.plaga && <PlagaBadge plaga={s.plaga} />}
              </div>

              <p className="mt-1 font-semibold text-gray-900">{s.productor}</p>
              <p className="text-sm text-gray-500">
                {s.finca} · {s.vereda} · {s.municipio}
              </p>

              {/* Puntaje de inferencia IA */}
              {s.confianza !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">{s.versionIA}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-agro-green"
                      style={{ width: `${s.confianza}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{s.confianza}%</span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-gray-400">{s.hace}</span>
              <button
                type="button"
                onClick={() => navigate(`/solicitudes/${s.id}`)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 opacity-0 transition hover:border-agro-green hover:text-agro-green group-hover:opacity-100"
              >
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}