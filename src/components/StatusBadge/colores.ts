import type { EstadoSolicitud } from '../../api/solicitudes/solicitudes.service'

// Punto de color del semáforo de StatusBadge (filtros de la bandeja). Vive aparte para que
// StatusBadge.tsx solo exporte componentes (react-refresh/only-export-components).
export const COLOR_PUNTO: Record<EstadoSolicitud, string> = {
  Pendiente: 'bg-orange-500',
  Enviada: 'bg-yellow-400',
  Asignada: 'bg-blue-600',
  Resuelta: 'bg-green-600',
  Descartada: 'bg-red-600',
}
