import axios from 'axios'
import { api, mensajeDeError } from '../axios'
import { descargarBlob } from '../descargas'

/** Error con un mensaje apto para mostrar al usuario. */
export class ErrorAsistente extends Error {}

const MENSAJE_OCUPADO = 'El asistente está ocupado o tuvo un problema (puede ser el límite de uso del modelo de IA). Espera un minuto e inténtalo de nuevo.'
// Analizar un vuelo y generar el informe puede tardar más de un minuto: la API corta a los 230 s y el chat a los 240 s
const ESPERA_CHAT_MS = 245_000
// Código del enlace de descarga que escribe el asistente: .../webhook/informe?t=<vencimiento>-<48 hex>
const CODIGO_INFORME = /^\d{10}-[a-f0-9]{48}$/i

function errorDelServidor(error: unknown, porDefecto: string): unknown {
  if (!axios.isAxiosError(error) || !error.response || axios.isCancel(error)) return error
  const estado = error.response.status
  if (estado === 500 || estado === 429) return new ErrorAsistente(MENSAJE_OCUPADO)
  if (estado >= 500) return new ErrorAsistente(mensajeDeError(error, MENSAJE_OCUPADO))
  return new ErrorAsistente(mensajeDeError(error, porDefecto))
}

/** Envía el mensaje a la API (con la sesión del panel), que lo pasa al asistente de n8n. Respuesta { output } o [{ output }]. */
export async function enviarMensajeChat(vueloId: string, sessionId: string, chatInput: string, signal?: AbortSignal): Promise<string> {
  let datos: unknown
  try {
    datos = (await api.post<unknown>(`/vuelos/${vueloId}/chat`, { sessionId, chatInput }, { signal, timeout: ESPERA_CHAT_MS })).data
  } catch (error) {
    throw errorDelServidor(error, 'No se pudo obtener una respuesta del asistente.')
  }
  const objeto = Array.isArray(datos) ? datos[0] : datos
  const salida: unknown = objeto && typeof objeto === 'object' && 'output' in objeto ? objeto.output : undefined
  if (typeof salida !== 'string' || !salida.trim()) throw new Error('El asistente no devolvió una respuesta válida.')
  return salida.trim()
}

/** Si la URL es el enlace de descarga del informe, devuelve su código; si no, null. */
export function codigoInforme(url: string): string | null {
  try {
    const enlace = new URL(url)
    if (!enlace.pathname.endsWith('/webhook/informe')) return null
    const codigo = (enlace.searchParams.get('t') ?? '').replace(/\.pdf$/i, '')
    return CODIGO_INFORME.test(codigo) ? codigo : null
  } catch {
    return null
  }
}

const MENSAJES_INFORME: Record<number, string> = {
  404: 'No se encontró el informe. Pide uno nuevo.',
  410: 'El enlace venció. Pide un informe nuevo.',
}

/** Descarga el PDF por la API (el enlace de n8n no es público). */
export async function descargarInforme(vueloId: string, codigo: string): Promise<void> {
  try {
    const respuesta = await api.get<Blob>(`/vuelos/${vueloId}/informe`, { params: { t: codigo }, responseType: 'blob', timeout: 60_000 })
    descargarBlob(respuesta.data, 'informe-agrovision.pdf')
  } catch (error) {
    // Con responseType blob el cuerpo del error no se puede leer como JSON: el mensaje sale del estado
    const estado = axios.isAxiosError(error) ? error.response?.status : undefined
    if (estado && MENSAJES_INFORME[estado]) throw new ErrorAsistente(MENSAJES_INFORME[estado])
    if (estado && (estado >= 500 || estado === 429)) throw new ErrorAsistente(MENSAJE_OCUPADO)
    throw new ErrorAsistente('No se pudo descargar el informe. Inténtalo de nuevo.')
  }
}
