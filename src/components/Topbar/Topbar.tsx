type TopbarProps = {
  name: string
  role: string
  initials: string
  hasNotifications?: boolean
}

export default function Topbar({ name, role, initials, hasNotifications = false }: TopbarProps) {
  return (
    <header className="flex items-center justify-end gap-5 border-b border-gray-100 bg-white px-8 py-4">
      {/* RF-02.5 — notificaciones */}
      <button type="button" className="relative text-gray-400 hover:text-gray-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
        </svg>
        {hasNotifications && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </header>
  )
}