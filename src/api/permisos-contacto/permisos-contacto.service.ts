import { api } from '../axios'

// RF-08.8 — permiso de contacto directo productor-evaluador de un caso
export interface PermisoContacto {
  solicitudId: string
  // Ya considera al agrónomo asignado hoy: un permiso de un evaluador anterior sale como false
  habilitado: boolean
  agronomoId: string | null
  otorgadoPor: string | null
  fechaOtorgado: string | null
  revocadoPor: string | null
  fechaRevocado: string | null
}

// RF-04.10 — solo lo entrega la API si el permiso está vigente para el agrónomo
export interface ContactoProductor {
  solicitudId: string
  productorNombre: string
  telefono: string
}

export const permisosContactoService = {
  obtener: (solicitudId: string) =>
    api.get<PermisoContacto>(`/solicitudes/${solicitudId}/permiso-contacto`).then((r) => r.data),
  otorgar: (solicitudId: string) =>
    api
      .patch<{ permiso: PermisoContacto }>(`/solicitudes/${solicitudId}/permiso-contacto/otorgar`)
      .then((r) => r.data.permiso),
  revocar: (solicitudId: string) =>
    api
      .patch<{ permiso: PermisoContacto }>(`/solicitudes/${solicitudId}/permiso-contacto/revocar`)
      .then((r) => r.data.permiso),
  contactoProductor: (solicitudId: string) =>
    api.get<ContactoProductor>(`/solicitudes/${solicitudId}/contacto-productor`).then((r) => r.data),
}

export const clavesPermisosContacto = {
  permiso: (solicitudId: string) => ['permisos-contacto', solicitudId] as const,
  contacto: (solicitudId: string) => ['permisos-contacto', solicitudId, 'contacto'] as const,
}
