export type Rango = 'semana' | 'mes' | 'trimestre'

export const RANGOS: { id: Rango; label: string }[] = [
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: 'trimestre', label: 'Últimos 3 meses' },
]

export type Metricas = {
  tasaNoReconocido: number
  deltaTasa: number
  correcciones: number
  dispositivosActualizados: number
  tasaExitoOTA: number
  versionMayorAdopcion: string
  penetracion: number
}

export type PuntoTasa = {
  fecha: string
  'v2.3.0': number | null
  'v2.3.1': number | null
  'v2.4.0-beta': number | null
}

export type PuntoCorrecciones = { fecha: string; total: number }

export type FilaOTA = {
  version: string
  dispositivosActivos: number
  exitosos: number
  fallidos: number
}

export type Resolucion = {
  id: string
  titulo: string
  casos: number
  porcentaje: number
  descripcion: string
  color: string
  textoColor: string
  accion?: string
}

export type PuntoPlagas = { fecha: string; casos: number }

export type Telemetria = {
  metricas: Metricas
  tasaPorVersion: PuntoTasa[]
  correcciones: PuntoCorrecciones[]
  ota: FilaOTA[]
  resoluciones: Resolucion[]
  tendenciaPlagas: PuntoPlagas[]
}

// RF-06.7 — umbral de alerta preventiva
export const UMBRAL_PLAGAS_SEMANA = 5

// RF-06.5 — resoluciones del agrónomo y sus pesos porcentuales
const RESOLUCIONES: Resolucion[] = [
  {
    id: 'falso-negativo',
    titulo: 'Falso negativo',
    casos: 29,
    porcentaje: 45,
    descripcion: 'La IA detectó algo que no era o no detectó lo que sí había.',
    color: 'bg-blue-500',
    textoColor: 'text-blue-600',
  },
  {
    id: 'plaga-nueva',
    titulo: 'Plaga nueva',
    casos: 18,
    porcentaje: 28,
    descripcion: 'El agrónomo identificó una clase que el modelo no reconoce.',
    color: 'bg-amber-500',
    textoColor: 'text-amber-600',
    accion: 'Ver fotos para reentrenamiento', // RF-06.6
  },
  {
    id: 'no-es-plaga',
    titulo: 'No es plaga',
    casos: 11,
    porcentaje: 17,
    descripcion: 'La muestra enviada es una planta sana o síntoma no patológico.',
    color: 'bg-emerald-500',
    textoColor: 'text-emerald-600',
  },
  {
    id: 'imagen-inutilizable',
    titulo: 'Imagen inutilizable',
    casos: 6,
    porcentaje: 9,
    descripcion: 'La foto no tenía calidad suficiente para diagnóstico.',
    color: 'bg-gray-500',
    textoColor: 'text-gray-600',
  },
]

// RF-06.4 — estado de sincronización de los despliegues OTA
const OTA: FilaOTA[] = [
  { version: 'v2.3.1', dispositivosActivos: 1840, exitosos: 1840, fallidos: 0 },
  { version: 'v2.4.0-beta', dispositivosActivos: 284, exitosos: 271, fallidos: 13 },
  { version: 'v2.2.0', dispositivosActivos: 189, exitosos: 189, fallidos: 0 },
  { version: 'v2.3.0', dispositivosActivos: 47, exitosos: 44, fallidos: 3 },
]

// RF-06.1 — la consulta se delimita a ventanas de tiempo dinámicas
export function obtenerTelemetria(rango: Rango): Telemetria {
  if (rango === 'semana') {
    return {
      metricas: {
        tasaNoReconocido: 4.3,
        deltaTasa: -0.4,
        correcciones: 27,
        dispositivosActualizados: 2360,
        tasaExitoOTA: 97.8,
        versionMayorAdopcion: 'v2.3.1',
        penetracion: 78,
      },
      tasaPorVersion: [
        { fecha: '20 ago', 'v2.3.0': 8.9, 'v2.3.1': 5.6, 'v2.4.0-beta': null },
        { fecha: '21 ago', 'v2.3.0': 8.2, 'v2.3.1': 5.4, 'v2.4.0-beta': null },
        { fecha: '22 ago', 'v2.3.0': 8.5, 'v2.3.1': 5.1, 'v2.4.0-beta': null },
        { fecha: '23 ago', 'v2.3.0': 7.9, 'v2.3.1': 4.9, 'v2.4.0-beta': 4.2 },
        { fecha: '24 ago', 'v2.3.0': 8.1, 'v2.3.1': 4.7, 'v2.4.0-beta': 3.9 },
        { fecha: '25 ago', 'v2.3.0': 7.6, 'v2.3.1': 4.5, 'v2.4.0-beta': 3.6 },
        { fecha: '26 ago', 'v2.3.0': 7.4, 'v2.3.1': 4.3, 'v2.4.0-beta': 3.3 },
      ],
      correcciones: [
        { fecha: 'Lun', total: 4 },
        { fecha: 'Mar', total: 6 },
        { fecha: 'Mié', total: 3 },
        { fecha: 'Jue', total: 7 },
        { fecha: 'Vie', total: 5 },
        { fecha: 'Sáb', total: 2 },
      ],
      ota: OTA,
      resoluciones: RESOLUCIONES,
      tendenciaPlagas: [
        { fecha: 'Lun', casos: 2 },
        { fecha: 'Mar', casos: 3 },
        { fecha: 'Mié', casos: 4 },
        { fecha: 'Jue', casos: 6 },
        { fecha: 'Vie', casos: 5 },
        { fecha: 'Sáb', casos: 3 },
      ],
    }
  }

  if (rango === 'trimestre') {
    return {
      metricas: {
        tasaNoReconocido: 5.1,
        deltaTasa: -1.2,
        correcciones: 312,
        dispositivosActualizados: 2360,
        tasaExitoOTA: 96.4,
        versionMayorAdopcion: 'v2.3.1',
        penetracion: 78,
      },
      tasaPorVersion: [
        { fecha: 'Jun', 'v2.3.0': 11.2, 'v2.3.1': 7.8, 'v2.4.0-beta': null },
        { fecha: 'Jul', 'v2.3.0': 9.8, 'v2.3.1': 6.4, 'v2.4.0-beta': null },
        { fecha: 'Ago', 'v2.3.0': 8.1, 'v2.3.1': 4.9, 'v2.4.0-beta': 3.7 },
      ],
      correcciones: [
        { fecha: 'Jun', total: 118 },
        { fecha: 'Jul', total: 96 },
        { fecha: 'Ago', total: 98 },
      ],
      ota: OTA,
      resoluciones: RESOLUCIONES,
      tendenciaPlagas: [
        { fecha: '3 jun', casos: 1 },
        { fecha: '17 jun', casos: 3 },
        { fecha: '1 jul', casos: 2 },
        { fecha: '15 jul', casos: 4 },
        { fecha: '29 jul', casos: 3 },
        { fecha: '12 ago', casos: 3 },
        { fecha: '26 ago', casos: 5 },
      ],
    }
  }

  // mes
  return {
    metricas: {
      tasaNoReconocido: 4.3,
      deltaTasa: -0.4,
      correcciones: 27,
      dispositivosActualizados: 2360,
      tasaExitoOTA: 97.8,
      versionMayorAdopcion: 'v2.3.1',
      penetracion: 78,
    },
    tasaPorVersion: [
      { fecha: '19 ago', 'v2.3.0': 8.4, 'v2.3.1': 6.1, 'v2.4.0-beta': null },
      { fecha: '20 ago', 'v2.3.0': 9.1, 'v2.3.1': 5.9, 'v2.4.0-beta': null },
      { fecha: '21 ago', 'v2.3.0': 8.7, 'v2.3.1': 5.7, 'v2.4.0-beta': null },
      { fecha: '22 ago', 'v2.3.0': 8.9, 'v2.3.1': 5.5, 'v2.4.0-beta': null },
      { fecha: '23 ago', 'v2.3.0': 7.8, 'v2.3.1': 5.2, 'v2.4.0-beta': 4.4 },
      { fecha: '24 ago', 'v2.3.0': 8.3, 'v2.3.1': 4.9, 'v2.4.0-beta': 4.0 },
      { fecha: '25 ago', 'v2.3.0': 7.9, 'v2.3.1': 4.6, 'v2.4.0-beta': 3.6 },
      { fecha: '26 ago', 'v2.3.0': 7.5, 'v2.3.1': 4.3, 'v2.4.0-beta': 3.2 },
    ],
    correcciones: [
      { fecha: '29 jul', total: 12 },
      { fecha: '5 ago', total: 20 },
      { fecha: '12 ago', total: 17 },
      { fecha: '19 ago', total: 31 },
      { fecha: '26 ago', total: 28 },
    ],
    ota: OTA,
    resoluciones: RESOLUCIONES,
    tendenciaPlagas: [
      { fecha: '29 jul', casos: 3 },
      { fecha: '5 ago', casos: 4 },
      { fecha: '12 ago', casos: 3 },
      { fecha: '19 ago', casos: 5 },
      { fecha: '26 ago', casos: 3 },
    ],
  }
}