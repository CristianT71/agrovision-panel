import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { CAPA_SATELITE, CENTRO_POR_DEFECTO } from '../../components/MapaUbicacion/config'
import type { PuntoTraza, TipoArchivo, TrazaVuelo } from '../../api/vuelos/vuelos.service'
import { ETIQUETAS_TIPO, TIPOS_ARCHIVO } from '../../utils/vuelos'

const COLORES: Record<TipoArchivo, string> = { foto_rgb: '#16a34a', banda_multiespectral: '#9333ea', video: '#2563eb', srt: '#ea580c', otro: '#64748b' }
const esPunto = (feature: TrazaVuelo['features'][number]): feature is PuntoTraza => feature.geometry.type === 'Point'
const valido = (coordenadas: number[]) => Number.isFinite(coordenadas[0]) && Number.isFinite(coordenadas[1]) && Math.abs(coordenadas[0]) <= 180 && Math.abs(coordenadas[1]) <= 90
const latLng = (coordenadas: number[]): LatLngTuple => [coordenadas[1], coordenadas[0]]

export default function MapaVuelo({ traza, seleccionado, seleccionar }: { traza: TrazaVuelo; seleccionado: string | null; seleccionar: (id: string) => void }) {
  const puntos = useMemo(() => traza.features.filter(esPunto).filter(p => valido(p.geometry.coordinates)), [traza])
  const rutas = useMemo(() => traza.features.flatMap(f => f.geometry.type === 'LineString' ? [f.geometry.coordinates.filter(valido).map(latLng)] : []), [traza])
  const posiciones = useMemo(() => puntos.map(p => latLng(p.geometry.coordinates)), [puntos])
  return <section aria-label="Mapa de la traza" className="space-y-3 rounded-2xl bg-white p-4">
    <h2 className="text-lg font-semibold">Traza del vuelo</h2>
    {traza.truncado && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Traza truncada: el servidor limitó la ruta a 2000 puntos. No se muestran todas las capturas.</p>}
    {!puntos.length && <p className="text-sm text-gray-500">Este vuelo todavía no tiene archivos con ubicación.</p>}
    <MapContainer center={CENTRO_POR_DEFECTO} zoom={8} className="relative z-0 h-96 w-full rounded-xl" scrollWheelZoom>
      <TileLayer url={CAPA_SATELITE.url} attribution={CAPA_SATELITE.atribucion} maxZoom={19} />
      <Ajustar posiciones={posiciones} />
      {rutas.map((ruta, i) => <Polyline key={i} positions={ruta} pathOptions={{ color: '#f8fafc', weight: 3 }} />)}
      {puntos.map(p => <CircleMarker key={p.properties.archivoId} center={latLng(p.geometry.coordinates)} radius={seleccionado === p.properties.archivoId ? 9 : 5} pathOptions={{ color: seleccionado === p.properties.archivoId ? '#facc15' : COLORES[p.properties.tipo], fillColor: COLORES[p.properties.tipo], fillOpacity: 0.9, weight: 2 }} eventHandlers={{ click: () => seleccionar(p.properties.archivoId) }}>
        <Tooltip>{ETIQUETAS_TIPO[p.properties.tipo]}{p.properties.banda && ` · ${p.properties.banda}`}</Tooltip>
      </CircleMarker>)}
    </MapContainer>
    <ul className="flex flex-wrap gap-4 text-xs text-gray-600">{TIPOS_ARCHIVO.map(tipo => <li key={tipo} className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORES[tipo] }} />{ETIQUETAS_TIPO[tipo]}</li>)}</ul>
  </section>
}
function Ajustar({ posiciones }: { posiciones: LatLngTuple[] }) {
  const mapa = useMap()
  useEffect(() => {
    if (posiciones.length === 1) mapa.setView(posiciones[0], 18)
    else if (posiciones.length > 1) mapa.fitBounds(posiciones, { padding: [24, 24], maxZoom: 18 })
  }, [mapa, posiciones])
  return null
}
