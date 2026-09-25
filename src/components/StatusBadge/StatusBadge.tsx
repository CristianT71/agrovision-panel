import type { EstadoSolicitud } from '../../api/solicitudes/solicitudes.service'

const COLORES: Record<EstadoSolicitud, string> = {
  Pendiente: 'bg-gray-100 text-gray-600',
  Enviada: 'bg-blue-50 text-blue-700',
  Asignada: 'bg-amber-50 text-amber-700',
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