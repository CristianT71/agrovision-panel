// Capas base del mapa. Se configuran por entorno para poder cambiar de proveedor sin tocar el código.
// Son variables VITE_*: viajan al navegador, así que NUNCA deben llevar claves privadas.
// Por defecto: Esri World Imagery (satélite). Revisar sus términos de uso antes de producción.
const SATELITE_POR_DEFECTO = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  atribucion: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
}

const CALLES_POR_DEFECTO = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

export const CAPA_SATELITE = {
  url: import.meta.env.VITE_MAP_TILES_URL || SATELITE_POR_DEFECTO.url,
  atribucion: import.meta.env.VITE_MAP_ATTRIBUTION || SATELITE_POR_DEFECTO.atribucion,
}

export const CAPA_CALLES = {
  url: import.meta.env.VITE_MAP_STREETS_URL || CALLES_POR_DEFECTO.url,
  atribucion: import.meta.env.VITE_MAP_STREETS_ATTRIBUTION || CALLES_POR_DEFECTO.atribucion,
}

// Centro inicial si no hay puntos: Huila, Colombia
export const CENTRO_POR_DEFECTO: [number, number] = [2.5359, -75.5277]

// A partir de aquí se agrupan los marcadores en clústeres
export const UMBRAL_CLUSTER = 200
