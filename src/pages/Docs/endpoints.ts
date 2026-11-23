// Referencia de la API pública de AgroVisión (agrovision.sbs/docs). Un solo lugar con los datos: la página los
// dibuja y public/openapi.json los repite para Postman, Insomnia y generadores de clientes.
export const URL_BASE = 'https://agrovision.sbs/api/public/v1'

export type Parametro = {
  nombre: string
  en: 'query' | 'path'
  tipo: string
  requerido: boolean
  descripcion: string
  /** Valores permitidos, si son pocos */
  opciones?: string[]
  ejemplo?: string
}

export type Respuesta = { codigo: string; descripcion: string }

export type Endpoint = {
  id: string
  metodo: 'GET'
  ruta: string
  resumen: string
  descripcion: string
  parametros: Parametro[]
  respuestas: Respuesta[]
  /** Ruta de ejemplo ya armada (con parámetros de muestra) para el curl y el botón Probar */
  ejemploRuta: string
  ejemploRespuesta: string
}

export const FICHA_EJEMPLO = `{
  "id": "c07f02d2-74c9-4be8-861d-00554bf85cf6",
  "clave": "Deficiencia_Zinc",
  "nombreComun": "Deficiencia de Zinc-Zn",
  "nombreCientifico": null,
  "sinonimos": ["deficiencia de Zn", "falta de zinc"],
  "tipo": "deficiencia",
  "cultivo": "cafe",
  "descripcion": "El zinc ayuda al crecimiento de los brotes…",
  "sintomas": "Afecta los brotes nuevos: las hojas salen pequeñas, angostas…",
  "organosAfectados": ["hoja", "brote"],
  "hospederos": [],
  "fotoUrl": "https://agrovision.sbs/archivos/plagas/60bf0f23-b9db-4585-be64-ea991cccc874.jpg",
  "avalada": false,
  "medidasContencion": null,
  "protocoloQuimico": null,
  "modelo": { "clase": "Deficiencia_Zinc", "desdeVersion": "3.0.0" }
}`

export const ENDPOINTS: Endpoint[] = [
  {
    id: 'listar-fichas',
    metodo: 'GET',
    ruta: '/catalog',
    resumen: 'Listar fichas',
    descripcion:
      'Devuelve las fichas del catálogo de enfermedades, plagas y deficiencias del café. Se puede filtrar por tipo y buscar por nombre.',
    parametros: [
      {
        nombre: 'tipo',
        en: 'query',
        tipo: 'string',
        requerido: false,
        descripcion: 'Filtra por tipo de ficha.',
        opciones: ['enfermedad', 'plaga', 'deficiencia', 'sano'],
        ejemplo: 'deficiencia',
      },
      {
        nombre: 'q',
        en: 'query',
        tipo: 'string',
        requerido: false,
        descripcion: 'Busca en el nombre común, el nombre científico y los sinónimos.',
        ejemplo: 'roya',
      },
    ],
    respuestas: [
      { codigo: '200', descripcion: 'Lista de fichas.' },
      { codigo: '400', descripcion: 'Un parámetro no es válido (por ejemplo, un tipo desconocido).' },
      { codigo: '429', descripcion: 'Superaste el límite de 300 peticiones por minuto.' },
    ],
    ejemploRuta: '/catalog?tipo=deficiencia',
    ejemploRespuesta: `{
  "total": 10,
  "fichas": [
    {
      "id": "c07f02d2-74c9-4be8-861d-00554bf85cf6",
      "clave": "Deficiencia_Zinc",
      "nombreComun": "Deficiencia de Zinc-Zn",
      "tipo": "deficiencia",
      "fotoUrl": "https://agrovision.sbs/archivos/plagas/60bf0f23-….jpg",
      "avalada": false
      // …el resto de los campos de la ficha
    }
  ]
}`,
  },
  {
    id: 'obtener-ficha',
    metodo: 'GET',
    ruta: '/catalog/{id}',
    resumen: 'Obtener una ficha',
    descripcion: 'Devuelve una sola ficha. El identificador puede ser el UUID o la clave legible de la ficha.',
    parametros: [
      {
        nombre: 'id',
        en: 'path',
        tipo: 'string',
        requerido: true,
        descripcion: 'UUID de la ficha o su clave, por ejemplo Enfermedad_Roya o Deficiencia_Zinc.',
        ejemplo: 'Deficiencia_Zinc',
      },
    ],
    respuestas: [
      { codigo: '200', descripcion: 'La ficha.' },
      { codigo: '404', descripcion: 'No existe una ficha con ese id o clave.' },
      { codigo: '429', descripcion: 'Superaste el límite de 300 peticiones por minuto.' },
    ],
    ejemploRuta: '/catalog/Deficiencia_Zinc',
    ejemploRespuesta: FICHA_EJEMPLO,
  },
  {
    id: 'regla-zona',
    metodo: 'GET',
    ruta: '/zone-rules',
    resumen: 'Regla de zona de vigilancia',
    descripcion:
      'Devuelve la regla activa que traduce severidad e incidencia de una enfermedad o plaga en un radio de vigilancia, en metros. Cada fila aplica hasta su sevMax y su incMax. Usa el encabezado ETag con If-None-Match para no volver a descargarla si no cambió.',
    parametros: [
      {
        nombre: 'tipo',
        en: 'query',
        tipo: 'string',
        requerido: true,
        descripcion: 'Enfermedad o plaga: entre 2 y 50 caracteres en minúsculas, dígitos, guion o guion bajo.',
        ejemplo: 'roya',
      },
    ],
    respuestas: [
      { codigo: '200', descripcion: 'La regla activa.' },
      { codigo: '204', descripcion: 'No hay una regla activa para ese tipo.' },
      { codigo: '304', descripcion: 'La regla no cambió desde tu If-None-Match.' },
      { codigo: '400', descripcion: 'Falta tipo o no es válido.' },
    ],
    ejemploRuta: '/zone-rules?tipo=roya',
    ejemploRespuesta: `{
  "tipoEnfermedad": "roya",
  "version": 2,
  "calibrada": false,
  "filas": [
    { "orden": 1, "sevMax": 100, "incMax": 5,   "radioMinM": 0, "radioMaxM": 3 },
    { "orden": 2, "sevMax": 100, "incMax": 15,  "radioMinM": 3, "radioMaxM": 8 },
    { "orden": 3, "sevMax": 100, "incMax": 100, "radioMinM": 8, "radioMaxM": 15 }
  ]
}`,
  },
]

export type CampoFicha = { campo: string; tipo: string; descripcion: string }

export const CAMPOS_FICHA: CampoFicha[] = [
  { campo: 'id', tipo: 'string (UUID)', descripcion: 'Identificador de la ficha.' },
  { campo: 'clave', tipo: 'string', descripcion: 'Identificador estable y legible (Enfermedad_Roya). Úsalo como llave en tu proyecto.' },
  { campo: 'nombreComun', tipo: 'string', descripcion: 'Nombre con el que se conoce.' },
  { campo: 'nombreCientifico', tipo: 'string | null', descripcion: 'Nombre científico. Es null en deficiencias y hoja sana.' },
  { campo: 'sinonimos', tipo: 'string[]', descripcion: 'Otros nombres con los que se conoce.' },
  { campo: 'tipo', tipo: 'string', descripcion: 'enfermedad, plaga, deficiencia o sano.' },
  { campo: 'cultivo', tipo: 'string', descripcion: 'Siempre cafe.' },
  { campo: 'descripcion', tipo: 'string', descripcion: 'Qué es y por qué aparece.' },
  { campo: 'sintomas', tipo: 'string', descripcion: 'Cómo se ve en la planta.' },
  { campo: 'organosAfectados', tipo: 'string[]', descripcion: 'Partes de la planta afectadas.' },
  { campo: 'hospederos', tipo: 'string[]', descripcion: 'Plantas hospederas.' },
  { campo: 'fotoUrl', tipo: 'string | null', descripcion: 'URL completa de la foto, o null si la ficha aún no tiene.' },
  { campo: 'avalada', tipo: 'boolean', descripcion: 'true si un agrónomo revisó y firmó la ficha.' },
  { campo: 'medidasContencion', tipo: 'string | null', descripcion: 'Solo trae texto cuando avalada es true.' },
  { campo: 'protocoloQuimico', tipo: 'string | null', descripcion: 'Solo trae texto cuando avalada es true.' },
  {
    campo: 'modelo',
    tipo: 'object | null',
    descripcion: 'Clase del modelo de reconocimiento ligada a la ficha: { clase, desdeVersion }. null si el modelo no la reconoce.',
  },
]

export const EJEMPLO_ERROR = `{
  "statusCode": 404,
  "timestamp": "2026-11-23T01:19:43.562Z",
  "path": "/api/public/v1/catalog/NoExiste",
  "metodo": "GET",
  "mensaje": "No existe una ficha con ese id o clave."
}`

/** Ejemplos de código para una ruta ya armada */
export function ejemplosCodigo(ruta: string): { lenguaje: string; codigo: string }[] {
  const url = `${URL_BASE}${ruta}`
  return [
    { lenguaje: 'curl', codigo: `curl "${url}"` },
    {
      lenguaje: 'JavaScript',
      codigo: `const respuesta = await fetch('${url}')
const datos = await respuesta.json()
console.log(datos)`,
    },
    {
      lenguaje: 'Python',
      codigo: `import requests

r = requests.get("${url}", timeout=10)
r.raise_for_status()
print(r.json())`,
    },
  ]
}
