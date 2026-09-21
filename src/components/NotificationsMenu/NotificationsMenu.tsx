import { useEffect, useRef, useState } from 'react'
import { NOTIFICACIONES, type Notificacion } from './mockNotificaciones'

export default function NotificationsMenu() {
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(NOTIFICACIONES)
  const ref = useRef<HTMLDivElement>(null)

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  // Cerrar al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return
    const clicAfuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', clicAfuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', clicAfuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  // RF-02.6 — de "no leído" a "leído"
  const marcarTodo = () => setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))

  const marcarUna = (id: string) =>
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))

  const eliminar = (id: string) => setNotificaciones((prev) => prev.filter((n) => n.id !== id))

  return (
    <div ref={ref} className="relative">
      {/* Campana — RF-02.5 */}
      <button
        type="button"
        title="Notificaciones"
        onClick={() => setAbierto((a) => !a)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
          abierto
            ? 'bg-[#eaf4ee] text-agro-green'
            : 'text-gray-400 hover:bg-[#eaf4ee] hover:text-gray-700'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
        </svg>
        {noLeidas > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
        )}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div className="absolute right-0 top-full z-40 mt-3 w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Notificaciones</h3>
              {noLeidas > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-white">
                  {noLeidas}
                </span>
              )}
            </div>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodo}
                className="text-sm font-medium text-agro-green hover:underline"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* Lista */}
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center border-t border-gray-100 px-5 py-10 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-gray-300">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-400">No tienes notificaciones</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notificaciones.map((n) => (
                <li
                  key={n.id}
                  onClick={() => marcarUna(n.id)}
                  className={`group flex cursor-pointer gap-3 border-t border-gray-100 px-5 py-4 transition ${
                    n.leida ? 'bg-white hover:bg-gray-50' : 'bg-[#f5faf7] hover:bg-[#edf6f0]'
                  }`}
                >
                  {/* Icono según tipo */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      n.tipo === 'asignacion'
                        ? 'bg-[#e3f1e8] text-agro-green'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {n.tipo === 'asignacion' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                        <rect x="5" y="4" width="14" height="17" rx="2" />
                        <path d="M9 4V3h6v1M9 11h6M9 15h4" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>

                  {/* Texto */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm ${
                        n.leida ? 'font-medium text-gray-500' : 'font-semibold text-gray-900'
                      }`}
                    >
                      {n.titulo}
                    </p>
                    <p className={`mt-0.5 text-sm ${n.leida ? 'text-gray-400' : 'text-gray-600'}`}>
                      {n.mensaje}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-400">{n.hace}</p>
                  </div>

                  {/* Eliminar */}
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminar(n.id)
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-md text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}