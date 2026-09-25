import { useEffect } from 'react'
import { codigoSolicitud, type Solicitud } from '../../api/solicitudes/solicitudes.service'
import Toggle from '../../components/Toggle/Toggle'
import CanalCoordinacion from '../RequestDetail/CanalCoordinacion'

type Props = {
  solicitud: Solicitud
  nombreAgronomo: string | null
  onClose: () => void
}

export default function CaseChatDrawer({ solicitud, nombreAgronomo, onClose }: Props) {
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Encabezado */}
        <header className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-bold text-gray-900">{solicitud.finca}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-1 font-mono text-xs text-gray-400">{codigoSolicitud(solicitud.id)}</p>
          <p className="text-xs text-gray-500">
            {solicitud.agronomoId ? (
              <>
                Asignado a <strong className="text-gray-800">{nombreAgronomo ?? 'agrónomo'}</strong>
              </>
            ) : (
              <span className="text-amber-600">Sin agrónomo asignado</span>
            )}
          </p>
        </header>

        {/* RF-08.8 — permiso de contacto directo (ACL); la API aún no lo expone */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">Contacto directo con productor</p>
            <p className="text-xs text-gray-500">
              Disponible cuando la API exponga el permiso de contacto (RF-08.8)
            </p>
          </div>
          <Toggle activo={false} onChange={() => {}} etiqueta="Contacto directo con productor" disabled />
        </div>

        {/* RF-08.7 — el canal solo funciona con un agrónomo vinculado */}
        <div className="flex-1 overflow-y-auto">
          <CanalCoordinacion
            solicitudId={solicitud.id}
            yo="admin"
            habilitado={!!solicitud.agronomoId}
          />
        </div>
      </aside>
    </div>
  )
}
