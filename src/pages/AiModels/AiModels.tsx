import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ETIQUETAS_CANAL, clavesModelos, modelosService, type Canal, type Modelo } from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'
import { formatearFecha } from '../../utils/fechas'
import PublishModal from './PublishModal'
import KillSwitchModal from './KillSwitchModal'
import ModeloDetalle from './ModeloDetalle'

const COLOR_CANAL: Record<Canal, string> = {
  produccion: 'bg-[#e8f7ee] text-agro-green',
  canario: 'bg-amber-50 text-amber-700',
  interno: 'bg-blue-50 text-blue-700',
  borrador: 'bg-gray-100 text-gray-600',
  descontinuado: 'bg-red-50 text-red-600',
}

export default function AiModels() {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [apagando, setApagando] = useState<Modelo | null>(null)

  // RF-09.1 — inventario con canal, compatibilidad, métricas y adopción
  const consulta = useQuery({
    queryKey: clavesModelos.lista,
    queryFn: () => modelosService.listar(),
  })

  const modelos = consulta.data ?? []

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
          Subir nueva versión
        </button>
      </div>

      {/* RF-09.1 — inventario de empaquetados */}
      {consulta.isPending ? (
        <p className="mt-6 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">Cargando modelos...</p>
      ) : consulta.isError ? (
        <p className="mt-6 rounded-xl bg-red-50 px-5 py-10 text-center text-sm text-red-600">
          {mensajeDeError(consulta.error, 'No se pudo cargar el inventario de modelos.')}
        </p>
      ) : modelos.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
          Aún no hay modelos. Sube la primera versión con "Subir nueva versión".
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {modelos.map((m) => {
            const abierto = expandido === m.id
            const publicado = m.canal === 'canario' || m.canal === 'produccion'
            const adopcion = m.adopcion?.porcentaje ?? 0

            return (
              <article key={m.id} className="overflow-hidden rounded-2xl bg-white">
                {/* Fila principal */}
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900">v{m.version}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_CANAL[m.canal]}`}>
                        {ETIQUETAS_CANAL[m.canal]}
                        {m.canal === 'canario' && m.porcentajeCanario !== null && ` · ${m.porcentajeCanario}%`}
                      </span>
                      {m.killSwitch && (
                        <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          Kill-switch activo
                        </span>
                      )}
                      {m.formato === 'pt' && (
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          .pt · solo referencia
                        </span>
                      )}
                      {m.formato === 'tflite' && !m.firmado && (
                        <span
                          className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                          title="La API no tenía clave de firma al subirlo: no se puede publicar"
                        >
                          Sin firma
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {m.fechaPublicacion
                        ? `Publicado el ${formatearFecha(m.fechaPublicacion)}`
                        : `Subido el ${formatearFecha(m.fechaCreacion)}`}{' '}
                      · App mín. {m.versionMinApp}
                    </p>
                  </div>

                  {/* RF-09.1 — penetración instalada (productores que lo usan en los últimos 30 días) */}
                  <div
                    className="flex shrink-0 items-center gap-3"
                    title={`${m.adopcion?.productores ?? 0} productores en los últimos 30 días`}
                  >
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-agro-green" style={{ width: `${Math.max(adopcion, 1)}%` }} />
                    </div>
                    <span className="w-12 text-right text-sm text-gray-600">{adopcion}%</span>
                  </div>

                  {/* Kill-switch — RF-09.3: solo sobre versiones que ya están en teléfonos */}
                  {publicado && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={m.activo}
                      disabled={m.killSwitch}
                      title={m.killSwitch ? 'Retirado con kill-switch' : 'Activar kill-switch'}
                      onClick={() => setApagando(m)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed ${
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

                {/* Detalle expandido: se monta solo abierto, así la auditoría se consulta al abrir */}
                {abierto && <ModeloDetalle modelo={m} />}
              </article>
            )
          })}
        </div>
      )}

      {publicando && <PublishModal onClose={() => setPublicando(false)} />}

      {apagando && <KillSwitchModal modelo={apagando} onClose={() => setApagando(null)} />}
    </div>
  )
}
