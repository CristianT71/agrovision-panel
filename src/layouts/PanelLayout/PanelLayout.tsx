import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'
import Topbar from '../../components/Topbar/Topbar'
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary'
import { useCierrePorInactividad } from './useCierrePorInactividad'
import { obtenerSesion, calcularIniciales } from '../../api/auth/session'

export default function PanelLayout() {
  const { pathname: ruta } = useLocation()
  const sesion = obtenerSesion()
  const nombre = sesion?.nombre ?? 'Usuario'
  const esAdmin = sesion?.rol === 'administrador'

  useCierrePorInactividad()

  // Si en otra pestaña se inicia o se cierra sesión con otra cuenta, esta pestaña se recarga
  // para no seguir actuando con un usuario distinto al que muestra la pantalla.
  // El evento "storage" solo llega a las otras pestañas, así que no provoca recargas en bucle.
  useEffect(() => {
    const alCambiar = (e: StorageEvent) => {
      if (e.key === 'agrovision_sesion' || e.key === 'token') window.location.reload()
    }
    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
  }, [])

  return (
    <div className="flex h-screen bg-[#f7faf8]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          name={nombre}
          role={esAdmin ? 'Administrador' : 'Profesional'}
          initials={calcularIniciales(nombre)}
        />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {/* La clave reinicia la animación al cambiar de pantalla, no al cambiar de filtro dentro de ella */}
          {/* El boundary se reinicia al cambiar de ruta: un fallo en una pantalla no bloquea el menú */}
          <ErrorBoundary key={ruta}>
            <Suspense fallback={<p className="py-10 text-center text-sm text-gray-400">Cargando...</p>}>
              <div className="pagina-entra">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}