import { api } from '../axios'
import { descargarBlob } from '../descargas'

// RF-04.9 — canal interno administrador ↔ agrónomo de cada solicitud.
// El agrónomo solo accede a las solicitudes que tiene asignadas; en las demás la API responde 403.
export type AutorMensaje = 'admin' | 'agronomo'

export interface AdjuntoMensaje {
  id: string
  nombreArchivo: string
  tipoMime: string
  tamanoBytes: number
  tipo: string
}

export interface Mensaje {
  id: string
  solicitudId: string
  autorId: string
  autorTipo: AutorMensaje
  contenido: string | null
  fecha: string
  leido: boolean
  adjuntos: AdjuntoMensaje[]
}

export interface NuevoMensaje {
  contenido?: string
  adjuntos?: File[]
}

// Deben coincidir con los que acepta la API
export const MAX_ADJUNTOS_MENSAJE = 5
export const TIPOS_ADJUNTO_MENSAJE = ['application/pdf', 'image/jpeg', 'image/png']

export const mensajesService = {
  listar: (solicitudId: string) =>
    api.get<Mensaje[]>(`/solicitudes/${solicitudId}/mensajes`).then((r) => r.data),

  // Multipart: el texto es opcional si hay adjuntos
  enviar: (solicitudId: string, { contenido, adjuntos = [] }: NuevoMensaje) => {
    const formulario = new FormData()
    if (contenido?.trim()) formulario.append('contenido', contenido.trim())
    adjuntos.forEach((adjunto) => formulario.append('adjuntos', adjunto))
    return api.post<Mensaje>(`/solicitudes/${solicitudId}/mensajes`, formulario).then((r) => r.data)
  },

  marcarLeidos: (solicitudId: string) =>
    api.patch(`/solicitudes/${solicitudId}/mensajes/leidos`).then((r) => r.data),

  descargarAdjunto: async (solicitudId: string, mensajeId: string, adjunto: AdjuntoMensaje) => {
    const respuesta = await api.get<Blob>(
      `/solicitudes/${solicitudId}/mensajes/${mensajeId}/adjuntos/${adjunto.id}`,
      { responseType: 'blob' },
    )
    descargarBlob(respuesta.data, adjunto.nombreArchivo)
  },
}

export const clavesMensajes = {
  todos: ['mensajes'] as const,
  lista: (solicitudId: string) => ['mensajes', solicitudId] as const,
}
