import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'

type Role = 'profesional' | 'administrador'

const PREFIXES = [
  { code: 'co', dial: '+57' },
  { code: 'us', dial: '+1' },
  { code: 'mx', dial: '+52' },
  { code: 'pe', dial: '+51' },
  { code: 'ec', dial: '+593' },
]

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('profesional')
  const [dial, setDial] = useState('+57')
  const [phone, setPhone] = useState('')

  const isValid = phone.replace(/\D/g, '').length >= 7

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
      <p className="mt-2 text-sm text-gray-500">
        Ingresa tu número de celular para recibir un código de verificación.
      </p>

      {/* Selección de rol — RF-01.2 */}
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

      {/* Teléfono — RF-01.3 */}
      <div className="mt-6">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Número de celular
        </label>
        <div className="mt-2 flex gap-2">
          <select
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#1f5f3f] focus:outline-none"
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
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#1f5f3f] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button disabled={!isValid} onClick={() => navigate('/verificar')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
          </svg>
          Enviar código
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Eres nuevo?{' '}
        <Link to="/solicitar-acceso" className="font-medium text-[#2f7d4f] hover:underline">
          Solicitar acceso
        </Link>
      </p>
    </AuthLayout>
  )
}