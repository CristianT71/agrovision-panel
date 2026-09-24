import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import { authService } from '../../api/auth/auth.service'
import { agronomosService } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'
import {
  calcularIniciales,
  guardarSesion,
  rolDesdeApi,
  rolParaApi,
  rutaInicial,
  type Rol,
} from '../../api/auth/session'

const PREFIXES = [
  { code: 'co', dial: '+57' },
  { code: 'us', dial: '+1' },
  { code: 'mx', dial: '+52' },
  { code: 'pe', dial: '+51' },
  { code: 'ec', dial: '+593' },
]

export default function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [role, setRole] = useState<Rol>('profesional')
  const [dial, setDial] = useState('+57')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    params.get('sesion') === 'expirada' ? 'Tu sesión expiró. Ingresa de nuevo.' : null,
  )
  const [countdown, setCountdown] = useState(0)

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const numericPhone = phone.replace(/\D/g, '')
  const isPhoneValid = numericPhone.length >= 7
  const formattedPhone = `${dial}${numericPhone}`
  const otpCompleto = otp.replace(/\D/g, '').length === 6

  // RF-01.5 — bloqueo de 30s para reenviar
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [countdown])

  /* ---------- OTP: escritura secuencial (RF-01.4) ---------- */

  const escribirDigito = (i: number, valor: string) => {
    const digito = valor.replace(/\D/g, '').slice(-1)
    if (!digito) return
    const actual = otp.padEnd(6, ' ').split('')
    actual[i] = digito
    setOtp(actual.join('').trimEnd())
    if (i < 5) inputsRef.current[i + 1]?.focus()
  }

  const teclaOtp = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const actual = otp.padEnd(6, ' ').split('')
      if (actual[i] && actual[i] !== ' ') {
        actual[i] = ' '
        setOtp(actual.join('').trimEnd())
      } else if (i > 0) {
        actual[i - 1] = ' '
        setOtp(actual.join('').trimEnd())
        inputsRef.current[i - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < 5) inputsRef.current[i + 1]?.focus()
  }

  const pegarOtp = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pegado = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pegado) return
    setOtp(pegado)
    inputsRef.current[Math.min(pegado.length, 5)]?.focus()
  }

  const volverATelefono = () => {
    setStep('enterPhone')
    setOtp('')
    setError(null)
  }

  /* ---------- Peticiones ---------- */

  const enviarCodigo = async () => {
    setError(null)
    if (!isPhoneValid) {
      setError('Número inválido')
      return
    }
    setLoading(true)
    try {
      const { esperaSegundos } = await authService.solicitarOtp({ telefono: formattedPhone })
      setStep('enterOtp')
      setCountdown(esperaSegundos ?? 30)
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'No se pudo enviar el código.'))
    } finally {
      setLoading(false)
    }
  }

  const reenviarCodigo = async () => {
    if (countdown > 0) return
    setOtp('')
    await enviarCodigo()
  }

  const validarCodigo = async () => {
    setError(null)
    const codigo = otp.replace(/\D/g, '')
    if (codigo.length !== 6) {
      setError('El código debe tener 6 dígitos')
      return
    }
    setLoading(true)
    try {
      const { accessToken, usuario } = await authService.validarOtp({
        telefono: formattedPhone,
        codigo,
        rolSeleccionado: rolParaApi(role),
      })

      // El rol de la sesión es el que confirma la API, no el que se eligió en pantalla
      const rol = rolDesdeApi(usuario.rol)
      if (!rol) {
        setError('Esta cuenta no tiene acceso al panel administrativo.')
        return
      }

      // El agrónomo se muestra con su nombre; la cuenta de administrador no tiene perfil
      const nombre =
        rol === 'profesional' ? (await agronomosService.miPerfil(accessToken)).nombre : 'Administrador'

      guardarSesion(
        { rol, nombre, iniciales: calcularIniciales(nombre), telefono: usuario.telefono },
        accessToken,
      )

      // RF-01.7 — enrutar según el rol
      navigate(rutaInicial(rol), { replace: true })
    } catch (err: unknown) {
      setError(mensajeDeError(err, 'No se pudo validar el código.'))
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Vista ---------- */

  return (
    <AuthLayout>
      {step === 'enterPhone' ? (
        <>
          <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-gray-500">
            Ingresa tu número de celular para recibir un código de verificación.
          </p>

          {/* RF-01.2 — selección de rol */}
          <div className="mt-8">
            <label className="text-sm font-medium text-gray-700">Acceder como</label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Button
                variant="toggle"
                active={role === 'profesional'}
                onClick={() => setRole('profesional')}
              >
                Agrónomo
              </Button>
              <Button
                variant="toggle"
                active={role === 'administrador'}
                onClick={() => setRole('administrador')}
              >
                Administrador
              </Button>
            </div>
          </div>

          {/* RF-01.3 — prefijos internacionales */}
          <div className="mt-6">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Número de celular
            </label>
            <div className="mt-2 flex gap-2">
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-agro-green focus:outline-none"
              >
                {PREFIXES.map((p) => (
                  <option key={p.dial} value={p.dial}>
                    {p.code} {p.dial}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="311 452 8801"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6">
            <Button disabled={!isPhoneValid || loading} onClick={enviarCodigo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path
                  d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
                  strokeLinejoin="round"
                />
              </svg>
              {loading ? 'Enviando...' : 'Enviar código'}
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Eres nuevo?{' '}
            <Link to="/solicitar-acceso" className="font-medium text-agro-green hover:underline">
              Solicitar acceso
            </Link>
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={volverATelefono}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Cambiar número
          </button>

          <h2 className="mt-5 text-3xl font-bold text-gray-900">Verificar código</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enviamos un código de 6 dígitos a{' '}
            <strong className="text-gray-900">{formattedPhone}</strong>
          </p>

          {/* RF-01.4 — 6 casillas secuenciales */}
          <div className="mt-6 flex gap-3" onPaste={pegarOtp}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const digito = otp[i] && otp[i] !== ' ' ? otp[i] : ''
              return (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digito}
                  onChange={(e) => escribirDigito(i, e.target.value)}
                  onKeyDown={(e) => teclaOtp(i, e)}
                  className={`h-14 w-12 rounded-xl border text-center text-xl font-semibold text-gray-900 transition focus:border-agro-green focus:outline-none ${
                    digito ? 'border-agro-green bg-[#f3f9f5]' : 'border-gray-200 bg-white'
                  }`}
                />
              )
            })}
          </div>

          <div className="mt-6">
            <Button disabled={!otpCompleto || loading} onClick={validarCodigo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? 'Validando...' : 'Verificar e ingresar'}
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* RF-01.5 — reenvío bloqueado 30s */}
          <p className="mt-5 text-center text-sm">
            {countdown > 0 ? (
              <span className="text-gray-500">
                Reenviar código en <strong className="text-gray-900">{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={reenviarCodigo}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-medium text-agro-green hover:underline disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                  <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Reenviar código
              </button>
            )}
          </p>
        </>
      )}
    </AuthLayout>
  )
}