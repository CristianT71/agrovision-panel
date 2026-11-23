import { api } from '../axios'

// Contrato /api/reglas-zona: tabla versionada (severidad %, incidencia %) -> radio en metros.
// Ciclo: borrador -> aprobada -> activa -> archivada. Solo el borrador se edita; lo demás se duplica.
export const ESTADOS_REGLA = ['borrador', 'aprobada', 'activa', 'archivada'] as const
export type EstadoRegla = (typeof ESTADOS_REGLA)[number]

export interface FilaRegla {
  orden: number
  sevMax: number
  incMax: number
  radioMinM: number
  radioMaxM: number
}

export interface AprobadorRegla {
  nombre: string
  tarjetaProfesional: string
}

export interface ReglaZona {
  id: string
  tipoEnfermedad: string
  version: number
  // Contador de cambios del borrador: se devuelve al guardar o aprobar para detectar ediciones simultáneas
  revision: number
  estado: EstadoRegla
  calibrada: boolean
  // La nota de aprobación no tiene campo propio: llega aquí con el prefijo "Nota de calibración:" o "Nota de aprobación:"
  notas: string | null
  filas: FilaRegla[]
  creadaPor: string | null
  creadaEn: string
  aprobadaPor: AprobadorRegla | null
  aprobadaEn: string | null
  activadaEn: string | null
}

export interface FiltrosReglas {
  tipo?: string
  estado?: EstadoRegla
}

export interface NuevaRegla {
  tipoEnfermedad: string
  notas?: string | null
  filas: FilaRegla[]
}

// PATCH solo acepta notas y filas: el tipo de enfermedad no cambia después de crear.
// revision es la que se vio al cargar: si el borrador cambió después, el API responde 409 VERSION_EN_CONFLICTO
export interface CambiosRegla {
  revision: number
  notas?: string | null
  filas?: FilaRegla[]
}

export interface DatosAprobacion {
  // Revisión que el agrónomo revisó: se aprueba esa o ninguna
  revision: number
  calibrada: boolean
  nota?: string
}

export interface DatosSimulacion {
  severidadPct: number
  incidenciaPct: number
  plantasPorHa: number
}

export interface ResultadoSimulacion {
  reglaVersion: number
  filaAplicada: number
  radioMinM: number
  radioMaxM: number
  plantasMin: number
  plantasMax: number
  calibrada: boolean
}

const ruta = (id: string) => `/reglas-zona/${encodeURIComponent(id)}`

// Un filtro vacío no se envía: el API rechaza un tipo que no cumpla su patrón
function sinVacios(filtros: FiltrosReglas): FiltrosReglas {
  const tipo = filtros.tipo?.trim()
  return { ...(tipo ? { tipo } : {}), ...(filtros.estado ? { estado: filtros.estado } : {}) }
}

export const reglasZonaService = {
  listar: (filtros: FiltrosReglas = {}, signal?: AbortSignal) =>
    api.get<ReglaZona[]>('/reglas-zona', { params: sinVacios(filtros), signal }).then((r) => r.data),
  crear: (datos: NuevaRegla) => api.post<ReglaZona>('/reglas-zona', datos).then((r) => r.data),
  obtener: (id: string, signal?: AbortSignal) => api.get<ReglaZona>(ruta(id), { signal }).then((r) => r.data),
  editar: (id: string, cambios: CambiosRegla) => api.patch<ReglaZona>(ruta(id), cambios).then((r) => r.data),
  eliminar: (id: string) => api.delete<void>(ruta(id)).then(() => undefined),
  duplicar: (id: string) => api.post<ReglaZona>(`${ruta(id)}/duplicar`).then((r) => r.data),
  aprobar: (id: string, datos: DatosAprobacion) =>
    api.post<ReglaZona>(`${ruta(id)}/aprobar`, datos).then((r) => r.data),
  activar: (id: string) => api.post<ReglaZona>(`${ruta(id)}/activar`).then((r) => r.data),
  archivar: (id: string) => api.post<ReglaZona>(`${ruta(id)}/archivar`).then((r) => r.data),
  simular: (id: string, datos: DatosSimulacion) =>
    api.post<ResultadoSimulacion>(`${ruta(id)}/simular`, datos).then((r) => r.data),
}

export const clavesReglasZona = {
  todas: ['reglas-zona'] as const,
  lista: (filtros: FiltrosReglas) => ['reglas-zona', 'lista', sinVacios(filtros)] as const,
}
