export type Categoria = 'Enfermedad'| 'Plaga'|'Deficiencia'|'Sano'|'Otro'


export type Manejo = {
  cultural: string
  biologico: string
  ingredienteActivo: string
  dosis: string
  periodoCarencia: string
}
export type Ficha ={
      id: string
  nombreComun: string
  nombreCientifico: string
  categoria: Categoria
  conAval: boolean 
  sinonimos: string[] 
  cultivos?: string[]
  organos?: string[]
  descripcion?: string
  sintomas?: string
  fuente?: string
  aval?: { nombre: string; tarjeta: string }
  manejo?: Manejo
  imagen: string
}

export const FICHAS: Ficha[]=[
    {
    id: 'F-001',
    nombreComun: 'Roya de café',
    nombreCientifico: 'Hemileia vastatrix',
    categoria: 'Enfermedad',
    conAval: true,
    sinonimos: ['roya naranja','oxido del cafe','leaf rust'],
    imagen: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=70',
    },

    {
    id: 'F-002',
    nombreComun: 'Mancha de hierro',
    nombreCientifico: 'Cercospera coffeicola',
    categoria: 'Enfermedad',
    conAval: true,
    sinonimos: ['cercospera','mancha de cercospera','ojo de gallo'],
    imagen: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=600&q=70',
    },

    {
     id: 'F-003',
    nombreComun: 'Minador de la hoja de café',
    nombreCientifico: 'Leucoptera coffella',
    categoria: 'Plaga',
    conAval: false,
    sinonimos: ['polilla minadora', 'minador', 'miner'],
    imagen: 'https://images.unsplash.com/photo-1502741126161-b048400d085d?w=600&q=70',
    },

    {
     id: 'F-004',
    nombreComun: 'Muerte decendiente(Quema)',
    nombreCientifico: 'Phoma Spp', 
    categoria: 'Enfermedad',
    conAval: true,
    sinonimos: ['phoma', 'quema del cafeto', 'muerte regresiva', 'llaga marcana'],
    imagen: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&q=70',
    },

    {
    id: 'F-005',
    nombreComun: 'Antracnosis',
    nombreCientifico: 'Colletotrichum gloesporioides',
    categoria: 'Enfermedad',
    conAval: false,
    sinonimos: ['antracnosis del café', 'anthracnose','mancha antracnósica',],
    imagen: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&q=70',
    },

    {
    id: 'F-006',
    nombreComun: 'Ojo de gallo',
    nombreCientifico: 'Mycena citricolor',
    categoria: 'Enfermedad',
    conAval: true,
    sinonimos: ['american left spot','enfermedad del ojo de gallo','gotera del cafe'],
    imagen: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=600&q=70',
    },
    
    {
    id: 'F-007',
    nombreComun: 'Deficiencia de potasio',
    nombreCientifico: 'N/A desbalance nutricional(K)',
    categoria: 'Deficiencia',
    conAval: false,
    sinonimos: ['potassium','deficiency','falta de potasio','deficencia K'],
    imagen: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=70',

    },

    {
      id: 'F-008',
    nombreComun:  'Deficiencia de azufre',
    nombreCientifico:  'N/A -Desbalance nutricional (S)',
    categoria: 'Deficiencia',
    conAval: false,
    sinonimos: ['sulfur deciency', 'falta de azufre', 'deficiencia S'],
    imagen: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=70',

    },


]