import { useMemo, useState } from 'react'
import { AGRONOMOS, CASOS, type Caso, type EstadoCaso } from './mockCasos'
import AssignModal from './AssignModal'
import CaseChatDrawer from './CaseChatDrawer'

type Filtro = 'Todas' | EstadoCaso

const FILTROS: Filtro[] = ['Todas', 'Pendiente', 'Enviada', 'Asignada', 'Resuelta', 'Descartada']

const COLOR_ESTADO: Record<EstadoCaso, string> = {
  Pendiente: 'bg-gray-100 text-gray-600',
  Enviada: 'bg-blue-50 text-blue-700',
  Asignada: 'bg-amber-50 text-amber-700',
  Resuelta: 'bg-green-50 text-green-700',
  Descartada: 'bg-red-50 text-red-600',
}

const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function CasesInbox() {
  const [casos, setCasos] = useState<Caso[]>(CASOS)
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [asignando, setAsignando] = useState<Caso | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)

  const casoEnChat = casos.find((c) => c.id === chatId) ?? null

  const conteos = useMemo(() => {
    const c: Record<string, number> = { Todas: casos.length }
    for (const f of FILTROS) {
      if (f === 'Todas') continue
      c[f] = casos.filter((x) => x.estado === f).length
    }
    return c
  }, [casos])

  // RF-08.2 — casos en estado de orfandad
  const sinAsignar = casos.filter((c) => !c.asignadoA && c.estado !== 'Descartada').length

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return casos.filter((c) => {
      if (filtro !== 'Todas' && c.estado !== filtro) return false
      if (!q) return true
      return [c.productor, c.finca, c.municipio, c.id].some((t) => normalizar(t).includes(q))
    })
  }, [casos, filtro, busqueda])

  // RF-08.3 — registrar la delegación vinculando ticket y recurso
  const asignar = (agronomoId: string, mensaje: string, adjuntos: string[]) => {
    if (!asignando) return
    const a = AGRONOMOS.find((x) => x.id === agronomoId)
    if (!a) return

    setCasos((prev) =>
      prev.map((c) => {
        if (c.id !== asignando.id) return c
        const nuevos = [...c.mensajes]
        if (mensaje.trim() || adjuntos.length > 0) {
          nuevos.push({
            id: `m${nuevos.length + 1}`,
            autor: 'Mario Zapata C.',
            iniciales: 'MZ',
            esAdmin: true,
            texto:
              mensaje.trim() +
              (adjuntos.length ? `\n(${adjuntos.length} archivo(s) adjunto(s))` : ''),
            fecha: 'ahora',
          })
        }
        return {
          ...c,
          estado: 'Asignada' as EstadoCaso,
          asignadoA: { id: a.id, nombre: a.nombre, iniciales: a.iniciales },
          mensajes: nuevos,
        }
      }),
    )
    setAsignando(null)
  }

  const enviarMensaje = (texto: string) => {
    if (!chatId) return
    setCasos((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              mensajes: [
                ...c.mensajes,
                {
                  id: `m${c.mensajes.length + 1}`,
                  autor: 'Mario Zapata C.',
                  iniciales: 'MZ',
                  esAdmin: true,
                  texto,
                  fecha: 'ahora',
                },
              ],
            }
          : c,
      ),
    )
  }

  // RF-08.8 — otorgar o extinguir el permiso de contacto
  const cambiarContacto = (permitido: boolean) => {
    if (!chatId) return
    setCasos((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, contactoDirecto: permitido } : c)),
    )
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
          placeholder="Buscar por productor, finca, municipio o ID..."
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
        {visibles.length === 0 && (
          <p className="rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            No hay casos que coincidan con el filtro.
          </p>
        )}

        {visibles.map((c) => (
          <article key={c.id} className="flex items-center gap-4 rounded-xl bg-white p-4">
            <img src={c.imagen} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{c.id}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[c.estado]}`}>
                  {c.estado}
                </span>
                {c.plaga && (
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {c.plaga}
                  </span>
                )}
              </div>

              <p className="mt-1 font-semibold text-gray-900">{c.productor}</p>

              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {c.finca} · {c.municipio}
                </span>
                {c.versionIA && (
                  <span className="inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                      <rect x="7" y="7" width="10" height="10" rx="2" />
                      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
                    </svg>
                    {c.versionIA}
                  </span>
                )}
                <span className="text-gray-400">{c.hace}</span>
              </p>

              {/* Agrónomo vinculado */}
              {c.asignadoA && (
                <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agro-green text-[10px] font-semibold text-white">
                    {c.asignadoA.iniciales}
                  </span>
                  Asignado a <strong className="font-semibold text-gray-800">{c.asignadoA.nombre}</strong>
                </p>
              )}

              {c.confianza !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Confianza IA</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-agro-green"
                      style={{ width: `${c.confianza}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{c.confianza}%</span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex shrink-0 items-center gap-2">
              {/* RF-08.6 — métricas de interlocución */}
              <button
                type="button"
                title="Abrir comunicación"
                onClick={() => setChatId(c.id)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:border-agro-green hover:text-agro-green"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                  <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
                </svg>
                {c.mensajes.length > 0 && c.mensajes.length}
              </button>

              <button
                type="button"
                onClick={() => setAsignando(c)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  c.asignadoA
                    ? 'border border-gray-200 text-gray-700 hover:border-agro-green hover:text-agro-green'
                    : 'bg-agro-green text-white hover:bg-[#194b32]'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
                  <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {c.asignadoA ? 'Reasignar' : 'Asignar'}
              </button>
            </div>
          </article>
        ))}
      </div>

      {asignando && (
        <AssignModal caso={asignando} onClose={() => setAsignando(null)} onAsignar={asignar} />
      )}

      {casoEnChat && (
        <CaseChatDrawer
          caso={casoEnChat}
          onClose={() => setChatId(null)}
          onEnviar={enviarMensaje}
          onCambiarContacto={cambiarContacto}
        />
      )}
    </div>
  )
}