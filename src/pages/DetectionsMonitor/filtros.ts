// Filtros del monitor de detecciones (RF-07). Funciones puras, sin React ni axios.
import type {
  Categoria,
  EstadoRevision,
  ParametrosDetecciones,
  ResumenCategoria,
} from '../../api/detecciones/detecciones.service'

export interface FiltrosMonitor {
  // incluir agrupa con OR; excluir quita con AND NOT. Una categoría nunca está en las dos.
  incluir: Categoria[]
  excluir: Categoria[]
  revision?: EstadoRevision
  // false también es un filtro: "sin defectuosos"
  defectuosas?: boolean
  modeloVersion?: string
  // Igualdad exacta sin distinguir mayúsculas (no es búsqueda parcial)
  municipio?: string
  // YYYY-MM-DD; "hasta" incluye todo ese día
  desde?: string
  hasta?: string
}

export const FILTROS_VACIOS: FiltrosMonitor = { incluir: [], excluir: [] }

export type EstadoCategoria = 'neutral' | 'incluida' | 'excluida'

export function estadoDeCategoria(c: Categoria, filtros: Pick<FiltrosMonitor, 'incluir' | 'excluir'>): EstadoCategoria {
  if (filtros.incluir.includes(c)) return 'incluida'
  if (filtros.excluir.includes(c)) return 'excluida'
  return 'neutral'
}

// Ciclo de cada clic: neutral → incluida → excluida → neutral
export function alternarCategoria(
  c: Categoria,
  filtros: Pick<FiltrosMonitor, 'incluir' | 'excluir'>,
): Pick<FiltrosMonitor, 'incluir' | 'excluir'> {
  const incluir = filtros.incluir.filter((x) => x !== c)
  const excluir = filtros.excluir.filter((x) => x !== c)

  switch (estadoDeCategoria(c, filtros)) {
    case 'neutral':
      return { incluir: [...incluir, c], excluir }
    case 'incluida':
      return { incluir, excluir: [...excluir, c] }
    case 'excluida':
      return { incluir, excluir }
  }
}

// Las categorías que cubre el filtro: las incluidas (o todas si no hay ninguna), menos las excluidas
export function categoriasSeleccionadas(
  todas: readonly Categoria[],
  filtros: Pick<FiltrosMonitor, 'incluir' | 'excluir'>,
): Categoria[] {
  const base = filtros.incluir.length > 0 ? todas.filter((c) => filtros.incluir.includes(c)) : [...todas]
  return base.filter((c) => !filtros.excluir.includes(c))
}

// Totales de las tarjetas a partir del resumen por categoría; una categoría ausente cuenta 0
export function sumarResumen(porCategoria: ResumenCategoria[], seleccionadas: readonly Categoria[]) {
  return porCategoria
    .filter((fila) => seleccionadas.includes(fila.categoria))
    .reduce(
      (acc, fila) => ({
        total: acc.total + fila.total,
        divergentes: acc.divergentes + fila.divergentes,
        defectuosas: acc.defectuosas + fila.defectuosas,
      }),
      { total: 0, divergentes: 0, defectuosas: 0 },
    )
}

// Solo lo que tiene valor: la API rechaza parámetros vacíos o desconocidos
export function aParametros(filtros: FiltrosMonitor): ParametrosDetecciones {
  const p: ParametrosDetecciones = {}
  if (filtros.incluir.length > 0) p.incluir = filtros.incluir.join(',')
  if (filtros.excluir.length > 0) p.excluir = filtros.excluir.join(',')
  if (filtros.revision) p.revision = filtros.revision
  if (filtros.defectuosas !== undefined) p.defectuosas = filtros.defectuosas
  if (filtros.modeloVersion) p.modeloVersion = filtros.modeloVersion
  const municipio = filtros.municipio?.trim()
  if (municipio) p.municipio = municipio
  if (filtros.desde) p.desde = filtros.desde
  if (filtros.hasta) p.hasta = filtros.hasta
  return p
}

export function hayFiltros(filtros: FiltrosMonitor): boolean {
  return Object.keys(aParametros(filtros)).length > 0
}

// Las fechas YYYY-MM-DD se comparan bien como texto
export function rangoInvalido({ desde, hasta }: Pick<FiltrosMonitor, 'desde' | 'hasta'>): boolean {
  return Boolean(desde && hasta && desde > hasta)
}
