import { useState } from 'react'

type TagInputProps = {
  label: string
  placeholder?: string
  values: string[]
  onChange: (values: string[]) => void
}

export default function TagInput({ label, placeholder, values, onChange }: TagInputProps) {
  const [texto, setTexto] = useState('')

  const agregar = () => {
    const valor = texto.trim()
    if (!valor) return
    const repetido = values.some((v) => v.toLowerCase() === valor.toLowerCase())
    if (!repetido) onChange([...values, valor])
    setTexto('')
  }

  const quitar = (valor: string) => onChange(values.filter((v) => v !== valor))

  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-2 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregar()
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!texto.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ec] text-agro-green transition hover:bg-[#d6ebde] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 rounded-md bg-[#eef4f0] px-2 py-1 text-xs text-gray-700"
            >
              {v}
              <button
                type="button"
                onClick={() => quitar(v)}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}