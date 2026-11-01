import axios from 'axios'
import { ultimaActividad } from './auth/actividad'
import { cerrarSesion, obtenerToken } from './auth/session'

// Una petición hecha con el usuario quieto más de este tiempo es un sondeo automático
const SEGUNDOS_PARA_SONDEO = 60

// Sin Content-Type fijo: axios pone JSON para objetos y multipart (con su boundary) para FormData
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Sin tope, un API colgado dejaría los spinners girando para siempre
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = obtenerToken()
  // Si la petición ya trae su token (ej. justo después del login) no se reemplaza
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  // El servidor no cuenta como actividad lo que el panel consulta solo (notificaciones, monitores):
  // así la sesión de una pestaña desatendida caduca a los 30 min (RNF-02.2)
  if (Date.now() - ultimaActividad() > SEGUNDOS_PARA_SONDEO * 1000) config.headers['X-Sondeo'] = '1'
  return config
})

// RNF-02.2 — la sesión se cierra por inactividad (ver useCierrePorInactividad) o vence en el servidor: un 401 cierra la sesión y vuelve al login.
// En /auth el 401 significa "código inválido" y lo maneja la propia pantalla.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const esAuth = String(error.config?.url ?? '').startsWith('/auth/')
    if (axios.isAxiosError(error) && error.response?.status === 401 && !esAuth) {
      cerrarSesion()
      window.location.replace('/login?sesion=expirada')
    }
    return Promise.reject(error)
  },
)

// El filtro global de la API responde { mensaje: string | string[] }
export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (axios.isAxiosError(error)) {
    const mensaje = error.response?.data?.mensaje
    if (Array.isArray(mensaje)) return mensaje.join(' ')
    if (typeof mensaje === 'string') return mensaje
    if (!error.response) return 'No se pudo conectar con el servidor.'
  }
  return porDefecto
}

// Los archivos públicos (fotos del catálogo) se sirven fuera de /api, en la raíz de la API
export function urlArchivo(ruta: string | null | undefined): string {
  if (!ruta) return ''
  return new URL(ruta, import.meta.env.VITE_API_URL).href
}
