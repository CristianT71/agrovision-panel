import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { mensajeDeError } from '../../api/axios'

export const CAMPO = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-agro-green focus:outline-none'
export const BOTON = 'rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
export const PRIMARIO = 'rounded-xl bg-agro-green px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50'

export function ErrorVuelo({ error, reintentar }: { error: unknown; reintentar?: () => void }) {
  const prohibido = axios.isAxiosError(error) && error.response?.status === 403
  return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
    <p>{prohibido ? 'Acceso denegado (403). Esta sección está disponible solo para administradores.' : mensajeDeError(error, 'No se pudieron cargar los vuelos.')}</p>
    {reintentar && <button type="button" onClick={reintentar} className="mt-2 underline">Reintentar</button>}
  </div>
}
export function Paginacion({ pagina, total, limite, cambiar, cargando = false }: { pagina: number; total: number; limite: number; cambiar: (pagina: number) => void; cargando?: boolean }) {
  const paginas = Math.max(1, Math.ceil(total / limite))
  return <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-gray-500">
    <span>{total} resultados · Página {pagina} de {paginas}</span>
    <div className="flex gap-2">
      <button type="button" className={BOTON} disabled={pagina <= 1 || cargando} onClick={() => cambiar(pagina - 1)}>Anterior</button>
      <button type="button" className={BOTON} disabled={pagina >= paginas || cargando} onClick={() => cambiar(pagina + 1)}>Siguiente</button>
    </div>
  </nav>
}
export function ModalVuelo({ titulo, cerrar, children }: { titulo: string; cerrar: () => void; children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    return () => elemento?.close()
  }, [])
  return createPortal(<dialog ref={dialogo} aria-label={titulo} onCancel={e => { e.preventDefault(); cerrar() }} className="fixed inset-0 m-auto max-h-[90vh] w-[min(96vw,1100px)] overflow-y-auto rounded-2xl border-0 bg-white p-6 text-gray-800 shadow-xl backdrop:bg-black/60">
    <div className="mb-5 flex items-start justify-between gap-4"><h2 className="text-xl font-semibold">{titulo}</h2><button type="button" className={BOTON} onClick={cerrar}>Cerrar</button></div>
    {children}
  </dialog>, document.body)
}
