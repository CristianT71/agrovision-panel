import { api } from "../axios";

export interface SolicitarOtpDto { telefono: string }
export interface ValidarOtpDto { telefono: string; codigo: string; rolSeleccionado: 'admin'|'agronomo'|'productor' }
export interface AuthResponse { accessToken: string; usuario: { id: string; telefono: string; rol: string } }

export const authService = {
  solicitarOtp: (data: SolicitarOtpDto) => api.post("/auth/solicitar-otp", data).then(r => r.data),
  validarOtp: (data: ValidarOtpDto) => api.post<AuthResponse>("/auth/validar-otp", data).then(r => r.data),
};