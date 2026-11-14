import { useEffect, useRef, useState, type FormEvent } from 'react'
import { enviarMensajeChat } from '../../api/chat-multiespectral/chat.service'

const PRIMARIO = 'rounded-xl bg-agro-green px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50'

type Mensaje = { id: string; autor: 'usuario' | 'asistente'; texto: string }
const webhook = (import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL as string | undefined)?.trim()

export default function ChatAsistente() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const sesion = useRef<string | null>(null)
  const peticion = useRef<AbortController | null>(null)
  useEffect(() => () => { const activa = peticion.current; peticion.current = null; activa?.abort() }, [])

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const mensaje = texto.trim()
    if (!mensaje || !webhook || peticion.current) return
    sesion.current ??= crypto.randomUUID()
    const controlador = new AbortController()
    peticion.current = controlador
    setMensajes(actuales => [...actuales, { id: crypto.randomUUID(), autor: 'usuario', texto: mensaje }])
    setTexto('')
    setError('')
    setEnviando(true)
    const limite = window.setTimeout(() => controlador.abort(), 60000)
    try {
      const respuesta = await enviarMensajeChat(webhook, sesion.current, mensaje, controlador.signal)
      if (!controlador.signal.aborted) setMensajes(actuales => [...actuales, { id: crypto.randomUUID(), autor: 'asistente', texto: respuesta }])
    } catch {
      if (peticion.current === controlador) {
        setError(controlador.signal.aborted ? 'La respuesta tardó demasiado. Inténtalo de nuevo.' : 'No se pudo conectar con el asistente. Inténtalo de nuevo.')
        setTexto(mensaje)
      }
    } finally {
      window.clearTimeout(limite)
      if (peticion.current === controlador) { peticion.current = null; setEnviando(false) }
    }
  }

  function nuevaConversacion() {
    sesion.current = null
    setMensajes([])
    setTexto('')
    setError('')
  }

  return <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
    {abierto && <section id="chat-multiespectral" aria-labelledby="titulo-chat-multiespectral" className="flex max-h-[min(36rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div><h2 id="titulo-chat-multiespectral" className="text-lg font-semibold text-gray-900">Asistente de análisis</h2><p className="mt-1 text-sm text-gray-500">Haz una consulta al asistente de AgroVision.</p></div>
      <button type="button" onClick={nuevaConversacion} disabled={enviando || mensajes.length === 0} className="text-sm font-medium text-agro-green hover:underline disabled:opacity-40">Nueva conversación</button>
    </div>
    <div role="log" aria-label="Conversación con el asistente" aria-live="polite" className="min-h-28 flex-1 space-y-3 overflow-y-auto bg-gray-50/70 p-5 sm:min-h-48">
      {mensajes.length === 0 && <p className="text-sm text-gray-500">Escribe una pregunta para empezar. Comparte los datos que quieras consultar.</p>}
      {mensajes.map(m => <div key={m.id} className={`flex ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm ${m.autor === 'usuario' ? 'bg-agro-green text-white' : 'border border-gray-100 bg-white text-gray-800'}`}><span className="sr-only">{m.autor === 'usuario' ? 'Tú: ' : 'Asistente: '}</span>{m.texto}</div></div>)}
      {enviando && <p role="status" className="text-sm text-gray-500">El asistente está respondiendo…</p>}
    </div>
    <form onSubmit={enviar} className="space-y-2 p-4">
      {!webhook && <p className="text-sm text-amber-700">El asistente aún no está configurado.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex items-end gap-3"><label htmlFor="mensaje-chat-multiespectral" className="sr-only">Mensaje para el asistente</label><textarea id="mensaje-chat-multiespectral" value={texto} onChange={e => setTexto(e.target.value)} disabled={!webhook || enviando} maxLength={4000} rows={2} placeholder="Escribe tu pregunta…" className="min-h-12 flex-1 resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-agro-green focus:outline-none disabled:bg-gray-50" /><button className={PRIMARIO} disabled={!webhook || enviando || !texto.trim()}>Enviar</button></div>
    </form>
  </section>}
    <button type="button" aria-label={abierto ? 'Cerrar asistente de análisis' : 'Abrir asistente de análisis'} aria-expanded={abierto} aria-controls="chat-multiespectral" onClick={() => setAbierto(actual => !actual)} className="flex h-14 w-14 items-center justify-center rounded-full bg-agro-green text-white shadow-lg transition hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-agro-green">
      {abierto ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.6-.8L4 21l1.4-4.1A8.5 8.5 0 1 1 21 11.5Z" /><path strokeLinecap="round" d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></svg>}
    </button>
  </div>
}
