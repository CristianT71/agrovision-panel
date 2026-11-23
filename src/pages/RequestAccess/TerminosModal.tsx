import { useEffect } from 'react'
import { TERMINOS_INTRO, TERMINOS_SECCIONES, VERSION_TERMINOS_AGRONOMO } from './terminosAgronomo'

// Ventana con el texto completo de los términos y condiciones del agrónomo
export default function TerminosModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])

  return (
    <div className="overlay-modal fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terminos-titulo"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="shrink-0 border-b border-gray-100 px-6 pb-4 pt-6">
          <h2 id="terminos-titulo" className="text-xl font-bold text-gray-900">
            Términos y condiciones
          </h2>
          <p className="mt-1 text-xs text-gray-500">Agrónomos profesionales · Versión {VERSION_TERMINOS_AGRONOMO}</p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-gray-700">
          <p>{TERMINOS_INTRO}</p>

          {TERMINOS_SECCIONES.map((seccion) => (
            <section key={seccion.titulo}>
              <h3 className="font-semibold text-gray-900">{seccion.titulo}</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5">
                {seccion.lineas.map((linea) => (
                  <li key={linea}>{linea}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-agro-green px-5 py-2 text-sm font-medium text-white transition hover:bg-[#194b32]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
