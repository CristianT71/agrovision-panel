import { useEffect } from 'react'
import { authService } from '../../api/auth/auth.service'
import { registrarActividad, ultimaActividad } from '../../api/auth/actividad'
import { cerrarSesion, obtenerToken } from '../../api/auth/session'

// RNF-02.2 — a los 30 min sin actividad real del usuario se cierra la sesión. El servidor no puede
// decidirlo por sí solo: el sondeo de notificaciones y monitores cuenta allí como actividad.
export const MINUTOS_INACTIVIDAD = 30
const EVENTOS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

export function useCierrePorInactividad() {
  useEffect(() => {
    const limite = MINUTOS_INACTIVIDAD * 60_000

    registrarActividad()

    const salir = () => {
      const token = obtenerToken()
      if (token) authService.cerrarSesion(token).catch(() => {})
      cerrarSesion()
      window.location.replace('/login?sesion=expirada')
    }

    // Un temporizador revisa cada minuto; también al volver a la pestaña, porque el navegador
    // frena los temporizadores de las pestañas ocultas
    const revisar = () => {
      if (Date.now() - ultimaActividad() >= limite) salir()
    }
    const intervalo = window.setInterval(revisar, 60_000)
    const alVolver = () => {
      if (document.visibilityState === 'visible') revisar()
    }

    let ultimoRegistro = 0
    const alActuar = () => {
      const ahora = Date.now()
      if (ahora - ultimoRegistro > 5_000) {
        ultimoRegistro = ahora
        registrarActividad()
      }
    }

    EVENTOS.forEach((e) => window.addEventListener(e, alActuar, { passive: true }))
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      window.clearInterval(intervalo)
      EVENTOS.forEach((e) => window.removeEventListener(e, alActuar))
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])
}
