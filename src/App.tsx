import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import PanelLayout from './layouts/PanelLayout/PanelLayout'
import RequestsInbox from './pages/RequestsInbox/RequestsInbox'
import RequestDetail from './pages/RequestDetail/RequestDetail'
import PestCatalog from './pages/PestCatalog/PestCatalog'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import Dashboard from './pages/Dashboard/Dashboard'
import CasesInbox from './pages/CasesInbox/CasesInbox'
import AiModels from './pages/AiModels/AiModels'
import Accounts from './pages/Accounts/Accounts'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/solicitar-acceso" element={<RequestAccess />} />

        <Route element={<PanelLayout />}>
          <Route path="/solicitudes" element={<RequestsInbox />} />
          <Route path="/solicitudes/:id" element={<RequestDetail />} />
          <Route path='/catalogo' element={<PestCatalog/>} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/casos" element={<CasesInbox />} />
          <Route path="/modelos" element={<AiModels />} />
          <Route path="/cuentas" element={<Accounts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App