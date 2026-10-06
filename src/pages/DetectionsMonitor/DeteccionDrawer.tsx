import { useEffect } from 'react'
import {
  ETIQUETAS_COMPUERTA,
  ETIQUETAS_CULTIVO,
  ETIQUETAS_ORGANO,
  type Deteccion,
} from '../../api/detecciones/detecciones.service'
import { codigoSolicitud } from '../../api/solicitudes/solicitudes.service'
import { formatearFechaHora } from '../../utils/fechas'
import { BadgeCategoria, BadgeRevision } from './insignias'
import { porcentajeConfianza } from './formato'

type Props = {
  deteccion: Deteccion
  onClose: () => void
}

// Se arma con los datos de la fila: no hace otra petición. Sin enlace a la solicitud, porque
// /solicitudes/:id es ruta del profesional y el administrador no puede abrirla.
export default function DeteccionDrawer({ deteccion: d, onClose }: Props) {
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  const r = d.revision
  const cultivoOrgano = [
    d.cultivo && ETIQUETAS_CULTIVO[d.cultivo],
    d.organo && ETIQUETAS_ORGANO[d.organo],
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900">Detalle de la detección</h2>
              <p className="mt-0.5 truncate font-mono text-xs text-gray-400" title={d.id}>
                {d.id}
              </p>
            </div>
            <button type="button" title="Cerrar" onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* RF-07.4 */}
          {d.defectuosa && (
            <div className="flex gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-4 w-4 shrink-0">
                <path d="M12 4l9 16H3l9-16Z" strokeLinejoin="round" />
                <path d="M12 10v4M12 17h.01" strokeLinecap="round" />
              </svg>
              <p>
                <strong className="font-semibold">Dato defectuoso:</strong> la inferencia devolvió confianza cero
                y no debe usarse para medir el modelo.
              </p>
            </div>
          )}

          <Grupo titulo="Predicción de la máquina">
            <Fila etiqueta="Categoría">
              <BadgeCategoria categoria={d.categoria} />
            </Fila>
            <Fila etiqueta="Clase predicha">{d.clasePredicha ?? '—'}</Fila>
            <Fila etiqueta="Confianza">
              {d.confianza === null ? '—' : `${porcentajeConfianza(d.confianza)}%`}
            </Fila>
            <Fila etiqueta="Compuerta">{ETIQUETAS_COMPUERTA[d.resultadoCompuerta]}</Fila>
            <Fila etiqueta="Puntaje fuera de dominio">{d.puntajeOod.toFixed(3)}</Fila>
            <Fila etiqueta="Versión del modelo">
              <span className="font-mono">{d.modeloVersion}</span>
            </Fila>
          </Grupo>

          {/* RF-07.3 */}
          <Grupo titulo="Revisión humana">
            <Fila etiqueta="Estado">
              <BadgeRevision revision={r} />
            </Fila>
            <Fila etiqueta="Productor">
              {r.correccionProductor
                ? `Corrigió a ${r.correccionProductor}`
                : r.confirmadaProductor
                  ? 'Confirmó el diagnóstico'
                  : 'Sin respuesta'}
            </Fila>
            <Fila etiqueta="Agrónomo">
              {r.resultadoAgronomo || r.plagaAgronomo
                ? [r.resultadoAgronomo, r.plagaAgronomo].filter(Boolean).join(' · ')
                : 'Sin respuesta'}
            </Fila>
            {r.solicitudId && (
              <Fila etiqueta="Solicitud">
                <span className="font-mono">{codigoSolicitud(r.solicitudId)}</span>
              </Fila>
            )}
          </Grupo>

          <Grupo titulo="Captura">
            <Fila etiqueta="Productor">{d.productorNombre ?? 'Sin perfil registrado'}</Fila>
            <Fila etiqueta="Municipio">{d.municipio}</Fila>
            {cultivoOrgano.length > 0 && <Fila etiqueta="Cultivo · órgano">{cultivoOrgano.join(' · ')}</Fila>}
            {d.latitud !== null && d.longitud !== null && (
              <Fila etiqueta="Coordenadas">
                <span className="font-mono">
                  {d.latitud.toFixed(5)}, {d.longitud.toFixed(5)}
                </span>
              </Fila>
            )}
            <Fila etiqueta="Capturada">{formatearFechaHora(d.fecha)}</Fila>
            <Fila etiqueta="Recibida">{formatearFechaHora(d.recibidaEn)}</Fila>
          </Grupo>
        </div>
      </aside>
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{titulo}</h3>
      <dl className="mt-3 space-y-2.5 text-sm">{children}</dl>
    </section>
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-gray-500">{etiqueta}</dt>
      <dd className="min-w-0 text-right font-medium text-gray-800">{children}</dd>
    </div>
  )
}
