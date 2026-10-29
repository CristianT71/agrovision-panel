import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Circle, LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import { codigoSolicitud, type EstadoSolicitud } from '../../api/solicitudes/solicitudes.service'
import type { UbicacionCaptura } from '../../api/ubicacion/ubicacion.service'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import { AccionesUbicacion, ResumenCoordenadas } from './AccionesUbicacion'
import { CAPA_CALLES, CAPA_SATELITE, CENTRO_POR_DEFECTO, UMBRAL_CLUSTER } from './config'

// Mismos tonos que las insignias de StatusBadge (gris, azul, ámbar, verde, rojo)
const COLOR_ESTADO: Record<EstadoSolicitud, string> = {
  Pendiente: '#6b7280',
  Enviada: '#1d4ed8',
  Asignada: '#b45309',
  Resuelta: '#15803d',
  Descartada: '#dc2626',
}

function iconoDeEstado(estado: EstadoSolicitud) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${COLOR_ESTADO[estado]};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  })
}

type Props = {
  puntos: UbicacionCaptura[]
  // Clases de tamaño del contenedor (el mapa necesita una altura explícita)
  className?: string
  // Sin esta función no se muestra el botón "Ver caso"
  onVerCaso?: (solicitudId: string) => void
  // Zoom cuando hay un solo punto (detalle de una solicitud)
  zoomPunto?: number
}

export default function MapaUbicacion({ puntos, className = 'h-[28rem] w-full', onVerCaso, zoomPunto = 16 }: Props) {
  const agrupar = puntos.length > UMBRAL_CLUSTER
  const marcadores = puntos.map((p) => (
    <Marker key={p.solicitudId} position={[p.latitud, p.longitud]} icon={iconoDeEstado(p.estado)}>
      <Popup minWidth={230}>
        <PopupCaso punto={p} onVerCaso={onVerCaso} />
      </Popup>
    </Marker>
  ))

  return (
    <MapContainer
      center={CENTRO_POR_DEFECTO}
      zoom={8}
      scrollWheelZoom
      className={`${className} z-0 overflow-hidden rounded-xl`}
    >
      <AjustarVista puntos={puntos} zoomPunto={zoomPunto} />

      {/* La atribución de la capa activa se muestra siempre (control de Leaflet, esquina inferior derecha) */}
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satélite">
          <TileLayer url={CAPA_SATELITE.url} attribution={CAPA_SATELITE.atribucion} maxZoom={19} />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Calles">
          <TileLayer url={CAPA_CALLES.url} attribution={CAPA_CALLES.atribucion} maxZoom={19} />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* Círculo del error del GPS: solo cuando la app lo reportó */}
      {puntos.map(
        (p) =>
          p.precisionMetros != null &&
          p.precisionMetros > 0 && (
            <Circle
              key={`precision-${p.solicitudId}`}
              center={[p.latitud, p.longitud]}
              radius={p.precisionMetros}
              pathOptions={{ color: COLOR_ESTADO[p.estado], weight: 1, fillOpacity: 0.12 }}
            />
          ),
      )}

      {agrupar ? <MarkerClusterGroup chunkedLoading>{marcadores}</MarkerClusterGroup> : marcadores}
    </MapContainer>
  )
}

// Encuadra todos los puntos (o se acerca al único). Solo se recalcula cuando cambia el conjunto de puntos.
function AjustarVista({ puntos, zoomPunto }: { puntos: UbicacionCaptura[]; zoomPunto: number }) {
  const mapa = useMap()
  const clave = useMemo(() => puntos.map((p) => p.solicitudId).join('|'), [puntos])

  useEffect(() => {
    if (puntos.length === 0) return
    if (puntos.length === 1) {
      mapa.setView([puntos[0].latitud, puntos[0].longitud], zoomPunto)
      return
    }
    mapa.fitBounds(L.latLngBounds(puntos.map((p) => [p.latitud, p.longitud] as [number, number])), {
      padding: [32, 32],
      maxZoom: 15,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- "clave" ya resume el contenido de puntos
  }, [mapa, clave, zoomPunto])

  return null
}

function PopupCaso({ punto: p, onVerCaso }: { punto: UbicacionCaptura; onVerCaso?: (id: string) => void }) {
  return (
    <div className="space-y-2 text-xs text-gray-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-semibold text-gray-900">{codigoSolicitud(p.solicitudId)}</span>
        <StatusBadge estado={p.estado} />
      </div>
      <p>
        {p.vereda} · {p.municipio}
      </p>
      <ResumenCoordenadas ubicacion={p} />
      <AccionesUbicacion ubicacion={p} onVerCaso={onVerCaso} compacto />
    </div>
  )
}
