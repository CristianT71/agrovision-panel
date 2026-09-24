import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import PanelLayout from './layouts/PanelLayout/PanelLayout'
import RutaProtegida from './layouts/RutaProtegida/RutaProtegida'
import RequestsInbox from './pages/RequestsInbox/RequestsInbox'
import RequestDetail from './pages/RequestDetail/RequestDetail'
import PestCatalog from './pages/PestCatalog/PestCatalog'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'
import CasesInbox from './pages/CasesInbox/CasesInbox'
import AiModels from './pages/AiModels/AiModels'
import Accounts from './pages/Accounts/Accounts'
import { obtenerSesion, rutaInicial } from './api/auth/session'

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
