import type { ResumenTelemetria } from '../../api/telemetria/telemetria.service'
import { TIPOS_RESULTADO, type Solicitud, type TipoResultado } from '../../api/solicitudes/solicitudes.service'

const DIA_MS = 86_400_000

export type Rango = 'semana' | 'mes' | 'trimestre'

// La API acota la ventana a 90 días (MAX_DIAS_VENTANA): el trimestre es exactamente eso
export const RANGOS: { id: Rango; label: string; dias: number; tramos: number }[] = [
  { id: 'semana', label: 'Última semana', dias: 7, tramos: 7 },
  { id: 'mes', label: 'Último mes', dias: 30, tramos: 6 },
  { id: 'trimestre', label: 'Últimos 3 meses', dias: 90, tramos: 6 },
]

// RF-06.7 — umbral de alerta preventiva: 5 casos de "Plaga nueva" en una semana
export const UMBRAL_PLAGAS_SEMANA = 5
export const SEMANAS_TENDENCIA = 8

export type Tramo = { desde: Date; hasta: Date; etiqueta: string }

function etiquetaDia(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
}

// La ventana se parte en tramos contiguos [desde, hasta): la API no entrega series por día,
// así que cada punto de las gráficas sale de una consulta al resumen de su propio tramo
export function calcularTramos(rango: Rango, ahora: number): { ventana: Tramo; tramos: Tramo[]; anterior: Tramo } {
  const config = RANGOS.find((r) => r.id === rango) ?? RANGOS[1]
  const largo = config.dias * DIA_MS
  const inicio = ahora - largo
  const paso = largo / config.tramos

  const tramos = Array.from({ length: config.tramos }, (_, i) => {
    const desde = new Date(Math.round(inicio + paso * i))
    const hasta = new Date(Math.round(inicio + paso * (i + 1)))
    return { desde, hasta, etiqueta: etiquetaDia(desde) }
  })

  return {
    ventana: { desde: new Date(inicio), hasta: new Date(ahora), etiqueta: '' },
    tramos,
    // Periodo inmediatamente anterior y del mismo largo, para comparar la tasa
    anterior: { desde: new Date(inicio - largo), hasta: new Date(inicio), etiqueta: '' },
  }
}

/* ---------- Telemetría de la app (RF-06.2, RF-06.3, RF-06.4) ---------- */

export type Totales = {
  escaneos: number
  evaluados: number
  identificados: number
  noReconocidos: number
  correcciones: number
  // Porcentaje de 0 a 100 con un decimal; null si no hubo escaneos evaluables
  tasaNoReconocido: number | null
}

const aPorcentaje = (fraccion: number) => Math.round(fraccion * 1000) / 10

// Una foto borrosa es un problema de la cámara, no del modelo: los rechazos por calidad no entran
// en el denominador (mismo criterio que la API)
export function sumarTotales(resumenes: ResumenTelemetria[]): Totales {
  let escaneos = 0
  let identificados = 0
  let rechazados = 0
  let correcciones = 0

  for (const resumen of resumenes) {
    for (const m of resumen.porModelo) {
      escaneos += m.escaneos
      identificados += m.identificados
      rechazados += m.rechazadosPorCalidad
      correcciones += m.correcciones
    }
  }

  const evaluados = escaneos - rechazados
  const noReconocidos = evaluados - identificados

  return {
    escaneos,
    evaluados,
    identificados,
    noReconocidos,
    correcciones,
    tasaNoReconocido: evaluados > 0 ? aPorcentaje(noReconocidos / evaluados) : null,
  }
}

export type PuntoTasa = { fecha: string; [version: string]: number | string | null }

// Una serie por versión del modelo; null donde esa versión no tuvo escaneos en el tramo
export function tasaPorVersion(
  resumenes: ResumenTelemetria[],
  tramos: Tramo[],
): { datos: PuntoTasa[]; versiones: string[] } {
  const versiones = [...new Set(resumenes.flatMap((r) => r.porModelo.map((m) => m.versionModelo)))].sort()

  const datos = tramos.map((tramo, i) => {
    const punto: PuntoTasa = { fecha: tramo.etiqueta }
    for (const version of versiones) {
      const modelo = resumenes[i]?.porModelo.find((m) => m.versionModelo === version)
      punto[version] = modelo?.tasaNoReconocido != null ? aPorcentaje(modelo.tasaNoReconocido) : null
    }
    return punto
  })

  return { datos, versiones }
}

export function correccionesPorTramo(resumenes: ResumenTelemetria[], tramos: Tramo[]) {
  return tramos.map((tramo, i) => ({
    fecha: tramo.etiqueta,
    total: (resumenes[i]?.porModelo ?? []).reduce((suma, m) => suma + m.correcciones, 0),
  }))
}

export type FilaOta = { version: string; intentos: number; exitos: number; fallos: number; tasaExito: number | null }

export function actualizacionesPorVersion(resumenes: ResumenTelemetria[]): FilaOta[] {
  const porVersion = new Map<string, { exitos: number; fallos: number }>()

  for (const resumen of resumenes) {
    for (const a of resumen.actualizaciones) {
      const actual = porVersion.get(a.versionDestino) ?? { exitos: 0, fallos: 0 }
      porVersion.set(a.versionDestino, { exitos: actual.exitos + a.exitos, fallos: actual.fallos + a.fallos })
    }
  }

  return [...porVersion.entries()]
    .map(([version, { exitos, fallos }]) => ({
      version,
      intentos: exitos + fallos,
      exitos,
      fallos,
      tasaExito: exitos + fallos > 0 ? aPorcentaje(exitos / (exitos + fallos)) : null,
    }))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
}

/* ---------- Resoluciones del agrónomo (RF-06.5, RF-06.6, RF-06.7) ---------- */

type EstiloResolucion = { descripcion: string; color: string; textoColor: string }

const ESTILOS: Record<TipoResultado, EstiloResolucion> = {
  'Confirma diagnóstico IA': {
    descripcion: 'La IA acertó: el agrónomo confirmó su diagnóstico.',
    color: 'bg-emerald-500',
    textoColor: 'text-emerald-600',
  },
  'Corrige diagnóstico IA': {
    descripcion: 'El agrónomo cambió el diagnóstico que dio la IA.',
    color: 'bg-blue-500',
    textoColor: 'text-blue-600',
  },
  'Plaga nueva': {
    descripcion: 'El agrónomo identificó una clase que el modelo no reconoce.',
    color: 'bg-amber-500',
    textoColor: 'text-amber-600',
  },
  'Imagen no diagnosticable': {
    descripcion: 'La foto no tenía calidad suficiente para diagnóstico.',
    color: 'bg-gray-500',
    textoColor: 'text-gray-600',
  },
  'Planta sana': {
    descripcion: 'La muestra era una planta sana o un síntoma no patológico.',
    color: 'bg-teal-500',
    textoColor: 'text-teal-600',
  },
}

export type Resolucion = EstiloResolucion & { tipo: TipoResultado; casos: number; porcentaje: number }

const resueltaEn = (s: Solicitud, desde: Date, hasta: Date): boolean => {
  if (s.estado !== 'Resuelta' || !s.fechaResolucion) return false
  const fecha = new Date(s.fechaResolucion).getTime()
  return fecha >= desde.getTime() && fecha < hasta.getTime()
}

// RF-06.5 — peso porcentual de cada resolución sobre el total del periodo
export function resolucionesDelPeriodo(solicitudes: Solicitud[], desde: Date, hasta: Date): Resolucion[] {
  const enPeriodo = solicitudes.filter((s) => resueltaEn(s, desde, hasta))

  return TIPOS_RESULTADO.map((tipo) => {
    const casos = enPeriodo.filter((s) => s.tipoResultado === tipo).length
    return {
      ...ESTILOS[tipo],
      tipo,
      casos,
      porcentaje: enPeriodo.length > 0 ? Math.round((casos / enPeriodo.length) * 100) : 0,
    }
  })
}

// RF-06.6 — los casos evaluados como "Plaga nueva", los más recientes primero
export function casosPlagaNueva(solicitudes: Solicitud[], desde: Date, hasta: Date): Solicitud[] {
  return solicitudes
    .filter((s) => s.tipoResultado === 'Plaga nueva' && resueltaEn(s, desde, hasta))
    .sort((a, b) => new Date(b.fechaResolucion ?? 0).getTime() - new Date(a.fechaResolucion ?? 0).getTime())
}

// RF-06.7 — el umbral es semanal, así que la tendencia siempre se cuenta por semanas completas
// hacia atrás desde ahora, sin importar el rango elegido arriba
export function tendenciaPlagas(solicitudes: Solicitud[], ahora: number): { fecha: string; casos: number }[] {
  return Array.from({ length: SEMANAS_TENDENCIA }, (_, i) => {
    const desde = new Date(ahora - (SEMANAS_TENDENCIA - i) * 7 * DIA_MS)
    const hasta = new Date(ahora - (SEMANAS_TENDENCIA - i - 1) * 7 * DIA_MS)
    return { fecha: etiquetaDia(desde), casos: casosPlagaNueva(solicitudes, desde, hasta).length }
  })
}
