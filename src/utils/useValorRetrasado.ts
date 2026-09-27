import { useEffect, useState } from 'react'

// Devuelve el valor solo cuando deja de cambiar durante "ms" milisegundos.
// Sirve para no consultar la API en cada tecla mientras el usuario escribe una búsqueda.
export function useValorRetrasado<T>(valor: T, ms = 300): T {
  const [retrasado, setRetrasado] = useState(valor)

  useEffect(() => {
    const espera = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(espera)
  }, [valor, ms])

  return retrasado
}
