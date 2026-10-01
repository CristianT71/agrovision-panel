import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FORMATO_VERSION,
  MAX_MB_JSON,
  MAX_MB_MODELO,
  clavesModelos,
  modelosService,
} from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'
import { tamanoLegible } from '../../utils/archivos'

// RF-09.5 — artefactos tensoriales que acepta la API (los reconoce por su contenido)
const EXTENSIONES_MODELO = ['.tflite', '.pt']

const INPUT =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none'

type Props = {
  onClose: () => void
}

export default function PublishModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [modelo, setModelo] = useState<File | null>(null)
  const [etiquetas, setEtiquetas] = useState<File | null>(null)
  const [calibracion, setCalibracion] = useState<File | null>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [version, setVersion] = useState('')
  const [appMinima, setAppMinima] = useState('')
  const [notas, setNotas] = useState('')

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  const subir = useMutation({
    mutationFn: () =>
      modelosService.subir({
        version: version.trim(),
        versionMinApp: appMinima.trim(),
        notas: notas.trim(),
        modelo: modelo!,
        etiquetas,
        calibracion,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clavesModelos.todos })
      onClose()
    },
  })

  const elegirModelo = (f: File) => {
    setErrorArchivo(null)
    if (!EXTENSIONES_MODELO.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      setErrorArchivo(`Formato no admitido. Solo ${EXTENSIONES_MODELO.join(', ')}.`)
      return
    }
    if (f.size > MAX_MB_MODELO * 1024 * 1024) {
      setErrorArchivo(`El modelo supera los ${MAX_MB_MODELO} MB.`)
      return
    }
    setModelo(f)
  }

  const elegirJson = (f: File | undefined, guardar: (f: File) => void) => {
    setErrorArchivo(null)
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.json') || f.size > MAX_MB_JSON * 1024 * 1024) {
      setErrorArchivo(`Las etiquetas y la calibración son archivos .json de hasta ${MAX_MB_JSON} MB.`)
      return
    }
    guardar(f)
  }

  // Un .tflite sin etiquetas ni calibración no se puede activar en el teléfono
  const esTflite = modelo?.name.toLowerCase().endsWith('.tflite') ?? false
  const versionValida = FORMATO_VERSION.test(version.trim())
  const appValida = FORMATO_VERSION.test(appMinima.trim())
  const puedeSubir =
    modelo !== null && versionValida && appValida && (!esTflite || (etiquetas !== null && calibracion !== null))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Subir nueva versión</h2>
          <p className="mt-1 text-sm text-gray-500">
            Entra como borrador. Desde ahí avanza por interno, canario y producción.
          </p>
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
              if (f) elegirModelo(f)
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition ${
              arrastrando
                ? 'border-agro-green bg-[#f3f9f5]'
                : modelo
                  ? 'border-agro-green bg-[#f7fbf8]'
                  : 'border-[#cfe3d6] hover:border-agro-green hover:bg-[#f7fbf8]'
            }`}
          >
            {modelo ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-agro-green">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 12.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 max-w-full truncate text-sm font-medium text-gray-800">{modelo.name}</span>
                <span className="mt-0.5 text-xs text-gray-400">
                  {tamanoLegible(modelo.size)} · Clic para reemplazar
                </span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-agro-green">
                  <path d="M12 16V4M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
                </svg>
                <span className="mt-2 text-sm font-medium text-gray-800">Arrastrar artefacto del modelo</span>
                <span className="mt-1 text-xs text-gray-400">
                  {EXTENSIONES_MODELO.join(', ')} — máx. {MAX_MB_MODELO} MB
                </span>
              </>
            )}
            <input
              type="file"
              accept={EXTENSIONES_MODELO.join(',')}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) elegirModelo(f)
                e.target.value = ''
              }}
              className="hidden"
            />
          </label>

          {/* La app no instala un .tflite sin estos dos archivos; un .pt los admite opcionales */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ArchivoJson
              titulo="Etiquetas"
              ayuda="labels.json"
              archivo={etiquetas}
              obligatorio={esTflite}
              onElegir={(f) => elegirJson(f, setEtiquetas)}
            />
            <ArchivoJson
              titulo="Calibración"
              ayuda="calibration.json"
              archivo={calibracion}
              obligatorio={esTflite}
              onElegir={(f) => elegirJson(f, setCalibracion)}
            />
          </div>

          {errorArchivo && <p className="text-xs text-red-600">{errorArchivo}</p>}

          {modelo && !esTflite && (
            <p className="rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-700">
              Un .pt queda como referencia (por ejemplo, el Teacher): nunca se publica a los teléfonos.
            </p>
          )}

          <div>
            <label htmlFor="version" className="text-sm font-medium text-gray-700">
              Número de versión
            </label>
            <input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.3.0"
              className={`mt-2 ${INPUT} font-mono`}
            />
            {version.trim() && !versionValida && (
              <p className="mt-1 text-xs text-amber-600">Usa el formato 1.2.3, sin la letra v.</p>
            )}
          </div>

          <div>
            <label htmlFor="appMin" className="text-sm font-medium text-gray-700">
              Versión mínima de la app
            </label>
            <input
              id="appMin"
              value={appMinima}
              onChange={(e) => setAppMinima(e.target.value)}
              placeholder="2.0.0"
              className={`mt-2 ${INPUT} font-mono`}
            />
            {appMinima.trim() && !appValida && (
              <p className="mt-1 text-xs text-amber-600">Usa el formato 1.2.3, sin la letra v.</p>
            )}
          </div>

          <div>
            <label htmlFor="notas" className="text-sm font-medium text-gray-700">
              Notas de versión
            </label>
            <textarea
              id="notas"
              rows={3}
              maxLength={1000}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Describe los cambios, mejoras y correcciones de esta versión..."
              className={`mt-2 ${INPUT} resize-none`}
            />
          </div>

          {subir.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {mensajeDeError(subir.error, 'No se pudo subir el modelo.')}
            </p>
          )}
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
            disabled={!puedeSubir || subir.isPending}
            onClick={() => subir.mutate()}
            className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {subir.isPending ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchivoJson({
  titulo,
  ayuda,
  archivo,
  obligatorio,
  onElegir,
}: {
  titulo: string
  ayuda: string
  archivo: File | null
  obligatorio: boolean
  onElegir: (f: File | undefined) => void
}) {
  return (
    <label
      className={`cursor-pointer rounded-xl border px-4 py-3 transition hover:border-agro-green ${
        archivo ? 'border-agro-green bg-[#f7fbf8]' : 'border-gray-200'
      }`}
    >
      <span className="text-sm font-medium text-gray-700">
        {titulo} {obligatorio && <span className="text-red-500">*</span>}
      </span>
      <span className="mt-0.5 block truncate text-xs text-gray-400">{archivo ? archivo.name : ayuda}</span>
      <input
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          onElegir(e.target.files?.[0])
          e.target.value = ''
        }}
        className="hidden"
      />
    </label>
  )
}
