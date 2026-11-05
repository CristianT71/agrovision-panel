import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ajustesService, clavesAjustes } from '../../api/ajustes/ajustes.service'
import { authService } from '../../api/auth/auth.service'
import { registrarActividad, ultimaActividad } from '../../api/auth/actividad'
import { cerrarSesion, obtenerToken } from '../../api/auth/session'

// RNF-02.2 — tras el tiempo sin actividad real del usuario se cierra la sesión. Lo configura el administrador
// en Ajustes (por defecto 30 min). El servidor también lo aplica, pero no puede decidirlo solo si la pestaña
// no hace peticiones, y el sondeo de notificaciones y monitores no cuenta como actividad.
export const MINUTOS_INACTIVIDAD = 30
const MINUTOS_ENTRE_CONSULTAS = 5
const EVENTOS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

export function useCierrePorInactividad() {
  // Si no se puede consultar, rige el valor por defecto; el servidor aplica el configurado de todos modos
  const ajuste = useQuery({
    queryKey: clavesAjustes.inactividad,
    queryFn: ajustesService.obtenerInactividad,
    staleTime: MINUTOS_ENTRE_CONSULTAS * 60_000,
    refetchInterval: MINUTOS_ENTRE_CONSULTAS * 60_000,
  })
  // Un cambio de ajuste no debe reiniciar los oyentes ni contarse como actividad: se lee al revisar
  const minutos = useRef(MINUTOS_INACTIVIDAD)
  const configurados = ajuste.data?.minutosInactividad
  useEffect(() => {
    minutos.current = configurados ?? MINUTOS_INACTIVIDAD
  }, [configurados])

  useEffect(() => {
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
      if (Date.now() - ultimaActividad() >= minutos.current * 60_000) salir()
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
