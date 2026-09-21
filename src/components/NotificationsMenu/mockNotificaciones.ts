export type TipoNotificacion = 'asignacion' | 'recordatorio'

export type Notificacion = {
  id: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  hace: string
  leida: boolean
}

export const NOTIFICACIONES: Notificacion[] = [
  {
    id: 'n1',
    tipo: 'asignacion',
    titulo: 'Solicitud asignada',
    mensaje: 'SOL-2024-0041 de Carlos Arango Ríos fue asignada a tu bandeja',
    hace: 'Hace 2 h',
    leida: false,
  },
  {
    id: 'n2',
    tipo: 'asignacion',
    titulo: 'Solicitud asignada',
    mensaje: 'SOL-2024-0036 de Ana Lucía Moreno fue asignada a tu bandeja',
    hace: 'Hace 5 h',
    leida: false,
  },
  {
    id: 'n3',
    tipo: 'recordatorio',
    titulo: 'Recordatorio',
    mensaje: 'Tienes 2 solicitudes en estado "Asignada" sin resolver',
    hace: 'Ayer',
    leida: true,
  },
]