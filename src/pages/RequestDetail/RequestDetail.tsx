import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DETALLE, TIPOS_RESULTADO, type Mensaje } from './mockDetalle'
import { StatusBadge, PlagaBadge } from '../../components/StatusBadge/StatusBadge'
import Button from '../../components/Button/Button'
import type { EstadoSolicitud } from '../RequestsInbox/mockSolicitudes'

export default function RequestDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const d = DETALLE

  // RF-04.8 — si ya viene resuelta, arranca en solo lectura
  const [resolucion, setResolucion] = useState(d.resolucion)
  const resuelta = Boolean(resolucion)

  // RF-04.5 — evaluación humana obligatoria
  const [tipo, setTipo] = useState('')
  const [plaga, setPlaga] = useState(d.diagnosticoIA)
  const [respuesta, setRespuesta] = useState('')
  const [adjuntos, setAdjuntos] = useState<string[]>([])

  const [mensajes, setMensajes] = useState<Mensaje[]>(d.mensajes)
  const [borrador, setBorrador] = useState('')

  // RF-04.7 — validación íntegra antes de resolver
  const formValido = tipo !== '' && plaga.trim() !== '' && respuesta.trim().length >= 10

  const resolver = () => {
    if (!formValido) return
    setResolucion({ tipo, plaga, respuesta, fecha: 'ahora' })
  }

  const enviarMensaje = () => {
    const texto = borrador.trim()
    if (!texto) return
    setMensajes((prev) => [
      ...prev,
      {
        id: `m${prev.length + 1}`,
        autor: 'Dra. Claudia Ríos',
        iniciales: 'DC',
        esAdmin: false,
        texto,
        fecha: 'ahora',
      },
    ])
    setBorrador('')
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/solicitudes')}
          className="mt-1 text-gray-400 hover:text-gray-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Solicitud {id ?? d.id}</h1>
            <StatusBadge estado={(resuelta ? 'Resuelta' : d.estado) as EstadoSolicitud} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {d.productor} · {d.finca}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* ---------- Columna izquierda ---------- */}
        <div className="space-y-5">
          {/* RF-04.1 — galería 2x2 */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Galería de fotos</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {d.fotos.map((f) => (
                <figure key={f.angulo} className="relative overflow-hidden rounded-xl">
                  <img src={f.url} alt={f.angulo} className="h-56 w-full object-cover" />
                  {/* RF-04.2 — ángulo identificado */}
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs font-medium text-white">
                    {f.angulo}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>

          {/* RF-04.3 — casos similares */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Casos similares</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {d.casosSimilares.map((c) => (
                <button
                  key={c.nombre}
                  type="button"
                  className="overflow-hidden rounded-xl border border-gray-100 text-left transition hover:border-agro-green"
                >
                  <img src={c.imagen} alt={c.nombre} className="h-28 w-full object-cover" />
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-400">Similitud {c.similitud}%</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* RF-04.5 — formulario de resolución */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Formulario de resolución</h2>

            {resolucion ? (
              /* RF-04.8 — solo lectura tras la confirmación */
              <div className="mt-4 rounded-xl bg-[#e8f7ee] p-5">
                <div className="flex gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="mt-0.5 h-5 w-5 shrink-0 text-agro-green"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-semibold text-agro-green">Solicitud resuelta</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#2f6b4a]">
                      {resolucion.respuesta}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#4a8563]">
                      <span>
                        Tipo: <strong className="font-semibold">{resolucion.tipo}</strong>
                      </span>
                      <span>
                        Plaga: <strong className="font-semibold">{resolucion.plaga}</strong>
                      </span>
                      <span>Resuelta {resolucion.fecha}</span>
                    </div>

                    {adjuntos.length > 0 && (
                      <p className="mt-2 text-xs text-[#4a8563]">
                        {adjuntos.length} archivo(s) adjunto(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div>
                  <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
                    Tipo de resultado
                  </label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-agro-green focus:outline-none ${
                      tipo === '' ? 'text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_RESULTADO.map((t) => (
                      <option key={t} value={t} className="text-gray-800">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="plaga" className="text-sm font-medium text-gray-700">
                    Plaga identificada
                  </label>
                  <input
                    id="plaga"
                    value={plaga}
                    onChange={(e) => setPlaga(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-agro-green focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="respuesta" className="text-sm font-medium text-gray-700">
                    Respuesta para el productor
                  </label>
                  <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
                    <textarea
                      id="respuesta"
                      rows={4}
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Describe el diagnóstico y las recomendaciones de manejo..."
                      className="w-full resize-none px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
                    />
                    {/* RF-04.6 — anexos */}
                    <div className="flex items-center gap-2 border-t border-gray-100 bg-[#fafbfa] px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setAdjuntos((a) => [...a, `anexo-${a.length + 1}.pdf`])}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-agro-green"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                          <path
                            d="M21 12.8l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Adjuntar archivo
                      </button>
                      {adjuntos.length > 0 && (
                        <span className="text-xs text-gray-400">{adjuntos.length} archivo(s)</span>
                      )}
                    </div>
                  </div>
                  {respuesta.trim().length > 0 && respuesta.trim().length < 10 && (
                    <p className="mt-1.5 text-xs text-amber-600">
                      La respuesta debe tener al menos 10 caracteres.
                    </p>
                  )}
                </div>

                <Button disabled={!formValido} onClick={resolver}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Resolver solicitud
                </Button>
              </div>
            )}
          </section>
        </div>

        {/* ---------- Columna derecha ---------- */}
        <div className="space-y-5">
          {/* Datos del productor */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Datos del productor</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Dato icono="user" etiqueta="Productor">
                <span className="font-semibold text-gray-900">{d.productor}</span>
              </Dato>

              <Dato icono="pin" etiqueta="Ubicación">
                <span className="font-semibold text-gray-900">{d.finca}</span>
                <span className="block text-gray-500">
                  {d.vereda} · {d.municipio}
                </span>
              </Dato>

              {/* RF-04.10 — el teléfono depende del permiso */}
              <Dato icono="phone" etiqueta="Teléfono">
                {d.telefonoVisible ? (
                  <span className="font-semibold text-gray-900">{d.telefono}</span>
                ) : (
                  <span className="text-gray-400">Sin permiso de contacto directo</span>
                )}
              </Dato>

              <Dato icono="calendar" etiqueta="Fecha de captura">
                <span className="font-semibold text-gray-900">{d.fechaCaptura}</span>
              </Dato>
            </dl>
          </section>

          {/* RF-04.4 — resultado de la IA */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Resultado IA</h2>
            <div className="mt-4 space-y-4 text-sm">
              <Dato icono="chip" etiqueta="Modelo">
                <span className="font-semibold text-gray-900">{d.modeloIA}</span>
              </Dato>

              <div>
                <p className="text-gray-500">Diagnóstico sugerido</p>
                <div className="mt-1.5">
                  <PlagaBadge plaga={d.diagnosticoIA} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nivel de confianza</span>
                  <span className="font-semibold text-gray-900">{d.confianza}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-agro-green"
                    style={{ width: `${d.confianza}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* RF-04.9 — bitácora de mensajería */}
          <section className="flex flex-col rounded-2xl bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 text-gray-400">
                  <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
                </svg>
                Comunicación con administración
              </h2>
              <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {mensajes.length} mensajes
              </span>
            </div>

            <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
              {mensajes.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.esAdmin ? '' : 'flex-row-reverse'}`}>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      m.esAdmin ? 'bg-gray-200 text-gray-600' : 'bg-agro-green text-white'
                    }`}
                  >
                    {m.iniciales}
                  </div>
                  <div className={`min-w-0 flex-1 ${m.esAdmin ? '' : 'text-right'}`}>
                    <p className="text-[11px] text-gray-400">{m.autor}</p>
                    <div
                      className={`mt-1 inline-block rounded-xl px-3 py-2 text-left text-sm ${
                        m.esAdmin ? 'bg-[#eef4f0] text-gray-700' : 'bg-agro-green text-white'
                      }`}
                    >
                      {m.texto}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">{m.fecha}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 focus-within:border-agro-green">
              <textarea
                rows={2}
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviarMensaje()
                }}
                placeholder="Escribe al administrador..."
                className="w-full resize-none px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-[#fafbfa] px-3 py-2">
                <span className="text-xs text-gray-400">Ctrl + Enter para enviar</span>
                <button
                  type="button"
                  onClick={enviarMensaje}
                  disabled={borrador.trim() === ''}
                  className="flex items-center gap-1.5 rounded-lg bg-agro-green px-3 py-1.5 text-sm text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z" strokeLinejoin="round" />
                  </svg>
                  Enviar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* Fila de dato con icono */
const ICONOS: Record<string, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  phone: (
    <path
      d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
      strokeLinejoin="round"
    />
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
    </>
  ),
}

function Dato({
  icono,
  etiqueta,
  children,
}: {
  icono: keyof typeof ICONOS
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
      >
        {ICONOS[icono]}
      </svg>
      <div className="min-w-0">
        <dt className="text-gray-500">{etiqueta}</dt>
        <dd className="mt-0.5">{children}</dd>
      </div>
    </div>
  )
}