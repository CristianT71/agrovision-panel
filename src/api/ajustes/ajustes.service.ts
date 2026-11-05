import { api } from '../axios'

// Preferencias de la propia cuenta. La API solo devuelve las que existen para el rol:
// el agrónomo no recibe los eventos del administrador y viceversa.
export interface AjustesPersonales {
  idioma: string
  zonaHoraria: string
  pushNavegador: boolean
  // Eventos del administrador
  casosSinAsignar: boolean
  alertaPlagaNueva: boolean
  despliegues: boolean
  fallosOTA: boolean
  // Eventos del agrónomo
  nuevasSolicitudes: boolean
}

export type AjustesPersonalesAdmin = Pick<
  AjustesPersonales,
  'idioma' | 'zonaHoraria' | 'pushNavegador' | 'casosSinAsignar' | 'alertaPlagaNueva' | 'despliegues' | 'fallosOTA'
>
export type AjustesPersonalesAgronomo = Pick<
  AjustesPersonales,
  'idioma' | 'zonaHoraria' | 'pushNavegador' | 'nuevasSolicitudes'
>

// Configuración global de la plataforma (solo el administrador la ve y la cambia)
export interface AjustesSistema {
  asignacionAutomatica: boolean
  cargaMaximaAgronomo: string
  umbralPlagaNueva: string
  expiracionSesion: string
}

export const ajustesService = {
  obtenerMios: () => api.get<Partial<AjustesPersonales>>('/ajustes/mios').then((r) => r.data),
  guardarMios: (cambios: Partial<AjustesPersonales>) =>
    api.patch<Partial<AjustesPersonales>>('/ajustes/mios', cambios).then((r) => r.data),
  // Lo puede consultar también el agrónomo: es lo único del sistema que el panel necesita para cerrar la sesión
  obtenerInactividad: () => api.get<{ minutosInactividad: number }>('/ajustes/sesion').then((r) => r.data),
  obtenerSistema: () => api.get<AjustesSistema>('/ajustes/sistema').then((r) => r.data),
  guardarSistema: (cambios: Partial<AjustesSistema>) =>
    api.patch<AjustesSistema>('/ajustes/sistema', cambios).then((r) => r.data),
}

export const clavesAjustes = {
  mios: ['ajustes', 'mios'] as const,
  sistema: ['ajustes', 'sistema'] as const,
  inactividad: ['ajustes', 'inactividad'] as const,
}
