import { useEffect } from 'react'
import { codigoSolicitud, type Solicitud } from '../../api/solicitudes/solicitudes.service'
import AnexosLectura from '../../components/AnexosLectura/AnexosLectura'
import { PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'
import TarjetaUbicacion from '../../components/MapaUbicacion/TarjetaUbicacion'
import CanalCoordinacion from '../RequestDetail/CanalCoordinacion'
import PermisoContacto from './PermisoContacto'

type Props = {
  solicitud: Solicitud
  nombreAgronomo: string | null
  onClose: () => void
}

// Lo que resolvió el agrónomo; el texto va como texto plano y conserva los saltos de línea
function ResolucionProfesional({ solicitud: s, nombreAgronomo }: { solicitud: Solicitud; nombreAgronomo: string | null }) {
  return (
    <section className="bg-[#e8f7ee] p-4">
      <h3 className="text-sm font-semibold text-agro-green">Resolución del profesional</h3>
      <div className="mt-2 space-y-1 text-xs text-[#4a8563]">
        <p>
          Resuelta por <strong className="font-semibold">{nombreAgronomo ?? 'agrónomo'}</strong>
        </p>
        {s.fechaResolucion && <p>{formatearFechaHora(s.fechaResolucion)}</p>}
        {s.tipoResultado && (
          <p>
            Tipo de resultado: <strong className="font-semibold">{s.tipoResultado}</strong>
          </p>
        )}
        {s.plagaIdentificada && (
          <p className="flex items-center gap-1.5">
            Plaga identificada: <PlagaBadge plaga={s.plagaIdentificada} />
          </p>
        )}
      </div>
      {s.respuestaProfesional?.trim() ? (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#2f6b4a]">
          {s.respuestaProfesional}
        </p>
      ) : (
        <p className="mt-3 text-sm italic text-[#4a8563]">Sin texto de respuesta</p>
      )}
      <AnexosLectura solicitudId={s.id} />
    </section>
  )
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
    <div className="overlay-drawer fixed inset-0 z-50 flex justify-end">
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

        {/* RF-08.8 — permiso de contacto directo (ACL) */}
        <PermisoContacto solicitud={solicitud} />

        {/* Resolución aparte del chat, con su propio scroll para que un texto largo no lo tape */}
        {solicitud.estado === 'Resuelta' && (
          <div className="max-h-[45%] shrink-0 overflow-y-auto border-b border-gray-200">
            <ResolucionProfesional solicitud={solicitud} nombreAgronomo={nombreAgronomo} />
          </div>
        )}

        {/* RF-08.7 — el canal solo funciona con un agrónomo vinculado */}
        <div className="flex-1 overflow-y-auto">
          {solicitud.estado === 'Descartada' && (
            <div className="border-b border-gray-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">Solicitud descartada</p>
              {solicitud.fechaResolucion && (
                <p className="text-xs">{formatearFecha(solicitud.fechaResolucion)}</p>
              )}
            </div>
          )}
          {/* Dónde se tomó la foto: la API decide si el administrador puede verla */}
          <div className="border-b border-gray-100 p-3">
            <TarjetaUbicacion solicitudId={solicitud.id} tieneUbicacion={solicitud.tieneUbicacion} />
          </div>
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
