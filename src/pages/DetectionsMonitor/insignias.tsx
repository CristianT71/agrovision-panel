import {
  ETIQUETAS_CATEGORIA,
  type Categoria,
  type RevisionDeteccion,
} from '../../api/detecciones/detecciones.service'

// Clases literales para que Tailwind las incluya en el build
const COLOR_CATEGORIA: Record<Categoria, string> = {
  enfermedad: 'bg-red-50 text-red-700',
  plaga: 'bg-amber-50 text-amber-700',
  deficiencia: 'bg-purple-50 text-purple-700',
  sano: 'bg-green-50 text-green-700',
  no_reconocido: 'bg-gray-100 text-gray-600',
  otra: 'bg-blue-50 text-blue-700',
}

export function BadgeCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_CATEGORIA[categoria]}`}>
      {ETIQUETAS_CATEGORIA[categoria]}
    </span>
  )
}

const REVISION: Record<RevisionDeteccion['estado'], { texto: string; color: string }> = {
  divergente: { texto: 'Divergente', color: 'bg-orange-50 text-orange-700' },
  coincide: { texto: 'Coincide', color: 'bg-green-50 text-green-700' },
  sin_revision: { texto: 'Sin revisión', color: 'bg-gray-100 text-gray-500' },
}

// RF-07.3 — estado de la revisión humana y quién la hizo
export function BadgeRevision({ revision }: { revision: Pick<RevisionDeteccion, 'estado' | 'origen'> }) {
  const { texto, color } = REVISION[revision.estado]
  return (
    <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${color}`}>
      {texto}
      {revision.origen && ` · ${revision.origen === 'agronomo' ? 'agrónomo' : 'productor'}`}
    </span>
  )
}
