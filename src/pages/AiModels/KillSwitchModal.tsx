import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ETIQUETAS_CANAL,
  MIN_JUSTIFICACION,
  clavesModelos,
  modelosService,
  type Modelo,
} from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'

type Props = {
  modelo: Modelo
  onClose: () => void
}

export default function KillSwitchModal({ modelo, onClose }: Props) {
  const queryClient = useQueryClient()
  const [justificacion, setJustificacion] = useState('')

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  // RF-09.3 / RF-09.4 — la justificación queda como causa en el registro inmutable
  const activar = useMutation({
    mutationFn: () => modelosService.activarKillSwitch(modelo.id, justificacion.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clavesModelos.todos })
      onClose()
    },
  })

  const valida = justificacion.trim().length >= MIN_JUSTIFICACION

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Activar kill-switch</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Vas a retirar <strong className="text-gray-700">v{modelo.version}</strong> (canal{' '}
            {ETIQUETAS_CANAL[modelo.canal]}). Los teléfonos que la tienen vuelven a su modelo anterior en su
            próxima consulta, que hoy usa <strong className="text-gray-700">{modelo.adopcion?.porcentaje ?? 0}%</strong>{' '}
            de los productores activos. <strong className="text-gray-700">No se puede deshacer</strong>: después solo
            se puede descontinuar.
          </p>
        </div>

        <div className="px-6 py-5">
          <label htmlFor="justificacion" className="text-sm font-medium text-gray-700">
            Justificación <span className="text-red-500">*</span>
          </label>
          <textarea
            id="justificacion"
            rows={3}
            autoFocus
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Describe la razón: falla crítica, degradación de métricas, incidente de seguridad..."
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-red-400 focus:outline-none"
          />
          {justificacion.trim().length > 0 && !valida && (
            <p className="mt-1.5 text-xs text-amber-600">
              La justificación debe tener al menos {MIN_JUSTIFICACION} caracteres.
            </p>
          )}
          {/* RF-09.4 — registro inmutable en auditoría */}
          <p className="mt-2 text-xs text-gray-400">
            Quedará registrada con tu usuario y la hora en el historial de auditoría del modelo.
          </p>
          {activar.isError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {mensajeDeError(activar.error, 'No se pudo activar el kill-switch.')}
            </p>
          )}
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
            disabled={!valida || activar.isPending}
            onClick={() => activar.mutate()}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-red-600 disabled:bg-red-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 4v8" strokeLinecap="round" />
              <path d="M7.5 7a7 7 0 1 0 9 0" strokeLinecap="round" />
            </svg>
            {activar.isPending ? 'Retirando...' : 'Retirar versión'}
          </button>
        </div>
      </div>
    </div>
  )
}
