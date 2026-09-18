import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import axios from 'axios'
import { authService } from '../../services/auth.service'
import { guardarSesion, rutaInicial, type Rol } from '../../auth/session'

// Poner en false cuando el backend esté disponible
const USAR_MOCK = true

type ApiRole = 'admin' | 'agronomo' | 'productor'

const PREFIXES = [
  { code: 'co', dial: '+57' },
  { code: 'us', dial: '+1' },
  { code: 'mx', dial: '+52' },
  { code: 'pe', dial: '+51' },
  { code: 'ec', dial: '+593' },
]

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Rol>('profesional')
  const [dial, setDial] = useState('+57')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'enterPhone' | 'enterOtp'>('enterPhone')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const numericPhone = phone.replace(/\D/g, '')
  const isPhoneValid = numericPhone.length >= 7
  const formattedPhone = `${dial}${numericPhone}`

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

  const mapRoleToApi = (r: Rol): ApiRole => (r === 'profesional' ? 'agronomo' : 'admin')

  const enviarCodigo = async () => {
    setError(null)
    if (!isPhoneValid) {
      setError('Número inválido')
      return
    }
    setLoading(true)
    try {
      if (USAR_MOCK) {
        await new Promise((r) => setTimeout(r, 600))
      } else {
        await authService.solicitarOtp({ telefono: formattedPhone })
      }
      setStep('enterOtp')
      setCountdown(30)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.mensaje ?? err.message)
      } else {
        setError(String(err ?? 'Error enviando código'))
      }
    } finally {
      setLoading(false)
    }
  }

  const reenviarCodigo = async () => {
    if (countdown > 0) return
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
      if (USAR_MOCK) {
        await new Promise((r) => setTimeout(r, 600))
      } else {
        const { accessToken } = await authService.validarOtp({
          telefono: formattedPhone,
          codigo,
          rolSeleccionado: mapRoleToApi(role),
        })
        localStorage.setItem('token', accessToken)
      }

      const esAdmin = role === 'administrador'
      guardarSesion({
        rol: role,
        nombre: esAdmin ? 'Ing. Andrés Molina' : 'Dra. Claudia Ríos',
        iniciales: esAdmin ? 'AM' : 'DC',
        telefono: formattedPhone,
      })

      // RF-01.7 — enrutar según el rol
      navigate(rutaInicial(role), { replace: true })
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.mensaje ?? err.message)
      } else {
        setError(String(err ?? 'Código inválido'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
      <p className="mt-2 text-sm text-gray-500">
        Ingresa tu número de celular para recibir un código de verificación.
      </p>

      {/* RF-01.2 — selección de rol */}
      <div className="mt-8">
        <label className="text-sm font-medium text-gray-700">Acceder como</label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Button variant="toggle" active={role === 'profesional'} onClick={() => setRole('profesional')}>
            Agrónomo
          </Button>
          <Button variant="toggle" active={role === 'administrador'} onClick={() => setRole('administrador')}>
            Administrador
          </Button>
        </div>
      </div>

      {step === 'enterPhone' && (
        <>
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
              {loading ? 'Enviando...' : 'Enviar código'}
            </Button>
          </div>
        </>
      )}

      {step === 'enterOtp' && (
        <>
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700">Código de 6 dígitos</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm tracking-[0.4em] focus:border-agro-green focus:outline-none"
            />
            {USAR_MOCK && (
              <p className="mt-2 text-xs text-gray-400">
                Modo de prueba: cualquier código de 6 dígitos funciona.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Enviado a <strong>{formattedPhone}</strong>
            </div>
            <button
              className="text-sm text-agro-green disabled:opacity-40"
              onClick={reenviarCodigo}
              disabled={countdown > 0 || loading}
            >
              {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
            </button>
          </div>

          <div className="mt-6">
            <Button disabled={loading} onClick={validarCodigo}>
              {loading ? 'Validando...' : 'Validar código'}
            </Button>
          </div>

          <p className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('enterPhone')
                setOtp('')
                setError(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Cambiar número
            </button>
          </p>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Eres nuevo?{' '}
        <Link to="/solicitar-acceso" className="font-medium text-agro-green hover:underline">
          Solicitar acceso
        </Link>
      </p>
    </AuthLayout>
  )
}