export type EstadoSolicitud =
  | 'Pendiente de subir'
  | 'Enviada'
  | 'Asignada'
  | 'Resuelta'
  | 'Descartada'

export type Solicitud = {
  id: string
  productor: string
  finca: string
  vereda: string
  municipio: string
  estado: EstadoSolicitud
  plaga?: string
  versionIA?: string
  confianza?: number
  hace: string
  imagen: string
  esMia: boolean
}

export const SOLICITUDES: Solicitud[] = [
  {
    id: 'SOL-2024-0041',
    productor: 'Carlos Arango Ríos',
    finca: 'La Esperanza',
    vereda: 'Vereda El Cedro',
    municipio: 'Jardín, Antioquia',
    estado: 'Asignada',
    plaga: 'Broca del café',
    versionIA: 'IA v2.3.1',
    confianza: 87,
    hace: 'hace 749 d',
    imagen: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&q=60',
    esMia: true,
  },
  {
    id: 'SOL-2024-0040',
    productor: 'Luz Marina Bedoya',
    finca: 'Villa Café',
    vereda: 'Vereda Palmar',
    municipio: 'Andes, Antioquia',
    estado: 'Pendiente de subir',
    hace: 'hace 749 d',
    imagen: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=200&q=60',
    esMia: false,
  },
  {
    id: 'SOL-2024-0039',
    productor: 'José Hernán Soto',
    finca: 'El Porvenir',
    vereda: 'Vereda Ranchería',
    municipio: 'Salento, Quindío',
    estado: 'Resuelta',
    plaga: 'Roya del cafeto',
    versionIA: 'IA v2.3.1',
    confianza: 94,
    hace: 'hace 749 d',
    imagen: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=200&q=60',
    esMia: false,
  },
  {
    id: 'SOL-2024-0038',
    productor: 'Martha Cecilia Giraldo',
    finca: 'La Montaña',
    vereda: 'Vereda San Isidro',
    municipio: 'Pitalito, Huila',
    estado: 'Enviada',
    plaga: 'Phoma spp.',
    versionIA: 'IA v2.2.0',
    confianza: 72,
    hace: 'hace 750 d',
    imagen: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=60',
    esMia: false,
  },
  {
    id: 'SOL-2024-0037',
    productor: 'Rodrigo Patiño Velásquez',
    finca: 'Dos Quebradas',
    vereda: 'Vereda El Rosario',
    municipio: 'Marsella, Risaralda',
    estado: 'Descartada',
    plaga: 'Minador de la hoja',
    versionIA: 'IA v2.2.0',
    confianza: 61,
    hace: 'hace 751 d',
    imagen: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=200&q=60',
    esMia: false,
  },
  {
    id: 'SOL-2024-0036',
    productor: 'Ana Lucía Restrepo',
    finca: 'Buenos Aires',
    vereda: 'Vereda La Cumbre',
    municipio: 'Chinchiná, Caldas',
    estado: 'Asignada',
    plaga: 'Cercospora',
    versionIA: 'IA v2.3.1',
    confianza: 79,
    hace: 'hace 752 d',
    imagen: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=200&q=60',
    esMia: true,
  },
]