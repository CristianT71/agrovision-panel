import { useState } from 'react'
import {
  AUDITORIA,
  MODELOS,
  type Canal,
  type EventoAuditoria,
  type Modelo,
} from './mockModelos'
import PublishModal from './PublishModal'
import KillSwitchModal from './KillSwitchModal'

const COLOR_CANAL: Record<Canal, string> = {
  Producción: 'bg-[#e8f7ee] text-agro-green',
  Canario: 'bg-amber-50 text-amber-700',
  Interno: 'bg-blue-50 text-blue-700',
  Borrador: 'bg-gray-100 text-gray-600',
  Descontinuado: 'bg-red-50 text-red-600',
}

export default function AiModels() {
  const [modelos, setModelos] = useState<Modelo[]>(MODELOS)
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>(AUDITORIA)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [apagando, setApagando] = useState<Modelo | null>(null)

  const alternar = (m: Modelo) => {
    // Encender no requiere justificación; apagar sí — RF-09.3
    if (m.activo) {
      setApagando(m)
      return
    }
    setModelos((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, activo: true, motivoDesactivacion: undefined } : x)),
    )
  }

  const desactivar = (motivo: string) => {
    if (!apagando) return
    setModelos((prev) =>
      prev.map((x) =>
        x.id === apagando.id ? { ...x, activo: false, motivoDesactivacion: motivo } : x,
      ),
    )
    // RF-09.4 — operador, estampilla de tiempo y causalidad
    setAuditoria((prev) => [
      {
        id: `e${prev.length + 1}`,
        version: apagando.version,
        operador: 'Mario Zapata C.',
        fecha: 'ahora',
        motivo,
      },
      ...prev,
    ])
    setApagando(null)
  }

  const publicar = (d: {
    version: string
    appMinima: string
    canal: Canal
    notas: string
    archivo: string
  }) => {
    setModelos((prev) => [
      {
        id: `m${Date.now()}`,
        version: d.version,
        canal: d.canal,
        publicado: new Date().toISOString().slice(0, 10),
        appMinima: d.appMinima,
        penetracion: 0,
        activo: d.canal !== 'Borrador',
        notas: d.notas || 'Sin notas de versión.',
      },
      ...prev,
    ])
    setPublicando(false)
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de modelos IA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Versiones, canales de distribución y controles de despliegue
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPublicando(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-agro-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#194b32]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
            <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
          </svg>
          Publicar nueva versión
        </button>
      </div>

      {/* RF-09.1 — inventario de empaquetados */}
      <div className="mt-6 space-y-3">
        {modelos.map((m) => {
          const abierto = expandido === m.id
          return (
            <article key={m.id} className="overflow-hidden rounded-2xl bg-white">
              {/* Fila principal */}
              <div className="flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{m.version}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_CANAL[m.canal]}`}>
                      {m.canal}
                    </span>
                    {!m.activo && m.canal !== 'Descontinuado' && (
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        Desactivado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Publicado el {m.publicado} · App mín. {m.appMinima}
                  </p>
                </div>

                {/* Penetración instalada */}
                <div className="flex shrink-0 items-center gap-3">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-agro-green"
                      style={{ width: `${Math.max(m.penetracion, 1)}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-sm text-gray-600">{m.penetracion}%</span>
                </div>

                {/* Kill-switch — RF-09.3 */}
                {m.canal !== 'Descontinuado' && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={m.activo}
                    title={m.activo ? 'Desactivar modelo' : 'Activar modelo'}
                    onClick={() => alternar(m)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      m.activo ? 'bg-agro-green' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                        m.activo ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                )}

                <button
                  type="button"
                  title={abierto ? 'Contraer' : 'Ver detalles'}
                  onClick={() => setExpandido(abierto ? null : m.id)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    abierto ? 'bg-[#eaf4ee] text-agro-green' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Detalle expandido */}
              {abierto && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <p className="text-sm text-gray-600">{m.notas}</p>

                  {/* RF-09.2 — variables de rendimiento algorítmico */}
                  {m.metricas && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Metrica etiqueta="Precisión" valor={m.metricas.precision} />
                      <Metrica etiqueta="Recall" valor={m.metricas.recall} />
                      <Metrica etiqueta="F1 Score" valor={m.metricas.f1} />
                    </div>
                  )}

                  {m.penetracion > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Despliegue gradual</span>
                        <span className="font-medium text-agro-green">
                          {m.penetracion}% de dispositivos
                        </span>
                      </div>
                      <div className="relative mt-3 h-1.5 rounded-full bg-gray-100">
                        <div
                          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-agro-green ring-4 ring-white"
                          style={{ left: `calc(${m.penetracion}% - 7px)` }}
                        />
                      </div>
                    </div>
                  )}

                  {m.motivoDesactivacion && (
                    <div className="mt-4 rounded-xl bg-red-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                        Motivo de desactivación
                      </p>
                      <p className="mt-1 text-sm text-red-700">{m.motivoDesactivacion}</p>
                    </div>
                  )}

                  {/* RF-09.6 — exportación para reentrenamiento */}
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-agro-green hover:text-agro-green"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                        <path d="M12 4v12M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 18v2h16v-2" strokeLinecap="round" />
                      </svg>
                      Exportar dataset anonimizado
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* RF-09.4 — historial de auditoría */}
      {auditoria.length > 0 && (
        <div className="mt-8 rounded-2xl bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-gray-400">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            Historial de auditoría
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Registro inmutable de las desactivaciones de modelos
          </p>

          <ul className="mt-5 space-y-4">
            {auditoria.map((e) => (
              <li key={e.id} className="flex gap-3 border-l-2 border-red-200 pl-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-mono font-semibold text-gray-900">{e.version}</span>
                    <span className="text-gray-500"> desactivada por </span>
                    <span className="font-medium text-gray-800">{e.operador}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{e.fecha}</p>
                  <p className="mt-1.5 text-sm text-gray-600">{e.motivo}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {publicando && <PublishModal onClose={() => setPublicando(false)} onPublicar={publicar} />}

      {apagando && (
        <KillSwitchModal
          modelo={apagando}
          onClose={() => setApagando(null)}
          onDesactivar={desactivar}
        />
      )}
    </div>
  )
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl bg-[#f3f9f5] px-4 py-3 text-center">
      <p className="text-xs text-gray-500">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-agro-green">{valor}%</p>
    </div>
  )
}