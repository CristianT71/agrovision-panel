import { useEffect } from 'react'
import { codigoSolicitud, type Solicitud } from '../../api/solicitudes/solicitudes.service'
import AnexosLectura from '../../components/AnexosLectura/AnexosLectura'
import { PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'

type Props = {
  solicitud: Solicitud
  nombreAgronomo: string | null
  onClose: () => void
}

// Resolución del agrónomo en un modal propio, aparte del canal de coordinación.
// El texto va como texto plano y conserva los saltos de línea.
export default function ResolucionModal({ solicitud: s, nombreAgronomo, onClose }: Props) {
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  const descartada = s.estado === 'Descartada'

  return (
    <div className="overlay-modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {descartada ? 'Solicitud descartada' : 'Resolución del profesional'}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-gray-400">
              {codigoSolicitud(s.id)} · {s.finca}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {descartada ? (
            s.fechaResolucion && <p className="text-sm text-gray-500">{formatearFecha(s.fechaResolucion)}</p>
          ) : (
            <>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  Resuelta por <strong className="font-semibold text-gray-800">{nombreAgronomo ?? 'agrónomo'}</strong>
                </p>
                {s.fechaResolucion && <p className="text-gray-500">{formatearFechaHora(s.fechaResolucion)}</p>}
                {s.tipoResultado && (
                  <p>
                    Tipo de resultado: <strong className="font-semibold text-gray-800">{s.tipoResultado}</strong>
                  </p>
                )}
                {s.plagaIdentificada && (
                  <p className="flex items-center gap-1.5">
                    Plaga identificada: <PlagaBadge plaga={s.plagaIdentificada} />
                  </p>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-[#e8f7ee] p-4">
                {s.respuestaProfesional?.trim() ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#2f6b4a]">
                    {s.respuestaProfesional}
                  </p>
                ) : (
                  <p className="text-sm italic text-[#4a8563]">Sin texto de respuesta</p>
                )}
                <AnexosLectura solicitudId={s.id} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
