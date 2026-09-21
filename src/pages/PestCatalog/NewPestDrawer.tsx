import { useEffect, useState } from 'react'
import TagInput from '../../components/TagInput/TagInput'
import Button from '../../components/Button/Button'
import type { Categoria, Ficha } from './mockFichas'

const CATEGORIAS: Categoria[] = ['Enfermedad', 'Plaga', 'Deficiencia', 'Sano', 'Otro']
const MAX_FOTOS = 5
const MAX_MB = 10

const INPUT =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none disabled:bg-gray-50 disabled:text-gray-500'

type Props = {
  onClose: () => void
  onCreate: (ficha: Ficha) => void
}

export default function NewPestDrawer({ onClose, onCreate }: Props) {
  // Identificación 
  const [nombreComun, setNombreComun] = useState('')
  const [nombreCientifico, setNombreCientifico] = useState('')
  const [categoria, setCategoria] = useState<Categoria | ''>('')
  const [sinonimos, setSinonimos] = useState<string[]>([])
  const [cultivos, setCultivos] = useState<string[]>([])
  const [organos, setOrganos] = useState<string[]>([])

  // Descripción
  const [descripcion, setDescripcion] = useState('')
  const [sintomas, setSintomas] = useState('')

  // Fotos
  const [fotos, setFotos] = useState<{ url: string; nombre: string }[]>([])
  const [errorFotos, setErrorFotos] = useState<string | null>(null)
  const [urlPrincipal, setUrlPrincipal] = useState('')

  const [fuente, setFuente] = useState('')

  // Aval 
  const [avalNombre, setAvalNombre] = useState('')
  const [avalTarjeta, setAvalTarjeta] = useState('')
  const [avalRegistrado, setAvalRegistrado] = useState(false)

  // Manejo fitosanitario (bloqueado sin aval)
  const [cultural, setCultural] = useState('')
  const [biologico, setBiologico] = useState('')
  const [ingrediente, setIngrediente] = useState('')
  const [dosis, setDosis] = useState('')
  const [carencia, setCarencia] = useState('')

  // Cerrar con Escape
  useEffect(() => {
    const manejar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [onClose])

  const subirFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFotos(null)
    const archivos = Array.from(e.target.files ?? [])
    const validos = archivos.filter(
      (f) => ['image/jpeg', 'image/png'].includes(f.type) && f.size <= MAX_MB * 1024 * 1024,
    )
    if (validos.length < archivos.length) {
      setErrorFotos('Se omitieron archivos: solo JPG o PNG de hasta 10 MB.')
    }
    const espacio = MAX_FOTOS - fotos.length
    if (validos.length > espacio) {
      setErrorFotos(`Máximo ${MAX_FOTOS} imágenes por ficha.`)
    }
    setFotos((prev) => [
      ...prev,
      ...validos.slice(0, espacio).map((f) => ({ url: URL.createObjectURL(f), nombre: f.name })),
    ])
    e.target.value = ''
  }

  const quitarFoto = (url: string) => {
    URL.revokeObjectURL(url)
    setFotos((prev) => prev.filter((f) => f.url !== url))
  }

  const avalValido = avalNombre.trim().length > 3 && avalTarjeta.trim().length > 3

  const quitarAval = () => {
    setAvalRegistrado(false)
    // Al perder el aval, los campos de manejo se vacían
    setCultural('')
    setBiologico('')
    setIngrediente('')
    setDosis('')
    setCarencia('')
  }

  const puedeCrear =
    nombreComun.trim() !== '' && nombreCientifico.trim() !== '' && categoria !== ''

  const crear = () => {
    if (!puedeCrear) return
    onCreate({
      id: `F-${Date.now()}`,
      nombreComun: nombreComun.trim(),
      nombreCientifico: nombreCientifico.trim(),
      categoria: categoria as Categoria,
      conAval: avalRegistrado,
      sinonimos,
      imagen: urlPrincipal.trim() || fotos[0]?.url || '',
      cultivos,
      organos,
      descripcion,
      sintomas,
      fuente,
      aval: avalRegistrado ? { nombre: avalNombre.trim(), tarjeta: avalTarjeta.trim() } : undefined,
      manejo: avalRegistrado
        ? { cultural, biologico, ingredienteActivo: ingrediente, dosis, periodoCarencia: carencia }
        : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Fondo */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <aside className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Encabezado */}
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nueva ficha de plaga</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Completa los campos para registrar una nueva ficha fitosanitaria
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
              <Campo label="Nombre científico" requerido>
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
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as Categoria)}
                className={`${INPUT} bg-white ${categoria === '' ? 'text-gray-400' : 'text-gray-800'}`}
              >
                <option value="">Seleccionar tipo</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c} className="text-gray-800">
                    {c}
                  </option>
                ))}
              </select>
            </Campo>

            <TagInput
              label="Sinónimos regionales"
              placeholder="taladrillo del café..."
              values={sinonimos}
              onChange={setSinonimos}
            />
            <TagInput
              label="Cultivo(s)"
              placeholder="Coffea arabica..."
              values={cultivos}
              onChange={setCultivos}
            />
            <TagInput
              label="Órganos afectados"
              placeholder="frutos, hojas, raíces..."
              values={organos}
              onChange={setOrganos}
            />
          </section>

          {/* ---------- Descripción y síntomas ---------- */}
          <section className="space-y-5">
            <TituloSeccion>Descripción y síntomas</TituloSeccion>

            <Campo label="Descripción">
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción general del organismo, biología y condiciones favorables..."
                className={`${INPUT} resize-none`}
              />
            </Campo>

            <Campo label="Síntomas">
              <textarea
                rows={3}
                value={sintomas}
                onChange={(e) => setSintomas(e.target.value)}
                placeholder="Describe los síntomas observables en campo: color, textura, patrón de daño..."
                className={`${INPUT} resize-none`}
              />
            </Campo>
          </section>

          {/* ---------- Galería ---------- */}
          <section className="space-y-5">
            <TituloSeccion>Galería de fotos</TituloSeccion>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cfe3d6] px-6 py-8 text-center transition hover:border-agro-green hover:bg-[#f7fbf8] ${
                fotos.length >= MAX_FOTOS ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-agro-green">
                <rect x="3" y="5" width="15" height="15" rx="2" />
                <path d="M3 16l4-4 4 4 3-3 4 4" strokeLinejoin="round" />
                <path d="M19 2v6M16 5h6" strokeLinecap="round" />
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-800">Subir fotos de referencia</span>
              <span className="mt-1 text-xs text-gray-400">
                JPG, PNG — máx. {MAX_FOTOS} imágenes, {MAX_MB} MB c/u
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={subirFotos}
                className="hidden"
              />
            </label>

            {errorFotos && <p className="text-xs text-amber-600">{errorFotos}</p>}

            {fotos.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {fotos.map((f) => (
                  <div key={f.url} className="group relative overflow-hidden rounded-lg">
                    <img src={f.url} alt={f.nombre} className="h-20 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => quitarFoto(f.url)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Campo label="URL de foto principal">
              <input
                value={urlPrincipal}
                onChange={(e) => setUrlPrincipal(e.target.value)}
                placeholder="https://..."
                className={INPUT}
              />
            </Campo>
          </section>

          {/* ---------- Fuente ---------- */}
          <section className="space-y-4">
            <TituloSeccion>Fuente / Referencia</TituloSeccion>
            <input
              value={fuente}
              onChange={(e) => setFuente(e.target.value)}
              placeholder="Cenicafé. Boletín Técnico n.° 36, 2019. / DOI: 10.xxxxx"
              className={INPUT}
            />
          </section>

          {/* ---------- Manejo fitosanitario — RF-05.6 ---------- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <TituloSeccion>Manejo fitosanitario</TituloSeccion>
              {avalRegistrado ? (
                <span className="flex items-center gap-1 text-xs font-medium text-agro-green">
                  <IconoCandado abierto /> Desbloqueado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <IconoCandado /> Requiere aval
                </span>
              )}
            </div>

            {avalRegistrado ? (
              <div className="space-y-4">
                <Campo label="Control cultural">
                  <textarea
                    rows={2}
                    value={cultural}
                    onChange={(e) => setCultural(e.target.value)}
                    placeholder="Recolección oportuna, manejo de sombra, podas..."
                    className={`${INPUT} resize-none`}
                  />
                </Campo>
                <Campo label="Control biológico">
                  <textarea
                    rows={2}
                    value={biologico}
                    onChange={(e) => setBiologico(e.target.value)}
                    placeholder="Beauveria bassiana, parasitoides..."
                    className={`${INPUT} resize-none`}
                  />
                </Campo>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Campo label="Ingrediente activo">
                    <input
                      value={ingrediente}
                      onChange={(e) => setIngrediente(e.target.value)}
                      placeholder="Clorpirifos"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Dosis">
                    <input
                      value={dosis}
                      onChange={(e) => setDosis(e.target.value)}
                      placeholder="1.5 L/ha"
                      className={INPUT}
                    />
                  </Campo>
                  <Campo label="Periodo de carencia">
                    <input
                      value={carencia}
                      onChange={(e) => setCarencia(e.target.value)}
                      placeholder="21 días"
                      className={INPUT}
                    />
                  </Campo>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-[#cfe3d6] bg-[#fafcfb] px-6 py-7 text-center">
                <span className="text-gray-600">
                  <IconoCandado grande />
                </span>
                <p className="mt-2 text-sm font-medium text-gray-800">Requiere aval profesional</p>
                <p className="mt-1 max-w-sm text-xs text-gray-500">
                  Registra el aval de agrónomo en la sección de abajo para desbloquear los campos de
                  recomendación de manejo.
                </p>
              </div>
            )}
          </section>

          {/* ---------- Aval profesional — RF-05.7 ---------- */}
          <section className="rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Aval profesional</h3>
              {avalRegistrado ? (
                <span className="flex items-center gap-1 text-xs font-medium text-agro-green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
                    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Registrado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" />
                  </svg>
                  Pendiente
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Nombre del agrónomo" pequeño>
                <input
                  value={avalNombre}
                  disabled={avalRegistrado}
                  onChange={(e) => setAvalNombre(e.target.value)}
                  placeholder="Dr. Fernando Restrepo M."
                  className={INPUT}
                />
              </Campo>
              <Campo label="N° tarjeta profesional" pequeño>
                <input
                  value={avalTarjeta}
                  disabled={avalRegistrado}
                  onChange={(e) => setAvalTarjeta(e.target.value)}
                  placeholder="TP-110234"
                  className={INPUT}
                />
              </Campo>
            </div>

            <div className="mt-4">
              {avalRegistrado ? (
                <button
                  type="button"
                  onClick={quitarAval}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Quitar aval y volver a bloquear el manejo
                </button>
              ) : (
                <Button disabled={!avalValido} onClick={() => setAvalRegistrado(true)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
                  </svg>
                  Guardar aval y desbloquear manejo
                </Button>
              )}
            </div>
          </section>
        </div>

        {/* Pie */}
        <footer className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <Button disabled={!puedeCrear} onClick={crear}>
            Crear ficha
          </Button>
        </footer>
      </aside>
    </div>
  )
}

/* ---------- Piezas pequeñas ---------- */

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{children}</h3>
  )
}

function Campo({
  label,
  requerido = false,
  pequeño = false,
  children,
}: {
  label: string
  requerido?: boolean
  pequeño?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className={`font-medium text-gray-700 ${pequeño ? 'text-xs' : 'text-sm'}`}>
        {label}
        {requerido && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="mt-2">{children}</div>
    </div>
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