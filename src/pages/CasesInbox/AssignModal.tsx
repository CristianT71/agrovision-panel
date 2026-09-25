import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  clavesSolicitudes,
  codigoSolicitud,
  solicitudesService,
  type Solicitud,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import {
  MAX_ADJUNTOS_MENSAJE,
  TIPOS_ADJUNTO_MENSAJE,
  clavesMensajes,
  mensajesService,
} from '../../api/mensajes/mensajes.service'
import { mensajeDeError } from '../../api/axios'
import { iniciales } from './iniciales'

type Props = {
  solicitud: Solicitud
  onClose: () => void
  // Aviso para la bandeja cuando se asignó pero el mensaje no se pudo enviar
  onAsignada: (aviso: string | null) => void
}

export default function AssignModal({ solicitud, onClose, onAsignada }: Props) {
  const queryClient = useQueryClient()
  const actual = solicitud.agronomoId
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])
  const [errorArchivos, setErrorArchivos] = useState('')
  const inputArchivos = useRef<HTMLInputElement>(null)

  // RF-08.4 — especialistas activos y su carga de trabajo
  const agronomos = useQuery({
    queryKey: clavesAgronomos.lista({ estado: 'activo' }),
    queryFn: () => agronomosService.listar({ estado: 'activo' }),
  })

  // RF-08.3 / RF-08.5 — primero se asigna; solo si funciona se envían las instrucciones
  const confirmar = useMutation({
    mutationFn: async (agronomoId: string) => {
      await solicitudesService.asignar(solicitud.id, agronomoId)

      if (mensaje.trim() === '' && archivos.length === 0) return null
      try {
        await mensajesService.enviar(solicitud.id, { contenido: mensaje, adjuntos: archivos })
        return null
      } catch (error) {
        return `Se asignó, pero no se pudo enviar el mensaje: ${mensajeDeError(error, 'error inesperado.')}`
      }
    },
    onSuccess: (aviso) => {
      queryClient.invalidateQueries({ queryKey: clavesSolicitudes.todas })
      queryClient.invalidateQueries({ queryKey: clavesAgronomos.todos })
      queryClient.invalidateQueries({ queryKey: clavesMensajes.todos })
      onAsignada(aviso)
    },
    onError: (error) => {
      // Otra persona la asignó al mismo tiempo: se recarga para mostrar el estado real
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: clavesSolicitudes.todas })
      }
    },
  })

  const ocupado = confirmar.isPending
  const cerrar = () => {
    if (!ocupado) onClose()
  }

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose, ocupado])

  const agregarArchivos = (lista: FileList | null) => {
    if (!lista) return
    const nuevos = Array.from(lista)
    setErrorArchivos('')

    if (nuevos.some((f) => !TIPOS_ADJUNTO_MENSAJE.includes(f.type))) {
      setErrorArchivos('Solo se permiten archivos PDF, JPG o PNG.')
      return
    }
    if (archivos.length + nuevos.length > MAX_ADJUNTOS_MENSAJE) {
      setErrorArchivos(`Puedes adjuntar máximo ${MAX_ADJUNTOS_MENSAJE} archivos por mensaje.`)
      return
    }
    setArchivos((prev) => [...prev, ...nuevos])
  }

  const accion = actual ? 'Reasignar' : 'Asignar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={cerrar} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">
            {actual ? 'Reasignar caso a otro agrónomo' : 'Asignar caso a agrónomo'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {solicitud.finca} · <span className="font-mono">{codigoSolicitud(solicitud.id)}</span>
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Seleccionar agrónomo
          </h3>

          <div className="mt-3 space-y-2">
            {agronomos.isPending ? (
              <p className="py-4 text-center text-sm text-gray-400">Cargando agrónomos...</p>
            ) : agronomos.isError ? (
              <div className="rounded-xl bg-red-50 px-4 py-4 text-center text-sm text-red-600">
                <p>{mensajeDeError(agronomos.error, 'No se pudieron cargar los agrónomos.')}</p>
                <button
                  type="button"
                  onClick={() => agronomos.refetch()}
                  className="mt-2 text-xs font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            ) : agronomos.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No hay agrónomos activos.</p>
            ) : (
              agronomos.data.map((a) => {
                const esActual = a.id === actual
                const activo = seleccionado === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={esActual || ocupado}
                    onClick={() => setSeleccionado(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
                      activo
                        ? 'border-agro-green bg-[#f3f9f5]'
                        : esActual
                          ? 'border-gray-100 bg-gray-50 opacity-70'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
                      {iniciales(a.nombre)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {a.nombre}
                      </span>
                      <span className="block truncate text-xs text-gray-500">{a.especialidad}</span>
                    </span>
                    {esActual ? (
                      <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Asignado actualmente
                      </span>
                    ) : activo ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-agro-green">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                          a.casosActivos === 0
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-[#e8f3ec] text-agro-green'
                        }`}
                      >
                        {a.casosActivos} {a.casosActivos === 1 ? 'caso' : 'casos'}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* RF-08.5 — instrucciones y paquetería de archivos */}
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Mensaje y adjuntos <span className="normal-case text-gray-400">(opcional)</span>
          </h3>

          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
            <textarea
              rows={3}
              value={mensaje}
              disabled={ocupado}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Ej: Revisar urgente, posible brote nuevo en la zona..."
              className="w-full resize-none px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
            />

            {archivos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {archivos.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="flex max-w-full items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      title="Quitar"
                      disabled={ocupado}
                      onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-gray-100 bg-[#fafbfa] px-4 py-2.5">
              <button
                type="button"
                onClick={() => inputArchivos.current?.click()}
                disabled={archivos.length >= MAX_ADJUNTOS_MENSAJE || ocupado}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-agro-green disabled:text-gray-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                  <path
                    d="M21 12.8l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Adjuntar
              </button>
              <input
                ref={inputArchivos}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  agregarArchivos(e.target.files)
                  e.target.value = ''
                }}
              />
              <span className="text-xs text-gray-400">
                PDF, JPG o PNG · máx. {MAX_ADJUNTOS_MENSAJE}
              </span>
            </div>
          </div>

          {errorArchivos && <p className="mt-2 text-xs text-amber-600">{errorArchivos}</p>}
          {confirmar.isError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {mensajeDeError(confirmar.error, 'No se pudo asignar la solicitud.')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={cerrar}
            disabled={ocupado}
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!seleccionado || ocupado}
            onClick={() => seleccionado && confirmar.mutate(seleccionado)}
            className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
              <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {ocupado ? 'Guardando...' : accion}
          </button>
        </div>
      </div>
    </div>
  )
}
