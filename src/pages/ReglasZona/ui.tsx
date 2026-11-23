import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { EstadoRegla } from '../../api/reglas-zona/reglas-zona.service'
import { ETIQUETA_ESTADO, type ErrorRegla } from './logica'

export const CAMPO = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-agro-green focus:outline-none disabled:bg-gray-50'
export const BOTON = 'rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
export const PRIMARIO = 'rounded-xl bg-agro-green px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50'
export const PELIGRO = 'rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white enabled:hover:bg-red-600 disabled:opacity-50'

const COLOR_ESTADO: Record<EstadoRegla, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  aprobada: 'bg-blue-50 text-blue-700',
  activa: 'bg-green-50 text-green-700',
  archivada: 'bg-amber-50 text-amber-700',
}

export function EstadoBadge({ estado }: { estado: EstadoRegla }) {
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>
}

// Aviso fijo mientras la regla no esté calibrada (RF: no presentar la tabla como criterio validado)
export function AvisoSinCalibrar() {
  return (
    <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      Estimación sin calibrar: los radios de esta tabla aún no están validados en campo.
    </p>
  )
}

export function MensajeError({ error }: { error: ErrorRegla }) {
  return (
    <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      <p>{error.mensaje}</p>
      {error.detalles.length > 0 && (
        <ul className="mt-1 list-disc pl-5">{error.detalles.map((d) => <li key={d}>{d}</li>)}</ul>
      )}
    </div>
  )
}

// Diálogo nativo (como EliminarFichaModal): sin portal, se puede renderizar en las pruebas SSR
export function Dialogo({ titulo, cerrar, children, ancho = 'max-w-md', cerrarAlClicFuera = false, etiquetaVolver = 'Cerrar' }: { titulo: string; cerrar: () => void; children: ReactNode; ancho?: string; cerrarAlClicFuera?: boolean; etiquetaVolver?: string }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    return () => elemento?.close()
  }, [])
  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      // El evento cancel de React sube por el árbol: sin esta guarda, Escape en un diálogo hijo cerraría también al padre
      onCancel={(e) => { e.preventDefault(); if (e.target === e.currentTarget) cerrar() }}
      // El <dialog> no tiene padding propio: solo el fondo (::backdrop) llega con target === currentTarget
      onClick={cerrarAlClicFuera ? (e) => { if (e.target === e.currentTarget) cerrar() } : undefined}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] ${ancho} overflow-y-auto rounded-2xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm`}
    >
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <button type="button" onClick={cerrar} aria-label={etiquetaVolver} title={etiquetaVolver} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /><path d="M20 12H9" /></svg>
          </button>
          <h2 id={idTitulo} className="text-xl font-bold text-gray-900">{titulo}</h2>
        </div>
        {children}
      </div>
    </dialog>
  )
}
