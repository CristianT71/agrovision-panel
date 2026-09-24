import { useEffect, useState } from 'react'
import type { Caso, MensajeCaso } from './mockCasos'

type Props = {
  caso: Caso
  onClose: () => void
  onEnviar: (texto: string) => void
  onCambiarContacto: (permitido: boolean) => void
}

export default function CaseChatDrawer({ caso, onClose, onEnviar, onCambiarContacto }: Props) {
  const [borrador, setBorrador] = useState('')

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  // RF-08.7 — no se permite mensajería sin agrónomo vinculado
  const sinAgronomo = !caso.asignadoA

  const enviar = () => {
    const texto = borrador.trim()
    if (!texto || sinAgronomo) return
    onEnviar(texto)
    setBorrador('')
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Encabezado */}
        <header className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold text-gray-900">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-agro-green">
                <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
              </svg>
              Comunicación del caso
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-1 font-mono text-xs text-gray-400">{caso.id}</p>
          <p className="text-xs text-gray-500">
            {caso.asignadoA ? (
              <>
                Asignado a <strong className="text-gray-800">{caso.asignadoA.nombre}</strong>
              </>
            ) : (
              <span className="text-amber-600">Sin agrónomo asignado</span>
            )}
          </p>
        </header>

        {/* RF-08.8 — permiso de contacto directo (ACL) */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className={caso.contactoDirecto ? 'text-agro-green' : 'text-gray-400'}>
              {caso.contactoDirecto ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                  <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                  <path d="M4 4l16 16" strokeLinecap="round" />
                  <path d="M12 3l7 3v6c0 2-.6 3.7-1.6 5.1M7 7.2V6l1.6-.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">Contacto directo con productor</p>
              <p className="text-xs text-gray-500">
                {caso.contactoDirecto
                  ? 'Habilitado por Mario Zapata C.'
                  : 'El agrónomo no puede contactar al productor aún'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={caso.contactoDirecto}
              disabled={sinAgronomo}
              title={caso.contactoDirecto ? 'Revocar permiso' : 'Otorgar permiso'}
              onClick={() => onCambiarContacto(!caso.contactoDirecto)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
                caso.contactoDirecto ? 'bg-agro-green' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  caso.contactoDirecto ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* El teléfono solo aparece con el permiso otorgado */}
          {caso.contactoDirecto && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#d6ebde] bg-[#f5faf7] px-4 py-2.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0 text-agro-green">
                <path
                  d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{caso.productor}</p>
                <p className="text-sm text-gray-600">{caso.telefonoProductor}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bitácora */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {caso.mensajes.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Aún no hay mensajes en este caso.
            </p>
          ) : (
            caso.mensajes.map((m: MensajeCaso) => (
              <div key={m.id} className={`flex gap-2 ${m.esAdmin ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                    m.esAdmin ? 'bg-agro-green text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {m.iniciales}
                </div>
                <div className={`min-w-0 flex-1 ${m.esAdmin ? 'text-right' : ''}`}>
                  <p className="text-[11px] text-gray-400">{m.autor}</p>
                  <div
                    className={`mt-1 inline-block rounded-xl px-3 py-2 text-left text-sm ${
                      m.esAdmin ? 'bg-agro-green text-white' : 'bg-[#eef4f0] text-gray-700'
                    }`}
                  >
                    {m.texto}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{m.fecha}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Redacción */}
        <div className="border-t border-gray-100 p-4">
          {sinAgronomo ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Asigna un agrónomo al caso para habilitar el canal de coordinación.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
              <textarea
                rows={2}
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar()
                }}
                placeholder={`Mensaje para ${caso.asignadoA?.nombre}...`}
                className="w-full resize-none px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-[#fafbfa] px-3 py-2">
                <span className="text-xs text-gray-400">Ctrl + Enter para enviar</span>
                <button
                  type="button"
                  onClick={enviar}
                  disabled={borrador.trim() === ''}
                  className="flex items-center gap-1.5 rounded-lg bg-agro-green px-3 py-1.5 text-sm text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" strokeLinejoin="round" />
                  </svg>
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}