import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type FiltrosVuelos } from '../../api/vuelos/vuelos.service'
import { altitudVuelo, bytesVuelo, desdeDelDia, ETIQUETAS_TIPO, fechaVuelo, hastaDelDia, TIPOS_ARCHIVO } from '../../utils/vuelos'
import FormularioVuelo from './FormularioVuelo'
import { BOTON, CAMPO, ErrorVuelo, Paginacion, PRIMARIO } from './ui'

export default function Vuelos() {
  const navegar = useNavigate()
  const [nuevo, setNuevo] = useState(false)
  const [lote, setLote] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtros, setFiltros] = useState<FiltrosVuelos>({ pagina: 1, limite: 20 })
  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const vuelos = useQuery({ queryKey: clavesVuelos.lista(filtros), queryFn: ({ signal }) => vuelosService.listar(filtros, signal), placeholderData: keepPreviousData, gcTime: 0 })
  const filtrar = (e: FormEvent) => {
    e.preventDefault()
    if (!rangoInvalido) setFiltros({ pagina: 1, limite: 20, lote: lote.trim() || undefined, desde: desdeDelDia(desde), hasta: hastaDelDia(hasta) })
  }
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Vuelos de dron</h1><p className="mt-1 text-sm text-gray-500">Capturas y telemetría · Horas en America/Bogota</p></div><button type="button" className={PRIMARIO} onClick={() => setNuevo(true)}>Nuevo vuelo</button></header>
    <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4">
      <label className="text-sm text-gray-600">Lote<input value={lote} onChange={e => setLote(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <label className="text-sm text-gray-600">Desde<input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <label className="text-sm text-gray-600">Hasta<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <button className={BOTON} disabled={rangoInvalido}>Filtrar</button>
      <button type="button" className={BOTON} onClick={() => { setLote(''); setDesde(''); setHasta(''); setFiltros({ pagina: 1, limite: 20 }) }}>Limpiar</button>
      {rangoInvalido && <p role="alert" className="w-full text-sm text-red-700">La fecha inicial no puede ser posterior a la final.</p>}
    </form>
    {vuelos.isPending ? <p role="status">Cargando vuelos…</p> : vuelos.isError ? <ErrorVuelo error={vuelos.error} reintentar={() => void vuelos.refetch()} /> : <>
      {vuelos.data.datos.length === 0 ? <p className="rounded-2xl bg-white p-10 text-center text-gray-500">No hay vuelos para estos filtros. Crea un nuevo vuelo para subir archivos.</p> : <div className="overflow-x-auto rounded-2xl bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b border-gray-100 text-xs text-gray-500"><tr>{['Nombre', 'Lote', 'Inicio (Bogotá)', 'Archivos por tipo', 'Altitud media', 'Tamaño total'].map(t => <th key={t} className="p-4">{t}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">{vuelos.data.datos.map(v => <tr key={v.id} className="hover:bg-green-50/40">
            <td className="p-4"><Link className="font-semibold text-agro-green underline" to={`/vuelos/${encodeURIComponent(v.id)}`}>{v.nombre}</Link></td>
            <td className="p-4">{v.lote ?? '—'}</td><td className="p-4">{fechaVuelo(v.resumen?.primeraCapturaEn)}</td>
            <td className="p-4"><ul className="space-y-1 text-xs">{TIPOS_ARCHIVO.map(tipo => <li key={tipo}>{ETIQUETAS_TIPO[tipo]}: {v.resumen?.porTipo?.[tipo] ?? '—'}</li>)}</ul></td>
            <td className="p-4">{altitudVuelo(v.resumen?.altitudAbsolutaM?.media)}</td><td className="p-4">{bytesVuelo(v.resumen?.tamanoTotalBytes)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <Paginacion pagina={filtros.pagina ?? 1} limite={20} total={vuelos.data.total} cargando={vuelos.isFetching} cambiar={pagina => setFiltros({ ...filtros, pagina })} />
    </>}
    {nuevo && <FormularioVuelo cerrar={() => setNuevo(false)} guardado={v => navegar(`/vuelos/${encodeURIComponent(v.id)}?subir=1`)} />}
  </div>
}
