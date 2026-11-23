import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { clavesPlagas, plagasService, type Plaga } from '../../api/plagas/plagas.service'
import { mensajeDeError } from '../../api/axios'

type Props = {
  ficha: Plaga
  onClose: () => void
  onEliminada: () => void
}

function mensajeEliminacion(error: unknown): string {
  const estado = axios.isAxiosError(error) ? error.response?.status : undefined
  switch (estado) {
    case 409: return 'Esta ficha está protegida y no se puede eliminar.'
    case 404: return 'La ficha ya no existe. Cierra el panel y actualiza el catálogo.'
    case 403: return 'No tienes permiso para eliminar fichas. Solo puede hacerlo un agrónomo.'
    default: return mensajeDeError(error, 'No se pudo eliminar la ficha. Inténtalo de nuevo.')
  }
}

export default function EliminarFichaModal({ ficha, onClose, onEliminada }: Props) {
  const [confirmacion, setConfirmacion] = useState('')
  const dialogo = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const eliminar = useMutation({
    mutationFn: () => plagasService.eliminar(ficha.id),
    onSuccess: async () => {
      // Cancela respuestas anteriores para que no repongan la ficha eliminada.
      await queryClient.cancelQueries({ queryKey: clavesPlagas.todas })
      queryClient.setQueriesData<Plaga[]>({ queryKey: clavesPlagas.listas }, (fichas) =>
        fichas?.filter((actual) => actual.id !== ficha.id),
      )
      queryClient.removeQueries({ queryKey: clavesPlagas.todas, type: 'inactive' })
      onEliminada()
      await queryClient.invalidateQueries({ queryKey: clavesPlagas.todas })
    },
  })

  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    return () => elemento?.close()
  }, [])

  const cerrar = () => {
    if (!eliminar.isPending) onClose()
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="eliminar-ficha-titulo"
      aria-describedby="eliminar-ficha-aviso"
      onCancel={(e) => { e.preventDefault(); cerrar() }}
      onClick={(e) => { if (e.target === e.currentTarget) cerrar() }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={(e) => {
        e.preventDefault()
        if (confirmacion === 'ELIMINAR' && !ficha.protegida && !eliminar.isPending) eliminar.mutate()
      }}>
        <div className="px-6 pt-6">
          <h2 id="eliminar-ficha-titulo" className="text-xl font-bold text-gray-900">Eliminar ficha</h2>
          <p className="mt-2 text-sm text-gray-500">Vas a eliminar la ficha <strong>{ficha.nombreComun}</strong>.</p>
          <p id="eliminar-ficha-aviso" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-600">
            Esta acción no se puede deshacer. La ficha desaparecerá también de las aplicaciones móviles en su próxima sincronización.
          </p>
        </div>
        <div className="px-6 py-5">
          <label htmlFor="eliminar-ficha-confirmacion" className="text-sm font-medium text-gray-700">
            Escribe ELIMINAR para confirmar
          </label>
          <input
            id="eliminar-ficha-confirmacion"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={confirmacion}
            disabled={eliminar.isPending}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none disabled:bg-gray-50"
          />
          {eliminar.isError && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {mensajeEliminacion(eliminar.error)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={cerrar} disabled={eliminar.isPending}
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={confirmacion !== 'ELIMINAR' || !!ficha.protegida || eliminar.isPending}
            className="rounded-lg bg-red-500 px-3 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300">
            {eliminar.isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
