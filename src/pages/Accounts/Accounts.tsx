import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import {
  clavesProductores,
  productoresService,
  type EstadoProductor,
  type Productor,
} from '../../api/productores/productores.service'
import {
  agronomosService,
  clavesAgronomos,
  type AgronomoResumen,
  type DocumentoAgronomo,
  type EstadoAgronomo,
} from '../../api/agronomos/agronomos.service'
import { calcularIniciales } from '../../api/auth/session'
import { mensajeDeError } from '../../api/axios'
import { formatearFecha } from '../../utils/fechas'
import { tamanoLegible } from '../../utils/archivos'

type Pestana = 'productores' | 'agronomos'

type Accion =
  | { tipo: 'validarProductor'; productor: Productor }
  | { tipo: 'revocar'; productor: Productor }
  | { tipo: 'validarAgronomo'; agronomo: AgronomoResumen }
  | { tipo: 'desactivar'; agronomo: AgronomoResumen }
  | { tipo: 'reactivar'; agronomo: AgronomoResumen }

const ESTADO_PRODUCTOR: Record<EstadoProductor, { etiqueta: string; color: string }> = {
  validado: { etiqueta: 'Validado', color: 'bg-[#e8f7ee] text-agro-green' },
  registrado: { etiqueta: 'Registrado', color: 'bg-amber-50 text-amber-700' },
}

const ESTADO_AGRONOMO: Record<EstadoAgronomo, { etiqueta: string; color: string }> = {
  activo: { etiqueta: 'Activo', color: 'bg-[#e8f7ee] text-agro-green' },
  pendiente: { etiqueta: 'Validación pendiente', color: 'bg-amber-50 text-amber-700' },
  inactivo: { etiqueta: 'Inactivo', color: 'bg-gray-100 text-gray-600' },
}

const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')

const iconoValidar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-3.5 w-3.5">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
    <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const iconoDocumento = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
    <path d="M14 3v5h5" strokeLinejoin="round" />
    <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z" strokeLinejoin="round" />
  </svg>
)

const botonPrimario =
  'flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-agro-green px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#194b32]'
const botonPeligro =
  'whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600'
const botonNeutro =
  'whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-agro-green hover:text-agro-green'

function ejecutarAccion(accion: Accion): Promise<unknown> {
  switch (accion.tipo) {
    case 'validarProductor':
      return productoresService.validar(accion.productor.id)
    case 'revocar':
      return productoresService.revocarConsentimiento(accion.productor.id)
    case 'validarAgronomo':
      return agronomosService.validar(accion.agronomo.id)
    case 'desactivar':
      return agronomosService.desactivar(accion.agronomo.id)
    case 'reactivar':
      return agronomosService.reactivar(accion.agronomo.id)
  }
}

export default function Accounts() {
  const queryClient = useQueryClient()
  const [pestana, setPestana] = useState<Pestana>('productores')
  const [busqueda, setBusqueda] = useState('')
  const [accion, setAccion] = useState<Accion | null>(null)
  const [documentosDe, setDocumentosDe] = useState<AgronomoResumen | null>(null)

  const productores = useQuery({
    queryKey: clavesProductores.lista(),
    queryFn: () => productoresService.listar(),
  })

  const agronomos = useQuery({
    queryKey: clavesAgronomos.lista(),
    queryFn: () => agronomosService.listar(),
  })

  // La búsqueda se aplica en el navegador sobre lo que devolvió la API
  const productoresVisibles = useMemo(() => {
    const lista = productores.data ?? []
    const q = normalizar(busqueda.trim())
    if (!q) return lista
    return lista.filter((p) =>
      [p.nombre, p.finca, p.municipio, p.vereda].some((t) => normalizar(t).includes(q)),
    )
  }, [productores.data, busqueda])

  const agronomosVisibles = useMemo(() => {
    const lista = agronomos.data ?? []
    const q = normalizar(busqueda.trim())
    if (!q) return lista
    return lista.filter((a) =>
      [a.nombre, a.especialidad, a.tarjetaProfesional].some((t) => normalizar(t).includes(q)),
    )
  }, [agronomos.data, busqueda])

  const confirmar = useMutation({
    mutationFn: ejecutarAccion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clavesProductores.todos })
      queryClient.invalidateQueries({ queryKey: clavesAgronomos.todos })
      setAccion(null)
    },
  })

  const abrir = (nueva: Accion) => {
    confirmar.reset()
    setAccion(nueva)
  }

  const cerrar = () => {
    if (!confirmar.isPending) setAccion(null)
  }

  const pendientes = (agronomos.data ?? []).filter((a) => a.estado === 'pendiente').length

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de cuentas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Productores registrados y agrónomos del sistema
          </p>
        </div>
        {pendientes > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {pendientes} por validar
          </span>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mt-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={
            pestana === 'productores'
              ? 'Buscar por nombre, finca o municipio...'
              : 'Buscar por nombre, especialidad o tarjeta...'
          }
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* RF-10.1 — módulos diferenciados */}
      <div className="mt-4 inline-flex gap-1 rounded-xl bg-[#eef4f0] p-1">
        {(
          [
            { id: 'productores' as Pestana, label: 'Productores', total: productores.data?.length ?? 0 },
            { id: 'agronomos' as Pestana, label: 'Agrónomos', total: agronomos.data?.length ?? 0 },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPestana(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition ${
              pestana === t.id
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
            <span className="rounded-md bg-gray-100 px-1.5 text-xs text-gray-600">{t.total}</span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white">
        <div className="overflow-x-auto">
          {pestana === 'productores' ? (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4 font-medium">Productor / Finca</th>
                  <th className="px-5 py-4 font-medium">Ubicación</th>
                  <th className="px-5 py-4 font-medium">Teléfono</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Consentimiento</th>
                  <th className="px-5 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <FilaEstado
                  consulta={productores}
                  columnas={6}
                  visibles={productoresVisibles.length}
                  textoCarga="Cargando productores..."
                  textoError="No se pudieron cargar los productores."
                  textoVacio="Aún no hay productores registrados. Aparecerán cuando se registren desde la app."
                  textoSinCoincidencias="No hay productores que coincidan con la búsqueda."
                />

                {productoresVisibles.map((p) => (
                  <tr
                    key={p.id}
                    className="group border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.finca}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{p.vereda}</p>
                      <p className="text-xs text-gray-400">{p.municipio}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.telefono}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_PRODUCTOR[p.estado].color}`}
                      >
                        {ESTADO_PRODUCTOR[p.estado].etiqueta}
                      </span>
                    </td>
                    {/* RF-10.2 — estatus de políticas de privacidad */}
                    <td className="px-5 py-4">
                      {p.consentimiento ? (
                        <span className="flex items-center gap-1.5 text-agro-green">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Sí
                          {p.fechaConsentimiento && (
                            <span className="text-xs text-gray-400">· {formatearFecha(p.fechaConsentimiento)}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>

                    {/* Acciones: aparecen al pasar el mouse por la fila. Otorgar solo lo hace el productor desde la app. */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                        {p.estado === 'registrado' && (
                          <button
                            type="button"
                            onClick={() => abrir({ tipo: 'validarProductor', productor: p })}
                            className={botonPrimario}
                          >
                            {iconoValidar}
                            Validar
                          </button>
                        )}
                        {p.consentimiento && (
                          <button
                            type="button"
                            onClick={() => abrir({ tipo: 'revocar', productor: p })}
                            className={botonPeligro}
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4 font-medium">Agrónomo</th>
                  <th className="px-5 py-4 font-medium">Tarjeta</th>
                  <th className="px-5 py-4 font-medium">Teléfono</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Acreditación</th>
                  <th className="px-5 py-4 font-medium">Casos activos</th>
                  <th className="px-5 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <FilaEstado
                  consulta={agronomos}
                  columnas={7}
                  visibles={agronomosVisibles.length}
                  textoCarga="Cargando agrónomos..."
                  textoError="No se pudieron cargar los agrónomos."
                  textoVacio="Aún no hay agrónomos registrados. Aparecerán cuando soliciten acceso al panel."
                  textoSinCoincidencias="No hay agrónomos que coincidan con la búsqueda."
                />

                {agronomosVisibles.map((a) => (
                  <tr
                    key={a.id}
                    className="group border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
                          {calcularIniciales(a.nombre)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{a.nombre}</p>
                          <p className="text-xs text-gray-500">{a.especialidad}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{a.tarjetaProfesional}</td>
                    <td className="px-5 py-4 text-gray-600">{a.telefono}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_AGRONOMO[a.estado].color}`}
                      >
                        {ESTADO_AGRONOMO[a.estado].etiqueta}
                      </span>
                    </td>
                    {/* RF-10.4 — binarios de acreditación */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setDocumentosDe(a)}
                        className="flex items-center gap-1.5 text-xs text-agro-green hover:underline"
                      >
                        {iconoDocumento}
                        Ver documentos
                      </button>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{a.casosActivos}</td>

                    {/* RF-10.5 — validación humana y ciclo de vida de la cuenta */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                        {a.estado === 'pendiente' && (
                          <button
                            type="button"
                            onClick={() => abrir({ tipo: 'validarAgronomo', agronomo: a })}
                            className={botonPrimario}
                          >
                            {iconoValidar}
                            Validar
                          </button>
                        )}
                        {a.estado === 'activo' && (
                          <button
                            type="button"
                            onClick={() => abrir({ tipo: 'desactivar', agronomo: a })}
                            className={botonPeligro}
                          >
                            Desactivar
                          </button>
                        )}
                        {a.estado === 'inactivo' && (
                          <button
                            type="button"
                            onClick={() => abrir({ tipo: 'reactivar', agronomo: a })}
                            className={botonNeutro}
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {accion && (
        <ModalConfirmacion
          {...textosAccion(accion)}
          procesando={confirmar.isPending}
          error={confirmar.isError ? mensajeDeError(confirmar.error, 'No se pudo completar la acción.') : null}
          onConfirmar={() => confirmar.mutate(accion)}
          onCerrar={cerrar}
        />
      )}

      {documentosDe && <ModalDocumentos agronomo={documentosDe} onCerrar={() => setDocumentosDe(null)} />}
    </div>
  )
}

/* ---------- Textos de cada confirmación ---------- */

function textosAccion(accion: Accion): {
  titulo: string
  descripcion: ReactNode
  aviso?: string
  textoConfirmar: string
  peligro: boolean
} {
  switch (accion.tipo) {
    case 'validarProductor':
      return {
        titulo: 'Validar cuenta de productor',
        descripcion: (
          <>
            Confirmas que la cuenta de <strong className="text-gray-700">{accion.productor.nombre}</strong> ha
            completado el proceso de verificación y puede usar el sistema.
          </>
        ),
        textoConfirmar: 'Validar cuenta',
        peligro: false,
      }
    // RF-10.3 — confirmación explícita de revocación
    case 'revocar':
      return {
        titulo: 'Revocar consentimiento',
        descripcion: (
          <>
            Al revocar el consentimiento de <strong className="text-gray-700">{accion.productor.nombre}</strong>, el
            sistema dejará de tratar sus datos fotográficos. Las imágenes ya enviadas no podrán usarse para
            reentrenamiento. Solo el productor puede volver a otorgarlo desde la app.
          </>
        ),
        textoConfirmar: 'Revocar',
        peligro: true,
      }
    case 'validarAgronomo':
      return {
        titulo: 'Validar cuenta de agrónomo',
        descripcion: (
          <>
            Confirmas que revisaste la acreditación de{' '}
            <strong className="text-gray-700">{accion.agronomo.nombre}</strong> (tarjeta{' '}
            {accion.agronomo.tarjetaProfesional}) y que puede recibir casos asignados.
          </>
        ),
        textoConfirmar: 'Validar cuenta',
        peligro: false,
      }
    case 'desactivar':
      return {
        titulo: 'Desactivar agrónomo',
        descripcion: (
          <>
            <strong className="text-gray-700">{accion.agronomo.nombre}</strong> no podrá ingresar al panel ni recibir
            nuevos casos hasta que se reactive su cuenta.
          </>
        ),
        aviso:
          accion.agronomo.casosActivos > 0
            ? `Tiene ${accion.agronomo.casosActivos} caso(s) activo(s) asignado(s). Considera reasignarlos antes de desactivarlo.`
            : undefined,
        textoConfirmar: 'Desactivar',
        peligro: true,
      }
    case 'reactivar':
      return {
        titulo: 'Reactivar agrónomo',
        descripcion: (
          <>
            <strong className="text-gray-700">{accion.agronomo.nombre}</strong> podrá volver a ingresar al panel y
            recibir casos asignados.
          </>
        ),
        textoConfirmar: 'Reactivar',
        peligro: false,
      }
  }
}

/* ---------- Filas de carga, error y lista vacía ---------- */

function FilaEstado({
  consulta,
  columnas,
  visibles,
  textoCarga,
  textoError,
  textoVacio,
  textoSinCoincidencias,
}: {
  consulta: UseQueryResult<unknown[]>
  columnas: number
  visibles: number
  textoCarga: string
  textoError: string
  textoVacio: string
  textoSinCoincidencias: string
}) {
  let contenido: ReactNode = null

  if (consulta.isPending) {
    contenido = <span className="text-gray-400">{textoCarga}</span>
  } else if (consulta.isError) {
    contenido = (
      <div className="text-red-600">
        <p>{mensajeDeError(consulta.error, textoError)}</p>
        <button
          type="button"
          onClick={() => consulta.refetch()}
          className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
        >
          Reintentar
        </button>
      </div>
    )
  } else if (consulta.data.length === 0) {
    contenido = <span className="text-gray-400">{textoVacio}</span>
  } else if (visibles === 0) {
    contenido = <span className="text-gray-400">{textoSinCoincidencias}</span>
  }

  if (!contenido) return null
  return (
    <tr>
      <td colSpan={columnas} className="px-5 py-12 text-center text-sm">
        {contenido}
      </td>
    </tr>
  )
}

/* ---------- Modal de confirmación común ---------- */

function ModalConfirmacion({
  titulo,
  descripcion,
  aviso,
  textoConfirmar,
  peligro,
  procesando,
  error,
  onConfirmar,
  onCerrar,
}: {
  titulo: string
  descripcion: ReactNode
  aviso?: string
  textoConfirmar: string
  peligro: boolean
  procesando: boolean
  error: string | null
  onConfirmar: () => void
  onCerrar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{descripcion}</p>
          {aviso && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">{aviso}</p>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 pb-5 pt-5">
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={procesando}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-70 ${
              peligro ? 'bg-red-500 enabled:hover:bg-red-600' : 'bg-agro-green enabled:hover:bg-[#194b32]'
            }`}
          >
            {!peligro && !procesando && iconoValidar}
            {procesando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- RF-10.4 — documentos de acreditación ---------- */

function ModalDocumentos({ agronomo, onCerrar }: { agronomo: AgronomoResumen; onCerrar: () => void }) {
  const [descargando, setDescargando] = useState<string | null>(null)
  const [errorDescarga, setErrorDescarga] = useState('')

  const detalle = useQuery({
    queryKey: clavesAgronomos.detalle(agronomo.id),
    queryFn: () => agronomosService.obtener(agronomo.id),
  })

  const descargar = async (documento: DocumentoAgronomo) => {
    setDescargando(documento.id)
    setErrorDescarga('')
    try {
      await agronomosService.descargarDocumento(agronomo.id, documento)
    } catch (error) {
      setErrorDescarga(mensajeDeError(error, 'No se pudo descargar el documento.'))
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Documentos de acreditación</h2>
            <p className="mt-1 text-sm text-gray-500">
              {agronomo.nombre} · tarjeta {agronomo.tarjetaProfesional}
            </p>
          </div>
          <button type="button" title="Cerrar" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          {detalle.isPending ? (
            <p className="py-6 text-center text-sm text-gray-400">Cargando documentos...</p>
          ) : detalle.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-5 text-center text-sm text-red-600">
              <p>{mensajeDeError(detalle.error, 'No se pudieron cargar los documentos.')}</p>
              <button
                type="button"
                onClick={() => detalle.refetch()}
                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
              >
                Reintentar
              </button>
            </div>
          ) : detalle.data.documentos.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">El agrónomo no cargó documentos.</p>
          ) : (
            <ul className="space-y-2">
              {detalle.data.documentos.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3"
                >
                  <span className="text-gray-400">{iconoDocumento}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{d.nombreOriginal}</p>
                    <p className="text-xs text-gray-400">
                      {tamanoLegible(d.tamanoBytes)} · {formatearFecha(d.fechaSubida)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => descargar(d)}
                    disabled={descargando !== null}
                    className={`${botonNeutro} disabled:opacity-50`}
                  >
                    {descargando === d.id ? 'Descargando…' : 'Descargar'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {errorDescarga && <p className="mt-3 text-xs text-red-600">{errorDescarga}</p>}
        </div>
      </div>
    </div>
  )
}
