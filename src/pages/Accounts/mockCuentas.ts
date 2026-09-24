export type EstadoProductor = 'Validado' | 'Registrado' | 'Suspendido'
export type EstadoAgronomo = 'Activo' | 'Validación pendiente' | 'Inactivo'

export type Productor = {
  id: string
  nombre: string
  finca: string
  vereda: string
  municipio: string
  telefono: string
  estado: EstadoProductor
  consentimiento: boolean // RF-10.2 — tratamiento de datos fotográficos
  registro: string
}

export type AgronomoCuenta = {
  id: string
  nombre: string
  iniciales: string
  especialidad: string
  tarjeta: string
  telefono: string
  estado: EstadoAgronomo
  acreditacion: string | null // RF-10.4 — binario de acreditación documental
  registro: string
  casosResueltos: number
}

// RF-10.1 — identidades originadoras
export const PRODUCTORES: Productor[] = [
  {
    id: 'p1',
    nombre: 'Carlos Arango Ríos',
    finca: 'La Esperanza',
    vereda: 'Vereda El Cedro',
    municipio: 'Jardín, Antioquia',
    telefono: '+57 311 452 8801',
    estado: 'Validado',
    consentimiento: true,
    registro: '2024-03-12',
  },
  {
    id: 'p2',
    nombre: 'Luz Marina Bedoya',
    finca: 'Villa Café',
    vereda: 'Vereda Palmar',
    municipio: 'Andes, Antioquia',
    telefono: '+57 314 667 2200',
    estado: 'Registrado',
    consentimiento: true,
    registro: '2024-08-20',
  },
  {
    id: 'p3',
    nombre: 'José Hernán Soto',
    finca: 'El Porvenir',
    vereda: 'Vereda Ranchería',
    municipio: 'Salento, Quindío',
    telefono: '+57 317 890 1123',
    estado: 'Validado',
    consentimiento: true,
    registro: '2024-04-05',
  },
  {
    id: 'p4',
    nombre: 'Martha Cecilia Giraldo',
    finca: 'La Montaña',
    vereda: 'Vereda San Isidro',
    municipio: 'Pitalito, Huila',
    telefono: '+57 320 334 9988',
    estado: 'Validado',
    consentimiento: false,
    registro: '2024-02-17',
  },
  {
    id: 'p5',
    nombre: 'Rodrigo Patiño Velásquez',
    finca: 'Dos Quebradas',
    vereda: 'Vereda El Rosario',
    municipio: 'Marsella, Risaralda',
    telefono: '+57 300 122 4455',
    estado: 'Registrado',
    consentimiento: true,
    registro: '2024-08-24',
  },
  {
    id: 'p6',
    nombre: 'Ana Lucía Moreno',
    finca: 'Buenos Aires',
    vereda: 'Vereda La Cumbre',
    municipio: 'Chinchiná, Caldas',
    telefono: '+57 318 445 7712',
    estado: 'Validado',
    consentimiento: true,
    registro: '2024-01-30',
  },
]

// RF-10.1 — identidades operativas
export const AGRONOMOS_CUENTA: AgronomoCuenta[] = [
  {
    id: 'a1',
    nombre: 'Dra. Claudia Ríos Salcedo',
    iniciales: 'CR',
    especialidad: 'Fitopatología y plagas café',
    tarjeta: 'TP-098712',
    telefono: '+57 312 441 7780',
    estado: 'Activo',
    acreditacion: 'tarjeta-profesional-CR.pdf',
    registro: '2023-11-08',
    casosResueltos: 47,
  },
  {
    id: 'a2',
    nombre: 'Dr. Fernando Restrepo Mejía',
    iniciales: 'FR',
    especialidad: 'Agronomía general - café y cacao',
    tarjeta: 'TP-110234',
    telefono: '+57 315 778 9012',
    estado: 'Activo',
    acreditacion: 'acreditacion-FR.pdf',
    registro: '2024-01-22',
    casosResueltos: 31,
  },
  {
    id: 'a3',
    nombre: 'Ing. Mario Zapata Corrales',
    iniciales: 'MZ',
    especialidad: 'Nutrición vegetal y fisiología',
    tarjeta: 'TP-124590',
    telefono: '+57 301 223 0045',
    estado: 'Activo',
    acreditacion: 'tarjeta-MZ.pdf',
    registro: '2023-09-15',
    casosResueltos: 12,
  },
  {
    id: 'a4',
    nombre: 'Ing. Paula Andrea Cardona',
    iniciales: 'PC',
    especialidad: 'Entomología agrícola',
    tarjeta: 'TP-131877',
    telefono: '+57 316 990 3321',
    // RF-10.5 — flag preventivo a todo recurso de nuevo ingreso
    estado: 'Validación pendiente',
    acreditacion: 'tarjeta-PC.pdf',
    registro: '2024-08-26',
    casosResueltos: 0,
  },
]