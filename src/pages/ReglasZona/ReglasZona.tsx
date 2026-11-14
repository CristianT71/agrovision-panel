import { useCallback, useRef, useState, type FormEvent } from 'react'
import { obtenerSesion } from '../../api/auth/session'
import { ESTADOS_REGLA, type EstadoRegla, type FiltrosReglas } from '../../api/reglas-zona/reglas-zona.service'
import { formatearFecha } from '../../utils/fechas'
import DetalleRegla from './DetalleRegla'
import DialogoNuevaRegla from './DialogoNuevaRegla'
import { ETIQUETA_ESTADO, mensajeErrorRegla } from './logica'
import { useReglas } from './useReglasZona'
import { BOTON, CAMPO, Dialogo, EstadoBadge, MensajeError, PRIMARIO } from './ui'

// Reglas de zona (admin y agrónomo): tabla versionada severidad/incidencia -> radio de la zona afectada
export default function ReglasZona() {
  const rol = obtenerSesion()?.rol ?? null
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState<EstadoRegla | ''>('')
  const [filtros, setFiltros] = useState<FiltrosReglas>({})
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)
  const reglas = useReglas(filtros)

  const lista = reglas.data ?? []
  const idSeleccionado = seleccion
  const seleccionada = seleccion ? lista.find((r) => r.id === seleccion) ?? null : null
  const sinGuardar = useRef(false)
  const avisarSinGuardar = useCallback((valor: boolean) => { sinGuardar.current = valor }, [])
  const cerrarDetalle = () => {
    if (sinGuardar.current && !window.confirm('Tienes cambios sin guardar en esta regla. ¿Cerrar y descartarlos?')) return
    setSeleccion(null)
  }

  // La selección ya no está en la lista (filtro que la excluye o regla eliminada): quita el filtro o suelta la selección
  // (se ajusta durante el render, protegido por la condición, para no usar setState dentro de un efecto)
  if (seleccion && !reglas.isFetching && reglas.data && !reglas.data.some((r) => r.id === seleccion)) {
    if (filtros.tipo || filtros.estado) { setTipo(''); setEstado(''); setFiltros({}) }
    else setSeleccion(null)
  }

  const filtrar = (e: FormEvent) => {
    e.preventDefault()
    setFiltros({ tipo: tipo.trim() || undefined, estado: estado || undefined })
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reglas de zona</h1>
          <p className="mt-1 text-sm text-gray-500">Severidad e incidencia → radio estimado de la zona afectada. Solo los borradores se editan.</p>
        </div>
        <button type="button" className={PRIMARIO} onClick={() => setNueva(true)}>Nueva regla</button>
      </header>

      <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4">
        <label className="text-sm text-gray-600">Tipo<input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="roya" className={`${CAMPO} mt-1`} /></label>
        <label className="text-sm text-gray-600">
          Estado
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoRegla | '')} className={`${CAMPO} mt-1`}>
            <option value="">Todos</option>
            {ESTADOS_REGLA.map((e) => <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>)}
          </select>
        </label>
        <button className={BOTON}>Filtrar</button>
        <button type="button" className={BOTON} onClick={() => { setTipo(''); setEstado(''); setFiltros({}) }}>Limpiar</button>
      </form>

      {reglas.isPending ? (
        <p role="status" className="text-sm text-gray-500">Cargando reglas…</p>
      ) : reglas.isError ? (
        <div className="space-y-2">
          <MensajeError error={mensajeErrorRegla(reglas.error, 'No se pudieron cargar las reglas.', 'No tienes permiso para ver las reglas de zona.')} />
          <button type="button" className={BOTON} onClick={() => void reglas.refetch()}>Reintentar</button>
        </div>
      ) : lista.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-gray-500">No hay reglas para estos filtros. Crea una nueva regla en borrador.</p>
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Reglas de zona por tipo y versión</caption>
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th scope="col" className="px-5 py-3 font-semibold">Tipo de zona</th><th scope="col" className="px-5 py-3 font-semibold">Versión</th><th scope="col" className="px-5 py-3 font-semibold">Estado</th><th scope="col" className="px-5 py-3 font-semibold">Calibración</th><th scope="col" className="px-5 py-3 font-semibold">Creada</th><th scope="col" className="px-5 py-3 text-center font-semibold">Información</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((r) => (
                  <tr key={r.id} className={r.id === idSeleccionado ? 'bg-[#f2f8f4]' : 'hover:bg-gray-50'}>
                    <td className="px-5 py-4 font-medium text-gray-900">{r.tipoEnfermedad}</td>
                    <td className="px-5 py-4 text-gray-700">v{r.version}</td>
                    <td className="px-5 py-4"><EstadoBadge estado={r.estado} /></td>
                    <td className="px-5 py-4 text-gray-600">{r.calibrada ? 'Calibrada' : 'Sin calibrar'}</td>
                    <td className="px-5 py-4 text-gray-600">{formatearFecha(r.creadaEn)}</td>
                    <td className="px-5 py-4 text-center"><button type="button" onClick={() => setSeleccion(r.id)} aria-label={`Ver información de ${r.tipoEnfermedad} v${r.version}`} className="inline-flex items-center whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-agro-green hover:text-agro-green">
                      Ver información
                    </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {seleccionada && (
        <Dialogo titulo={`Regla de zona: ${seleccionada.tipoEnfermedad} · v${seleccionada.version}`} cerrar={cerrarDetalle} cerrarAlClicFuera etiquetaVolver="Volver a reglas de zona" ancho="max-w-5xl">
          <DetalleRegla
            key={seleccionada.id}
            regla={seleccionada}
            rol={rol}
            seleccionar={setSeleccion}
            avisarSinGuardar={avisarSinGuardar}
          />
        </Dialogo>
      )}
      {nueva && <DialogoNuevaRegla cerrar={() => setNueva(false)} creada={(r) => { setNueva(false); setSeleccion(r.id) }} />}
    </div>
  )
}
