import { lazy as lazyReact, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import PanelLayout from './layouts/PanelLayout/PanelLayout'
import RutaProtegida from './layouts/RutaProtegida/RutaProtegida'
import { obtenerSesion, rutaInicial } from './api/auth/session'

// Cada pantalla del panel se descarga al entrar (RNF-03.2/03.3). Si tras un despliegue el archivo viejo
// ya no existe, se recarga la página una vez para tomar la versión nueva.
function lazy<T extends ComponentType<object>>(cargar: () => Promise<{ default: T }>) {
  return lazyReact(() =>
    cargar().catch((error: unknown) => {
      const clave = 'agrovision_recarga_chunk'
      if (sessionStorage.getItem(clave) !== '1') {
        sessionStorage.setItem(clave, '1')
        window.location.reload()
        return new Promise<never>(() => {})
      }
      sessionStorage.removeItem(clave)
      throw error
    }),
  )
}

const RequestsInbox = lazy(() => import('./pages/RequestsInbox/RequestsInbox'))
const RequestDetail = lazy(() => import('./pages/RequestDetail/RequestDetail'))
const PestCatalog = lazy(() => import('./pages/PestCatalog/PestCatalog'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const CasesInbox = lazy(() => import('./pages/CasesInbox/CasesInbox'))
const AiModels = lazy(() => import('./pages/AiModels/AiModels'))
const Accounts = lazy(() => import('./pages/Accounts/Accounts'))
const DetectionsMonitor = lazy(() => import('./pages/DetectionsMonitor/DetectionsMonitor'))
const CasesMap = lazy(() => import('./pages/CasesMap/CasesMap'))
const Vuelos = lazyReact(() => import('./pages/Vuelos/Vuelos'))
const VueloDetalle = lazyReact(() => import('./pages/Vuelos/VueloDetalle'))

function Inicio() {
  const sesion = obtenerSesion()
  return <Navigate to={sesion ? rutaInicial(sesion.rol) : '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />

        <Route path="/login" element={<Login />} />
        <Route path="/solicitar-acceso" element={<RequestAccess />} />

        <Route element={<RutaProtegida />}>
          <Route element={<PanelLayout />}>
            {/* RF-02.2 — módulos del Profesional */}
            <Route element={<RutaProtegida rol="profesional" />}>
              <Route path="/solicitudes" element={<RequestsInbox />} />
              <Route path="/solicitudes/:id" element={<RequestDetail />} />
              <Route path="/catalogo" element={<PestCatalog />} />
            </Route>

            {/* RF-02.3 — módulos del Administrador */}
            <Route element={<RutaProtegida rol="administrador" />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/casos" element={<CasesInbox />} />
              <Route path="/modelos" element={<AiModels />} />
              <Route path="/cuentas" element={<Accounts />} />
              <Route path="/detecciones" element={<DetectionsMonitor />} />
              <Route path="/mapa" element={<CasesMap />} />
              <Route path="/vuelos" element={<Vuelos />} />
              <Route path="/vuelos/:id" element={<VueloDetalle />} />
            </Route>

            {/* RF-02.4 — comunes a ambos roles */}
            <Route path="/perfil" element={<Profile />} />
            <Route path="/ajustes" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
