import type { EstadoSolicitud } from '../../api/solicitudes/solicitudes.service'

// Semáforo: naranja = borrador, amarillo = enviada y a la espera de agrónomo, azul = en curso,
// verde = resuelta, rojo = descartada
const COLORES: Record<EstadoSolicitud, string> = {
  Pendiente: 'bg-orange-100 text-orange-700',
  Enviada: 'bg-yellow-100 text-yellow-800',
  Asignada: 'bg-blue-50 text-blue-700',
  Resuelta: 'bg-green-50 text-green-700',
  Descartada: 'bg-red-50 text-red-600',
}

export function StatusBadge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLORES[estado]}`}>
      {estado}
    </span>
  )
}

export function PlagaBadge({ plaga }: { plaga: string }) {
  return (
    <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
      {plaga}
    </span>
  )
}