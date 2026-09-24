import { api } from '../axios'
import type { RolApi } from './session'

// El rol evita que el panel cree cuentas: un número desconocido no se registra como productor
export interface SolicitarOtpDto { telefono: string; rolSeleccionado: RolApi }
export interface SolicitarOtpResponse { mensaje: string; esperaSegundos: number }
export interface ValidarOtpDto { telefono: string; codigo: string; rolSeleccionado: RolApi }
export interface AuthResponse { accessToken: string; usuario: { id: string; telefono: string; rol: RolApi } }

export const authService = {
  solicitarOtp: (data: SolicitarOtpDto) =>
    api.post<SolicitarOtpResponse>('/auth/solicitar-otp', data).then((r) => r.data),
  validarOtp: (data: ValidarOtpDto) => api.post<AuthResponse>('/auth/validar-otp', data).then((r) => r.data),
}
