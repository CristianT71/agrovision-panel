import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [seconds, setSeconds] = useState(RESEND_SECONDS)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // Contador de reenvío — RF-01.5
  useEffect(() => {
    if (seconds === 0) return
    const id = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [seconds])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const isComplete = code.every((d) => d !== '')

  // Escritura secuencial — RF-01.4
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    if (!digit) return

    const next = [...code]
    next[index] = digit
    setCode(next)

    if (index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...code]
      if (next[index]) {
        next[index] = ''
        setCode(next)
      } else if (index > 0) {
        next[index - 1] = ''
        setCode(next)
        inputsRef.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  // Pegar el código completo
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((d, i) => (next[i] = d))
    setCode(next)
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleResend = () => {
    setSeconds(RESEND_SECONDS)
    setCode(Array(OTP_LENGTH).fill(''))
    inputsRef.current[0]?.focus()
  }

  return (
    <AuthLayout>
      <h2 className="text-3xl font-bold text-gray-900">Verificar código</h2>
      <p className="mt-2 text-sm text-gray-500">
        Ingresa el código de 6 dígitos que enviamos a tu celular.
      </p>

      {/* Casillas del OTP */}
      <div className="mt-8 flex justify-between gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`h-14 w-12 rounded-lg border text-center text-xl font-semibold text-gray-900 transition focus:border-[#1f5f3f] focus:outline-none ${
              digit ? 'border-[#1f5f3f] bg-[#f3f9f5]' : 'border-gray-200 bg-white'
            }`}
          />
        ))}
      </div>

      <div className="mt-8">
        <Button disabled={!isComplete}>Verificar e ingresar</Button>
      </div>

      {/* Reenvío bloqueado 30s — RF-01.5 */}
      <p className="mt-6 text-center text-sm text-gray-500">
        {seconds > 0 ? (
          <>Puedes solicitar otro código en {seconds}s</>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-[#2f7d4f] hover:underline"
          >
            Reenviar código
          </button>
        )}
      </p>

      <p className="mt-4 text-center text-sm">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Cambiar número
        </button>
      </p>
    </AuthLayout>
  )
}