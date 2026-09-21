import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { obtenerSesion, cerrarSesion, calcularIniciales, type Rol } from '../../auth/session'

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
  { to: '/cuentas', label: 'Cuentas', icon: iconUsers },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  const sesion = obtenerSesion()
  const rol: Rol = sesion?.rol ?? 'profesional'
  const esAdmin = rol === 'administrador'
  const items = esAdmin ? ITEMS_ADMIN : ITEMS_PROFESIONAL

  const nombre = sesion?.nombre ?? 'Usuario'

  // RF-01.8 — invalidar sesión y purgar datos locales
  const salir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f3ec] text-agro-green">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 4c0 9-6 13-12 13 0-7 5-11 12-13Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20c1-4 4-7 8-9" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900">AgroVisión</p>
              <p className="text-xs text-gray-400">{esAdmin ? 'Administrador' : 'Agrónomo'}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Módulos
          </p>
        )}
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-[#eaf4ee] font-medium text-agro-green'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pie: perfil, ajustes, salir — RF-02.4 */}
      <div
        className={`flex items-center gap-1 border-t border-gray-100 px-3 py-3 ${
          collapsed ? 'flex-col' : ''
        }`}
      >
        {/* Perfil */}
        <NavLink
          to="/perfil"
          title="Mi perfil"
          className={({ isActive }) =>
            `flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-[#eaf4ee] ${
              isActive ? 'bg-[#eaf4ee]' : ''
            } ${collapsed ? '' : 'flex-1'}`
          }
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
            {calcularIniciales(nombre)}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-gray-800">{nombre}</p>
              <p className="text-[11px] text-gray-400">{esAdmin ? 'Administrador' : 'Profesional'}</p>
            </div>
          )}
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
              d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
              strokeLinecap="round"
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