import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type ArchivoVuelo, type Banda, type TipoArchivo } from '../../api/vuelos/vuelos.service'
import { BANDAS, bytesVuelo, ETIQUETAS_TIPO, etiquetaRtk, fechaVuelo, TIPOS_ARCHIVO } from '../../utils/vuelos'
import { BOTON, CAMPO, ErrorVuelo, Paginacion } from './ui'
import { useEnlaceArchivo } from './useEnlaceArchivo'

export default function GaleriaVuelo({ vueloId, seleccionado, abrir }: { vueloId: string; seleccionado: string | null; abrir: (id: string) => void }) {
  const [pagina, setPagina] = useState(1)
  const [tipo, setTipo] = useState<TipoArchivo | ''>('')
  const [banda, setBanda] = useState<Banda | ''>('')
  const filtros = { pagina, limite: 60, tipo: tipo || undefined, banda: banda || undefined }
  const archivos = useQuery({ queryKey: clavesVuelos.archivos(vueloId, filtros), queryFn: ({ signal }) => vuelosService.listarArchivos(vueloId, filtros, signal), placeholderData: keepPreviousData, gcTime: 0 })
  const visible = archivos.data?.datos.some(a => a.id === seleccionado)
  // El contrato no ofrece una búsqueda de página por id. Se obtiene solo el archivo
  // seleccionado fuera de página, sin recorrer ni descargar el resto de la galería.
  const enfocado = useQuery({ queryKey: clavesVuelos.archivo(vueloId, seleccionado ?? ''), queryFn: ({ signal }) => vuelosService.obtenerArchivo(vueloId, seleccionado!, signal), enabled: Boolean(seleccionado) && !visible && archivos.isSuccess && !archivos.isPlaceholderData, gcTime: 0 })
  return <section aria-label="Galería" className="space-y-4 rounded-2xl bg-white p-5">
    <h2 className="text-lg font-semibold">Galería de archivos</h2>
    <div className="flex flex-wrap gap-3">
      <label className="text-sm">Tipo<select className={`${CAMPO} mt-1`} value={tipo} onChange={e => { const valor = e.target.value as TipoArchivo | ''; setTipo(valor); if (valor !== 'banda_multiespectral') setBanda(''); setPagina(1) }}><option value="">Todos</option>{TIPOS_ARCHIVO.map(t => <option key={t} value={t}>{ETIQUETAS_TIPO[t]}</option>)}</select></label>
      <label className="text-sm">Banda<select className={`${CAMPO} mt-1`} value={banda} disabled={tipo !== 'banda_multiespectral'} onChange={e => { setBanda(e.target.value as Banda | ''); setPagina(1) }}><option value="">Todas</option>{BANDAS.map(b => <option key={b} value={b}>{b}</option>)}</select></label>
    </div>
    {seleccionado && !visible && <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-4">
      <p className="mb-2 text-sm">Archivo seleccionado en el mapa, fuera de esta página o de los filtros actuales.</p>
      {enfocado.isPending ? <p>Cargando selección…</p> : enfocado.isError ? <ErrorVuelo error={enfocado.error} /> : <Tarjeta archivo={enfocado.data} seleccionada abrir={() => abrir(seleccionado)} />}
    </div>}
    {archivos.isPending ? <p role="status">Cargando archivos…</p> : archivos.isError ? <ErrorVuelo error={archivos.error} reintentar={() => void archivos.refetch()} /> : <>
      {archivos.data.datos.length === 0 && <p className="py-8 text-center text-gray-500">No hay archivos para estos filtros.</p>}
      <div aria-busy={archivos.isFetching} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {archivos.data.datos.map(a => <Tarjeta key={a.id} archivo={a} seleccionada={a.id === seleccionado} abrir={() => abrir(a.id)} />)}
      </div>
      <Paginacion pagina={pagina} total={archivos.data.total} limite={60} cambiar={setPagina} cargando={archivos.isFetching} />
    </>}
  </section>
}
function Tarjeta({ archivo, seleccionada, abrir }: { archivo: ArchivoVuelo; seleccionada: boolean; abrir: () => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [fallos, setFallos] = useState(0)
  const enlace = useEnlaceArchivo(archivo.vueloId, archivo.id, visible)
  useEffect(() => {
    const nodo = contenedor.current
    if (!nodo) return
    if (!('IntersectionObserver' in window)) { setVisible(true); return }
    const observador = new IntersectionObserver(([entrada]) => setVisible(entrada.isIntersecting), { rootMargin: '150px' })
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])
  useEffect(() => { if (seleccionada) contenedor.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [seleccionada])
  const miniatura = enlace.data?.urlMiniatura
  return <div ref={contenedor} className={`overflow-hidden rounded-xl border ${seleccionada ? 'border-yellow-500 ring-2 ring-yellow-300' : 'border-gray-100'}`}>
    <button type="button" onClick={abrir} className="block w-full text-left hover:bg-green-50/40" aria-label={`Ver ${archivo.nombreOriginal}`}>
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-gray-400">
        {visible && miniatura && fallos < 2 ? <img src={miniatura} alt={archivo.nombreOriginal} loading="lazy" decoding="async" referrerPolicy="no-referrer" width={320} height={240} className="h-full w-full object-cover" onError={() => { setFallos(f => f + 1); if (fallos === 0) void enlace.refetch() }} /> : <span className="text-center"><span aria-hidden="true" className="block text-3xl">{archivo.tipo === 'video' ? '▷' : '▧'}</span><span className="text-xs">{enlace.isPending && visible ? 'Cargando vista…' : 'Sin miniatura'}</span></span>}
      </div>
      <div className="space-y-1 p-3"><p className="truncate text-sm font-medium text-gray-800" title={archivo.nombreOriginal}>{archivo.nombreOriginal}</p><p className="text-xs text-gray-500">{ETIQUETAS_TIPO[archivo.tipo]}{archivo.banda && ` · ${archivo.banda}`} · {bytesVuelo(archivo.tamanoBytes)}</p><p className="text-xs text-gray-500">{fechaVuelo(archivo.capturadoEn)}</p><p className={`text-xs ${etiquetaRtk(archivo.gps) === 'RTK fijo' ? 'text-green-700' : 'text-gray-500'}`}>{etiquetaRtk(archivo.gps)}</p></div>
    </button>
    {visible && enlace.isError && <div className="p-2"><ErrorVuelo error={enlace.error} reintentar={() => void enlace.refetch()} /></div>}
    {fallos >= 2 && <button type="button" className={`${BOTON} m-2`} onClick={() => { setFallos(0); void enlace.refetch() }}>Recargar miniatura</button>}
  </div>
}
