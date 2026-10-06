import { useState } from 'react'

// Página actual de una lista que vuelve a la 1 cuando cambian sus filtros. Se guarda junto a la
// clave de los filtros con los que se eligió, así no hace falta un efecto que la reinicie.
export function usePaginaDeFiltros(claveFiltros: string): [number, (pagina: number) => void] {
  const [estado, setEstado] = useState({ clave: claveFiltros, pagina: 1 })
  const pagina = estado.clave === claveFiltros ? estado.pagina : 1
  return [pagina, (nueva: number) => setEstado({ clave: claveFiltros, pagina: nueva })]
}
