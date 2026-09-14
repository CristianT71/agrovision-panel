import { useState } from 'react'
import { NavLink } from 'react-router-dom'

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

// RF-02.2 — accesos exclusivos del rol Profesional
const PROFESIONAL_ITEMS: Item[] = [
  { to: '/solicitudes', label: 'Solicitudes', icon: iconInbox },
  { to: '/catalogo', label: 'Catálogo de plagas', icon: iconBook },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

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
              <p className="text-xs text-gray-400">Agrónomo</p>
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
          {PROFESIONAL_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
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
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
          DC
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden leading-tight">
              <p className="truncate text-xs font-medium text-gray-800">Dra. Claudia...</p>
              <p className="text-[11px] text-gray-400">Profesional</p>
            </div>
            <button type="button" className="text-gray-400 hover:text-gray-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V1a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" transform="scale(0.85) translate(2 2)" />
              </svg>
            </button>
            {/* RF-01.8 — cerrar sesión */}
            <button type="button" className="text-red-400 hover:text-red-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                <path d="M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}