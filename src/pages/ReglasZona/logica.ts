import axios from 'axios'
import { mensajeDeError } from '../../api/axios'
import type { Rol } from '../../api/auth/session'
import type { CambiosRegla, DatosAprobacion, EstadoRegla, FilaRegla, ReglaZona } from '../../api/reglas-zona/reglas-zona.service'

// Lógica pura de la pantalla de reglas de zona: se prueba sin DOM.

export const MAX_FILAS = 12
export const RADIO_MAXIMO_M = 500
export const MAX_NOTAS = 5000
export const MAX_NOTA_APROBACION = 2000
export const PATRON_TIPO = /^[a-z0-9_-]{2,50}$/

const esNumero = (v: number) => typeof v === 'number' && Number.isFinite(v)

// Espejo exacto de validarFilas del API (mismos mensajes), para avisar antes de enviar.
// Las filas se evalúan en el orden en que llegan: el orden declarado debe ser 1..n consecutivo.
export function validarFilas(filas: readonly FilaRegla[]): string[] {
  const errores: string[] = []
  if (filas.length < 1 || filas.length > MAX_FILAS) {
    errores.push(`La tabla debe tener entre 1 y ${MAX_FILAS} filas.`)
    return errores
  }
  filas.forEach((f, i) => {
    const n = i + 1
    if (f.orden !== n) errores.push(`Fila ${n}: el orden debe ser consecutivo desde 1 (se esperaba ${n}).`)
    for (const [campo, valor] of [['sevMax', f.sevMax], ['incMax', f.incMax]] as const) {
      if (!esNumero(valor) || valor <= 0 || valor > 100) errores.push(`Fila ${n}: ${campo} debe estar en (0, 100].`)
    }
    for (const [campo, valor] of [['radioMinM', f.radioMinM], ['radioMaxM', f.radioMaxM]] as const) {
      if (!esNumero(valor) || valor < 0 || valor > RADIO_MAXIMO_M)
        errores.push(`Fila ${n}: ${campo} debe estar en [0, ${RADIO_MAXIMO_M}].`)
    }
    if (esNumero(f.radioMinM) && esNumero(f.radioMaxM) && f.radioMinM > f.radioMaxM)
      errores.push(`Fila ${n}: radioMinM no puede ser mayor que radioMaxM.`)
    if (i > 0) {
      const p = filas[i - 1]
      if (f.sevMax < p.sevMax) errores.push(`Fila ${n}: sevMax no puede ser menor que el de la fila anterior.`)
      if (f.incMax < p.incMax) errores.push(`Fila ${n}: incMax no puede ser menor que el de la fila anterior.`)
      if (f.radioMinM < p.radioMinM) errores.push(`Fila ${n}: radioMinM no puede ser menor que el de la fila anterior.`)
      if (f.radioMaxM < p.radioMaxM) errores.push(`Fila ${n}: radioMaxM no puede ser menor que el de la fila anterior.`)
    }
  })
  const ultima = filas[filas.length - 1]
  if (ultima.sevMax !== 100 || ultima.incMax !== 100) errores.push('La última fila debe cubrir sevMax 100 e incMax 100.')
  return errores
}

/* ---------- Editor de la tabla ---------- */

// Los campos se editan como texto: un campo vacío es un valor inválido, no un cero
export type FilaEditable = { sevMax: string; incMax: string; radioMinM: string; radioMaxM: string }
export const CAMPOS_FILA = ['sevMax', 'incMax', 'radioMinM', 'radioMaxM'] as const

const aNumero = (texto: string) => (texto.trim() === '' ? Number.NaN : Number(texto))

export const aEditables = (filas: readonly FilaRegla[]): FilaEditable[] =>
  [...filas]
    .sort((a, b) => a.orden - b.orden)
    .map((f) => ({ sevMax: String(f.sevMax), incMax: String(f.incMax), radioMinM: String(f.radioMinM), radioMaxM: String(f.radioMaxM) }))

// El API exige las filas ya ordenadas con orden 1..n: el orden sale de la posición
export const aFilas = (editables: readonly FilaEditable[]): FilaRegla[] =>
  editables.map((f, i) => ({
    orden: i + 1,
    sevMax: aNumero(f.sevMax),
    incMax: aNumero(f.incMax),
    radioMinM: aNumero(f.radioMinM),
    radioMaxM: aNumero(f.radioMaxM),
  }))

// La nueva fila copia la última: así la tabla sigue cumpliendo "no decreciente" y "última 100/100"
export function agregarFila(filas: readonly FilaEditable[]): FilaEditable[] {
  if (filas.length >= MAX_FILAS) return [...filas]
  const ultima = filas[filas.length - 1] ?? { sevMax: '100', incMax: '100', radioMinM: '0', radioMaxM: '0' }
  return [...filas, { ...ultima }]
}

export function quitarFila(filas: readonly FilaEditable[], indice: number): FilaEditable[] {
  if (filas.length <= 1) return [...filas]
  return filas.filter((_, i) => i !== indice)
}

export const FILA_INICIAL: FilaEditable = { sevMax: '100', incMax: '100', radioMinM: '0', radioMaxM: '0' }

export function validarTipo(tipo: string): string | null {
  return PATRON_TIPO.test(tipo.trim())
    ? null
    : 'El tipo debe tener entre 2 y 50 caracteres: minúsculas, dígitos, "-" o "_" (p. ej. "roya").'
}

/* ---------- Editor frente a lo guardado ---------- */

// Huellas comparables: la tabla tal como la entiende el API y las notas (vacías = sin notas)
export const huellaFilas = (filas: readonly FilaRegla[]) => JSON.stringify(aFilas(aEditables(filas)))
export const huellaContenido = (filas: readonly FilaRegla[], notas: string | null) =>
  JSON.stringify([huellaFilas(filas), notas?.trim() ? notas : ''])

// base: lo guardado de lo que partió el editor; servidor: lo que llega ahora; local: lo que hay en el editor.
// adoptar = el editor ya coincide con lo nuevo; recargar = el editor estaba limpio; conflicto = estaba modificado.
export type Sincronizacion = 'al-dia' | 'adoptar' | 'recargar' | 'conflicto'
export function sincronizarEditor(base: string, servidor: string, local: string): Sincronizacion {
  if (servidor === base) return 'al-dia'
  if (local === servidor) return 'adoptar'
  if (local === base) return 'recargar'
  return 'conflicto'
}

// Revisión que respalda lo que hay en el editor. Si lo guardado cambió bajo un editor modificado (conflicto) se
// mantiene la que se vio al cargar, para que el API rechace el guardado en vez de pisar cambios que no se vieron.
export const revisionVista = (sincronizacion: Sincronizacion, revisionBase: number, revisionServidor: number) =>
  sincronizacion === 'conflicto' ? revisionBase : revisionServidor

// Solo viaja lo que cambió: un guardado de notas no reenvía la tabla
export function cuerpoGuardado(
  revision: number,
  cambios: { filas: FilaRegla[]; filasCambiaron: boolean; notas: string | null; notasCambiaron: boolean },
): CambiosRegla {
  return {
    revision,
    ...(cambios.filasCambiaron ? { filas: cambios.filas } : {}),
    ...(cambios.notasCambiaron ? { notas: cambios.notas } : {}),
  }
}

// El API aprueba la tabla guardada: no se aprueba lo que no se ve guardado
export function motivoBloqueoAprobar(sinGuardar: boolean, hayErrores: boolean): string | null {
  if (hayErrores) return 'Corrige los errores de la tabla y guarda antes de aprobar.'
  if (sinGuardar) return 'Guarda los cambios antes de aprobar: se aprueba la tabla guardada.'
  return null
}

/* ---------- Acciones por rol y estado ---------- */

export type Acciones = {
  editar: boolean
  eliminar: boolean
  duplicar: boolean
  aprobar: boolean
  activar: boolean
  archivar: boolean
}

// Rol del panel: "profesional" es el agrónomo de la API y "administrador" el admin.
// Aprobar solo lo ve el agrónomo; el API además exige que su cuenta esté validada.
export function accionesDisponibles(rol: Rol | null | undefined, estado: EstadoRegla): Acciones {
  const borrador = estado === 'borrador'
  return {
    editar: borrador,
    eliminar: borrador,
    duplicar: true,
    aprobar: borrador && rol === 'profesional',
    activar: estado === 'aprobada',
    archivar: estado === 'aprobada' || estado === 'activa',
  }
}

/* ---------- Aprobación ---------- */

export function validarAprobacion(calibrada: boolean, nota: string): string | null {
  if (calibrada && nota.trim() === '') return 'Para marcar la regla como calibrada se requiere una nota.'
  if (nota.trim().length > MAX_NOTA_APROBACION) return `La nota no puede superar ${MAX_NOTA_APROBACION} caracteres.`
  return null
}

export function cuerpoAprobacion(revision: number, calibrada: boolean, nota: string): DatosAprobacion {
  const limpia = nota.trim()
  return limpia ? { revision, calibrada, nota: limpia } : { revision, calibrada }
}

/* ---------- Simulador ---------- */

export type EntradaSimulacion = { severidad: string; incidencia: string; plantas: string }

export function validarSimulacion(e: EntradaSimulacion): string[] {
  const errores: string[] = []
  const sev = aNumero(e.severidad)
  const inc = aNumero(e.incidencia)
  const plantas = aNumero(e.plantas)
  if (!esNumero(sev) || sev < 0 || sev > 100) errores.push('La severidad debe estar entre 0 y 100 %.')
  if (!esNumero(inc) || inc < 0 || inc > 100) errores.push('La incidencia debe estar entre 0 y 100 %.')
  if (!esNumero(plantas) || plantas < 1 || plantas > 1_000_000) errores.push('Las plantas por hectárea deben estar entre 1 y 1 000 000.')
  return errores
}

export const cuerpoSimulacion = (e: EntradaSimulacion) => ({
  severidadPct: aNumero(e.severidad),
  incidenciaPct: aNumero(e.incidencia),
  plantasPorHa: aNumero(e.plantas),
})

// Con qué entradas y qué tabla guardada se calculó un resultado
export type ClaveSimulacion = { entrada: string; tabla: string }
export const claveSimulacion = (e: EntradaSimulacion, filas: readonly FilaRegla[]): ClaveSimulacion => ({
  entrada: JSON.stringify(cuerpoSimulacion(e)),
  tabla: huellaFilas(filas),
})

// El resultado solo vale para las entradas y la tabla guardada con que se pidió, y si el editor no tiene cambios
export const resultadoVigente = (usada: ClaveSimulacion | null, actual: ClaveSimulacion, sinGuardar: boolean) =>
  !sinGuardar && usada !== null && usada.entrada === actual.entrada && usada.tabla === actual.tabla

/* ---------- Activación ---------- */

// activa: undefined mientras se consulta; null si no hay ninguna activa del tipo
export function textoActivacion(regla: ReglaZona, activa: ReglaZona | null | undefined, error: boolean): string {
  const tipo = regla.tipoEnfermedad
  if (error) return `No se pudo comprobar la regla activa de ${tipo}: si hay una, quedará archivada y la app empezará a usar esta.`
  if (activa === undefined) return `Comprobando la regla activa de ${tipo}…`
  if (activa && activa.id !== regla.id) return `La versión v${activa.version} de ${tipo} quedará archivada y la app empezará a usar esta.`
  return `No hay otra regla activa de ${tipo}: la app empezará a usar esta.`
}

/* ---------- Errores del API ---------- */

const MENSAJES_CODIGO: Record<string, string> = {
  REGLA_NO_ENCONTRADA: 'La regla ya no existe. Actualiza la lista.',
  REGLA_INVALIDA: 'La tabla de la regla no es válida.',
  REGLA_INMUTABLE: 'Solo una regla en borrador se puede editar, aprobar o borrar. Duplícala para crear una nueva versión.',
  SIN_PERMISO_APROBAR: 'Solo un agrónomo validado puede aprobar una regla de zona.',
  REGLA_NO_APROBADA: 'Solo una regla aprobada se puede activar.',
  TRANSICION_INVALIDA: 'La regla cambió de estado y ya no admite esta acción. Vuelve a cargarla.',
  VERSION_EN_CONFLICTO: 'Otra persona cambió esta regla al mismo tiempo. Carga la versión guardada e inténtalo de nuevo.',
}

export type ErrorRegla = { mensaje: string; detalles: string[] }

// 409 VERSION_EN_CONFLICTO al guardar o aprobar: el borrador ya no está en la revisión que se envió
export function esConflictoRevision(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return false
  const datos: unknown = error.response.data
  return !!datos && typeof datos === 'object' && (datos as { codigo?: unknown }).codigo === 'VERSION_EN_CONFLICTO'
}

// El 403 del guard de roles (p. ej. un admin que intenta aprobar) llega sin código: se usa el mensaje de la acción
export function mensajeErrorRegla(error: unknown, porDefecto: string, prohibido = 'No tienes permiso para esta acción.'): ErrorRegla {
  if (axios.isAxiosError(error)) {
    const datos: unknown = error.response?.data
    const cuerpo = datos && typeof datos === 'object' ? (datos as { codigo?: unknown; detalles?: unknown }) : {}
    const detalles = Array.isArray(cuerpo.detalles) ? cuerpo.detalles.filter((d): d is string => typeof d === 'string') : []
    if (typeof cuerpo.codigo === 'string' && MENSAJES_CODIGO[cuerpo.codigo])
      return { mensaje: MENSAJES_CODIGO[cuerpo.codigo], detalles }
    if (error.response?.status === 403) return { mensaje: prohibido, detalles: [] }
  }
  return { mensaje: mensajeDeError(error, porDefecto), detalles: [] }
}

/* ---------- Lista e historial ---------- */

export type GrupoReglas = { tipo: string; reglas: ReglaZona[]; activa: ReglaZona | null }

// Una tarjeta por tipo de enfermedad con su historial de versiones, de la más nueva a la más vieja
export function agruparPorTipo(reglas: readonly ReglaZona[]): GrupoReglas[] {
  const grupos = new Map<string, ReglaZona[]>()
  for (const r of reglas) grupos.set(r.tipoEnfermedad, [...(grupos.get(r.tipoEnfermedad) ?? []), r])
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([tipo, lista]) => {
      const ordenadas = [...lista].sort((a, b) => b.version - a.version)
      return { tipo, reglas: ordenadas, activa: ordenadas.find((r) => r.estado === 'activa') ?? null }
    })
}

// Separa los párrafos de las notas para resaltar la nota que dejó el agrónomo al aprobar
export function parrafosNotas(notas: string | null): { texto: string; deAprobacion: boolean }[] {
  if (!notas?.trim()) return []
  return notas
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((texto) => ({ texto, deAprobacion: /^Nota de (calibración|aprobación):/.test(texto) }))
}

export const ETIQUETA_ESTADO: Record<EstadoRegla, string> = {
  borrador: 'Borrador',
  aprobada: 'Aprobada',
  activa: 'Activa',
  archivada: 'Archivada',
}
