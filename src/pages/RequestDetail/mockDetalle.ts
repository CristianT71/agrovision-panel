export type Foto = { url: string; angulo: string }
export type CasoSimilar = { nombre: string; similitud: number; imagen: string }
export type Mensaje = {
  id: string
  autor: string
  iniciales: string
  esAdmin: boolean
  texto: string
  fecha: string
}

export type Resolucion = {
  tipo: string
  plaga: string
  respuesta: string
  fecha: string
}

export type DetalleSolicitud = {
  id: string
  estado: string
  productor: string
  finca: string
  vereda: string
  municipio: string
  telefono: string
  telefonoVisible: boolean
  fechaCaptura: string
  fotos: Foto[]
  modeloIA: string
  diagnosticoIA: string
  confianza: number
  casosSimilares: CasoSimilar[]
  mensajes: Mensaje[]
  resolucion?: Resolucion // presente solo si ya fue resuelta
}

// RF-04.1 y RF-04.2 — 4 fotografías con su ángulo identificado
export const DETALLE: DetalleSolicitud = {
  id: 'SOL-2024-0041',
  estado: 'Asignada',
  productor: 'Carlos Arango Ríos',
  finca: 'La Esperanza',
  vereda: 'Vereda El Cedro',
  municipio: 'Jardín, Antioquia',
  telefono: '+57 311 452 8801',
  telefonoVisible: true, // RF-04.10 — depende del permiso otorgado
  fechaCaptura: '26 de agosto de 2024 a las 04:14 a. m.',
  fotos: [
    { url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=70', angulo: 'Vista general' },
    { url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&q=70', angulo: 'Haz foliar' },
    { url: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&q=70', angulo: 'Envés foliar' },
    { url: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=600&q=70', angulo: 'Detalle' },
  ],
  modeloIA: 'v2.3.1',
  diagnosticoIA: 'Broca del café',
  confianza: 87,
  // RF-04.3 — al menos 3 expedientes con mayor correlación
  casosSimilares: [
    { nombre: 'Roya del cafeto', similitud: 87, imagen: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=70' },
    { nombre: 'Phoma spp.', similitud: 75, imagen: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=400&q=70' },
    { nombre: 'Minador de la hoja', similitud: 83, imagen: 'https://images.unsplash.com/photo-1502741126161-b048400d085d?w=400&q=70' },
  ],
  // RF-04.9 — bitácora de mensajería con el coordinador
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
  ],
  //Descomentar para ver el estado resuelto:
  resolucion: {
    tipo: 'Confirma diagnóstico IA',
     plaga: 'Roya del cafeto',
    respuesta:
      'Se confirma roya del cafeto en estadio inicial. Se recomienda aplicación de fungicida cúprico y mejora de aireación entre surcos.',
    fecha: 'el 27 de ago, 09:15 a. m.',
   }, 
}

export const TIPOS_RESULTADO = [
  'Confirma diagnóstico IA',
  'Corrige diagnóstico IA',
  'Plaga nueva',
  'Imagen no diagnosticable',
  'Planta sana',
]