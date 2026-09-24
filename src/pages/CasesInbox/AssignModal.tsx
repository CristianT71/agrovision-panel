import { useEffect, useState } from 'react'
import { AGRONOMOS, type Caso } from './mockCasos'

type Props = {
  caso: Caso
  onClose: () => void
  onAsignar: (agronomoId: string, mensaje: string, adjuntos: string[]) => void
}

export default function AssignModal({ caso, onClose, onAsignar }: Props) {
  const [seleccionado, setSeleccionado] = useState<string | null>(caso.asignadoA?.id ?? null)
  const [mensaje, setMensaje] = useState('')
  const [adjuntos, setAdjuntos] = useState<string[]>([])

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

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Asignar caso a agrónomo</h2>
          <p className="mt-0.5 text-sm text-gray-500">Caso de {caso.productor}</p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Seleccionar agrónomo
          </h3>

          {/* RF-08.4 — carga de trabajo de cada especialista */}
          <div className="mt-3 space-y-2">
            {AGRONOMOS.map((a) => {
              const activo = seleccionado === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSeleccionado(a.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    activo
                      ? 'border-agro-green bg-[#f3f9f5]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
                    {a.iniciales}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {a.nombre}
                    </span>
                    <span className="block truncate text-xs text-gray-500">{a.especialidad}</span>
                  </span>
                  {activo ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-agro-green">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                        a.casosActivos === 0
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-[#e8f3ec] text-agro-green'
                      }`}
                    >
                      {a.casosActivos} {a.casosActivos === 1 ? 'caso' : 'casos'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* RF-08.5 — instrucciones y paquetería de archivos */}
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Mensaje y adjuntos <span className="normal-case text-gray-400">(opcional)</span>
          </h3>

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
            <textarea
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: Revisar urgente, posible brote nuevo en la zona..."
              className="w-full resize-none px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
            />
            <div className="flex items-center gap-2 border-t border-gray-100 bg-[#fafbfa] px-4 py-2.5">
              <button
                type="button"
                onClick={() => setAdjuntos((a) => [...a, `archivo-${a.length + 1}.pdf`])}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-agro-green"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                  <path
                    d="M21 12.8l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Adjuntar
              </button>
              {adjuntos.length > 0 && (
                <span className="text-xs text-gray-400">{adjuntos.length} archivo(s)</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!seleccionado}
            onClick={() => seleccionado && onAsignar(seleccionado, mensaje, adjuntos)}
            className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
              <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Asignar
          </button>
        </div>
      </div>
    </div>
  )
}