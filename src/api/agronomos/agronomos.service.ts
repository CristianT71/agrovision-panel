import { api } from '../axios'

export type EstadoAgronomo = 'pendiente' | 'activo' | 'inactivo'

export interface DocumentoAgronomo {
  id: string
  nombreOriginal: string
  tipoMime: string
  tamanoBytes: number
  fechaSubida: string
}

export interface PerfilAgronomo {
  id: string
  usuarioId: string
  nombre: string
  tarjetaProfesional: string
  telefono: string
  correo: string
  especialidad: string
  estado: EstadoAgronomo
  fechaAlta: string
  casosActivos: number
  documentos: DocumentoAgronomo[]
}

export interface RegistroAgronomo {
  nombre: string
  telefono: string
  correo: string
  tarjetaProfesional: string
  especialidad: string
  documentos: File[]
}

export interface RespuestaRegistro {
  id: string
  estado: EstadoAgronomo
  mensaje: string
}

// Deben coincidir con las que acepta la API (RF-01.6)
export const ESPECIALIDADES = [
  'Fitopatología',
  'Entomología',
  'Agronomía general',
  'Suelos y nutrición',
  'Manejo integrado de plagas',
]

export const agronomosService = {
  // RF-01.6 / RF-10.4 — se envía como multipart porque incluye los documentos de acreditación
  registrar: (datos: RegistroAgronomo) => {
    const formulario = new FormData()
    formulario.append('nombre', datos.nombre)
    formulario.append('telefono', datos.telefono)
    formulario.append('correo', datos.correo)
    formulario.append('tarjetaProfesional', datos.tarjetaProfesional)
    formulario.append('especialidad', datos.especialidad)
    datos.documentos.forEach((documento) => formulario.append('documentos', documento))

    return api.post<RespuestaRegistro>('/agronomos/registro', formulario).then((r) => r.data)
  },

  // El login lo llama con el token recién emitido, antes de guardar la sesión
  miPerfil: (token?: string) =>
    api
      .get<PerfilAgronomo>('/agronomos/me', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined)
      .then((r) => r.data),
}

export const clavesAgronomos = {
  miPerfil: ['agronomos', 'me'] as const,
}
