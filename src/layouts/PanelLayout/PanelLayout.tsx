import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Topbar from '../../components/Topbar/Topbar'

export default function PanelLayout() {
  return (
    <div className="flex h-screen bg-[#f7faf8]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar name="Dra. Claudia Ríos" role="Profesional" initials="DC" />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}