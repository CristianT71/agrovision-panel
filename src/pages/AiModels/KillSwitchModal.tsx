import { useEffect, useState } from 'react'
import type { Modelo } from './mockModelos'

type Props = {
  modelo: Modelo
  onClose: () => void
  onDesactivar: (motivo: string) => void
}

export default function KillSwitchModal({ modelo, onClose, onDesactivar }: Props) {
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  // RF-09.3 — justificación documental obligatoria
  const motivoValido = motivo.trim().length >= 10

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Apagar modelo en producción</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Estás a punto de desactivar <strong className="text-gray-700">{modelo.version}</strong>{' '}
            (canal {modelo.canal}). Esta acción afectará a{' '}
            <strong className="text-gray-700">{modelo.penetracion}%</strong> de los dispositivos
            activos y puede interrumpir el diagnóstico en campo.
          </p>
        </div>

        <div className="px-6 py-5">
          <label htmlFor="motivo" className="text-sm font-medium text-gray-700">
            Motivo de desactivación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="motivo"
            rows={3}
            autoFocus
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe la razón: falla crítica, degradación de métricas, incidente de seguridad..."
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
          />
          {motivo.trim().length > 0 && !motivoValido && (
            <p className="mt-1.5 text-xs text-amber-600">
              El motivo debe tener al menos 10 caracteres.
            </p>
          )}
          {/* RF-09.4 — registro inmutable en auditoría */}
          <p className="mt-2 text-xs text-gray-400">
            Este motivo quedará registrado en el historial de auditoría del modelo.
          </p>
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
            disabled={!motivoValido}
            onClick={() => onDesactivar(motivo.trim())}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-red-600 disabled:bg-red-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 4v8" strokeLinecap="round" />
              <path d="M7.5 7a7 7 0 1 0 9 0" strokeLinecap="round" />
            </svg>
            Desactivar
          </button>
        </div>
      </div>
    </div>
  )
}