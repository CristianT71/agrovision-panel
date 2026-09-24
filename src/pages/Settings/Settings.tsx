import { obtenerSesion } from '../../api/auth/session'
import SettingsAdmin from './SettingsAdmin'
import SettingsAgronomo from './SettingsAgronomo'

export default function Settings() {
  const esAdmin = obtenerSesion()?.rol === 'administrador'
  return esAdmin ? <SettingsAdmin /> : <SettingsAgronomo />
}