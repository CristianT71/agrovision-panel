/** Error con un mensaje apto para mostrar al usuario. */
export class ErrorAsistente extends Error {}

const MENSAJE_OCUPADO = 'El asistente está ocupado o tuvo un problema (puede ser el límite de uso del modelo de IA). Espera un minuto e inténtalo de nuevo.'

/** Contrato compatible con Chat Trigger de n8n y webhooks que devuelvan { output: "..." }. */
export async function enviarMensajeChat(url: string, sessionId: string, chatInput: string, signal?: AbortSignal, vueloId?: string): Promise<string> {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput, ...(vueloId ? { vueloId } : {}) }),
    signal,
    credentials: 'omit',
    cache: 'no-store',
  })
  if (!respuesta.ok) throw new ErrorAsistente(respuesta.status >= 500 || respuesta.status === 429 ? MENSAJE_OCUPADO : 'No se pudo obtener una respuesta del asistente.')
  const datos: unknown = await respuesta.json()
  const objeto = Array.isArray(datos) ? datos[0] : datos
  const salida: unknown = objeto && typeof objeto === 'object' && 'output' in objeto ? objeto.output : undefined
  if (typeof salida !== 'string' || !salida.trim()) throw new Error('El asistente no devolvió una respuesta válida.')
  return salida.trim()
}
