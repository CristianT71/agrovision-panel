import { useState } from 'react'
import type { Rol } from '../../api/auth/session'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import { formatearFechaHora } from '../../utils/fechas'
import DialogoAprobar from './DialogoAprobar'
import DialogoConfirmar from './DialogoConfirmar'
import EditorFilas from './EditorFilas'
import { accionesDisponibles, aEditables, aFilas, MAX_NOTAS, mensajeErrorRegla, parrafosNotas, validarFilas } from './logica'
import Simulador from './Simulador'
import { useActivarRegla, useArchivarRegla, useDuplicarRegla, useEditarRegla, useEliminarRegla } from './useReglasZona'
import { AvisoSinCalibrar, BOTON, CAMPO, EstadoBadge, MensajeError, PRIMARIO } from './ui'

type Props = {
  regla: ReglaZona
  rol: Rol | null
  // Regla activa del mismo tipo (puede ser esta misma)
  activaActual: ReglaZona | null
  seleccionar: (id: string | null) => void
}

type Confirmacion = 'activar' | 'archivar' | 'eliminar' | 'aprobar' | null

const fecha = (iso: string | null) => (iso ? formatearFechaHora(iso) : '—')

// Se monta con key={regla.id}: el estado del editor se reinicia al cambiar de regla
export default function DetalleRegla({ regla, rol, activaActual, seleccionar }: Props) {
  const acciones = accionesDisponibles(rol, regla.estado)
  const [filas, setFilas] = useState(() => aEditables(regla.filas))
  const [notas, setNotas] = useState(regla.notas ?? '')
  const [dialogo, setDialogo] = useState<Confirmacion>(null)

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

  const guardar = () => {
    if (errores.length > 0 || editar.isPending) return
    editar.mutate({ ...(filasCambiaron ? { filas: filasNuevas } : {}), ...(notasCambiaron ? { notas: notasNuevas } : {}) })
  }
  const cerrarDialogo = () => {
    activar.reset(); archivar.reset(); eliminar.reset()
    setDialogo(null)
  }
  const otraActiva = activaActual && activaActual.id !== regla.id ? activaActual : null

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
            {acciones.aprobar && <button type="button" className={PRIMARIO} disabled={ocupado} onClick={() => setDialogo('aprobar')}>Aprobar</button>}
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
              <EditorFilas filas={filas} />
            </>
          )}
          {errores.length > 0 && (
            <ul role="alert" className="mt-3 list-disc rounded-xl bg-red-50 py-3 pl-8 pr-4 text-sm text-red-700">
              {errores.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-gray-900">Notas</h3>
          {acciones.editar ? (
            <textarea value={notas} rows={4} maxLength={MAX_NOTAS} disabled={editar.isPending} onChange={(e) => setNotas(e.target.value)} className={CAMPO} />
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
            <button type="button" className={PRIMARIO} disabled={errores.length > 0 || editar.isPending || (!filasCambiaron && !notasCambiaron)} onClick={guardar}>
              {editar.isPending ? 'Guardando…' : 'Guardar'}
            </button>
            {editar.isSuccess && !filasCambiaron && !notasCambiaron && <span role="status" className="text-sm text-green-700">Cambios guardados.</span>}
          </div>
        )}
        {editar.isError && <MensajeError error={mensajeErrorRegla(editar.error, 'No se pudo guardar la regla.')} />}
      </section>

      <Simulador regla={regla} />

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
          <p>
            {otraActiva
              ? `La versión v${otraActiva.version} de ${regla.tipoEnfermedad} quedará archivada y la app empezará a usar esta.`
              : `No hay otra regla activa de ${regla.tipoEnfermedad}: la app empezará a usar esta.`}
          </p>
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
