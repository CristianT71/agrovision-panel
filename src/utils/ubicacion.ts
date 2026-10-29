// Formatos y enlaces externos de una ubicación. Funciones puras: se prueban en ubicacion.test.ts

// Distancia de la cámara en Google Earth, en metros
const DISTANCIA_CAMARA_M = 1500

export function formatearCoordenada(valor: number): string {
  return valor.toFixed(6)
}

export function formatearAltitud(altitudMsnm: number | null | undefined): string {
  return typeof altitudMsnm === 'number' && Number.isFinite(altitudMsnm)
    ? `${Math.round(altitudMsnm)} msnm`
    : 'n/d'
}

export function formatearPrecision(precisionMetros: number | null | undefined): string {
  return typeof precisionMetros === 'number' && Number.isFinite(precisionMetros)
    ? `±${Math.round(precisionMetros)} m`
    : 'n/d'
}

// Sin altitud se usa 0 (la vista sigue sirviendo: Earth ajusta la cámara con 1500d)
export function construirEnlaceGoogleEarth(lat: number, lng: number, altitudMsnm: number | null | undefined): string {
  const altitud = typeof altitudMsnm === 'number' && Number.isFinite(altitudMsnm) ? Math.round(altitudMsnm) : 0
  return `https://earth.google.com/web/@${formatearCoordenada(lat)},${formatearCoordenada(lng)},${altitud}a,${DISTANCIA_CAMARA_M}d,35y,0h,0t,0r`
}

// Respaldo si Earth no abre: vista satelital de Google Maps
export function construirEnlaceGoogleMapsSatelite(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${formatearCoordenada(lat)},${formatearCoordenada(lng)}&zoom=18&basemap=satellite`
}
