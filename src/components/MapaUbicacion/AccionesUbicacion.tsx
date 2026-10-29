import { useState } from 'react'
import { ubicacionService, type UbicacionCaptura } from '../../api/ubicacion/ubicacion.service'
import { mensajeDeError } from '../../api/axios'
import {
  construirEnlaceGoogleEarth,
  construirEnlaceGoogleMapsSatelite,
  formatearAltitud,
  formatearCoordenada,
  formatearPrecision,
} from '../../utils/ubicacion'

// Coordenadas, altitud, precisión y aviso de ubicación simulada (popup y tarjeta del detalle)
export function ResumenCoordenadas({ ubicacion: u }: { ubicacion: UbicacionCaptura }) {
  return (
    <div className="space-y-0.5">
      <p>
        Lat {formatearCoordenada(u.latitud)} · Lng {formatearCoordenada(u.longitud)}
      </p>
      <p>
        Altitud: {formatearAltitud(u.altitudMsnm)} · Precisión: {formatearPrecision(u.precisionMetros)}
      </p>
      {u.simulada && (
        <p className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700">Ubicación simulada</p>
      )}
    </div>
  )
}

// Google Earth y Maps se abren en pestaña nueva (no se embeben); el KML se pide con el token
export function AccionesUbicacion({
  ubicacion: u,
  onVerCaso,
  compacto = false,
}: {
  ubicacion: UbicacionCaptura
  onVerCaso?: (id: string) => void
  compacto?: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const tamano = compacto ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
  const boton = `rounded-lg border border-gray-200 font-medium text-gray-700 transition hover:border-agro-green hover:text-agro-green ${tamano}`

  const descargar = async () => {
    setError(null)
    try {
      await ubicacionService.descargarKml(u.solicitudId)
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo descargar el KML.'))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {onVerCaso && (
          <button type="button" onClick={() => onVerCaso(u.solicitudId)} className={boton}>
            Ver caso
          </button>
        )}
        <a
          href={construirEnlaceGoogleEarth(u.latitud, u.longitud, u.altitudMsnm)}
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
        href={construirEnlaceGoogleMapsSatelite(u.latitud, u.longitud)}
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
