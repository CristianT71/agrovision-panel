import { describe, expect, it } from 'vitest'
import type { EstadoRegla, FilaRegla, ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import {
  accionesDisponibles,
  aEditables,
  aFilas,
  agregarFila,
  agruparPorTipo,
  claveSimulacion,
  cuerpoAprobacion,
  huellaContenido,
  MAX_FILAS,
  mensajeErrorRegla,
  motivoBloqueoAprobar,
  parrafosNotas,
  quitarFila,
  resultadoVigente,
  sincronizarEditor,
  textoActivacion,
  validarAprobacion,
  validarFilas,
  validarSimulacion,
  validarTipo,
} from './logica'

// La tabla de EJEMPLO de la semilla "roya" v1 (misma que usa el API en sus pruebas)
const EJEMPLO: FilaRegla[] = [
  { orden: 1, sevMax: 10, incMax: 20, radioMinM: 0, radioMaxM: 3 },
  { orden: 2, sevMax: 30, incMax: 40, radioMinM: 3, radioMaxM: 8 },
  { orden: 3, sevMax: 60, incMax: 70, radioMinM: 8, radioMaxM: 15 },
  { orden: 4, sevMax: 100, incMax: 100, radioMinM: 15, radioMaxM: 30 },
]
const con = (i: number, cambios: Partial<FilaRegla>) => EJEMPLO.map((f, j) => (j === i ? { ...f, ...cambios } : f))

describe('validación de la tabla (espejo del API)', () => {
  it('acepta la tabla de ejemplo', () => {
    expect(validarFilas(EJEMPLO)).toEqual([])
  })

  it('exige entre 1 y 12 filas', () => {
    expect(validarFilas([])).toEqual(['La tabla debe tener entre 1 y 12 filas.'])
    const trece = Array.from({ length: 13 }, (_, i) => ({ orden: i + 1, sevMax: 100, incMax: 100, radioMinM: 0, radioMaxM: 0 }))
    expect(validarFilas(trece)).toEqual(['La tabla debe tener entre 1 y 12 filas.'])
  })

  it.each([
    ['orden no consecutivo', con(1, { orden: 3 }), 'Fila 2: el orden debe ser consecutivo desde 1 (se esperaba 2).'],
    ['sevMax en cero', con(0, { sevMax: 0 }), 'Fila 1: sevMax debe estar en (0, 100].'],
    ['incMax mayor que 100', con(0, { incMax: 101 }), 'Fila 1: incMax debe estar en (0, 100].'],
    ['incMax vacío (NaN)', con(0, { incMax: Number.NaN }), 'Fila 1: incMax debe estar en (0, 100].'],
    ['radio negativo', con(0, { radioMinM: -1 }), 'Fila 1: radioMinM debe estar en [0, 500].'],
    ['radio mayor que 500', con(3, { radioMaxM: 501 }), 'Fila 4: radioMaxM debe estar en [0, 500].'],
    ['radioMin > radioMax', con(1, { radioMinM: 9 }), 'Fila 2: radioMinM no puede ser mayor que radioMaxM.'],
    ['sevMax decreciente', con(2, { sevMax: 20 }), 'Fila 3: sevMax no puede ser menor que el de la fila anterior.'],
    ['incMax decreciente', con(2, { incMax: 30 }), 'Fila 3: incMax no puede ser menor que el de la fila anterior.'],
    ['radioMin decreciente', con(2, { radioMinM: 2 }), 'Fila 3: radioMinM no puede ser menor que el de la fila anterior.'],
    ['radioMax decreciente', con(2, { radioMaxM: 7 }), 'Fila 3: radioMaxM no puede ser menor que el de la fila anterior.'],
    ['última fila sin 100/100', con(3, { incMax: 90 }), 'La última fila debe cubrir sevMax 100 e incMax 100.'],
  ])('rechaza %s', (_caso, filas, mensaje) => {
    expect(validarFilas(filas)).toContain(mensaje)
  })
})

describe('editor de filas', () => {
  it('numera las filas 1..n por posición y convierte vacío en inválido', () => {
    const editables = aEditables([...EJEMPLO].reverse())
    expect(aFilas(editables)).toEqual(EJEMPLO)
    const vacia = aFilas([{ sevMax: '', incMax: '100', radioMinM: '0', radioMaxM: '1' }])
    expect(validarFilas(vacia)).toContain('Fila 1: sevMax debe estar en (0, 100].')
  })

  it('agregar copia la última fila (sigue válida) y respeta el máximo; quitar deja al menos una', () => {
    const editables = aEditables(EJEMPLO)
    const mas = agregarFila(editables)
    expect(mas).toHaveLength(5)
    expect(validarFilas(aFilas(mas))).toEqual([])
    const llenas = Array.from({ length: MAX_FILAS }, () => editables[3])
    expect(agregarFila(llenas)).toHaveLength(MAX_FILAS)
    expect(quitarFila(editables, 1).map((f) => f.sevMax)).toEqual(['10', '60', '100'])
    expect(quitarFila([editables[3]], 0)).toHaveLength(1)
  })

  it('valida el tipo de enfermedad con el patrón del API', () => {
    expect(validarTipo('roya')).toBeNull()
    expect(validarTipo('mancha_hierro-2')).toBeNull()
    expect(validarTipo('ROYA!')).not.toBeNull()
    expect(validarTipo('r')).not.toBeNull()
  })
})

describe('editor frente a lo guardado', () => {
  const guardada = huellaContenido(EJEMPLO, 'notas')

  it('la huella ignora el orden de llegada y trata notas vacías como sin notas', () => {
    expect(huellaContenido([...EJEMPLO].reverse(), 'notas')).toBe(guardada)
    expect(huellaContenido(aFilas(aEditables(EJEMPLO)), 'notas')).toBe(guardada)
    expect(huellaContenido(EJEMPLO, '   ')).toBe(huellaContenido(EJEMPLO, null))
    expect(huellaContenido(con(0, { radioMaxM: 4 }), 'notas')).not.toBe(guardada)
  })

  it('sincroniza el editor limpio, avisa del conflicto si está modificado y adopta lo propio ya guardado', () => {
    const otra = huellaContenido(con(0, { radioMaxM: 4 }), 'notas')
    const mia = huellaContenido(con(1, { radioMaxM: 9 }), 'notas')
    expect(sincronizarEditor(guardada, guardada, mia)).toBe('al-dia')
    expect(sincronizarEditor(guardada, otra, guardada)).toBe('recargar')
    expect(sincronizarEditor(guardada, otra, mia)).toBe('conflicto')
    expect(sincronizarEditor(guardada, mia, mia)).toBe('adoptar')
  })

  it('no deja aprobar con cambios sin guardar ni con errores', () => {
    expect(motivoBloqueoAprobar(false, false)).toBeNull()
    expect(motivoBloqueoAprobar(true, false)).toContain('Guarda los cambios antes de aprobar')
    expect(motivoBloqueoAprobar(true, true)).toContain('Corrige los errores')
    expect(motivoBloqueoAprobar(false, true)).toContain('Corrige los errores')
  })
})

describe('visibilidad de botones por rol y estado', () => {
  const casos: [EstadoRegla, 'profesional' | 'administrador', Record<string, boolean>][] = [
    ['borrador', 'profesional', { editar: true, eliminar: true, duplicar: true, aprobar: true, activar: false, archivar: false }],
    ['borrador', 'administrador', { editar: true, eliminar: true, duplicar: true, aprobar: false, activar: false, archivar: false }],
    ['aprobada', 'profesional', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: true, archivar: true }],
    ['aprobada', 'administrador', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: true, archivar: true }],
    ['activa', 'profesional', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: false, archivar: true }],
    ['activa', 'administrador', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: false, archivar: true }],
    ['archivada', 'profesional', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: false, archivar: false }],
    ['archivada', 'administrador', { editar: false, eliminar: false, duplicar: true, aprobar: false, activar: false, archivar: false }],
  ]
  it.each(casos)('%s como %s', (estado, rol, esperado) => {
    expect(accionesDisponibles(rol, estado)).toEqual(esperado)
  })

  it('sin sesión nunca muestra Aprobar', () => {
    expect(accionesDisponibles(null, 'borrador').aprobar).toBe(false)
  })
})

describe('aprobación', () => {
  it('calibrada exige nota (como el API: 422 REGLA_INVALIDA)', () => {
    expect(validarAprobacion(true, '')).toBe('Para marcar la regla como calibrada se requiere una nota.')
    expect(validarAprobacion(true, '   ')).toBe('Para marcar la regla como calibrada se requiere una nota.')
    expect(validarAprobacion(true, 'Validada en 3 fincas')).toBeNull()
    expect(validarAprobacion(false, '')).toBeNull()
  })

  it('arma el cuerpo sin nota vacía y con la nota recortada', () => {
    expect(cuerpoAprobacion(false, '  ')).toEqual({ calibrada: false })
    expect(cuerpoAprobacion(true, ' ok ')).toEqual({ calibrada: true, nota: 'ok' })
  })
})

describe('simulador', () => {
  it('valida los rangos del DTO', () => {
    expect(validarSimulacion({ severidad: '70', incidencia: '55', plantas: '5000' })).toEqual([])
    expect(validarSimulacion({ severidad: '', incidencia: '101', plantas: '0' })).toHaveLength(3)
  })

  it('el resultado vale solo para las entradas y la tabla guardada con que se pidió', () => {
    const entrada = { severidad: '70', incidencia: '55', plantas: '5000' }
    const usada = claveSimulacion(entrada, EJEMPLO)
    expect(resultadoVigente(usada, claveSimulacion({ ...entrada, severidad: '70.0' }, [...EJEMPLO].reverse()), false)).toBe(true)
    expect(resultadoVigente(usada, claveSimulacion({ ...entrada, severidad: '71' }, EJEMPLO), false)).toBe(false)
    expect(resultadoVigente(usada, claveSimulacion(entrada, con(3, { radioMaxM: 40 })), false)).toBe(false)
    expect(resultadoVigente(usada, usada, true)).toBe(false)
    expect(resultadoVigente(null, usada, false)).toBe(false)
  })
})

describe('mensajes de error del API', () => {
  const errorAxios = (status: number, data: unknown) => ({ isAxiosError: true, response: { status, data } })

  it.each([
    ['REGLA_INMUTABLE', 409, 'Solo una regla en borrador se puede editar'],
    ['SIN_PERMISO_APROBAR', 403, 'Solo un agrónomo validado puede aprobar'],
    ['REGLA_NO_APROBADA', 409, 'Solo una regla aprobada se puede activar.'],
    ['TRANSICION_INVALIDA', 409, 'ya no admite esta acción'],
    ['REGLA_NO_ENCONTRADA', 404, 'La regla ya no existe'],
    ['VERSION_EN_CONFLICTO', 409, 'Inténtalo de nuevo'],
  ])('traduce %s', (codigo, status, texto) => {
    expect(mensajeErrorRegla(errorAxios(status, { codigo, mensaje: 'x' }), 'def').mensaje).toContain(texto)
  })

  it('REGLA_INVALIDA incluye los detalles', () => {
    const r = mensajeErrorRegla(errorAxios(422, { codigo: 'REGLA_INVALIDA', detalles: ['Fila 2: a', 3] }), 'def')
    expect(r).toEqual({ mensaje: 'La tabla de la regla no es válida.', detalles: ['Fila 2: a'] })
  })

  it('el 403 del guard de roles (sin código) usa el mensaje de la acción', () => {
    const r = mensajeErrorRegla(errorAxios(403, { mensaje: 'Forbidden resource' }), 'def', 'Solo un agrónomo validado puede aprobar una regla de zona.')
    expect(r.mensaje).toBe('Solo un agrónomo validado puede aprobar una regla de zona.')
  })

  it('sin código ni 403 usa el mensaje del filtro global', () => {
    expect(mensajeErrorRegla(errorAxios(400, { mensaje: ['a', 'b'] }), 'def').mensaje).toBe('a b')
    expect(mensajeErrorRegla(new Error('x'), 'def').mensaje).toBe('def')
  })
})

describe('lista e historial', () => {
  const regla = (tipo: string, version: number, estado: EstadoRegla): ReglaZona => ({
    id: `${tipo}-${version}`, tipoEnfermedad: tipo, version, estado, calibrada: false, notas: null, filas: EJEMPLO,
    creadaPor: null, creadaEn: '2026-01-01T00:00:00Z', aprobadaPor: null, aprobadaEn: null, activadaEn: null,
  })

  it('agrupa por tipo, ordena versiones de mayor a menor y señala la activa', () => {
    const grupos = agruparPorTipo([regla('roya', 1, 'archivada'), regla('mancha', 1, 'borrador'), regla('roya', 3, 'borrador'), regla('roya', 2, 'activa')])
    expect(grupos.map((g) => g.tipo)).toEqual(['mancha', 'roya'])
    expect(grupos[1].reglas.map((r) => r.version)).toEqual([3, 2, 1])
    expect(grupos[1].activa?.version).toBe(2)
    expect(grupos[0].activa).toBeNull()
  })

  it('la confirmación de activar nombra la activa consultada, no la de la lista filtrada', () => {
    const nueva = regla('roya', 3, 'aprobada')
    expect(textoActivacion(nueva, regla('roya', 2, 'activa'), false)).toBe('La versión v2 de roya quedará archivada y la app empezará a usar esta.')
    expect(textoActivacion(nueva, null, false)).toBe('No hay otra regla activa de roya: la app empezará a usar esta.')
    expect(textoActivacion(nueva, undefined, false)).toBe('Comprobando la regla activa de roya…')
    expect(textoActivacion(nueva, undefined, true)).toContain('No se pudo comprobar la regla activa de roya')
  })

  it('muestra la nota de aprobación dentro de las notas, resaltada', () => {
    const notas = 'Valores de EJEMPLO.\n\nNota de calibración: validada en campo'
    expect(parrafosNotas(notas)).toEqual([
      { texto: 'Valores de EJEMPLO.', deAprobacion: false },
      { texto: 'Nota de calibración: validada en campo', deAprobacion: true },
    ])
    expect(parrafosNotas('Nota de aprobación: ok')[0].deAprobacion).toBe(true)
    expect(parrafosNotas(null)).toEqual([])
  })
})
