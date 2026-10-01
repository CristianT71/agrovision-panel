import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ETIQUETAS_CANAL,
  MAX_PORCENTAJE_CANARIO,
  MIN_PORCENTAJE_CANARIO,
  SIGUIENTE_CANAL,
  clavesModelos,
  modelosService,
  porcentaje,
  type Canal,
  type EventoAuditoria,
  type Modelo,
} from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'
import { formatearFechaHora } from '../../utils/fechas'
import { tamanoLegible } from '../../utils/archivos'
import MetricasModal from './MetricasModal'

export default function ModeloDetalle({ modelo: m }: { modelo: Modelo }) {
  const [editandoMetricas, setEditandoMetricas] = useState(false)
  const global = m.metricas.find((x) => x.clase === null)
  const porClase = m.metricas.filter((x) => x.clase !== null)

  return (
    <div className="border-t border-gray-100 px-5 py-5">
      <p className="text-sm text-gray-600">{m.notas ?? 'Sin notas de versión.'}</p>

      {/* Datos técnicos del artefacto */}
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <DatoTecnico etiqueta="Formato" valor={`.${m.formato}`} />
        <DatoTecnico etiqueta="Tamaño" valor={tamanoLegible(m.tamanoBytes)} />
        <DatoTecnico etiqueta="Clases" valor={m.numeroClases?.toString() ?? '—'} />
        <DatoTecnico etiqueta="Firma Ed25519" valor={m.firmado ? 'Firmado' : 'Sin firma'} />
        <div className="col-span-2 sm:col-span-4">
          <dt className="text-xs text-gray-400">SHA-256</dt>
          <dd className="truncate font-mono text-xs text-gray-600" title={m.sha256}>
            {m.sha256}
          </dd>
        </div>
      </dl>

      {/* RF-09.2 — variables de rendimiento algorítmico */}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Métricas</h3>
          {(m.canal === 'borrador' || m.canal === 'interno') && (
            <button
              type="button"
              onClick={() => setEditandoMetricas(true)}
              className="text-sm font-medium text-agro-green hover:underline"
            >
              {global ? 'Actualizar métricas' : 'Registrar métricas'}
            </button>
          )}
        </div>

        {global ? (
          <>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Metrica etiqueta="Precisión" valor={global.precision} />
              <Metrica etiqueta="Recall" valor={global.recall} />
              <Metrica etiqueta="F1 Score" valor={global.f1} />
            </div>

            {porClase.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-400">
                    <tr>
                      <th className="py-1.5 font-medium">Clase</th>
                      <th className="py-1.5 text-right font-medium">Precisión</th>
                      <th className="py-1.5 text-right font-medium">Recall</th>
                      <th className="py-1.5 text-right font-medium">F1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-700">
                    {porClase.map((x) => (
                      <tr key={x.clase}>
                        <td className="py-1.5">{x.clase}</td>
                        <td className="py-1.5 text-right">{porcentaje(x.precision)}%</td>
                        <td className="py-1.5 text-right">{porcentaje(x.recall)}%</td>
                        <td className="py-1.5 text-right">{porcentaje(x.f1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-400">Sin métricas registradas. Son obligatorias para publicarlo.</p>
        )}
      </div>

      {/* RF-09.1 — despliegue gradual del canario */}
      {m.canal === 'canario' && m.porcentajeCanario !== null && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Despliegue gradual</span>
            <span className="font-medium text-agro-green">{m.porcentajeCanario}% de dispositivos</span>
          </div>
          <div className="relative mt-3 h-1.5 rounded-full bg-gray-100">
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-agro-green ring-4 ring-white"
              style={{ left: `calc(${m.porcentajeCanario}% - 7px)` }}
            />
          </div>
        </div>
      )}

      {m.killSwitch && m.motivoKillSwitch && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
            Kill-switch{m.fechaKillSwitch && ` · ${formatearFechaHora(m.fechaKillSwitch)}`}
          </p>
          <p className="mt-1 text-sm text-red-700">{m.motivoKillSwitch}</p>
        </div>
      )}

      {/* RF-09.5 — pipeline de liberación */}
      <AccionesPipeline modelo={m} />

      {/* RF-09.4 — historial inmutable de esta versión */}
      <Auditoria modeloId={m.id} />

      {editandoMetricas && <MetricasModal modelo={m} onClose={() => setEditandoMetricas(false)} />}
    </div>
  )
}

function AccionesPipeline({ modelo: m }: { modelo: Modelo }) {
  const queryClient = useQueryClient()
  const [porcentajeCanario, setPorcentajeCanario] = useState(m.porcentajeCanario ?? 10)
  const [confirmarRetiro, setConfirmarRetiro] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const cambiar = useMutation({
    mutationFn: (canal: Canal) =>
      modelosService.cambiarCanal(m.id, canal, canal === 'canario' ? porcentajeCanario : undefined),
    onSuccess: ({ retirado }) => {
      setConfirmarRetiro(false)
      // Al llegar a producción la API retira la versión que estaba vigente
      setAviso(retirado ? `v${retirado.version} pasó a descontinuada.` : null)
      queryClient.invalidateQueries({ queryKey: clavesModelos.todos })
    },
  })

  if (m.canal === 'descontinuado') {
    return (
      <p className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-400">
        Versión fuera del pipeline. Para volver a publicar, sube una versión nueva.
      </p>
    )
  }

  const siguiente = m.killSwitch ? null : SIGUIENTE_CANAL[m.canal]
  const pideCanario = siguiente === 'canario' || (m.canal === 'canario' && !m.killSwitch)
  const porcentajeValido =
    Number.isInteger(porcentajeCanario) &&
    porcentajeCanario >= MIN_PORCENTAJE_CANARIO &&
    porcentajeCanario <= MAX_PORCENTAJE_CANARIO

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {pideCanario && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            Canario al
            <input
              type="number"
              min={MIN_PORCENTAJE_CANARIO}
              max={MAX_PORCENTAJE_CANARIO}
              value={porcentajeCanario}
              onChange={(e) => setPorcentajeCanario(Number(e.target.value))}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-agro-green focus:outline-none"
            />
            %
          </label>
        )}

        {siguiente && (
          <button
            type="button"
            disabled={cambiar.isPending || (siguiente === 'canario' && !porcentajeValido)}
            onClick={() => cambiar.mutate(siguiente)}
            className="rounded-lg bg-agro-green px-3 py-2 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            Pasar a {ETIQUETAS_CANAL[siguiente]}
          </button>
        )}

        {m.canal === 'canario' && !m.killSwitch && (
          <button
            type="button"
            disabled={cambiar.isPending || !porcentajeValido || porcentajeCanario === m.porcentajeCanario}
            onClick={() => cambiar.mutate('canario')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition enabled:hover:border-agro-green enabled:hover:text-agro-green disabled:opacity-50"
          >
            Ajustar porcentaje
          </button>
        )}

        {/* Descontinuar no tiene vuelta atrás: se confirma con un segundo clic */}
        <button
          type="button"
          disabled={cambiar.isPending}
          onClick={() => (confirmarRetiro ? cambiar.mutate('descontinuado') : setConfirmarRetiro(true))}
          onBlur={() => setConfirmarRetiro(false)}
          className={`rounded-lg px-3 py-2 text-sm transition ${
            confirmarRetiro
              ? 'bg-red-500 font-medium text-white hover:bg-red-600'
              : 'border border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600'
          }`}
        >
          {confirmarRetiro ? '¿Seguro? Clic de nuevo para descontinuar' : 'Descontinuar'}
        </button>

        {/* RF-09.6 — la app todavía no sube las imágenes de las capturas */}
        <button
          type="button"
          disabled
          title="Disponible cuando la app envíe las imágenes de las capturas"
          className="ml-auto flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <path d="M12 4v12M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 18v2h16v-2" strokeLinecap="round" />
          </svg>
          Exportar dataset anonimizado
        </button>
      </div>

      {(siguiente === 'canario' || siguiente === 'produccion') && (
        <p className="mt-2 text-xs text-gray-400">
          Para llegar a los teléfonos debe ser .tflite firmado, tener métricas y una versión mayor que la de
          producción.
        </p>
      )}
      {aviso && <p className="mt-2 text-xs text-agro-green">{aviso}</p>}
      {cambiar.isError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {mensajeDeError(cambiar.error, 'No se pudo cambiar el canal del modelo.')}
        </p>
      )}
    </div>
  )
}

function Auditoria({ modeloId }: { modeloId: string }) {
  const consulta = useQuery({
    queryKey: clavesModelos.auditoria(modeloId),
    queryFn: () => modelosService.auditoria(modeloId),
  })

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-gray-400">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
        Historial de auditoría
      </h3>
      <p className="text-xs text-gray-400">Registro inmutable: nadie puede corregirlo ni borrarlo</p>

      {consulta.isPending ? (
        <p className="mt-3 text-sm text-gray-400">Cargando historial...</p>
      ) : consulta.isError ? (
        <p className="mt-3 text-sm text-red-600">{mensajeDeError(consulta.error, 'No se pudo cargar el historial.')}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {consulta.data.map((e) => (
            <li
              key={e.id}
              className={`border-l-2 pl-4 ${e.accion === 'kill_switch' ? 'border-red-200' : 'border-[#cfe3d6]'}`}
            >
              <p className="text-sm text-gray-800">{describir(e)}</p>
              <p className="mt-0.5 text-xs text-gray-400" title={`Usuario ${e.actorUsuarioId}`}>
                Administrador · {formatearFechaHora(e.fecha)}
              </p>
              {e.motivo && <p className="mt-1 text-sm text-gray-600">{e.motivo}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function describir(e: EventoAuditoria): string {
  const d = e.detalle ?? {}
  const canal = (valor: unknown) => ETIQUETAS_CANAL[valor as Canal] ?? String(valor)

  switch (e.accion) {
    case 'subida':
      return d.firmado ? 'Subió la versión firmada' : 'Subió la versión sin firma'
    case 'metricas':
      return 'Registró las métricas del modelo'
    case 'kill_switch':
      return 'Activó el kill-switch'
    case 'cambio_canal': {
      const base = `Movió de ${canal(d.de)} a ${canal(d.a)}`
      if (d.reemplazadoPor) return `${base} al publicarse v${String(d.reemplazadoPor)}`
      if (d.a === 'canario' && d.porcentajeCanario) return `${base} (${String(d.porcentajeCanario)}% de dispositivos)`
      return base
    }
  }
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl bg-[#f3f9f5] px-4 py-3 text-center">
      <p className="text-xs text-gray-500">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-agro-green">{porcentaje(valor)}%</p>
    </div>
  )
}

function DatoTecnico({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{etiqueta}</dt>
      <dd className="text-gray-700">{valor}</dd>
    </div>
  )
}
