import { useId, useState } from 'react'
import type { Rol } from '../../api/auth/session'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import { formatearFechaHora } from '../../utils/fechas'
import DialogoAprobar from './DialogoAprobar'
import DialogoConfirmar from './DialogoConfirmar'
import EditorFilas from './EditorFilas'
import {
  accionesDisponibles,
  aEditables,
  aFilas,
  cuerpoGuardado,
  esConflictoRevision,
  huellaContenido,
  MAX_NOTAS,
  mensajeErrorRegla,
  motivoBloqueoAprobar,
  parrafosNotas,
  revisionVista,
  sincronizarEditor,
  textoActivacion,
  validarFilas,
} from './logica'
import Simulador from './Simulador'
import { useActivarRegla, useArchivarRegla, useDuplicarRegla, useEditarRegla, useEliminarRegla, useReglaActiva } from './useReglasZona'
import { AvisoSinCalibrar, BOTON, CAMPO, EstadoBadge, MensajeError, PRIMARIO } from './ui'

type Props = {
  regla: ReglaZona
  rol: Rol | null
  seleccionar: (id: string | null) => void
}

type Confirmacion = 'activar' | 'archivar' | 'eliminar' | 'aprobar' | null

const fecha = (iso: string | null) => (iso ? formatearFechaHora(iso) : '—')

// Se monta al abrir la confirmación: consulta la activa del tipo sin depender del filtro de la lista
function ConsecuenciaActivacion({ regla }: { regla: ReglaZona }) {
  const activa = useReglaActiva(regla.tipoEnfermedad)
  return <p>{textoActivacion(regla, activa.data, activa.isError && activa.data === undefined)}</p>
}

// Se monta con key={regla.id}: el estado del editor se reinicia al cambiar de regla
export default function DetalleRegla({ regla, rol, seleccionar }: Props) {
  const acciones = accionesDisponibles(rol, regla.estado)
  const [filas, setFilas] = useState(() => aEditables(regla.filas))
  const [notas, setNotas] = useState(regla.notas ?? '')
  const [dialogo, setDialogo] = useState<Confirmacion>(null)
  // Huella de lo guardado de lo que partió el editor: detecta recargas de la misma regla
  const [base, setBase] = useState(() => huellaContenido(regla.filas, regla.notas))
  // Revisión de esa misma versión guardada: es la que se envía al guardar si llega un conflicto
  const [revisionBase, setRevisionBase] = useState(regla.revision)
  const idNotas = useId()

  const editar = useEditarRegla(regla.id)
  const duplicar = useDuplicarRegla(regla.id)
  const activar = useActivarRegla(regla.id)
  const archivar = useArchivarRegla(regla.id)
  const eliminar = useEliminarRegla(regla.id)

  const filasNuevas = aFilas(filas)
  const errores = acciones.editar ? validarFilas(filasNuevas) : []
  const notasNuevas = notas.trim() === '' ? null : notas
  const filasCambiaron = JSON.stringify(filasNuevas) !== JSON.stringify(aFilas(aEditables(regla.filas)))
  const notasCambiaron = (notasNuevas ?? '') !== (regla.notas ?? '')
  const ocupado = editar.isPending || duplicar.isPending

  // Llegan datos nuevos de esta regla: editor limpio -> se recarga; modificado -> se avisa del conflicto
  const servidor = huellaContenido(regla.filas, regla.notas)
  const local = huellaContenido(filasNuevas, notasNuevas)
  const sincronizacion = acciones.editar ? sincronizarEditor(base, servidor, local) : 'al-dia'
  const adoptarGuardado = () => {
    setBase(servidor)
    setRevisionBase(regla.revision)
  }
  const recargar = () => {
    setFilas(aEditables(regla.filas))
    setNotas(regla.notas ?? '')
    adoptarGuardado()
  }
  if (sincronizacion === 'recargar') recargar()
  else if (sincronizacion === 'adoptar') adoptarGuardado()
  const sinGuardar = acciones.editar && local !== servidor
  // Conflicto: lo detectó la recarga de la lista, o el API rechazó el guardado con 409 VERSION_EN_CONFLICTO.
  // En ambos casos el trabajo local se queda en pantalla hasta que la persona decida recargar.
  const guardadoRechazado = sinGuardar && esConflictoRevision(editar.error)
  const enConflicto = sincronizacion === 'conflicto' || guardadoRechazado
  const bloqueoAprobar = motivoBloqueoAprobar(sinGuardar, errores.length > 0)

  const guardar = () => {
    if (errores.length > 0 || editar.isPending || enConflicto) return
    editar.mutate(
      cuerpoGuardado(revisionVista(sincronizacion, revisionBase, regla.revision), {
        filas: filasNuevas, filasCambiaron, notas: notasNuevas, notasCambiaron,
      }),
    )
  }
  const cargarGuardada = () => {
    editar.reset()
    recargar()
  }
  const cerrarDialogo = () => {
    activar.reset(); archivar.reset(); eliminar.reset()
    setDialogo(null)
  }
  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-white p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{regla.tipoEnfermedad} · v{regla.version}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <EstadoBadge estado={regla.estado} />
              <span>{regla.calibrada ? 'Calibrada' : 'Sin calibrar'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {acciones.duplicar && (
              <button type="button" className={BOTON} disabled={ocupado} onClick={() => duplicar.mutate(undefined, { onSuccess: (nueva) => nueva && seleccionar(nueva.id) })}>
                {duplicar.isPending ? 'Duplicando…' : 'Duplicar'}
              </button>
            )}
            {acciones.aprobar && (
              <button
                type="button"
                className={PRIMARIO}
                disabled={ocupado || bloqueoAprobar !== null}
                title={bloqueoAprobar ?? undefined}
                onClick={() => { if (!ocupado && !bloqueoAprobar) setDialogo('aprobar') }}
              >
                Aprobar
              </button>
            )}
            {acciones.activar && <button type="button" className={PRIMARIO} onClick={() => setDialogo('activar')}>Activar</button>}
            {acciones.archivar && <button type="button" className={BOTON} onClick={() => setDialogo('archivar')}>Archivar</button>}
            {acciones.eliminar && (
              <button type="button" disabled={ocupado} className="rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" onClick={() => setDialogo('eliminar')}>
                Eliminar borrador
              </button>
            )}
          </div>
        </header>

        {!regla.calibrada && <AvisoSinCalibrar />}
        {enConflicto && (
          <div role="alert" className="space-y-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>
              Esta regla cambió mientras la editabas{guardadoRechazado ? ' y tu guardado no se aplicó' : ''}. Tus cambios siguen en
              pantalla, pero no se pueden guardar sobre la versión nueva: anota lo que necesites y carga la versión guardada.
            </p>
            <button type="button" className={BOTON} onClick={cargarGuardada}>Descartar mis cambios y cargar la versión guardada</button>
          </div>
        )}
        {duplicar.isError && <MensajeError error={mensajeErrorRegla(duplicar.error, 'No se pudo duplicar la regla.')} />}

        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-gray-400">Creada</dt><dd className="text-gray-800">{fecha(regla.creadaEn)}</dd></div>
          <div>
            <dt className="text-xs text-gray-400">Aprobada por</dt>
            <dd className="text-gray-800">{regla.aprobadaPor ? `${regla.aprobadaPor.nombre} (TP ${regla.aprobadaPor.tarjetaProfesional})` : '—'}</dd>
          </div>
          <div><dt className="text-xs text-gray-400">Aprobada</dt><dd className="text-gray-800">{fecha(regla.aprobadaEn)}</dd></div>
          <div><dt className="text-xs text-gray-400">Activada</dt><dd className="text-gray-800">{fecha(regla.activadaEn)}</dd></div>
        </dl>

        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Tabla de zonas</h3>
          {acciones.editar ? (
            <EditorFilas filas={filas} cambiar={setFilas} deshabilitado={editar.isPending} />
          ) : (
            <>
              <p className="mb-2 text-xs text-gray-500">Solo lectura: duplica la regla para crear una nueva versión editable.</p>
              <EditorFilas filas={aEditables(regla.filas)} />
            </>
          )}
          {errores.length > 0 && (
            <ul role="alert" className="mt-3 list-disc rounded-xl bg-red-50 py-3 pl-8 pr-4 text-sm text-red-700">
              {errores.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-gray-900">{acciones.editar ? <label htmlFor={idNotas}>Notas</label> : 'Notas'}</h3>
          {acciones.editar ? (
            <textarea id={idNotas} value={notas} rows={4} maxLength={MAX_NOTAS} disabled={editar.isPending} onChange={(e) => setNotas(e.target.value)} className={CAMPO} />
          ) : parrafosNotas(regla.notas).length === 0 ? (
            <p className="text-sm text-gray-400">Sin notas.</p>
          ) : (
            <div className="space-y-2">
              {parrafosNotas(regla.notas).map((p, i) => (
                <p key={i} className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${p.deAprobacion ? 'border border-blue-100 bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-700'}`}>
                  {p.texto}
                </p>
              ))}
            </div>
          )}
        </div>

        {acciones.editar && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={PRIMARIO} disabled={errores.length > 0 || editar.isPending || enConflicto || (!filasCambiaron && !notasCambiaron)} onClick={guardar}>
              {editar.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            {editar.isSuccess && !filasCambiaron && !notasCambiaron && <span role="status" className="text-sm text-green-700">Cambios guardados.</span>}
            {acciones.aprobar && bloqueoAprobar && <span className="text-sm text-gray-500">{bloqueoAprobar}</span>}
          </div>
        )}
        {editar.isError && !esConflictoRevision(editar.error) && <MensajeError error={mensajeErrorRegla(editar.error, 'No se pudo guardar la regla.')} />}
      </section>

      <Simulador regla={regla} sinGuardar={sinGuardar} />

      {dialogo === 'aprobar' && <DialogoAprobar regla={regla} cerrar={() => setDialogo(null)} />}
      {dialogo === 'activar' && (
        <DialogoConfirmar
          titulo={`Activar ${regla.tipoEnfermedad} v${regla.version}`}
          textoConfirmar="Activar"
          pendiente={activar.isPending}
          error={activar.isError ? mensajeErrorRegla(activar.error, 'No se pudo activar la regla.') : null}
          confirmar={() => activar.mutate(undefined, { onSuccess: () => setDialogo(null) })}
          cerrar={cerrarDialogo}
        >
          <p className="font-medium">Esto reemplaza la regla activa actual.</p>
          <ConsecuenciaActivacion regla={regla} />
          {!regla.calibrada && <AvisoSinCalibrar />}
        </DialogoConfirmar>
      )}
      {dialogo === 'archivar' && (
        <DialogoConfirmar
          titulo={`Archivar ${regla.tipoEnfermedad} v${regla.version}`}
          textoConfirmar="Archivar"
          peligro
          pendiente={archivar.isPending}
          error={archivar.isError ? mensajeErrorRegla(archivar.error, 'No se pudo archivar la regla.') : null}
          confirmar={() => archivar.mutate(undefined, { onSuccess: () => setDialogo(null) })}
          cerrar={cerrarDialogo}
        >
          {regla.estado === 'activa' ? (
            <p>Esta es la regla activa actual de {regla.tipoEnfermedad}. Al archivarla la app no tendrá regla para este tipo hasta que actives otra versión.</p>
          ) : (
            <p>La versión aprobada quedará archivada y ya no se podrá activar. Esta acción no se puede deshacer.</p>
          )}
        </DialogoConfirmar>
      )}
      {dialogo === 'eliminar' && (
        <DialogoConfirmar
          titulo={`Eliminar borrador v${regla.version}`}
          textoConfirmar="Eliminar"
          peligro
          pendiente={eliminar.isPending}
          error={eliminar.isError ? mensajeErrorRegla(eliminar.error, 'No se pudo eliminar el borrador.') : null}
          confirmar={() => eliminar.mutate(undefined, { onSuccess: () => { setDialogo(null); seleccionar(null) } })}
          cerrar={cerrarDialogo}
        >
          <p>El borrador se eliminará definitivamente. Esta acción no se puede deshacer.</p>
        </DialogoConfirmar>
      )}
    </div>
  )
}
