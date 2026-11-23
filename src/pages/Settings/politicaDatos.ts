// Habeas data (Ley 1581 de 2012) — Política de Tratamiento de Datos Personales. Responsable: SENA.
// Es el mismo texto que ve el productor en la app móvil. Si cambia, hay que actualizarlo en los tres
// sitios y subir la versión: aquí, en la app (DataPolicy.CURRENT_VERSION / strings.xml) y en la API
// (VERSION_POLITICA_DATOS). Así la app vuelve a pedir la aceptación.
export const VERSION_POLITICA_DATOS = '1.0'

export const POLITICA_INTRO =
  'AgroVisión es una herramienta del SENA para el diagnóstico de plagas del café. Esta política explica cómo se tratan los datos personales de los productores, conforme a la Ley 1581 de 2012 (habeas data) y sus decretos reglamentarios.'

export const POLITICA_SECCIONES: { titulo: string; lineas: string[] }[] = [
  {
    titulo: '1. Responsable del tratamiento',
    lineas: ['El responsable del tratamiento de los datos es el Servicio Nacional de Aprendizaje – SENA.'],
  },
  {
    titulo: '2. Qué datos se recolectan',
    lineas: [
      'Número de celular.',
      'Nombre, nombre de la finca, vereda y municipio.',
      'Las fotos que el productor toma de sus cultivos.',
      'La ubicación (coordenadas) del lugar donde se toma cada foto, cuando el productor lo permite.',
      'Los mensajes que intercambia con el agrónomo asignado.',
      'No se recolectan datos sensibles.',
    ],
  },
  {
    titulo: '3. Para qué se usan',
    lineas: [
      'Verificar la identidad con un código enviado por mensaje.',
      'Que un agrónomo revise los casos y responda al productor.',
      'Ubicar los casos para entender dónde aparecen las plagas.',
      'Mejorar el modelo de reconocimiento de plagas, solo si el productor lo autoriza aparte con la opción «Usar mis fotos para mejorar el modelo».',
      'Generar estadísticas del programa sin identificar al productor.',
    ],
  },
  {
    titulo: '4. Con quién se comparten',
    lineas: [
      'Las fotos, la ubicación de la captura y los datos de contacto los ve el agrónomo que atiende la solicitud y el personal autorizado del SENA que administra el programa. No se venden los datos.',
    ],
  },
  {
    titulo: '5. Derechos del titular',
    lineas: [
      'Conocer, actualizar y rectificar sus datos; pedir prueba de la autorización otorgada; ser informado del uso que se les da; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y pedir la supresión de los datos cuando no exista un deber legal de conservarlos.',
      'El productor puede revocar su autorización en cualquier momento desde Ajustes › Privacidad en la app. Si la revoca, no podrá enviar nuevas solicitudes a un agrónomo hasta que la acepte de nuevo.',
    ],
  },
  {
    titulo: '6. Respuestas facultativas',
    lineas: [
      'Autorizar el tratamiento es voluntario, pero sin la autorización no se pueden atender las solicitudes de revisión. El escaneo y el catálogo de plagas se pueden usar sin crear cuenta.',
    ],
  },
  {
    titulo: '7. Cómo ejercer los derechos',
    lineas: [
      'Canal de atención de protección de datos del SENA: [CANAL DE CONTACTO DE PROTECCIÓN DE DATOS DEL SENA]. Las consultas y reclamos se atienden dentro de los plazos de la ley.',
    ],
  },
  {
    titulo: '8. Vigencia y cambios',
    lineas: [
      'Los datos se conservan mientras el productor mantenga su cuenta y sea necesario para las finalidades descritas. Si esta política cambia, la app la vuelve a mostrar y pide aceptarla de nuevo.',
    ],
  },
]
