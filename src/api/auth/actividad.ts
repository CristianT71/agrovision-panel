// Última interacción real del usuario (clic, tecla, scroll), compartida entre pestañas.
// La escribe useCierrePorInactividad; la lee el cierre por inactividad y el cliente HTTP.
export const CLAVE_ACTIVIDAD = 'agrovision_ultima_actividad'

export function registrarActividad(): void {
  try {
    localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now()))
  } catch {
    // Sin almacenamiento: cada pestaña cuenta por su cuenta
  }
}

export function ultimaActividad(): number {
  try {
    return Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || Date.now()
  } catch {
    return Date.now()
  }
}
