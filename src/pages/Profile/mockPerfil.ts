export type Perfil = {
  nombre: string
  telefono: string
  correo: string
  tarjetaProfesional: string
  especialidad: string
}

export type Acceso = {
  otpActiva: boolean
  ultimoAcceso: string
  ubicacion: string
}


export const PERFIL: Perfil = {
  nombre: 'Dra. Claudia Ríos',
  telefono: '+57 312 441 7780',
  correo: 'claudia.rios@agrovision.co',
  tarjetaProfesional: 'TP-098712',
  especialidad: 'Fitopatología y plagas café',
}

export const ACCESO: Acceso = {
  otpActiva: true,
  ultimoAcceso: 'Hoy, 8:42 a.m.',
  ubicacion: 'Medellín, Colombia',
}