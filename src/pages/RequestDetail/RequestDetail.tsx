import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ETIQUETAS_ANGULO,
  MAX_ANEXOS_RESOLUCION,
  MAX_MB_ANEXO,
  TIPOS_ANEXO,
  TIPOS_RESULTADO,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  solicitudesService,
  versionModeloCorta,
  type AnexoResolucion,
  type Solicitud,
  type TipoResultado,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import Button from '../../components/Button/Button'
import { formatearFechaHora } from '../../utils/fechas'
import { tamanoLegible } from '../../utils/archivos'
import FotoSolicitud, { Marcador } from '../../components/FotoSolicitud/FotoSolicitud'
import CanalCoordinacion from './CanalCoordinacion'

export default function RequestDetail() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const consulta = useQuery({
    queryKey: clavesSolicitudes.detalle(id),
    queryFn: () => solicitudesService.obtener(id),
    enabled: Boolean(id),
  })

  // RF-04.1 — fotos de la captura que envió la app
  const fotos = useQuery({
    queryKey: clavesSolicitudes.fotos(id),
    queryFn: () => solicitudesService.listarFotos(id),
    enabled: Boolean(id),
  })

  const perfil = useQuery({
    queryKey: clavesAgronomos.miPerfil,
    queryFn: () => agronomosService.miPerfil(),
  })

  const volver = (
    <button
      type="button"
      onClick={() => navigate('/solicitudes')}
      className="mt-1 text-gray-400 hover:text-gray-600"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )

  if (consulta.isPending || consulta.isError) {
    return (
      <div className="flex items-start gap-3">
        {volver}
        {consulta.isError ? (
          <div className="flex-1 rounded-xl bg-red-50 px-5 py-10 text-center text-sm text-red-600">
            <p>{mensajeDeError(consulta.error, 'No se pudo cargar la solicitud.')}</p>
            <button
              type="button"
              onClick={() => consulta.refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <p className="flex-1 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
            Cargando solicitud...
          </p>
        )}
      </div>
    )
  }

  const s = consulta.data
  const esMia = Boolean(perfil.data && s.agronomoId === perfil.data.id)
  const confianza = porcentajeConfianza(s.confianzaIa)

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        {volver}
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Solicitud {codigoSolicitud(s.id)}</h1>
            <StatusBadge estado={s.estado} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {s.productorNombre ?? 'Productor sin perfil'} · {s.finca} · {s.municipio}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* ---------- Columna izquierda ---------- */}
        <div className="space-y-5">
          {/* RF-04.1 — galería 2x2 con las fotos que subió la app */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Galería de fotos</h2>
            {fotos.isPending ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : fotos.isError ? (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {mensajeDeError(fotos.error, 'No se pudieron cargar las fotos.')}
              </p>
            ) : fotos.data.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">Esta solicitud no tiene fotos.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {fotos.data.map((foto) => (
                  <figure key={foto.id} className="relative overflow-hidden rounded-xl">
                    {foto.subida ? (
                      <FotoSolicitud
                        solicitudId={s.id}
                        fotoId={foto.id}
                        alt={ETIQUETAS_ANGULO[foto.angulo]}
                        className="h-56 w-full"
                      />
                    ) : (
                      // La app registra la foto primero y sube el archivo después (puede estar sin señal)
                      <Marcador className="h-56 w-full" texto="La app aún no termina de subir esta foto" />
                    )}
                    {/* RF-04.2 — ángulo identificado */}
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs font-medium text-white">
                      {ETIQUETAS_ANGULO[foto.angulo]}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>

          {/* RF-04.5 — formulario de resolución */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Formulario de resolución</h2>

            {s.estado === 'Resuelta' ? (
              <ResolucionLectura solicitud={s} />
            ) : s.estado === 'Asignada' && esMia ? (
              <FormularioResolucion solicitud={s} />
            ) : (
              <p className="mt-4 rounded-xl bg-[#fafbfa] px-4 py-4 text-sm text-gray-500">
                {motivoSinFormulario(s, esMia, perfil.isPending)}
              </p>
            )}
          </section>
        </div>

        {/* ---------- Columna derecha ---------- */}
        <div className="space-y-5">
          {/* Datos del caso */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Datos del caso</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <Dato icono="user" etiqueta="Productor">
                <span className="font-semibold text-gray-900">{s.productorNombre ?? 'Sin perfil registrado'}</span>
              </Dato>

              <Dato icono="home" etiqueta="Finca">
                <span className="font-semibold text-gray-900">{s.finca}</span>
              </Dato>

              <Dato icono="pin" etiqueta="Ubicación">
                <span className="font-semibold text-gray-900">{s.vereda}</span>
                <span className="block text-gray-500">{s.municipio}</span>
              </Dato>

              <Dato icono="calendar" etiqueta="Fecha de envío">
                <span className="font-semibold text-gray-900">{formatearFechaHora(s.fecha)}</span>
              </Dato>
            </dl>
          </section>

          {/* RF-04.4 — resultado de la IA */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Resultado IA</h2>
            <div className="mt-4 space-y-4 text-sm">
              <Dato icono="chip" etiqueta="Versión del modelo">
                <span className="font-mono font-semibold text-gray-900" title={s.modeloVersionId ?? undefined}>
                  {versionModeloCorta(s.modeloVersionId)}
                </span>
              </Dato>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nivel de confianza</span>
                  <span className="font-semibold text-gray-900">{confianza}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-agro-green" style={{ width: `${confianza}%` }} />
                </div>
              </div>
            </div>
          </section>

          {/* RF-04.9 — canal con administración */}
          <CanalCoordinacion solicitudId={s.id} yo="agronomo" habilitado={esMia} />
        </div>
      </div>
    </div>
  )
}

// Explica por qué no se muestra el formulario de resolución
function motivoSinFormulario(s: Solicitud, esMia: boolean, cargandoPerfil: boolean): string {
  if (cargandoPerfil) return 'Verificando la asignación...'
  switch (s.estado) {
    case 'Pendiente':
      return 'El productor aún no termina de enviar esta solicitud desde la app.'
    case 'Enviada':
      return 'La solicitud aún no tiene agrónomo asignado. Podrás resolverla cuando administración te la asigne.'
    case 'Descartada':
      return 'La solicitud fue descartada y no admite resolución.'
    default:
      return esMia ? 'La solicitud no se puede resolver en su estado actual.' : 'Esta solicitud está asignada a otro agrónomo.'
  }
}

/* RF-04.8 — solo lectura tras la resolución */
function ResolucionLectura({ solicitud: s }: { solicitud: Solicitud }) {
  return (
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
          {s.respuestaProfesional && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#2f6b4a]">
              {s.respuestaProfesional}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#4a8563]">
            {s.tipoResultado && (
              <span>
                Tipo: <strong className="font-semibold">{s.tipoResultado}</strong>
              </span>
            )}
            {s.plagaIdentificada && (
              <span>
                Plaga: <strong className="font-semibold">{s.plagaIdentificada}</strong>
              </span>
            )}
            {s.fechaResolucion && <span>Resuelta el {formatearFechaHora(s.fechaResolucion)}</span>}
          </div>

          <AnexosLectura solicitudId={s.id} />
        </div>
      </div>
    </div>
  )
}

/* RF-04.6 — anexos de una resolución ya confirmada */
function AnexosLectura({ solicitudId }: { solicitudId: string }) {
  const anexos = useQuery({
    queryKey: clavesSolicitudes.anexos(solicitudId),
    queryFn: () => solicitudesService.listarAnexos(solicitudId),
  })
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  if (!anexos.data || anexos.data.length === 0) return null

  const descargar = async (anexo: AnexoResolucion) => {
    setErrorDescarga(null)
    try {
      await solicitudesService.descargarAnexo(solicitudId, anexo)
    } catch (error) {
      setErrorDescarga(mensajeDeError(error, 'No se pudo descargar el anexo.'))
    }
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-[#2f6b4a]">Anexos</p>
      <ul className="mt-1.5 space-y-1.5">
        {anexos.data.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => descargar(a)}
              className="flex items-center gap-2 text-xs text-agro-green hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {a.nombreOriginal}
              <span className="text-[#4a8563]">· {tamanoLegible(a.tamanoBytes)}</span>
            </button>
          </li>
        ))}
      </ul>
      {errorDescarga && <p className="mt-1 text-xs text-red-600">{errorDescarga}</p>}
    </div>
  )
}

/* RF-04.5 — evaluación humana obligatoria */
function FormularioResolucion({ solicitud }: { solicitud: Solicitud }) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<TipoResultado | ''>('')
  const [plaga, setPlaga] = useState(solicitud.plagaIdentificada ?? '')
  const [respuesta, setRespuesta] = useState('')
  // RF-04.6 — imágenes o reportes PDF adjuntos a la resolución
  const [anexos, setAnexos] = useState<File[]>([])
  const [errorAnexos, setErrorAnexos] = useState<string | null>(null)

  const agregarAnexos = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorAnexos(null)
    const archivos = Array.from(e.target.files ?? [])
    const validos = archivos.filter((f) => TIPOS_ANEXO.includes(f.type) && f.size <= MAX_MB_ANEXO * 1024 * 1024)

    if (validos.length < archivos.length) {
      setErrorAnexos(`Se omitieron archivos: solo PDF, JPG, PNG o WEBP de hasta ${MAX_MB_ANEXO} MB.`)
    }

    const espacio = MAX_ANEXOS_RESOLUCION - anexos.length
    if (validos.length > espacio) setErrorAnexos(`Máximo ${MAX_ANEXOS_RESOLUCION} anexos por resolución.`)

    setAnexos((prev) => [...prev, ...validos.slice(0, espacio)])
    e.target.value = ''
  }

  // RF-04.7 — validación íntegra antes de resolver
  const formValido = tipo !== '' && plaga.trim() !== '' && respuesta.trim().length >= 10

  const resolver = useMutation({
    mutationFn: () =>
      solicitudesService.resolver(
        solicitud.id,
        {
          tipoResultado: tipo as TipoResultado,
          plagaIdentificada: plaga.trim(),
          respuestaProfesional: respuesta.trim(),
        },
        anexos,
      ),
    // Invalida la lista y este detalle: al recargarse pasa a "Resuelta" en solo lectura
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesSolicitudes.todas }),
  })

  return (
    <div className="mt-4 space-y-5">
      <div>
        <label htmlFor="tipo" className="text-sm font-medium text-gray-700">
          Tipo de resultado
        </label>
        <select
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoResultado | '')}
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
        <textarea
          id="respuesta"
          rows={4}
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Describe el diagnóstico y las recomendaciones de manejo..."
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
        {respuesta.trim().length > 0 && respuesta.trim().length < 10 && (
          <p className="mt-1.5 text-xs text-amber-600">La respuesta debe tener al menos 10 caracteres.</p>
        )}
      </div>

      {/* RF-04.6 — anexos */}
      <div>
        <span className="text-sm font-medium text-gray-700">Anexos (opcional)</span>
        <label
          className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#cfe3d6] px-4 py-3 transition hover:border-agro-green hover:bg-[#f7fbf8] ${
            anexos.length >= MAX_ANEXOS_RESOLUCION ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5 shrink-0 text-agro-green">
            <path
              d="M21 12.8l-8.5 8.5a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm text-gray-600">
            Adjuntar imágenes o reportes PDF
            <span className="block text-xs text-gray-400">
              Máx. {MAX_ANEXOS_RESOLUCION} archivos de {MAX_MB_ANEXO} MB
            </span>
          </span>
          <input type="file" accept={TIPOS_ANEXO.join(',')} multiple onChange={agregarAnexos} className="hidden" />
        </label>

        {errorAnexos && <p className="mt-1.5 text-xs text-amber-600">{errorAnexos}</p>}

        {anexos.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {anexos.map((a, i) => (
              <li
                key={`${a.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md bg-[#eef4f0] px-3 py-1.5 text-xs text-gray-700"
              >
                <span className="truncate">
                  {a.name} <span className="text-gray-400">· {tamanoLegible(a.size)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAnexos((prev) => prev.filter((_, j) => j !== i))}
                  className="shrink-0 text-gray-400 hover:text-red-500"
                  aria-label={`Quitar ${a.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {resolver.isError && (
        <p className="text-sm text-red-600">{mensajeDeError(resolver.error, 'No se pudo resolver la solicitud.')}</p>
      )}

      <Button disabled={!formValido || resolver.isPending || resolver.isSuccess}onClick={() => resolver.mutate()}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {resolver.isPending ? 'Resolviendo...' : 'Resolver solicitud'}
      </Button>
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
  home: (
    <>
      <path d="M4 11l8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5V20h12V9.5" strokeLinejoin="round" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </>
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
