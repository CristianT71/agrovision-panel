import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import TagInput from '../../components/TagInput/TagInput'
import Button from '../../components/Button/Button'
import {
  clavesPlagas,
  componerProtocolo,
  descomponerProtocolo,
  plagasService,
  TIPOS_PLAGA,
  type DatosFicha,
  type Plaga,
  type ProtocoloQuimico,
  type TipoPlaga,
} from '../../api/plagas/plagas.service'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import { mensajeDeError, urlArchivo } from '../../api/axios'

// Deben coincidir con los límites de la API
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 3

const INPUT =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none disabled:bg-gray-50 disabled:text-gray-500'

type Props = {
  // Sin ficha se crea una nueva; con ficha se ve y edita la existente
  ficha?: Plaga
  onGuardada: (ficha: Plaga) => void
  onClose: () => void
}

export default function PestDrawer({ ficha, onGuardada, onClose }: Props) {
  const queryClient = useQueryClient()
  const esNueva = !ficha

  // Identificación
  const [nombreComun, setNombreComun] = useState(ficha?.nombreComun ?? '')
  const [nombreCientifico, setNombreCientifico] = useState(ficha?.nombreCientifico ?? '')
  const [tipo, setTipo] = useState<TipoPlaga | ''>(ficha?.tipo ?? '')
  const [sinonimos, setSinonimos] = useState<string[]>(ficha?.sinonimos ?? [])
  const [hospederos, setHospederos] = useState<string[]>(ficha?.hospederos ?? [])
  const [organos, setOrganos] = useState<string[]>(ficha?.organosAfectados ?? [])

  // Descripción, síntomas y contención
  const [descripcion, setDescripcion] = useState(ficha?.descripcion ?? '')
  const [sintomas, setSintomas] = useState(ficha?.sintomas ?? '')
  const [medidas, setMedidas] = useState(ficha?.medidasContencion ?? '')

  // Foto (una sola por ficha)
  const [foto, setFoto] = useState<File | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)

  // Protocolo químico (bloqueado sin aval)
  const [protocolo, setProtocolo] = useState<ProtocoloQuimico>(descomponerProtocolo(ficha?.protocoloQuimico ?? null))

  const conAval = (ficha?.avales.length ?? 0) > 0

  // Para saber si el agrónomo autenticado ya avaló esta ficha
  const miPerfil = useQuery({
    queryKey: clavesAgronomos.miPerfil,
    queryFn: () => agronomosService.miPerfil(),
    enabled: !esNueva,
  })
  const yaAvale = !!miPerfil.data && !!ficha?.avales.some((a) => a.agronomoId === miPerfil.data.id)

  // Cerrar con Escape
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [onClose])

  // Libera la URL temporal de la vista previa
  useEffect(() => {
    return () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia)
    }
  }, [vistaPrevia])

  const alGuardar = (actualizada: Plaga) => {
    queryClient.invalidateQueries({ queryKey: clavesPlagas.todas })
    onGuardada(actualizada)
  }

  // RF-05.3 / RF-05.4 — crea o actualiza la ficha y después sube la foto si se eligió una
  const guardar = useMutation({
    mutationFn: async (datos: DatosFicha) => {
      const guardada = ficha ? await plagasService.actualizar(ficha.id, datos) : await plagasService.crear(datos)
      return foto ? await plagasService.subirFoto(guardada.id, foto) : guardada
    },
    onSuccess: (guardada) => {
      setFoto(null)
      setVistaPrevia(null)
      alGuardar(guardada)
    },
  })

  // RF-05.7 — firma con la tarjeta del agrónomo autenticado
  const avalar = useMutation({
    mutationFn: () => plagasService.avalar(ficha!.id),
    onSuccess: alGuardar,
  })

  // RF-05.6 — solo se acepta si la ficha tiene aval
  const guardarProtocolo = useMutation({
    mutationFn: () => plagasService.actualizarProtocolo(ficha!.id, componerProtocolo(protocolo)),
    onSuccess: alGuardar,
  })

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFoto(null)
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return

    if (!TIPOS_FOTO.includes(archivo.type) || archivo.size > MAX_MB * 1024 * 1024) {
      setErrorFoto(`Solo JPG, PNG o WEBP de hasta ${MAX_MB} MB.`)
      return
    }

    setFoto(archivo)
    setVistaPrevia(URL.createObjectURL(archivo))
  }

  // RF-05.4 — taxonomía, fisiología afectada y medidas de contención son obligatorias
  const puedeGuardar =
    nombreComun.trim() !== '' &&
    tipo !== '' &&
    descripcion.trim() !== '' &&
    sintomas.trim() !== '' &&
    organos.length > 0 &&
    medidas.trim() !== ''

  const enviar = () => {
    if (!puedeGuardar) return
    guardar.mutate({
      nombreComun: nombreComun.trim(),
      nombreCientifico: nombreCientifico.trim() || null,
      tipo,
      descripcion: descripcion.trim(),
      sintomas: sintomas.trim(),
      organosAfectados: organos,
      hospederos,
      medidasContencion: medidas.trim(),
      sinonimos,
    })
  }

  const protocoloCompleto = componerProtocolo(protocolo) !== ''
  const imagenActual = vistaPrevia ?? urlArchivo(ficha?.fotoUrl)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {esNueva ? 'Nueva ficha de plaga' : ficha.nombreComun}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {esNueva
                ? 'Completa los campos para registrar una nueva ficha fitosanitaria'
                : 'Edita la ficha, registra tu aval y completa el manejo químico'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Contenido desplazable */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* ---------- Identificación ---------- */}
          <section className="space-y-5">
            <TituloSeccion>Identificación</TituloSeccion>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Nombre común" requerido>
                <input
                  value={nombreComun}
                  onChange={(e) => setNombreComun(e.target.value)}
                  placeholder="Broca del café"
                  className={INPUT}
                />
              </Campo>
              <Campo label="Nombre científico">
                <input
                  value={nombreCientifico}
                  onChange={(e) => setNombreCientifico(e.target.value)}
                  placeholder="Hypothenemus hampei"
                  className={`${INPUT} italic`}
                />
              </Campo>
            </div>

            <Campo label="Tipo" requerido>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoPlaga)}
                className={`${INPUT} bg-white ${tipo === '' ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="">Seleccionar tipo</option>
                {TIPOS_PLAGA.map((t) => (
                  <option key={t.valor} value={t.valor} className="text-gray-800">
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>

            {/* RF-05.5 — listas dinámicas */}
            <TagInput
              label="Sinónimos regionales"
              placeholder="taladrillo del café..."
              values={sinonimos}
              onChange={setSinonimos}
            />
            <TagInput
              label="Hospederos vegetales"
              placeholder="Coffea arabica..."
              values={hospederos}
              onChange={setHospederos}
            />
            <TagInput
              label="Órganos afectados *"
              placeholder="frutos, hojas, raíces..."
              values={organos}
              onChange={setOrganos}
            />
          </section>

          {/* ---------- Descripción y síntomas ---------- */}
          <section className="space-y-5">
            <TituloSeccion>Descripción y síntomas</TituloSeccion>

            <Campo label="Descripción" requerido>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción general del organismo, biología y condiciones favorables..."
                className={`${INPUT} resize-none`}
              />
            </Campo>

            <Campo label="Síntomas" requerido>
              <textarea
                rows={3}
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                placeholder="Describe los síntomas observables en campo: color, textura, patrón de daño..."
                className={`${INPUT} resize-none`}
              />
            </Campo>

            {/* RF-05.4 — medidas no químicas: no requieren aval */}
            <Campo label="Medidas de contención" requerido>
              <textarea
                rows={3}
                value={medidas}
                onChange={(e) => setMedidas(e.target.value)}
                placeholder="Control cultural y biológico: recolección oportuna, manejo de sombra, Beauveria bassiana..."
                className={`${INPUT} resize-none`}
              />
            </Campo>
          </section>

          {/* ---------- Foto ---------- */}
          <section className="space-y-4">
            <TituloSeccion>Foto de referencia</TituloSeccion>

            <div className="flex items-center gap-4">
              {imagenActual ? (
                <img src={imagenActual} alt="Foto de la ficha" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl bg-[#eef4f0] text-[#9dc7ae]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <label className="flex cursor-pointer flex-col rounded-xl border-2 border-dashed border-[#cfe3d6] px-5 py-4 transition hover:border-agro-green hover:bg-[#f7fbf8]">
                <span className="text-sm font-medium text-gray-800">
                  {imagenActual ? 'Cambiar foto' : 'Subir foto'}
                </span>
                <span className="mt-1 text-xs text-gray-400">JPG, PNG o WEBP — máx. {MAX_MB} MB</span>
                <input type="file" accept={TIPOS_FOTO.join(',')} onChange={elegirFoto} className="hidden" />
              </label>
            </div>

            {foto && <p className="text-xs text-gray-500">Se subirá al guardar: {foto.name}</p>}
            {errorFoto && <p className="text-xs text-amber-600">{errorFoto}</p>}
          </section>

          {/* Aval y protocolo químico existen solo sobre una ficha ya creada */}
          {esNueva ? (
            <p className="rounded-xl bg-[#fafcfb] px-5 py-4 text-xs text-gray-500">
              Después de crear la ficha podrás registrar tu aval profesional y completar el manejo químico.
            </p>
          ) : (
            <>
              {/* ---------- Aval profesional — RF-05.7 ---------- */}
              <section className="rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Aval profesional</h3>
                  {conAval ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-agro-green">
                      <IconoEscudo /> {ficha.avales.length} aval(es)
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600">Pendiente</span>
                  )}
                </div>

                {conAval && (
                  <ul className="mt-3 space-y-1.5">
                    {ficha.avales.map((a) => (
                      <li key={a.id} className="flex justify-between rounded-md bg-[#eef4f0] px-3 py-1.5 text-xs text-gray-700">
                        <span>Tarjeta profesional {a.numeroTarjeta}</span>
                        <span className="text-gray-400">{new Date(a.fechaAval).toLocaleDateString('es-CO')}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4">
                  {yaAvale ? (
                    <p className="text-xs text-gray-500">Ya registraste tu aval para esta ficha.</p>
                  ) : (
                    <Button disabled={avalar.isPending || !miPerfil.data} onClick={() => avalar.mutate()}>
                      <IconoEscudo />
                      {avalar.isPending ? 'Registrando...' : 'Avalar con mi tarjeta profesional'}
                    </Button>
                  )}
                  {avalar.isError && (
                    <p className="mt-2 text-xs text-red-600">{mensajeDeError(avalar.error, 'No se pudo registrar el aval.')}</p>
                  )}
                </div>
              </section>

              {/* ---------- Manejo químico — RF-05.6 ---------- */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <TituloSeccion>Manejo químico</TituloSeccion>
                  {conAval ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-agro-green">
                      <IconoCandado abierto /> Desbloqueado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <IconoCandado /> Requiere aval
                    </span>
                  )}
                </div>

                {conAval ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Campo label="Ingrediente activo">
                        <input
                          value={protocolo.ingredienteActivo}
                          onChange={(e) => setProtocolo((p) => ({ ...p, ingredienteActivo: e.target.value }))}
                          placeholder="Oxicloruro de cobre"
                          className={INPUT}
                        />
                      </Campo>
                      <Campo label="Dosis">
                        <input
                          value={protocolo.dosis}
                          onChange={(e) => setProtocolo((p) => ({ ...p, dosis: e.target.value }))}
                          placeholder="3 g/L"
                          className={INPUT}
                        />
                      </Campo>
                      <Campo label="Periodo de carencia">
                        <input
                          value={protocolo.periodoCarencia}
                          onChange={(e) => setProtocolo((p) => ({ ...p, periodoCarencia: e.target.value }))}
                          placeholder="21 días"
                          className={INPUT}
                        />
                      </Campo>
                    </div>
                    <button
                      type="button"
                      disabled={!protocoloCompleto || guardarProtocolo.isPending}
                      onClick={() => guardarProtocolo.mutate()}
                      className="rounded-lg border border-agro-green px-4 py-2 text-sm font-medium text-agro-green transition hover:bg-[#eaf4ee] disabled:opacity-50"
                    >
                      {guardarProtocolo.isPending ? 'Guardando...' : 'Guardar manejo químico'}
                    </button>
                    {guardarProtocolo.isSuccess && <p className="text-xs text-agro-green">Manejo químico guardado.</p>}
                    {guardarProtocolo.isError && (
                      <p className="text-xs text-red-600">
                        {mensajeDeError(guardarProtocolo.error, 'No se pudo guardar el manejo químico.')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#cfe3d6] bg-[#fafcfb] px-6 py-7 text-center">
                    <span className="text-gray-600">
                      <IconoCandado grande />
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-800">Requiere aval profesional</p>
                    <p className="mt-1 max-w-sm text-xs text-gray-500">
                      Registra el aval de un agrónomo para desbloquear el ingrediente activo, la dosis y el periodo de
                      carencia.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Pie */}
        <footer className="border-t border-gray-100 px-6 py-4">
          {guardar.isError && (
            <p className="mb-3 text-sm text-red-600">{mensajeDeError(guardar.error, 'No se pudo guardar la ficha.')}</p>
          )}
          {guardar.isSuccess && !guardar.isPending && (
            <p className="mb-3 text-sm text-agro-green">Ficha guardada.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <Button disabled={!puedeGuardar || guardar.isPending} onClick={enviar}>
              {guardar.isPending ? 'Guardando...' : esNueva ? 'Crear ficha' : 'Guardar cambios'}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  )
}

/* ---------- Piezas pequeñas ---------- */

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{children}</h3>
}

function Campo({
  label,
  requerido = false,
  children,
}: {
  label: string
  requerido?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {requerido && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function IconoEscudo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconoCandado({ abierto = false, grande = false }: { abierto?: boolean; grande?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={grande ? 'h-6 w-6' : 'h-3.5 w-3.5'}
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d={abierto ? 'M8 11V7a4 4 0 0 1 7.5-2' : 'M8 11V7a4 4 0 0 1 8 0v4'} strokeLinecap="round" />
    </svg>
  )
}
