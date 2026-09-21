type ToggleProps = {
  activo: boolean
  onChange: (valor: boolean) => void
  etiqueta: string
}

export default function Toggle({ activo, onChange, etiqueta }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onChange(!activo)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        activo ? 'bg-agro-green' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          activo ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}