// Cálculos del dashboard (RF-06) a partir de lo que devuelve la API. Funciones puras, sin React.
import type {
  ActualizacionOta,
  IndicadoresModelo,
  PuntoSerie,
} from '../../api/telemetria/telemetria.service'
import { TIPOS_RESULTADO, type TipoResultado } from '../../api/solicitudes/solicitudes.service'

/* ---------- Ventanas de tiempo — RF-06.1 ---------- */

export type Rango = 'semana' | 'mes' | 'trimestre'

export const DIAS_RANGO: Record<Rango, number> = { semana: 7, mes: 30, trimestre: 90 }

export const RANGOS: { id: Rango; label: string }[] = [
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: 'trimestre', label: 'Últimos 3 meses' },
]

export interface Ventana {
  desde: Date
  hasta: Date
}

const MS_DIA = 86_400_000

export function ventanaDeRango(rango: Rango, ahora: Date): Ventana {
  return { desde: new Date(ahora.getTime() - DIAS_RANGO[rango] * MS_DIA), hasta: ahora }
}

// Periodo contiguo de igual duración, justo antes de la ventana
export function ventanaAnterior({ desde, hasta }: Ventana): Ventana {
  const duracion = hasta.getTime() - desde.getTime()
  return { desde: new Date(desde.getTime() - duracion), hasta: desde }
}

/* ---------- Indicadores del modelo — RF-06.2 ---------- */

export interface ResumenModelos {
  escaneos: number
  rechazados: number
  noReconocidos: number
  correcciones: number
  tasaNoReconocido: number | null
}

export function resumirModelos(porModelo: IndicadoresModelo[]): ResumenModelos {
  const r = porModelo.reduce(
    (acc, m) => ({
      escaneos: acc.escaneos + m.escaneos,
      rechazados: acc.rechazados + m.rechazadosPorCalidad,
      noReconocidos: acc.noReconocidos + m.noReconocidos,
      correcciones: acc.correcciones + m.correcciones,
    }),
    { escaneos: 0, rechazados: 0, noReconocidos: 0, correcciones: 0 },
  )
  // Los rechazados por calidad no llegaron a evaluarse: salen del denominador
  const evaluados = r.escaneos - r.rechazados
  return { ...r, tasaNoReconocido: evaluados > 0 ? r.noReconocidos / evaluados : null }
}

// 0.043 vs 0.051 -> -0.8 puntos porcentuales
export function diferenciaEnPuntos(actual: number | null, previa: number | null): number | null {
  if (actual === null || previa === null) return null
  return (actual - previa) * 100
}

/* ---------- Actualizaciones OTA — RF-06.4 ---------- */

export function resumirOta(actualizaciones: ActualizacionOta[]) {
  const exitos = actualizaciones.reduce((s, a) => s + a.exitos, 0)
  const fallos = actualizaciones.reduce((s, a) => s + a.fallos, 0)
  const intentos = exitos + fallos
  return { exitos, fallos, tasaExito: intentos > 0 ? exitos / intentos : null }
}

/* ---------- Días del calendario (hora de Colombia) ---------- */

// Colombia está en UTC-5 todo el año (no tiene horario de verano)
const DESFASE_BOGOTA_MS = 5 * 3_600_000

export function diaBogota(instante: Date | string): string {
  const t = new Date(instante).getTime() - DESFASE_BOGOTA_MS
  return new Date(t).toISOString().slice(0, 10)
}

// Todos los días de la ventana, incluidos los que no tuvieron eventos
export function diasDeVentana(desde: Date, hasta: Date): string[] {
  const ultimo = diaBogota(hasta)
  const dias: string[] = []
  let actual = new Date(`${diaBogota(desde)}T00:00:00Z`)
  while (true) {
    const dia = actual.toISOString().slice(0, 10)
    dias.push(dia)
    if (dia >= ultimo) break
    actual = new Date(actual.getTime() + MS_DIA)
  }
  return dias
}

// "2026-10-05" -> "5 oct". Se usa el mediodía UTC para que ninguna zona horaria cambie el día.
// Se arma con las partes porque es-CO intercala "de" ("5 de oct").
export function etiquetaDia(dia: string): string {
  const partes = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).formatToParts(new Date(`${dia}T12:00:00Z`))
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? ''
  return `${parte('day')} ${parte('month').replace('.', '')}`
}

export interface Tramo {
  etiqueta: string
  total: number
}

// Un punto por día, o tramos de 7 días contados hacia atrás desde el último día
// (el primero puede quedar incompleto), etiquetados con su primer día y en orden cronológico.
function agrupar(dias: string[], valor: (dia: string) => number, semanal: boolean): Tramo[] {
  if (!semanal) return dias.map((d) => ({ etiqueta: etiquetaDia(d), total: valor(d) }))

  const tramos: Tramo[] = []
  for (let fin = dias.length; fin > 0; fin -= 7) {
    const tramo = dias.slice(Math.max(0, fin - 7), fin)
    tramos.unshift({
      etiqueta: etiquetaDia(tramo[0]),
      total: tramo.reduce((s, d) => s + valor(d), 0),
    })
  }
  return tramos
}

/* ---------- Gráficas de telemetría — RF-06.3 ---------- */

export const COLORES_VERSION = ['#6b7280', '#2f7d4f', '#f0972b', '#3b82f6', '#a855f7', '#ef4444']

// Fila para Recharts: sN = tasa en % de la versión N, nN = sus escaneos.
// Se usa el índice como clave porque el nombre de la versión lleva puntos ("2.3.1")
// y Recharts los interpretaría como rutas anidadas.
export type FilaTasa = { dia: string; etiqueta: string } & Record<string, string | number | null>

export function serieTasaPorVersion(serie: PuntoSerie[], desde: Date, hasta: Date) {
  const versiones = [...new Set(serie.map((p) => p.versionModelo))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )

  const porDia = new Map<string, Map<string, PuntoSerie>>()
  for (const p of serie) {
    if (!porDia.has(p.dia)) porDia.set(p.dia, new Map())
    porDia.get(p.dia)!.set(p.versionModelo, p)
  }

  const filas: FilaTasa[] = diasDeVentana(desde, hasta).map((dia) => {
    const fila: FilaTasa = { dia, etiqueta: etiquetaDia(dia) }
    versiones.forEach((version, i) => {
      const punto = porDia.get(dia)?.get(version)
      fila[`s${i}`] =
        punto && punto.tasaNoReconocido !== null
          ? Math.round(punto.tasaNoReconocido * 1000) / 10
          : null
      fila[`n${i}`] = punto?.escaneos ?? null
    })
    return fila
  })

  return { versiones, filas }
}

// Suma por día en 'semana' y por tramos de 7 días en las demás; los días sin datos cuentan 0
function sumarPorTramo(
  valores: { dia: string; valor: number }[],
  desde: Date,
  hasta: Date,
  rango: Rango,
): Tramo[] {
  const porDia = new Map<string, number>()
  for (const { dia, valor } of valores) porDia.set(dia, (porDia.get(dia) ?? 0) + valor)
  return agrupar(diasDeVentana(desde, hasta), (d) => porDia.get(d) ?? 0, rango !== 'semana')
}

export function correccionesPorTramo(serie: PuntoSerie[], desde: Date, hasta: Date, rango: Rango): Tramo[] {
  return sumarPorTramo(
    serie.map((p) => ({ dia: p.dia, valor: p.correcciones })),
    desde,
    hasta,
    rango,
  )
}

/* ---------- Resoluciones del agrónomo — RF-06.5 a RF-06.7 ---------- */

// Las 5 tarjetas en el orden de TIPOS_RESULTADO, con 0 si la API no trajo algún tipo.
// El porcentaje es sobre el total de resueltas (puede incluir tipos antiguos fuera del catálogo).
export function filasResolucion(porTipo: { tipo: string; casos: number }[], total: number) {
  return TIPOS_RESULTADO.map((tipo) => {
    const casos = porTipo.find((f) => f.tipo === tipo)?.casos ?? 0
    return { tipo, casos, porcentaje: total > 0 ? Math.round((casos / total) * 100) : 0 }
  })
}

// RF-06.7 — la API manda solo los días con casos (hora de Colombia); se rellenan con 0
export function tendenciaPlagasNuevas(
  serie: { dia: string; casos: number }[],
  desde: Date,
  hasta: Date,
  rango: Rango,
): Tramo[] {
  return sumarPorTramo(
    serie.map((p) => ({ dia: p.dia, valor: p.casos })),
    desde,
    hasta,
    rango,
  )
}

// Clases literales para que Tailwind las incluya en el build
export const META_RESOLUCION: Record<
  TipoResultado,
  { titulo: string; descripcion: string; barra: string; texto: string }
> = {
  'Confirma diagnóstico IA': {
    titulo: 'Confirma a la IA',
    descripcion: 'El agrónomo coincide con el diagnóstico del modelo',
    barra: 'bg-emerald-500',
    texto: 'text-emerald-600',
  },
  'Corrige diagnóstico IA': {
    titulo: 'Corrige a la IA',
    descripcion: 'El modelo propuso otra plaga o enfermedad',
    barra: 'bg-blue-500',
    texto: 'text-blue-600',
  },
  'Plaga nueva': {
    titulo: 'Plaga nueva',
    descripcion: 'Clase que el modelo no conoce: candidata a reentrenamiento',
    barra: 'bg-amber-500',
    texto: 'text-amber-600',
  },
  'Planta sana': {
    titulo: 'Planta sana',
    descripcion: 'No había plaga ni enfermedad en la planta',
    barra: 'bg-teal-500',
    texto: 'text-teal-600',
  },
  'Imagen no diagnosticable': {
    titulo: 'Imagen inutilizable',
    descripcion: 'La foto no permitía emitir un diagnóstico',
    barra: 'bg-gray-500',
    texto: 'text-gray-600',
  },
}

// 0.0432 -> "4.3"; sin dato -> "—"
export function porcentajeDe(valor: number | null): string {
  return valor === null ? '—' : (valor * 100).toFixed(1)
}
