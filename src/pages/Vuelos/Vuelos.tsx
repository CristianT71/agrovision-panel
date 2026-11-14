import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type FiltrosVuelos } from '../../api/vuelos/vuelos.service'
import { altitudVuelo, bytesVuelo, desdeDelDia, ETIQUETAS_TIPO, fechaVuelo, hastaDelDia, TIPOS_ARCHIVO } from '../../utils/vuelos'
import { obtenerSesion } from '../../api/auth/session'
import ChatAsistente from '../../components/ChatAsistente/ChatAsistente'
import FormularioVuelo from './FormularioVuelo'
import { BOTON, CAMPO, ErrorVuelo, Paginacion, PRIMARIO } from './ui'

export default function Vuelos() {
  const navegar = useNavigate()
  const esAdmin = obtenerSesion()?.rol === 'administrador'
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
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">IA y análisis multiespectral</h1><p className="mt-1 text-sm text-gray-500">Capturas y telemetría del dron · Horas en hora de Colombia</p></div><button type="button" className={PRIMARIO} onClick={() => setNuevo(true)}>Nuevo vuelo</button></header>
    <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4">
      <label className="text-sm text-gray-600">Lote<input value={lote} onChange={e => setLote(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <label className="text-sm text-gray-600">Desde<input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <label className="text-sm text-gray-600">Hasta<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={`${CAMPO} mt-1`} /></label>
      <button className={BOTON} disabled={rangoInvalido}>Filtrar</button>
      <button type="button" className={BOTON} onClick={() => { setLote(''); setDesde(''); setHasta(''); setFiltros({ pagina: 1, limite: 20 }) }}>Limpiar</button>
      {rangoInvalido && <p role="alert" className="w-full text-sm text-red-700">La fecha inicial no puede ser posterior a la final.</p>}
    </form>
    {vuelos.isPending ? <p role="status">Cargando vuelos…</p> : vuelos.isError ? <ErrorVuelo error={vuelos.error} reintentar={() => void vuelos.refetch()} /> : <>
      {vuelos.data.datos.length === 0 ? <p className="rounded-2xl bg-white p-10 text-center text-gray-500">No hay vuelos para estos filtros. Crea un nuevo vuelo para subir archivos.</p> : <div className="overflow-hidden rounded-2xl bg-white"><div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">{['Nombre', 'Lote', 'Fecha de inicio', 'Archivos por tipo', 'Altitud media', 'Tamaño total'].map(t => <th key={t} className="px-5 py-4 font-medium">{t}</th>)}<th className="px-5 py-4 text-right font-medium">Acciones</th></tr></thead>
          <tbody>{vuelos.data.datos.map(v => <tr key={v.id} className="border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]">
            <td className="px-5 py-4 font-medium text-gray-900">{v.nombre}</td>
            <td className="px-5 py-4 text-gray-600">{v.lote ?? '—'}</td><td className="px-5 py-4 text-gray-600">{fechaVuelo(v.resumen?.primeraCapturaEn)}</td>
            <td className="px-5 py-4"><ul className="space-y-0.5 text-xs text-gray-500">{TIPOS_ARCHIVO.map(tipo => <li key={tipo}>{ETIQUETAS_TIPO[tipo]}: {v.resumen?.porTipo?.[tipo] ?? '—'}</li>)}</ul></td>
            <td className="px-5 py-4 text-gray-600">{altitudVuelo(v.resumen?.altitudAbsolutaM?.media)}</td><td className="px-5 py-4 text-gray-600">{bytesVuelo(v.resumen?.tamanoTotalBytes)}</td>
            <td className="px-5 py-4"><div className="flex justify-end"><button type="button" onClick={() => navegar(`/vuelos/${encodeURIComponent(v.id)}`)} className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:border-agro-green hover:text-agro-green">Ver detalle</button></div></td>
          </tr>)}</tbody>
        </table></div>
      </div>}
      <Paginacion pagina={filtros.pagina ?? 1} limite={20} total={vuelos.data.total} cargando={vuelos.isFetching} cambiar={pagina => setFiltros({ ...filtros, pagina })} />
    </>}
    {nuevo && <FormularioVuelo cerrar={() => setNuevo(false)} guardado={v => navegar(`/vuelos/${encodeURIComponent(v.id)}?subir=1`)} />}
    {esAdmin && <ChatAsistente />}
  </div>
}
