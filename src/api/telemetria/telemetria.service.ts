import { api } from '../axios'

// RF-06.2 — indicadores de una versión del modelo dentro de la ventana consultada
export interface IndicadoresModelo {
  versionModelo: string
  escaneos: number
  identificados: number
  rechazadosPorCalidad: number
  correcciones: number
  latenciaPromedioMs: number | null
  noReconocidos: number
  // Fracciones de 0 a 1; null cuando no hay con qué calcularlas
  tasaNoReconocido: number | null
  tasaCorreccion: number | null
}

// RF-06.4 — resultado de las actualizaciones OTA del modelo en los celulares
export interface ActualizacionModelo {
  versionDestino: string
  exitos: number
  fallos: number
  tasaExito: number | null
}

export interface ResumenTelemetria {
  desde: string
  hasta: string
  porModelo: IndicadoresModelo[]
  actualizaciones: ActualizacionModelo[]
}

export const telemetriaService = {
  // RF-06.1 — la API acota la ventana a 90 días; el rango es [desde, hasta)
  resumen: (desde: Date, hasta: Date) =>
    api
      .get<ResumenTelemetria>('/telemetria/resumen', {
        params: { desde: desde.toISOString(), hasta: hasta.toISOString() },
      })
      .then((r) => r.data),
}

export const clavesTelemetria = {
  todas: ['telemetria'] as const,
  tramo: (desde: number, hasta: number) => ['telemetria', 'resumen', desde, hasta] as const,
}

// La app guarda "1.3.0" y el panel siempre lo mostró como "v1.3.0"
export function etiquetaVersion(version: string): string {
  return version.toLowerCase().startsWith('v') ? version : `v${version}`
}
