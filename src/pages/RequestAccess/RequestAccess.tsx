import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'

const ESPECIALIDADES = [
  'Fitopatología',
  'Entomología',
  'Agronomía general',
  'Suelos y nutrición',
  'Manejo integrado de plagas',
]

export default function RequestAccess() {
  const [step, setStep] = useState<1 | 2>(1)

  // Paso 1
  const [nombre, setNombre] = useState('')
  const [celular, setCelular] = useState('')
  const [correo, setCorreo] = useState('')

  // Paso 2
  const [tarjeta, setTarjeta] = useState('')
  const [especialidad, setEspecialidad] = useState('')

  const step1Valid =
    nombre.trim().length > 2 &&
    celular.replace(/\D/g, '').length >= 7 &&
    /\S+@\S+\.\S+/.test(correo)

  const step2Valid = tarjeta.trim().length > 3 && especialidad !== ''

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
          className="h-full rounded-full bg-[#1f5f3f] transition-all duration-300"
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
            <Input
              id="celular"
              label="Celular"
              type="tel"
              inputMode="numeric"
              placeholder="+57 312 441 7780"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
            />
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
                className={`mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#1f5f3f] focus:outline-none ${
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
          </div>

          <div className="mt-6">
            <Button disabled={!step2Valid}>Enviar solicitud de acceso</Button>
          </div>

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