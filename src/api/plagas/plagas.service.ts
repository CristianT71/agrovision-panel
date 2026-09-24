import { api } from '../axios'

// RF-05.1 — clasificación de la ficha
export type TipoPlaga = 'enfermedad' | 'plaga' | 'deficiencia' | 'sano'

export const TIPOS_PLAGA: { valor: TipoPlaga; etiqueta: string }[] = [
  { valor: 'enfermedad', etiqueta: 'Enfermedad' },
  { valor: 'plaga', etiqueta: 'Plaga' },
  { valor: 'deficiencia', etiqueta: 'Deficiencia' },
  { valor: 'sano', etiqueta: 'Sano' },
]

export interface AvalPlaga {
  id: string
  agronomoId: string
  numeroTarjeta: string
  fechaAval: string
}

export interface Plaga {
  id: string
  nombreComun: string
  nombreCientifico: string | null
  tipo: TipoPlaga
  descripcion: string
  sintomas: string
  cultivo: string
  organosAfectados: string[]
  hospederos: string[]
  medidasContencion: string
  protocoloQuimico: string | null
  fotoUrl: string | null
  sinonimos: string[]
  avales: AvalPlaga[]
}

// RF-05.4 — datos de la ficha botánica; el aval y el protocolo químico van aparte
export interface DatosFicha {
  nombreComun: string
  nombreCientifico: string | null
  tipo: TipoPlaga
  descripcion: string
  sintomas: string
  organosAfectados: string[]
  hospederos: string[]
  medidasContencion: string
  sinonimos: string[]
}

export interface FiltrosPlagas {
  tipo?: TipoPlaga
  busqueda?: string
}

export const plagasService = {
  listar: (filtros: FiltrosPlagas) => api.get<Plaga[]>('/plagas', { params: filtros }).then((r) => r.data),
  crear: (datos: DatosFicha) => api.post<Plaga>('/plagas', datos).then((r) => r.data),
  actualizar: (id: string, datos: Partial<DatosFicha>) => api.patch<Plaga>(`/plagas/${id}`, datos).then((r) => r.data),
  // RF-05.7 — firma el agrónomo autenticado
  avalar: (id: string) => api.post<Plaga>(`/plagas/${id}/avales`).then((r) => r.data),
  // RF-05.6 — la API lo rechaza si la ficha no tiene aval
  actualizarProtocolo: (id: string, protocoloQuimico: string) =>
    api.patch<Plaga>(`/plagas/${id}/protocolo-quimico`, { protocoloQuimico }).then((r) => r.data),
  subirFoto: (id: string, foto: File) => {
    const formulario = new FormData()
    formulario.append('foto', foto)
    return api.post<Plaga>(`/plagas/${id}/foto`, formulario).then((r) => r.data)
  },
}

export const clavesPlagas = {
  todas: ['plagas'] as const,
  lista: (filtros: FiltrosPlagas) => ['plagas', 'lista', filtros] as const,
}

/* ---------- Protocolo químico ---------- */

// La API guarda el protocolo como texto; el panel lo edita en tres campos
export type ProtocoloQuimico = {
  ingredienteActivo: string
  dosis: string
  periodoCarencia: string
}

const ETIQUETAS_PROTOCOLO: Record<keyof ProtocoloQuimico, string> = {
  ingredienteActivo: 'Ingrediente activo',
  dosis: 'Dosis',
  periodoCarencia: 'Periodo de carencia',
}

export function componerProtocolo(protocolo: ProtocoloQuimico): string {
  return (Object.keys(ETIQUETAS_PROTOCOLO) as (keyof ProtocoloQuimico)[])
    .filter((clave) => protocolo[clave].trim())
    .map((clave) => `${ETIQUETAS_PROTOCOLO[clave]}: ${protocolo[clave].trim()}`)
    .join('\n')
}

export function descomponerProtocolo(texto: string | null): ProtocoloQuimico {
  const protocolo: ProtocoloQuimico = { ingredienteActivo: '', dosis: '', periodoCarencia: '' }
  if (!texto) return protocolo

  for (const linea of texto.split('\n')) {
    const clave = (Object.keys(ETIQUETAS_PROTOCOLO) as (keyof ProtocoloQuimico)[]).find((c) =>
      linea.startsWith(`${ETIQUETAS_PROTOCOLO[c]}:`),
    )
    if (clave) protocolo[clave] = linea.slice(ETIQUETAS_PROTOCOLO[clave].length + 1).trim()
  }

  // Texto que no sigue el formato (ej. escrito desde otra herramienta): se conserva completo
  if (!protocolo.ingredienteActivo && !protocolo.dosis && !protocolo.periodoCarencia) {
    protocolo.ingredienteActivo = texto
  }

  return protocolo
}
