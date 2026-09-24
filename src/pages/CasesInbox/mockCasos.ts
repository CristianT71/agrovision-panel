export type EstadoCaso = 'Pendiente' | 'Enviada' | 'Asignada' | 'Resuelta' | 'Descartada'

export type Agronomo = {
  id: string
  nombre: string
  iniciales: string
  especialidad: string
  casosActivos: number // RF-08.4 — carga de trabajo en curso
}

export type MensajeCaso = {
  id: string
  autor: string
  iniciales: string
  esAdmin: boolean
  texto: string
  fecha: string
}

export type Caso = {
  id: string
  productor: string
  telefonoProductor: string
  finca: string
  municipio: string
  estado: EstadoCaso
  plaga?: string
  versionIA?: string
  confianza?: number
  hace: string
  imagen: string
  asignadoA?: { id: string; nombre: string; iniciales: string }
  contactoDirecto: boolean // RF-08.8 — permiso ACL productor-evaluador
  mensajes: MensajeCaso[]
}

// RF-08.4 — especialistas disponibles y su carga
export const AGRONOMOS: Agronomo[] = [
  {
    id: 'a1',
    nombre: 'Dra. Claudia Ríos Salcedo',
    iniciales: 'CR',
    especialidad: 'Fitopatología y plagas café',
    casosActivos: 1,
  },
  {
    id: 'a2',
    nombre: 'Dr. Fernando Restrepo Mejía',
    iniciales: 'FR',
    especialidad: 'Agronomía general - café y cacao',
    casosActivos: 1,
  },
  {
    id: 'a3',
    nombre: 'Ing. Mario Zapata Corrales',
    iniciales: 'MZ',
    especialidad: 'Nutrición vegetal y fisiología',
    casosActivos: 0,
  },
]

// RF-08.1 — repositorio maestro de contingencias
export const CASOS: Caso[] = [
  {
    id: 'SOL-2024-0041',
    productor: 'Carlos Arango Ríos',
    telefonoProductor: '+57 311 452 8801',
    finca: 'La Esperanza',
    municipio: 'Jardín, Antioquia',
    estado: 'Asignada',
    plaga: 'Broca del café',
    versionIA: 'v2.3.1',
    confianza: 87,
    hace: 'hace 758 d',
    imagen: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&q=60',
    asignadoA: { id: 'a1', nombre: 'Dra. Claudia Ríos Salcedo', iniciales: 'CR' },
    contactoDirecto: false,
    mensajes: [
      {
        id: 'm1',
        autor: 'Mario Zapata C.',
        iniciales: 'MZ',
        esAdmin: true,
        texto:
          'Dra. Ríos, le asigno este caso porque el productor reporta que los daños se han extendido a más de 3 surcos en los últimos 5 días. Requiere revisión prioritaria.',
        fecha: '26 de ago, 04:30 a. m.',
      },
      {
        id: 'm2',
        autor: 'Dra. Claudia Ríos',
        iniciales: 'DC',
        esAdmin: false,
        texto:
          'Recibido. Revisé las fotos y efectivamente parece broca en estadio avanzado. ¿Hay registros de aplicaciones fitosanitarias previas del productor?',
        fecha: '26 de ago, 05:12 a. m.',
      },
      {
        id: 'm3',
        autor: 'Mario Zapata C.',
        iniciales: 'MZ',
        esAdmin: true,
        texto: 'Consultando con el técnico de zona. Te confirmo hoy mismo.',
        fecha: '26 de ago, 06:02 a. m.',
      },
    ],
  },
  {
    id: 'SOL-2024-0040',
    productor: 'Luz Marina Bedoya',
    telefonoProductor: '+57 310 778 2240',
    finca: 'Villa Café',
    municipio: 'Andes, Antioquia',
    estado: 'Pendiente',
    versionIA: 'v2.3.1',
    hace: 'hace 758 d',
    imagen: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=200&q=60',
    contactoDirecto: false,
    mensajes: [],
  },
  {
    id: 'SOL-2024-0039',
    productor: 'José Hernán Soto',
    telefonoProductor: '+57 312 004 9911',
    finca: 'El Porvenir',
    municipio: 'Salento, Quindío',
    estado: 'Resuelta',
    plaga: 'Roya del cafeto',
    versionIA: 'v2.3.1',
    confianza: 94,
    hace: 'hace 759 d',
    imagen: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=200&q=60',
    asignadoA: { id: 'a2', nombre: 'Dr. Fernando Restrepo Mejía', iniciales: 'FR' },
    contactoDirecto: true,
    mensajes: [
      {
        id: 'm1',
        autor: 'Mario Zapata C.',
        iniciales: 'MZ',
        esAdmin: true,
        texto: 'Caso de roya en zona alta. Prioridad media.',
        fecha: '25 de ago, 09:10 a. m.',
      },
      {
        id: 'm2',
        autor: 'Dr. Fernando Restrepo',
        iniciales: 'FR',
        esAdmin: false,
        texto: 'Resuelto. Recomendé fungicida cúprico y manejo de sombra.',
        fecha: '25 de ago, 02:40 p. m.',
      },
    ],
  },
  {
    id: 'SOL-2024-0038',
    productor: 'Martha Cecilia Giraldo',
    telefonoProductor: '+57 318 551 3092',
    finca: 'La Montaña',
    municipio: 'Pitalito, Huila',
    estado: 'Enviada',
    plaga: 'Phoma spp.',
    versionIA: 'v2.2.0',
    confianza: 72,
    hace: 'hace 759 d',
    imagen: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=60',
    contactoDirecto: false,
    mensajes: [],
  },
  {
    id: 'SOL-2024-0037',
    productor: 'Rodrigo Patiño Velásquez',
    telefonoProductor: '+57 315 220 7744',
    finca: 'Dos Quebradas',
    municipio: 'Marsella, Risaralda',
    estado: 'Descartada',
    plaga: 'Minador de la hoja',
    versionIA: 'v2.2.0',
    confianza: 61,
    hace: 'hace 760 d',
    imagen: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=200&q=60',
    asignadoA: { id: 'a1', nombre: 'Dra. Claudia Ríos Salcedo', iniciales: 'CR' },
    contactoDirecto: false,
    mensajes: [],
  },
  {
    id: 'SOL-2024-0036',
    productor: 'Ana Lucía Moreno',
    telefonoProductor: '+57 300 918 4471',
    finca: 'Buenos Aires',
    municipio: 'Chinchiná, Caldas',
    estado: 'Asignada',
    plaga: 'Cercospora',
    versionIA: 'v2.3.1',
    confianza: 79,
    hace: 'hace 761 d',
    imagen: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=200&q=60',
    asignadoA: { id: 'a2', nombre: 'Dr. Fernando Restrepo Mejía', iniciales: 'FR' },
    contactoDirecto: false,
    mensajes: [],
  },
]