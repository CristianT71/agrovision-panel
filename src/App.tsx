import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import PanelLayout from './layouts/PanelLayout/PanelLayout'
import RequestsInbox from './pages/RequestsInbox/RequestsInbox'
import RequestDetail from './pages/RequestDetail/RequestDetail'
import PestCatalog from './pages/PestCatalog/PestCatalog'

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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App