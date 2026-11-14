import { useState, type FormEvent } from 'react'
import { obtenerSesion } from '../../api/auth/session'
import { ESTADOS_REGLA, type EstadoRegla, type FiltrosReglas } from '../../api/reglas-zona/reglas-zona.service'
import { formatearFecha } from '../../utils/fechas'
import DetalleRegla from './DetalleRegla'
import DialogoNuevaRegla from './DialogoNuevaRegla'
import { agruparPorTipo, ETIQUETA_ESTADO, mensajeErrorRegla } from './logica'
import { useReglas } from './useReglasZona'
import { BOTON, CAMPO, EstadoBadge, MensajeError, PRIMARIO } from './ui'

// Reglas de zona (admin y agrónomo): tabla versionada severidad/incidencia -> radio de la zona afectada
export default function ReglasZona() {
  const rol = obtenerSesion()?.rol ?? null
  const [tipo, setTipo] = useState('')
  const [estado, setEstado] = useState<EstadoRegla | ''>('')
  const [filtros, setFiltros] = useState<FiltrosReglas>({})
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)
  const reglas = useReglas(filtros)

  const grupos = agruparPorTipo(reglas.data ?? [])
  const idSeleccionado = seleccion ?? grupos[0]?.reglas[0]?.id ?? null
  const seleccionada = reglas.data?.find((r) => r.id === idSeleccionado) ?? null

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
      ) : grupos.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-gray-500">No hay reglas para estos filtros. Crea una nueva regla en borrador.</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <nav aria-label="Reglas por tipo" className="space-y-4">
            {grupos.map((g) => (
              <section key={g.tipo} className="rounded-2xl bg-white p-4">
                <h2 className="mb-2 flex items-center justify-between font-semibold text-gray-900">
                  <span>{g.tipo}</span>
                  <span className="text-xs font-normal text-gray-400">{g.activa ? `Activa: v${g.activa.version}` : 'Sin regla activa'}</span>
                </h2>
                <ul className="space-y-1">
                  {g.reglas.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSeleccion(r.id)}
                        aria-current={r.id === idSeleccionado ? 'true' : undefined}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${r.id === idSeleccionado ? 'bg-[#eaf4ee]' : 'hover:bg-gray-50'}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900">v{r.version}</span>
                          <EstadoBadge estado={r.estado} />
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {r.aprobadaPor ? `Aprobó ${r.aprobadaPor.nombre}` : 'Sin aprobar'} · {formatearFecha(r.creadaEn)}
                          {!r.calibrada && ' · sin calibrar'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
          {seleccionada ? (
            <DetalleRegla
              key={seleccionada.id}
              regla={seleccionada}
              rol={rol}
              seleccionar={setSeleccion}
            />
          ) : (
            <p className="rounded-2xl bg-white p-10 text-center text-gray-500">Selecciona una versión para ver su tabla.</p>
          )}
        </div>
      )}

      {nueva && <DialogoNuevaRegla cerrar={() => setNueva(false)} creada={(r) => { setNueva(false); setSeleccion(r.id) }} />}
    </div>
  )
}
