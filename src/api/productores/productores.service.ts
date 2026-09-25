import { api } from '../axios'

// RF-10 — gestión de productores; todos los endpoints son solo para el administrador
export type EstadoProductor = 'registrado' | 'validado'

export interface Productor {
  id: string
  usuarioId: string
  nombre: string
  finca: string
  vereda: string
  municipio: string
  telefono: string
  estado: EstadoProductor
  consentimiento: boolean
  fechaConsentimiento: string | null
}

export interface FiltrosProductores {
  estado?: EstadoProductor
  consentimiento?: boolean
  municipio?: string
  busqueda?: string
}

export const productoresService = {
  listar: (filtros: FiltrosProductores = {}) =>
    api.get<Productor[]>('/productores', { params: filtros }).then((r) => r.data),
  validar: (id: string) => api.patch<Productor>(`/productores/${id}/validar`).then((r) => r.data),
  // RF-10.3 — la API exige la confirmación explícita. Otorgarlo solo lo puede hacer el productor desde la app.
  revocarConsentimiento: (id: string) =>
    api
      .patch<Productor>(`/productores/${id}/consentimiento/revocar`, { confirmacion: true })
      .then((r) => r.data),
}

export const clavesProductores = {
  todos: ['productores'] as const,
  lista: (filtros: FiltrosProductores = {}) => ['productores', 'lista', filtros] as const,
}
