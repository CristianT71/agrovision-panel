import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { agronomosService, ESPECIALIDADES } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'

// RF-01.3 — mismos prefijos que el login
const PREFIJOS = [
  { code: 'co', dial: '+57' },
  { code: 'us', dial: '+1' },
  { code: 'mx', dial: '+52' },
  { code: 'pe', dial: '+51' },
  { code: 'ec', dial: '+593' },
]

// RF-10.4 — deben coincidir con los límites de la API
const MAX_DOCUMENTOS = 3
const MAX_MB = 5
const TIPOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export default function RequestAccess() {
  const [step, setStep] = useState<1 | 2>(1)

  // Paso 1
  const [nombre, setNombre] = useState('')
  const [dial, setDial] = useState('+57')
  const [celular, setCelular] = useState('')
  const [correo, setCorreo] = useState('')

  // Paso 2
  const [tarjeta, setTarjeta] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [documentos, setDocumentos] = useState<File[]>([])
  const [errorDocumentos, setErrorDocumentos] = useState<string | null>(null)

  const registro = useMutation({ mutationFn: agronomosService.registrar })

  const celularNumerico = celular.replace(/\D/g, '')

  const step1Valid = nombre.trim().length > 2 && celularNumerico.length >= 7 && /\S+@\S+\.\S+/.test(correo)

  const step2Valid = tarjeta.trim().length > 3 && especialidad !== '' && documentos.length > 0

  const agregarDocumentos = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorDocumentos(null)
    const archivos = Array.from(e.target.files ?? [])
    const validos = archivos.filter((f) => TIPOS_DOCUMENTO.includes(f.type) && f.size <= MAX_MB * 1024 * 1024)

    if (validos.length < archivos.length) {
      setErrorDocumentos(`Se omitieron archivos: solo PDF, JPG, PNG o WEBP de hasta ${MAX_MB} MB.`)
    }

    const espacio = MAX_DOCUMENTOS - documentos.length
    if (validos.length > espacio) {
      setErrorDocumentos(`Máximo ${MAX_DOCUMENTOS} documentos.`)
    }

    setDocumentos((prev) => [...prev, ...validos.slice(0, espacio)])
    e.target.value = ''
  }

  const quitarDocumento = (indice: number) => setDocumentos((prev) => prev.filter((_, i) => i !== indice))

  const enviar = () => {
    if (!step2Valid) return
    registro.mutate({
      nombre: nombre.trim(),
      telefono: `${dial}${celularNumerico}`,
      correo: correo.trim(),
      tarjetaProfesional: tarjeta.trim(),
      especialidad,
      documentos,
    })
  }

  // RF-10.5 — la cuenta queda pendiente hasta que un administrador la valide
  if (registro.isSuccess) {
    return (
      <AuthLayout>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f7ee] text-agro-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-bold text-gray-900">Solicitud enviada</h2>
        <p className="mt-2 text-sm text-gray-500">{registro.data.mensaje}</p>
        <p className="mt-2 text-sm text-gray-500">
          Podrás iniciar sesión con <strong className="text-gray-900">{`${dial}${celularNumerico}`}</strong> cuando
          tu cuenta sea validada.
        </p>
        <Link
          to="/login"
          className="mt-8 flex w-full items-center justify-center rounded-lg bg-agro-green py-3 text-sm font-medium text-white transition hover:bg-[#194b32]"
        >
          Volver al inicio de sesión
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900">
        {step === 1 ? 'Solicitar acceso' : 'Datos profesionales'}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Paso {step} de 2 — {step === 1 ? 'Datos personales' : 'Credenciales'}
      </p>

      {/* Barra de progreso */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#dceee2]">
        <div
          className="h-full rounded-full bg-agro-green transition-all duration-300"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      {step === 1 ? (
        <>
          <div className="mt-8 space-y-5">
            <Input
              id="nombre"
              label="Nombre completo"
              placeholder="Claudia Ríos Salcedo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            {/* RF-01.3 — prefijo internacional */}
            <div>
              <label htmlFor="celular" className="text-sm font-medium text-gray-700">
                Celular
              </label>
              <div className="mt-2 flex gap-2">
                <select
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-agro-green focus:outline-none"
                >
                  {PREFIJOS.map((p) => (
                    <option key={p.dial} value={p.dial}>
                      {p.code} {p.dial}
                    </option>
                  ))}
                </select>
                <input
                  id="celular"
                  type="tel"
                  inputMode="numeric"
                  placeholder="312 441 7780"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
                />
              </div>
            </div>

            <Input
              id="correo"
              label="Correo electrónico"
              type="email"
              placeholder="claudia@agrovision.co"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <Button disabled={!step1Valid} onClick={() => setStep(2)}>
              Continuar
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>

          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="text-gray-500 hover:text-gray-700">
              ← Volver al inicio de sesión
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="mt-8 space-y-5">
            <Input
              id="tarjeta"
              label="N° tarjeta profesional"
              placeholder="TP-098712"
              value={tarjeta}
              onChange={(e) => setTarjeta(e.target.value)}
            />

            <div>
              <label htmlFor="especialidad" className="text-sm font-medium text-gray-700">
                Especialidad
              </label>
              <select
                id="especialidad"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className={`mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-agro-green focus:outline-none ${
                  especialidad === '' ? 'text-gray-400' : 'text-gray-800'
                }`}
              >
                <option value="">Seleccionar especialidad</option>
                {ESPECIALIDADES.map((e) => (
                  <option key={e} value={e} className="text-gray-800">
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* RF-10.4 — soportes de acreditación */}
            <div>
              <span className="text-sm font-medium text-gray-700">Documentos de acreditación</span>
              <label
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cfe3d6] px-4 py-5 text-center transition hover:border-agro-green hover:bg-[#f7fbf8] ${
                  documentos.length >= MAX_DOCUMENTOS ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6 text-agro-green">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
                  <path d="M14 3v5h5M12 18v-6M9 15l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-2 text-sm font-medium text-gray-800">Adjuntar tarjeta profesional o diplomas</span>
                <span className="mt-1 text-xs text-gray-400">
                  PDF, JPG, PNG o WEBP — máx. {MAX_DOCUMENTOS} archivos, {MAX_MB} MB c/u
                </span>
                <input
                  type="file"
                  accept={TIPOS_DOCUMENTO.join(',')}
                  multiple
                  onChange={agregarDocumentos}
                  className="hidden"
                />
              </label>

              {errorDocumentos && <p className="mt-2 text-xs text-amber-600">{errorDocumentos}</p>}

              {documentos.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {documentos.map((d, i) => (
                    <li
                      key={`${d.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-[#eef4f0] px-3 py-1.5 text-xs text-gray-700"
                    >
                      <span className="truncate">{d.name}</span>
                      <button
                        type="button"
                        onClick={() => quitarDocumento(i)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Button disabled={!step2Valid || registro.isPending} onClick={enviar}>
              {registro.isPending ? 'Enviando...' : 'Enviar solicitud de acceso'}
            </Button>
          </div>

          {registro.isError && (
            <p className="mt-4 text-sm text-red-600">
              {mensajeDeError(registro.error, 'No se pudo enviar la solicitud.')}
            </p>
          )}

          <p className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Atrás
            </button>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
