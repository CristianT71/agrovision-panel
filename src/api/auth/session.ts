export type Rol = 'profesional' | 'administrador'

// Rol tal como lo guarda la API
export type RolApi = 'admin' | 'agronomo' | 'productor'

export type Sesion = {
  rol: Rol
  nombre: string
  iniciales: string
  telefono: string
}

const CLAVE = 'agrovision_sesion'
const CLAVE_TOKEN = 'token'

export function guardarSesion(sesion: Sesion, token: string) {
  localStorage.setItem(CLAVE, JSON.stringify(sesion))
  localStorage.setItem(CLAVE_TOKEN, token)
}

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

// Lee la fecha de vencimiento (exp) del JWT sin validarlo: la firma la valida la API
function tokenVencido(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

// Devuelve la sesión solo si hay un token vigente; si venció, limpia los datos locales
export function obtenerSesion(): Sesion | null {
  const raw = localStorage.getItem(CLAVE)
  const token = obtenerToken()
  if (!raw || !token) return null

  if (tokenVencido(token)) {
    cerrarSesion()
    return null
  }

  try {
    return JSON.parse(raw) as Sesion
  } catch {
    return null
  }
}

// RF-01.8 — invalidar sesión y purgar datos locales
export function cerrarSesion() {
  localStorage.removeItem(CLAVE)
  localStorage.removeItem(CLAVE_TOKEN)
}

// El panel solo lo usan agrónomos (Profesional) y administradores
export function rolDesdeApi(rol: string): Rol | null {
  if (rol === 'agronomo') return 'profesional'
  if (rol === 'admin') return 'administrador'
  return null
}

export function rolParaApi(rol: Rol): RolApi {
  return rol === 'profesional' ? 'agronomo' : 'admin'
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
