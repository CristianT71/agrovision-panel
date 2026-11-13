import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type RangoAltura, type Vuelo } from '../../api/vuelos/vuelos.service'
import { altitudVuelo, bytesVuelo, duracionVuelo, ETIQUETAS_TIPO, fechaVuelo, numeroVuelo, TIPOS_ARCHIVO } from '../../utils/vuelos'
import FormularioVuelo from './FormularioVuelo'
import GaleriaVuelo from './GaleriaVuelo'
import SubidaArchivos from './SubidaArchivos'
import VisorArchivo from './VisorArchivo'
import { BOTON, CAMPO, ErrorVuelo, ModalVuelo } from './ui'

// Leaflet y la capa satelital solo se descargan al abrir el detalle.
const MapaVuelo = lazy(() => import('./MapaVuelo'))

export default function VueloDetalle() {
  const { id } = useParams<{ id: string }>()
  return id ? <ContenidoVuelo key={id} id={id} /> : <p>No se indicó un vuelo.</p>
}
function ContenidoVuelo({ id }: { id: string }) {
  const [parametros] = useSearchParams()
  const [editar, setEditar] = useState(false)
  const [eliminar, setEliminar] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [archivoAbierto, setArchivoAbierto] = useState<string | null>(null)
  const vuelo = useQuery({ queryKey: clavesVuelos.detalle(id), queryFn: ({ signal }) => vuelosService.obtener(id, signal), gcTime: 0 })
  const traza = useQuery({ queryKey: clavesVuelos.traza(id), queryFn: ({ signal }) => vuelosService.traza(id, signal), enabled: vuelo.isSuccess, gcTime: 0 })
  return <div className="space-y-5">
    {vuelo.isPending ? <p role="status">Cargando vuelo…</p> : vuelo.isError ? <ErrorVuelo error={vuelo.error} reintentar={() => void vuelo.refetch()} /> : <>
      <header className="flex flex-wrap justify-between gap-4"><div className="flex items-start gap-3"><Link to="/vuelos" aria-label="Volver a vuelos de dron" title="Volver a vuelos de dron" className="mt-1.5 text-gray-400 hover:text-gray-600"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg></Link><div><h1 className="break-words text-2xl font-bold text-gray-900">{vuelo.data.nombre}</h1><p className="mt-1 text-sm text-gray-500">Lote: {vuelo.data.lote || 'Sin lote'} · Horas en hora de Colombia</p></div></div><div className="flex items-start gap-2"><button type="button" className={BOTON} onClick={() => setEditar(true)}>Editar vuelo</button><button type="button" disabled={subiendo} title={subiendo ? 'Espera o cancela las subidas antes de borrar' : undefined} className={`${BOTON} text-red-700`} onClick={() => setEliminar(true)}>Borrar vuelo</button></div></header>
      {vuelo.data.notas && <p className="whitespace-pre-wrap break-words text-sm text-gray-600">{vuelo.data.notas}</p>}
      <Resumen vuelo={vuelo.data} />
      <details open={parametros.get('subir') === '1' || subiendo} className="rounded-2xl bg-white p-2"><summary className="cursor-pointer px-3 py-2 font-medium text-agro-green">Subir archivos a este vuelo</summary><SubidaArchivos vueloId={id} alCambiarActividad={setSubiendo} /></details>
      {traza.isPending ? <p role="status">Cargando traza…</p> : traza.isError ? <ErrorVuelo error={traza.error} reintentar={() => void traza.refetch()} /> : <Suspense fallback={<div className="h-96 rounded-xl bg-gray-100 p-6">Cargando mapa satelital…</div>}><MapaVuelo traza={traza.data} seleccionado={seleccionado} seleccionar={setSeleccionado} /></Suspense>}
      <GaleriaVuelo vueloId={id} seleccionado={seleccionado} abrir={setArchivoAbierto} />
      {editar && <FormularioVuelo vuelo={vuelo.data} cerrar={() => setEditar(false)} guardado={() => setEditar(false)} />}
      {eliminar && <BorrarVuelo vuelo={vuelo.data} cerrar={() => setEliminar(false)} />}
      {archivoAbierto && <VisorArchivo key={archivoAbierto} vueloId={id} archivoId={archivoAbierto} cerrar={() => setArchivoAbierto(null)} />}
    </>}
  </div>
}
function Resumen({ vuelo }: { vuelo: Vuelo }) {
  const r = vuelo.resumen
  const totalRtk = r?.rtk ? r.rtk.fijo + r.rtk.otro + r.rtk.sinDato : 0
  const rango = (valor: RangoAltura | null | undefined) => `Mín. ${altitudVuelo(valor?.min)} · Máx. ${altitudVuelo(valor?.max)} · Media ${altitudVuelo(valor?.media)}`
  const filas = [
    ['Inicio', fechaVuelo(r?.primeraCapturaEn)], ['Fin', fechaVuelo(r?.ultimaCapturaEn)], ['Duración', duracionVuelo(r?.duracionSegundos)],
    ['Archivos', r?.totalArchivos ?? '—'], ['Tamaño total', bytesVuelo(r?.tamanoTotalBytes)],
    ['Altitud absoluta (m)', rango(r?.altitudAbsolutaM)], ['Altura relativa', rango(r?.alturaRelativaM)],
    ['RTK fijo', r?.rtk && totalRtk ? `${numeroVuelo(100 * r.rtk.fijo / totalRtk, 1)}% (${r.rtk.fijo} de ${totalRtk}; ${r.rtk.sinDato} sin dato)` : '—'],
    ['Modelo del dron', r?.dron?.modelo ?? '—'], ['Serie del dron', r?.dron?.serie ?? '—'],
  ]
  return <section aria-label="Resumen del vuelo" className="space-y-4 rounded-2xl bg-white p-5"><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filas.map(([etiqueta, valor]) => <div key={etiqueta}><dt className="text-xs text-gray-500">{etiqueta}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-800">{valor}</dd></div>)}</dl><p className="text-xs text-gray-500">Altitud absoluta: según el modo puede estar medida sobre el nivel del mar o sobre el elipsoide.</p><ul className="flex flex-wrap gap-2">{TIPOS_ARCHIVO.map(tipo => <li key={tipo} className="rounded-lg bg-green-50 px-3 py-1 text-xs text-agro-green">{ETIQUETAS_TIPO[tipo]}: {r?.porTipo?.[tipo] ?? '—'}</li>)}</ul></section>
}
function BorrarVuelo({ vuelo, cerrar }: { vuelo: Vuelo; cerrar: () => void }) {
  const [nombre, setNombre] = useState('')
  const navegar = useNavigate()
  const cliente = useQueryClient()
  const borrar = useMutation({
    mutationFn: () => vuelosService.borrar(vuelo.id),
    onSuccess: () => {
      cliente.removeQueries({ queryKey: clavesVuelos.detalle(vuelo.id) })
      void cliente.invalidateQueries({ queryKey: clavesVuelos.todas })
      navegar('/vuelos', { replace: true })
    },
  })
  return <ModalVuelo titulo="Borrar vuelo" cerrar={cerrar}><form className="space-y-4" onSubmit={e => { e.preventDefault(); if (nombre === vuelo.nombre && !borrar.isPending) borrar.mutate() }}><p className="text-sm text-red-700">Esta acción borrará el vuelo y todos sus archivos de forma permanente.</p><label className="block text-sm">Escribe el nombre completo para confirmar: <strong>{vuelo.nombre}</strong><input autoFocus required className={`${CAMPO} mt-2`} value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="off" /></label>{borrar.isError && <ErrorVuelo error={borrar.error} />}<button disabled={nombre !== vuelo.nombre || borrar.isPending} className="rounded-xl bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">{borrar.isPending ? 'Borrando…' : 'Borrar definitivamente'}</button></form></ModalVuelo>
}
