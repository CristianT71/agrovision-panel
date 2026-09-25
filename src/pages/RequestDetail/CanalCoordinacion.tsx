import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  MAX_ADJUNTOS_MENSAJE,
  TIPOS_ADJUNTO_MENSAJE,
  clavesMensajes,
  mensajesService,
  type AdjuntoMensaje,
  type AutorMensaje,
} from '../../api/mensajes/mensajes.service'
import { mensajeDeError } from '../../api/axios'
import { formatearFechaHora } from '../../utils/fechas'
import { tamanoLegible } from '../../utils/archivos'

type Props = {
  solicitudId: string
  yo: AutorMensaje
  // El agrónomo solo puede usar el canal en las solicitudes que tiene asignadas
  habilitado: boolean
}

const NOMBRE_AUTOR: Record<AutorMensaje, { nombre: string; iniciales: string }> = {
  admin: { nombre: 'Administración', iniciales: 'AD' },
  agronomo: { nombre: 'Agrónomo', iniciales: 'AG' },
}

// RF-04.9 — bitácora de mensajería entre administración y el agrónomo asignado
export default function CanalCoordinacion({ solicitudId, yo, habilitado }: Props) {
  const queryClient = useQueryClient()
  const [borrador, setBorrador] = useState('')
  const [archivos, setArchivos] = useState<File[]>([])
  const [errorArchivos, setErrorArchivos] = useState('')
  const [errorDescarga, setErrorDescarga] = useState('')
  const inputArchivos = useRef<HTMLInputElement>(null)
  const finLista = useRef<HTMLDivElement>(null)

  const consulta = useQuery({
    queryKey: clavesMensajes.lista(solicitudId),
    queryFn: () => mensajesService.listar(solicitudId),
    enabled: habilitado,
    refetchInterval: 30_000,
  })

  const sinAcceso =
    !habilitado || (axios.isAxiosError(consulta.error) && consulta.error.response?.status === 403)

  const mensajes = consulta.data ?? []

  const marcarLeidos = useMutation({
    mutationFn: () => mensajesService.marcarLeidos(solicitudId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesMensajes.lista(solicitudId) }),
  })

  // Se marcan como leídos los mensajes de la contraparte en cuanto se ven.
  // Un intento por cada respuesta de la API: si falla, no se repite en bucle.
  const hayNoLeidos = mensajes.some((m) => m.autorTipo !== yo && !m.leido)
  const { mutate: marcar } = marcarLeidos
  const ultimoIntento = useRef(0)
  useEffect(() => {
    if (hayNoLeidos && consulta.dataUpdatedAt !== ultimoIntento.current) {
      ultimoIntento.current = consulta.dataUpdatedAt
      marcar()
    }
  }, [hayNoLeidos, consulta.dataUpdatedAt, marcar])

  // Mantiene visible el último mensaje
  useEffect(() => {
    finLista.current?.scrollIntoView({ block: 'nearest' })
  }, [mensajes.length])

  const enviar = useMutation({
    mutationFn: () => mensajesService.enviar(solicitudId, { contenido: borrador, adjuntos: archivos }),
    onSuccess: () => {
      setBorrador('')
      setArchivos([])
      queryClient.invalidateQueries({ queryKey: clavesMensajes.lista(solicitudId) })
    },
  })

  const puedeEnviar = (borrador.trim() !== '' || archivos.length > 0) && !enviar.isPending

  const intentarEnviar = () => {
    if (puedeEnviar) enviar.mutate()
  }

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

  const descargar = async (mensajeId: string, adjunto: AdjuntoMensaje) => {
    setErrorDescarga('')
    try {
      await mensajesService.descargarAdjunto(solicitudId, mensajeId, adjunto)
    } catch (error) {
      setErrorDescarga(mensajeDeError(error, 'No se pudo descargar el archivo.'))
    }
  }

  const contraparte = yo === 'agronomo' ? 'administración' : 'el agrónomo'

  return (
    <section className="flex flex-col rounded-2xl bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-gray-400">
            <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
          </svg>
          Comunicación con {contraparte}
        </h2>
        {!sinAcceso && (
          <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {mensajes.length} mensajes
          </span>
        )}
      </div>

      {sinAcceso ? (
        <p className="mt-4 rounded-xl bg-[#fafbfa] px-4 py-6 text-center text-sm text-gray-500">
          {yo === 'agronomo'
            ? 'El canal con administración se habilita cuando la solicitud te es asignada'
            : 'El canal se habilita cuando la solicitud tiene un agrónomo asignado'}
        </p>
      ) : (
        <>
          <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
            {consulta.isPending ? (
              <p className="py-6 text-center text-sm text-gray-400">Cargando mensajes...</p>
            ) : consulta.isError ? (
              <div className="rounded-xl bg-red-50 px-4 py-4 text-center text-sm text-red-600">
                <p>{mensajeDeError(consulta.error, 'No se pudieron cargar los mensajes.')}</p>
                <button
                  type="button"
                  onClick={() => consulta.refetch()}
                  className="mt-2 text-xs font-medium underline"
                >
                  Reintentar
                </button>
              </div>
            ) : mensajes.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Aún no hay mensajes. Escribe a {contraparte} si necesitas coordinar algo del caso.
              </p>
            ) : (
              mensajes.map((m) => {
                const propio = m.autorTipo === yo
                const autor = NOMBRE_AUTOR[m.autorTipo]
                return (
                  <div key={m.id} className={`flex gap-2 ${propio ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                        propio ? 'bg-agro-green text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {autor.iniciales}
                    </div>
                    <div className={`min-w-0 flex-1 ${propio ? 'text-right' : ''}`}>
                      <p className="text-[11px] text-gray-400">{propio ? 'Tú' : autor.nombre}</p>
                      {m.contenido && (
                        <div
                          className={`mt-1 inline-block whitespace-pre-wrap rounded-xl px-3 py-2 text-left text-sm ${
                            propio ? 'bg-agro-green text-white' : 'bg-[#eef4f0] text-gray-700'
                          }`}
                        >
                          {m.contenido}
                        </div>
                      )}
                      {m.adjuntos.length > 0 && (
                        <div className={`mt-1 flex flex-wrap gap-1.5 ${propio ? 'justify-end' : ''}`}>
                          {m.adjuntos.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => descargar(m.id, a)}
                              title="Descargar"
                              className="flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:border-agro-green hover:text-agro-green"
                            >
                              <IconoClip className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{a.nombreArchivo}</span>
                              <span className="shrink-0 text-gray-400">{tamanoLegible(a.tamanoBytes)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">{formatearFechaHora(m.fecha)}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={finLista} />
          </div>

          {errorDescarga && <p className="mt-2 text-xs text-red-600">{errorDescarga}</p>}

          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
            <textarea
              rows={2}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  intentarEnviar()
                }
              }}
              placeholder={`Escribe a ${contraparte}...`}
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
                      onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-[#fafbfa] px-3 py-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="Adjuntar PDF, JPG o PNG"
                  onClick={() => inputArchivos.current?.click()}
                  disabled={archivos.length >= MAX_ADJUNTOS_MENSAJE}
                  className="text-gray-500 transition hover:text-agro-green disabled:text-gray-300"
                >
                  <IconoClip className="h-4 w-4" />
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
                <span className="text-xs text-gray-400">Ctrl + Enter para enviar</span>
              </div>
              <button
                type="button"
                onClick={intentarEnviar}
                disabled={!puedeEnviar}
                className="flex items-center gap-1.5 rounded-lg bg-agro-green px-3 py-1.5 text-sm text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" strokeLinejoin="round" />
                </svg>
                {enviar.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>

          {errorArchivos && <p className="mt-2 text-xs text-amber-600">{errorArchivos}</p>}
          {enviar.isError && (
            <p className="mt-2 text-xs text-red-600">
              {mensajeDeError(enviar.error, 'No se pudo enviar el mensaje.')}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function IconoClip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <path
        d="M21 12.8l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
