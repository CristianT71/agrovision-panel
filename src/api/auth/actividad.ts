// Última interacción real del usuario (clic, tecla, scroll), compartida entre pestañas.
// La escribe useCierrePorInactividad (y guardarSesion al entrar); la lee el cierre por inactividad y el cliente HTTP.
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

// Sin registro previo (p. ej. una sesión abierta antes de este control) se empieza a contar desde ahora.
// Si ya hay uno, abrir o recargar el panel no lo renueva: volver tras el límite no revive la sesión.
export function iniciarActividadSiFalta(): void {
  try {
    if (!localStorage.getItem(CLAVE_ACTIVIDAD)) registrarActividad()
  } catch {
    // Sin almacenamiento: ultimaActividad() siempre es "ahora"
  }
}

export function sesionInactiva(minutos: number): boolean {
  return Date.now() - ultimaActividad() >= minutos * 60_000
}
