import { api } from '../axios'

// RF-06 — telemetría agregada (solo administrador). Todas las tasas vienen de 0 a 1.
// Los rechazos por calidad de imagen NO cuentan como "no reconocido".
export interface IndicadoresModelo {
  versionModelo: string
  escaneos: number
  identificados: number
  rechazadosPorCalidad: number
  correcciones: number
  latenciaPromedioMs: number | null
  noReconocidos: number
  tasaNoReconocido: number | null
  tasaCorreccion: number | null
}

// RF-06.4 — cada fila cuenta eventos de actualización, no dispositivos distintos
export interface ActualizacionOta {
  versionDestino: string
  exitos: number
  fallos: number
  tasaExito: number | null
}

// Solo llegan los días con eventos; el día está en hora de Colombia
export interface PuntoSerie {
  dia: string
  versionModelo: string
  escaneos: number
  noReconocidos: number
  tasaNoReconocido: number | null
  correcciones: number
}

export interface ResumenTelemetria {
  desde: string
  hasta: string
  porModelo: IndicadoresModelo[]
  actualizaciones: ActualizacionOta[]
  serie: PuntoSerie[]
}

// La API rechaza ventanas de más de 90 días
export const MAX_DIAS_TELEMETRIA = 90

export const telemetriaService = {
  resumen: ({ desde, hasta }: { desde: Date; hasta: Date }) =>
    api
      .get<ResumenTelemetria>('/telemetria/resumen', {
        params: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      })
      .then((r) => r.data),
}

export const clavesTelemetria = {
  todas: ['telemetria'] as const,
  resumen: (rango: string) => ['telemetria', 'resumen', rango] as const,
}
