/** Contrato compatible con Chat Trigger de n8n y webhooks que devuelvan { output: "..." }. */
export async function enviarMensajeChat(url: string, sessionId: string, chatInput: string, signal?: AbortSignal): Promise<string> {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput }),
    signal,
    credentials: 'omit',
    cache: 'no-store',
  })
  if (!respuesta.ok) throw new Error('No se pudo obtener una respuesta del asistente.')
  const datos: unknown = await respuesta.json()
  const objeto = Array.isArray(datos) ? datos[0] : datos
  const salida: unknown = objeto && typeof objeto === 'object' && 'output' in objeto ? objeto.output : undefined
  if (typeof salida !== 'string' || !salida.trim()) throw new Error('El asistente no devolvió una respuesta válida.')
  return salida.trim()
}
