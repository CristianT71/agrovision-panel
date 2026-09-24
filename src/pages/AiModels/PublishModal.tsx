import { useEffect, useState } from 'react'
import { CANALES, type Canal } from './mockModelos'

const EXTENSIONES = ['.tflite', '.pt', '.onnx']
const MAX_MB = 500

const INPUT =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none'

type Props = {
  onClose: () => void
  onPublicar: (datos: {
    version: string
    appMinima: string
    canal: Canal
    notas: string
    archivo: string
  }) => void
}

export default function PublishModal({ onClose, onPublicar }: Props) {
  const [archivo, setArchivo] = useState<string | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [version, setVersion] = useState('')
  const [appMinima, setAppMinima] = useState('')
  const [canal, setCanal] = useState<Canal>('Borrador')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  // RF-09.5 — transferencia binaria de artefactos tensoriales
  const validarArchivo = (f: File) => {
    setErrorArchivo(null)
    const valido = EXTENSIONES.some((ext) => f.name.toLowerCase().endsWith(ext))
    if (!valido) {
      setErrorArchivo(`Formato no admitido. Solo ${EXTENSIONES.join(', ')}.`)
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrorArchivo(`El archivo supera los ${MAX_MB} MB.`)
      return
    }
    setArchivo(f.name)
  }

  const puedePublicar = archivo !== null && version.trim() !== '' && appMinima.trim() !== ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Publicar nueva versión</h2>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Carga del artefacto */}
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setArrastrando(true)
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault()
              setArrastrando(false)
              const f = e.dataTransfer.files[0]
              if (f) validarArchivo(f)
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${
              arrastrando
                ? 'border-agro-green bg-[#f3f9f5]'
                : archivo
                  ? 'border-agro-green bg-[#f7fbf8]'
                  : 'border-[#cfe3d6] hover:border-agro-green hover:bg-[#f7fbf8]'
            }`}
          >
            {archivo ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-agro-green">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 max-w-full truncate text-sm font-medium text-gray-800">
                  {archivo}
                </span>
                <span className="mt-0.5 text-xs text-gray-400">Clic para reemplazar</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-agro-green">
                  <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
                </svg>
                <span className="mt-2 text-sm font-medium text-gray-800">
                  Arrastrar artefacto del modelo
                </span>
                <span className="mt-1 text-xs text-gray-400">
                  {EXTENSIONES.join(', ')} — máx. {MAX_MB} MB
                </span>
              </>
            )}
            <input
              type="file"
              accept={EXTENSIONES.join(',')}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) validarArchivo(f)
                e.target.value = ''
              }}
              className="hidden"
            />
          </label>

          {errorArchivo && <p className="text-xs text-red-600">{errorArchivo}</p>}

          <div>
            <label htmlFor="version" className="text-sm font-medium text-gray-700">
              Número de versión
            </label>
            <input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v2.5.0"
              className={`mt-2 ${INPUT} font-mono`}
            />
          </div>

          <div>
            <label htmlFor="appMin" className="text-sm font-medium text-gray-700">
              Versión mínima app
            </label>
            <input
              id="appMin"
              value={appMinima}
              onChange={(e) => setAppMinima(e.target.value)}
              placeholder="3.5.0"
              className={`mt-2 ${INPUT} font-mono`}
            />
          </div>

          {/* RF-09.5 — pipeline de liberación */}
          <div>
            <label htmlFor="canal" className="text-sm font-medium text-gray-700">
              Canal destino
            </label>
            <select
              id="canal"
              value={canal}
              onChange={(e) => setCanal(e.target.value as Canal)}
              className={`mt-2 ${INPUT} bg-white text-gray-800`}
            >
              {CANALES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notas" className="text-sm font-medium text-gray-700">
              Notas de versión
            </label>
            <textarea
              id="notas"
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Describe los cambios, mejoras y correcciones de esta versión..."
              className={`mt-2 ${INPUT} resize-none`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!puedePublicar}
            onClick={() =>
              onPublicar({
                version: version.trim(),
                appMinima: appMinima.trim(),
                canal,
                notas: notas.trim(),
                archivo: archivo!,
              })
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Publicar
          </button>
        </div>
      </div>
    </div>
  )
}