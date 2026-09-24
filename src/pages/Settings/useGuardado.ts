import { useRef, useState } from 'react'

/* Maneja el aviso de guardado y su temporizador */
export function useGuardado() {
  const [guardado, setGuardado] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Muestra el aviso y lo oculta 2.5 s después del último cambio
  const avisar = () => {
    setGuardado(true)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setGuardado(false), 2500)
  }

  return { guardado, avisar }
}