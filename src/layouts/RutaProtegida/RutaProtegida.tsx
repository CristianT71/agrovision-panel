import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { obtenerSesion, rutaInicial, type Rol } from '../../api/auth/session'

type Props = {
  // Sin rol: basta con tener sesión (perfil, ajustes)
  rol?: Rol
}

// RF-02.1 — cada módulo solo es accesible para su rol; sin sesión vigente se vuelve al login
export default function RutaProtegida({ rol }: Props) {
  const location = useLocation()
  const sesion = obtenerSesion()

  if (!sesion) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  }

  if (rol && sesion.rol !== rol) {
    return <Navigate to={rutaInicial(sesion.rol)} replace />
  }

  return <Outlet />
}
