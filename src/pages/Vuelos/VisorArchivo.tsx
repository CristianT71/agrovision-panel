import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type ArchivoVuelo } from '../../api/vuelos/vuelos.service'
import { descargarBlob } from '../../api/descargas'
import { mensajeDeError } from '../../api/axios'
import { construirEnlaceGoogleEarth } from '../../utils/ubicacion'
import { altitudVuelo, bytesVuelo, coordenadaVuelo, etiquetaRtk, fechaVuelo, hayNumero, numeroVuelo, requiereMiniatura } from '../../utils/vuelos'
import { BOTON, ErrorVuelo, ModalVuelo } from './ui'
import { useEnlaceArchivo } from './useEnlaceArchivo'

export default function VisorArchivo({ vueloId, archivoId, cerrar }: { vueloId: string; archivoId: string; cerrar: () => void }) {
  const archivo = useQuery({ queryKey: clavesVuelos.archivo(vueloId, archivoId), queryFn: ({ signal }) => vuelosService.obtenerArchivo(vueloId, archivoId, signal), gcTime: 0 })
  const enlace = useEnlaceArchivo(vueloId, archivoId, archivo.isSuccess)
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)
  const [fallos, setFallos] = useState(0)
  const controlador = useRef<AbortController | null>(null)
  useEffect(() => () => controlador.current?.abort(), [])
  const descargar = async () => {
    if (!archivo.data || descargando) return
    setDescargando(true); setErrorDescarga(null)
    controlador.current = new AbortController()
    try {
      // Una URL recién firmada evita empezar una descarga con un token próximo a vencer.
      const firmado = await vuelosService.pedirEnlace(vueloId, archivoId, controlador.current.signal)
      const respuesta = await fetch(firmado.urlContenido, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controlador.current.signal })
      if (!respuesta.ok) throw new Error('descarga')
      const blob = await respuesta.blob()
      if (!controlador.current.signal.aborted) descargarBlob(blob, archivo.data.nombreOriginal)
    } catch (error) {
      if (!controlador.current.signal.aborted) setErrorDescarga(mensajeDeError(error, 'No se pudo descargar. Inténtalo nuevamente para renovar el enlace.'))
    } finally { setDescargando(false) }
  }
  const a = archivo.data
  const refrescar = () => { if (fallos === 0) void enlace.refetch(); setFallos(f => f + 1) }
  const imagen = a && (a.tipo === 'foto_rgb' || a.tipo === 'banda_multiespectral')
  const fuenteImagen = a && requiereMiniatura(a) ? enlace.data?.urlMiniatura : enlace.data?.urlContenido
  return <ModalVuelo titulo={a?.nombreOriginal ?? 'Archivo del vuelo'} cerrar={cerrar}>
    {archivo.isPending ? <p>Cargando archivo…</p> : archivo.isError ? <ErrorVuelo error={archivo.error} reintentar={() => void archivo.refetch()} /> : a && <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex min-h-64 items-center justify-center rounded-xl bg-gray-100">
          {enlace.isPending ? <p>Cargando medio…</p> : enlace.isError ? <ErrorVuelo error={enlace.error} reintentar={() => void enlace.refetch()} /> : fallos >= 2 ? <div className="p-4 text-sm"><p>No se pudo mostrar el medio.</p><button type="button" className={BOTON} onClick={() => { setFallos(0); void enlace.refetch() }}>Renovar enlace</button></div> : a.tipo === 'video' ? <VideoVuelo url={enlace.data?.urlContenido ?? ''} alError={refrescar} /> : imagen && fuenteImagen ? <img src={fuenteImagen} alt={a.nombreOriginal} width={640} height={480} decoding="async" referrerPolicy="no-referrer" className="max-h-[65vh] w-full object-contain" onError={refrescar} /> : <p className="p-6 text-sm text-gray-500">Sin vista previa. Puedes descargar el archivo.</p>}
        </div>
        {requiereMiniatura(a) && <p className="text-xs text-gray-500">Vista previa de TIFF/DNG mediante miniatura; la descarga conserva el original.</p>}
        <div className="flex flex-wrap gap-2">
          {hayNumero(a.ubicacion?.latitud) && hayNumero(a.ubicacion?.longitud) && <a className={BOTON} href={construirEnlaceGoogleEarth(a.ubicacion.latitud, a.ubicacion.longitud, a.ubicacion.altitudAbsolutaM)} target="_blank" rel="noopener noreferrer">Abrir en Google Earth</a>}
          <button type="button" className={BOTON} disabled={descargando} onClick={() => void descargar()}>{descargando ? 'Descargando…' : 'Descargar'}</button>
        </div>
        {errorDescarga && <p role="alert" className="text-sm text-red-700">{errorDescarga}</p>}
      </div>
      <DatosArchivo archivo={a} />
      <details className="min-w-0 lg:col-span-2"><summary className="cursor-pointer text-sm font-medium text-agro-green">Metadatos crudos</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-gray-50 p-4 text-xs">{JSON.stringify(archivo.data.metadatosCrudos, null, 2)}</pre></details>
    </div>}
  </ModalVuelo>
}

function VideoVuelo({ url, alError }: { url: string; alError: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const estado = useRef({ tiempo: 0, reproduciendo: false })
  // Al renovar el token se reemplaza el elemento y se conserva la posición del
  // anterior antes de que el navegador reinicie sus eventos de reproducción.
  const asignarVideo = useCallback((elemento: HTMLVideoElement | null) => {
    if (!elemento && video.current) {
      estado.current = { tiempo: video.current.currentTime, reproduciendo: !video.current.paused }
    }
    video.current = elemento
  }, [])
  return (
    <video
      key={url}
      ref={asignarVideo}
      src={url}
      controls
      preload="metadata"
      playsInline
      className="max-h-[65vh] w-full"
      onError={alError}
      onLoadedMetadata={() => {
        if (!video.current) return
        video.current.currentTime = Math.min(estado.current.tiempo, video.current.duration || 0)
        if (estado.current.reproduciendo) void video.current.play().catch(() => {})
      }}
    />
  )
}
function DatosArchivo({ archivo: a }: { archivo: ArchivoVuelo }) {
  const u = a.ubicacion, gps = a.gps, c = a.camara, o = a.orientacion, m = a.multiespectral
  const grados = (v: number | null | undefined) => hayNumero(v) ? `${numeroVuelo(v)}°` : '—'
  const filas: [string, string | number | null | undefined][] = [
    ['Hora (Colombia)', fechaVuelo(a.capturadoEn)], ['Tamaño', bytesVuelo(a.tamanoBytes)],
    ['Latitud', coordenadaVuelo(u?.latitud)], ['Longitud', coordenadaVuelo(u?.longitud)],
    ['Altitud absoluta (m)', altitudVuelo(u?.altitudAbsolutaM)], ['Tipo de altitud', u?.tipoAltitud], ['Altura relativa', altitudVuelo(u?.alturaRelativaM)],
    ['Estado GPS', gps?.estado], ['RTK', etiquetaRtk(gps)], ['Indicador RTK', gps?.rtkFlag],
    ['Desviación longitud', altitudVuelo(gps?.desviacion?.longitud, 4)], ['Desviación latitud', altitudVuelo(gps?.desviacion?.latitud, 4)], ['Desviación altura', altitudVuelo(gps?.desviacion?.altura, 4)],
    ['Cámara · marca', c?.marca], ['Cámara · modelo', c?.modelo], ['Exposición (s)', c?.exposicionS], ['ISO', c?.iso], ['Distancia focal (mm)', c?.distanciaFocalMm], ['Ancho (px)', c?.ancho], ['Alto (px)', c?.alto], ['Serie del dron', a.dron?.serie],
    ['Gimbal · roll', grados(o?.gimbalRollGrados)], ['Gimbal · pitch', grados(o?.gimbalPitchGrados)], ['Gimbal · yaw', grados(o?.gimbalYawGrados)],
    ['Vuelo · roll', grados(o?.vueloRollGrados)], ['Vuelo · pitch', grados(o?.vueloPitchGrados)], ['Vuelo · yaw', grados(o?.vueloYawGrados)],
    ...(a.tipo === 'banda_multiespectral' ? [['Banda', a.banda], ['Irradiancia', m?.irradiancia], ['Ganancia', m?.ganancia], ['Nivel negro', m?.nivelNegro], ['Frecuencia de banda', m?.frecuenciaBanda]] as [string, string | number | null | undefined][] : []),
  ]
  return <div className="min-w-0"><p className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Altitud absoluta: según el modo puede estar medida sobre el nivel del mar o sobre el elipsoide.</p><dl className="divide-y divide-gray-100 text-sm">{filas.map(([etiqueta, valor]) => <div key={etiqueta} className="grid grid-cols-2 gap-3 py-2"><dt className="text-gray-500">{etiqueta}</dt><dd className="break-words font-medium text-gray-800">{valor ?? '—'}</dd></div>)}</dl></div>
}
