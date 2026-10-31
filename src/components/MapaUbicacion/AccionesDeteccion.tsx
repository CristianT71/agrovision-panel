import { useState } from 'react'
import { deteccionesService, type DeteccionConUbicacion } from '../../api/detecciones/detecciones.service'
import { mensajeDeError } from '../../api/axios'
import { construirEnlaceGoogleEarth, construirEnlaceGoogleMapsSatelite } from '../../utils/ubicacion'

// Mismos accesos que las solicitudes (Earth, KML, Maps satelital). Una detección no guarda altitud:
// Earth ajusta la cámara con la altitud en 0.
export function AccionesDeteccion({
  deteccion: d,
  compacto = false,
}: {
  deteccion: Pick<DeteccionConUbicacion, 'id' | 'latitud' | 'longitud'>
  compacto?: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const tamano = compacto ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
  const boton = `rounded-lg border border-gray-200 font-medium text-gray-700 transition hover:border-agro-green hover:text-agro-green ${tamano}`

  const descargar = async () => {
    setError(null)
    try {
      await deteccionesService.descargarKml(d.id)
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo descargar el KML.'))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <a
          href={construirEnlaceGoogleEarth(d.latitud, d.longitud, null)}
          target="_blank"
          rel="noopener noreferrer"
          className={boton}
        >
          Abrir en Google Earth
        </a>
        <button type="button" onClick={descargar} className={boton}>
          Descargar KML
        </button>
      </div>
      <a
        href={construirEnlaceGoogleMapsSatelite(d.latitud, d.longitud)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-[11px] text-gray-500 hover:text-agro-green hover:underline"
      >
        ¿No abre Earth? Ver en Google Maps satelital
      </a>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}
