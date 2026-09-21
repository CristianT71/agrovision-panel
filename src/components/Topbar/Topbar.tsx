import NotificationsMenu from '../NotificationsMenu/NotificationsMenu'

type TopbarProps = {
  name: string
  role: string
  initials: string
}

export default function Topbar({ name, role, initials }: TopbarProps) {
  return (
    <header className="flex items-center justify-end gap-5 border-b border-gray-100 bg-white px-8 py-3">
      <NotificationsMenu />

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