export type Rol = 'profesional' | 'administrador'

export type Sesion = {
  rol: Rol
  nombre: string
  iniciales: string
  telefono: string
}

const CLAVE = 'agrovision_sesion'

export function guardarSesion(sesion: Sesion) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion))
}

export function obtenerSesion(): Sesion | null {
  const raw = localStorage.getItem(CLAVE)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Sesion
  } catch {
    return null
  }
}

// RF-01.8 — invalidar sesión y purgar datos locales
export function cerrarSesion() {
  localStorage.removeItem(CLAVE)
  localStorage.removeItem('token')
}

// RF-01.7 — módulo principal según el nivel de acceso
export function rutaInicial(rol: Rol): string {
  return rol === 'administrador' ? '/dashboard' : '/solicitudes'
}

// Títulos que no cuentan para las iniciales
const TITULOS = ['dr', 'dra', 'ing', 'lic', 'esp', 'msc', 'phd']

// "Dra. Claudia Ríos" -> "CR"
export function calcularIniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !TITULOS.includes(p.replace(/\./g, '').toLowerCase()))

  return palabras
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}