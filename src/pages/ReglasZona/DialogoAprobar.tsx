import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { agronomosService, clavesAgronomos } from '../../api/agronomos/agronomos.service'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import { cuerpoAprobacion, MAX_NOTA_APROBACION, mensajeErrorRegla, validarAprobacion } from './logica'
import { useAprobarRegla } from './useReglasZona'
import { BOTON, CAMPO, Dialogo, MensajeError, PRIMARIO } from './ui'

type Props = { regla: ReglaZona; cerrar: () => void }

// Solo se abre para el agrónomo. El API guarda la nota dentro de las notas de la regla
// ("Nota de calibración:" o "Nota de aprobación:") y exige nota si se marca calibrada.
export default function DialogoAprobar({ regla, cerrar }: Props) {
  const [calibrada, setCalibrada] = useState(false)
  const [nota, setNota] = useState('')
  const perfil = useQuery({ queryKey: clavesAgronomos.miPerfil, queryFn: () => agronomosService.miPerfil() })
  const aprobar = useAprobarRegla(regla.id)

  const errorLocal = validarAprobacion(calibrada, nota)
  const noValidado = perfil.data !== undefined && perfil.data.estado !== 'activo'
  const salir = () => { if (!aprobar.isPending) cerrar() }

  return (
    <Dialogo titulo={`Aprobar ${regla.tipoEnfermedad} v${regla.version}`} cerrar={salir}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!errorLocal && !aprobar.isPending) aprobar.mutate(cuerpoAprobacion(calibrada, nota), { onSuccess: cerrar })
        }}
      >
        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wider text-gray-400">Aprueba</p>
          {perfil.isPending ? (
            <p className="text-gray-500">Cargando tus datos…</p>
          ) : perfil.isError ? (
            <p className="text-red-700">No se pudieron cargar tus datos de agrónomo.</p>
          ) : (
            <p className="font-medium text-gray-900">
              {perfil.data.nombre} · Tarjeta profesional {perfil.data.tarjetaProfesional}
            </p>
          )}
          {noValidado && (
            <p className="mt-1 text-red-700">Tu cuenta aún no está validada: solo un agrónomo validado puede aprobar.</p>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={calibrada} disabled={aprobar.isPending} onChange={(e) => setCalibrada(e.target.checked)} className="mt-0.5 h-4 w-4" />
          <span>
            <span className="font-medium">Calibrada</span>
            <span className="block text-gray-500">Marca solo si los radios se validaron en campo. Exige una nota que lo justifique.</span>
          </span>
        </label>

        <label className="block text-sm text-gray-600">
          {calibrada ? 'Nota de calibración (obligatoria)' : 'Nota de aprobación (opcional)'}
          <textarea
            value={nota}
            rows={4}
            maxLength={MAX_NOTA_APROBACION}
            disabled={aprobar.isPending}
            onChange={(e) => setNota(e.target.value)}
            className={`${CAMPO} mt-1`}
          />
        </label>

        {errorLocal && <p role="alert" className="text-sm text-red-700">{errorLocal}</p>}
        {aprobar.isError && (
          <MensajeError error={mensajeErrorRegla(aprobar.error, 'No se pudo aprobar la regla.', 'Solo un agrónomo validado puede aprobar una regla de zona.')} />
        )}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" className={BOTON} onClick={salir} disabled={aprobar.isPending}>Cancelar</button>
          <button type="submit" className={PRIMARIO} disabled={Boolean(errorLocal) || aprobar.isPending}>
            {aprobar.isPending ? 'Aprobando…' : 'Aprobar'}
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
