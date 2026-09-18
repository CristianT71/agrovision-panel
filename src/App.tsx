import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import PanelLayout from './layouts/PanelLayout/PanelLayout'
import RequestsInbox from './pages/RequestsInbox/RequestsInbox'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* TEMPORAL: apuntando al panel para desarrollo. Volver a "/login" al terminar. */}
        <Route path="/" element={<Navigate to="login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/solicitar-acceso" element={<RequestAccess />} />

        <Route element={<PanelLayout />}>
          <Route path="/solicitudes" element={<RequestsInbox />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App