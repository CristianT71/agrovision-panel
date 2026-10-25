import { useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '../../api/auth/auth.service'
import { obtenerSesion, obtenerToken, cerrarSesion, calcularIniciales, type Rol } from '../../api/auth/session'

type Item = { to: string; label: string; icon: React.ReactNode }

const iconInbox = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <path d="M3 12h4l2 3h6l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2-7Z" strokeLinejoin="round" />
  </svg>
)

const iconBook = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2V5Z" strokeLinejoin="round" />
    <path d="M20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2V5Z" strokeLinejoin="round" />
  </svg>
)

const iconChart = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 15l4-5 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const iconChip = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" strokeLinecap="round" />
  </svg>
)

const iconUsers = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
    <path d="M16 5a3 3 0 0 1 0 6M17 14.8c2.4.5 4 2.5 4 5.2" strokeLinecap="round" />
  </svg>
)

const iconRadar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 12l6-6" strokeLinecap="round" />
  </svg>
)

// RF-02.2 — accesos exclusivos del rol Profesional
const ITEMS_PROFESIONAL: Item[] = [
  { to: '/solicitudes', label: 'Solicitudes', icon: iconInbox },
  { to: '/catalogo', label: 'Catálogo de plagas', icon: iconBook },
]

// RF-02.3 — accesos exclusivos del rol Administrador
const ITEMS_ADMIN: Item[] = [
  { to: '/dashboard', label: 'Dashboard', icon: iconChart },
  { to: '/casos', label: 'Bandeja de casos', icon: iconInbox },
  { to: '/modelos', label: 'Modelos IA', icon: iconChip },
  { to: '/detecciones', label: 'Monitor de detecciones', icon: iconRadar },
  { to: '/cuentas', label: 'Cuentas', icon: iconUsers },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  // El pie pasa de columna a fila. Si lo hiciera al instante, al expandir los tres elementos se amontonarían en el
  // ancho que aún no llegó: se pone en fila cuando el menú ya terminó de abrirse y se apila en cuanto empieza a cerrarse
  const [pieEnFila, setPieEnFila] = useState(true)
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const alternarMenu = () => {
    clearTimeout(temporizador.current)
    if (collapsed) {
      setCollapsed(false)
      temporizador.current = setTimeout(() => setPieEnFila(true), 260)
    } else {
      setPieEnFila(false)
      setCollapsed(true)
    }
  }
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const sesion = obtenerSesion()
  const rol: Rol = sesion?.rol ?? 'profesional'
  const esAdmin = rol === 'administrador'
  const items = esAdmin ? ITEMS_ADMIN : ITEMS_PROFESIONAL

  const nombre = sesion?.nombre ?? 'Usuario'

  // RF-01.8 — invalidar sesión y purgar datos locales
  const salir = () => {
    // Se avisa a la API sin esperar la respuesta: si falla (sin red), la sesión igual vence por inactividad.
    // El token se lee antes de borrarlo: axios arma la petición un instante después.
    const token = obtenerToken()
    if (token) authService.cerrarSesion(token).catch(() => {})
    cerrarSesion()
    // Los datos en caché son del usuario que sale: no deben verse en la siguiente sesión
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      // Solo se anima el ancho. Lo de adentro no cambia de estructura entre un estado y otro: los textos se
      // desvanecen y se recortan en lugar de aparecer y desaparecer, por eso la transición se ve continua
      className={`relative flex h-screen flex-col border-r border-gray-100 bg-white transition-[width] duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Encabezado: con 80 px de ancho y px-5 queda justo el logo de 40 px */}
      <div className="flex items-center px-5 py-5">
        <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-agro-green">
            <img src="/logo-agrovision-blanco.png" alt="AgroVisión" className="h-7 w-7 object-contain" />
          </div>
          <div
            className={`whitespace-nowrap leading-tight transition-opacity duration-200 ${
              collapsed ? 'opacity-0' : 'opacity-100 delay-100'
            }`}
          >
            <p className="text-sm font-bold text-gray-900">AgroVisión</p>
            <p className="text-xs text-gray-400">{esAdmin ? 'Administrador' : 'Agrónomo'}</p>
          </div>
        </div>
        {/* Siempre en el borde derecho: al contraer se vuelve un círculo y al expandir se queda plano */}
        <button
          type="button"
          onClick={alternarMenu}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className={`absolute top-7 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-gray-400 transition-all duration-300 ease-in-out hover:text-agro-green ${
            collapsed
              ? '-right-3 border-gray-200 bg-white shadow-sm'
              : 'right-3 border-transparent bg-transparent shadow-none'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Navegación: con px-[18px] el módulo mide 44 px colapsado y el icono queda en el centro del menú */}
      <nav className="flex-1 px-[18px]">
        <p
          className={`overflow-hidden whitespace-nowrap px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 transition-all duration-300 ${
            collapsed ? 'h-0 pb-0 opacity-0' : 'h-6 opacity-100'
          }`}
        >
          Módulos
        </p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex h-11 items-center overflow-hidden whitespace-nowrap rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-[#eaf4ee] font-medium text-agro-green' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center">{item.icon}</span>
                <span className={`pr-3 transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100 delay-100'}`}>
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pie: perfil, ajustes, salir — RF-02.4. El icono queda siempre a 22 px del borde: centrado con el menú
          colapsado y en el mismo sitio al abrirlo, así no se desplaza de lado al cambiar de estado */}
      <div
        className={`flex border-t border-gray-100 py-3 pl-[22px] ${
          pieEnFila ? 'items-center gap-1 pr-3' : 'flex-col items-start gap-1 pb-4'
        }`}
      >
        {/* Perfil */}
        <NavLink
          to="/perfil"
          title="Mi perfil"
          className={({ isActive }) =>
            `flex min-w-0 items-center rounded-xl py-1 text-left transition-colors hover:bg-[#eaf4ee] ${
              isActive ? 'bg-[#eaf4ee]' : ''
            } ${pieEnFila ? 'flex-1 pr-2' : ''}`
          }
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
            {calcularIniciales(nombre)}
          </div>
          <div
            className={`min-w-0 overflow-hidden leading-tight transition-all duration-200 ${
              pieEnFila ? 'ml-2.5 max-w-full opacity-100' : 'ml-0 max-w-0 opacity-0'
            }`}
          >
            <p className="truncate text-xs font-semibold text-gray-800">{nombre}</p>
            <p className="text-[11px] text-gray-400">{esAdmin ? 'Administrador' : 'Profesional'}</p>
          </div>
        </NavLink>

        {/* Ajustes */}
        <NavLink
          to="/ajustes"
          title="Ajustes"
          className={({ isActive }) =>
            `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition hover:bg-[#eaf4ee] hover:text-gray-700 ${
              isActive ? 'bg-[#eaf4ee] text-agro-green' : 'text-gray-400'
            }`
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </NavLink>

        {/* Cerrar sesión — RF-01.8 */}
        <button
          type="button"
          title="Cerrar sesión"
          onClick={salir}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <path d="M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  )
}