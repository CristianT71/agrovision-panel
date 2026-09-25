import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  TIPOS_RESULTADO,
  clavesSolicitudes,
  codigoSolicitud,
  porcentajeConfianza,
  solicitudesService,
  versionModeloCorta,
  type Solicitud,
  type TipoResultado,
} from '../../api/solicitudes/solicitudes.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import Button from '../../components/Button/Button'
import { formatearFechaHora } from '../../utils/fechas'
import CanalCoordinacion from './CanalCoordinacion'

// RF-04.2 — ángulos de captura que envía la app
const ANGULOS = ['Vista general', 'Haz foliar', 'Envés foliar', 'Detalle']

export default function RequestDetail() {
  const navigate = useNavigate()
  const { id = '' } = useParams()

  const consulta = useQuery({
    queryKey: clavesSolicitudes.detalle(id),
    queryFn: () => solicitudesService.obtener(id),
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
            {s.finca} · {s.municipio}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        {/* ---------- Columna izquierda ---------- */}
        <div className="space-y-5">
          {/* RF-04.1 — galería 2x2; la API todavía no expone las fotos */}
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold text-gray-900">Galería de fotos</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {ANGULOS.map((angulo) => (
                <figure
                  key={angulo}
                  className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-gray-300"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <circle cx="9" cy="10" r="1.8" />
                    <path d="M21 16l-5-5-8 8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {/* RF-04.2 — ángulo identificado */}
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2 text-xs font-medium text-white">
                    {angulo}
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Las fotos de la captura llegarán cuando la API las exponga.
            </p>
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
        </div>
      </div>
    </div>
  )
}

/* RF-04.5 — evaluación humana obligatoria */
function FormularioResolucion({ solicitud }: { solicitud: Solicitud }) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<TipoResultado | ''>('')
  const [plaga, setPlaga] = useState(solicitud.plagaIdentificada ?? '')
  const [respuesta, setRespuesta] = useState('')

  // RF-04.7 — validación íntegra antes de resolver
  const formValido = tipo !== '' && plaga.trim() !== '' && respuesta.trim().length >= 10

  const resolver = useMutation({
    mutationFn: () =>
      solicitudesService.resolver(solicitud.id, {
        tipoResultado: tipo as TipoResultado,
        plagaIdentificada: plaga.trim(),
        respuestaProfesional: respuesta.trim(),
      }),
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
