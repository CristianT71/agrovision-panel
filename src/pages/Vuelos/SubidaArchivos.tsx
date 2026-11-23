import { useEffect, useState, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { clavesVuelos, vuelosService } from '../../api/vuelos/vuelos.service'
import { bytesVuelo } from '../../utils/vuelos'
import { ColaSubidas, EXTENSIONES_VUELO, MAX_ARCHIVO_MB, resumenSubidas } from './colaSubidas'
import { BOTON } from './ui'

export default function SubidaArchivos({ vueloId, alCambiarActividad }: { vueloId: string; alCambiarActividad?: (activa: boolean) => void }) {
  const cliente = useQueryClient()
  const [cola] = useState(() => new ColaSubidas(
    (archivo, opciones) => vuelosService.subirArchivo(vueloId, archivo, opciones),
  ))
  const elementos = useSyncExternalStore(cola.suscribir, cola.snapshot)
  const resumen = resumenSubidas(elementos)
  useEffect(() => { alCambiarActividad?.(resumen.enCurso) }, [alCambiarActividad, resumen.enCurso])
  // Se actualiza al terminar el lote, no con cada uno de cientos de archivos.
  useEffect(() => {
    if (elementos.length && !resumen.enCurso) void cliente.invalidateQueries({ queryKey: clavesVuelos.todas })
  }, [cliente, elementos.length, resumen.enCurso])
  useEffect(() => () => cola.cancelarTodas(), [cola])
  useEffect(() => {
    if (!resumen.enCurso) return
    const avisar = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = '' }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [resumen.enCurso])

  return <section aria-label="Subir archivos" className="space-y-4 rounded-2xl bg-white p-5">
    <h2 className="text-lg font-semibold">Subir archivos</h2>
    <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); cola.agregar(Array.from(e.dataTransfer.files)) }} className="block cursor-pointer rounded-xl border-2 border-dashed border-green-200 bg-green-50/40 p-6 text-center text-sm text-gray-600 focus-within:ring-2 focus-within:ring-agro-green">
      <span className="block font-medium text-agro-green">Arrastra aquí las capturas o selecciona archivos</span>
      <span className="mt-1 block">JPG, PNG, TIFF, DNG, MP4, MOV y SRT · Máximo {MAX_ARCHIVO_MB} MiB por archivo · 3 subidas simultáneas</span>
      <input type="file" multiple accept={EXTENSIONES_VUELO} className="mt-3 max-w-full text-xs" onChange={e => { cola.agregar(Array.from(e.target.files ?? [])); e.target.value = '' }} />
    </label>
    {elementos.length > 0 && <>
      <div aria-live="polite" className="text-sm text-gray-600">
        <p>{resumen.enCurso ? 'Subiendo… ' : 'Resumen final: '}{resumen.subidos} subidos, {resumen.duplicados} duplicados, {resumen.errores} con error{resumen.cancelados > 0 && `, ${resumen.cancelados} cancelados`}</p>
        <label>Progreso total: {resumen.progreso}% · {bytesVuelo(resumen.cargados)} / {bytesVuelo(resumen.totalBytes)}<progress aria-label="Progreso total" value={resumen.progreso} max={100} className="mt-2 h-2 w-full accent-agro-green" /></label>
        {!resumen.enCurso && (resumen.errores > 0 || resumen.cancelados > 0) && <p>El progreso incluye los bytes enviados; los errores y las cancelaciones pueden dejarlo por debajo del 100%.</p>}
      </div>
      <div className="flex gap-2">
        {resumen.enCurso && <button type="button" className={BOTON} onClick={cola.cancelarTodas}>Cancelar pendientes y activas</button>}
        {elementos.some(e => e.estado === 'error' && e.reintentable) && <button type="button" className={BOTON} onClick={() => cola.reintentarFallidos()}>Reintentar fallidos</button>}
      </div>
      <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
        {elementos.map(e => <li key={e.id} className="flex items-center gap-4 py-3 text-sm">
          <div className="min-w-0 flex-1"><p className="truncate" title={e.archivo.name}>{e.archivo.name}</p><p className="text-xs text-gray-500">{e.estado} · {bytesVuelo(e.archivo.size)}{e.error && ` · ${e.error}`}</p>
            <progress aria-label={`Progreso de ${e.archivo.name}`} value={e.cargados} max={e.archivo.size || 1} className="h-1.5 w-full accent-agro-green" />
          </div>
          {['pendiente', 'subiendo'].includes(e.estado) && <button type="button" className={BOTON} onClick={() => cola.cancelar(e.id)}>Cancelar</button>}
          {['error', 'cancelado'].includes(e.estado) && e.reintentable && <button type="button" className={BOTON} onClick={() => cola.reintentar(e.id)}>Reintentar</button>}
        </li>)}
      </ul>
    </>}
  </section>
}
