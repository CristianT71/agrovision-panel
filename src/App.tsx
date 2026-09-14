import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import RequestAccess from './pages/RequestAccess/RequestAccess'
import VerifyOtp from './pages/VerifyOtp/VerifyOtp'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/solicitar-acceso" element={<RequestAccess />} />
        <Route path="/verificar" element={<VerifyOtp/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App