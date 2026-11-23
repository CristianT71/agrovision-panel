// Términos y Condiciones de uso para agrónomos profesionales. Se muestran al solicitar acceso y la
// aceptación queda registrada en la API con esta versión y la fecha. Si cambia el texto, sube la
// versión aquí y en la API (VERSION_TERMINOS_AGRONOMO, agrovision-api/src/modules/agronomos/domain).
export const VERSION_TERMINOS_AGRONOMO = '1.0'

export const TERMINOS_INTRO =
  'Estos términos regulan el acceso y el uso de AgroVisión por parte de los profesionales del agro que atienden las solicitudes de revisión de los productores de café. Léelos antes de enviar tu solicitud: al marcar la casilla confirmas que los entiendes y los aceptas.'

export const TERMINOS_SECCIONES: { titulo: string; lineas: string[] }[] = [
  {
    titulo: '1. Quién puede solicitar acceso',
    lineas: [
      'Puede solicitarlo un profesional en ciencias agrarias o áreas afines, con tarjeta profesional vigente, en capacidad de orientar el manejo fitosanitario del café.',
      'Tu solicitud la revisa un administrador. Mientras no la valide, tu cuenta queda pendiente y no tiene acceso a los casos. El administrador puede aprobarla o no, según la acreditación presentada.',
    ],
  },
  {
    titulo: '2. Veracidad de la información',
    lineas: [
      'Tu nombre, celular, correo, número de tarjeta profesional, especialidad y los documentos que adjuntas deben ser verdaderos, tuyos y estar vigentes.',
      'Entregar información falsa o documentos ajenos es causal de rechazo o de desactivación inmediata de la cuenta, sin perjuicio de las acciones legales que correspondan.',
      'Si tus datos cambian o tu acreditación pierde vigencia, debes informarlo al administrador.',
    ],
  },
  {
    titulo: '3. Tu cuenta',
    lineas: [
      'La cuenta es personal e intransferible. Se accede con un código de un solo uso enviado al celular que registraste.',
      'No compartas el código, no entregues tu sesión a otra persona y ciérrala en equipos que no sean tuyos. Eres responsable de lo que se haga con tu cuenta. La sesión se cierra sola tras un tiempo de inactividad.',
    ],
  },
  {
    titulo: '4. Cómo debes atender los casos',
    lineas: [
      'Atiende cada solicitud con criterio profesional propio, con diligencia y respeto hacia el productor, dentro de los tiempos del programa.',
      'Tu concepto se basa en las fotos y datos de la solicitud. Si no alcanzan para una recomendación responsable, dilo, pide más información o sugiere una visita presencial.',
      'La detección automática de la plataforma es solo una ayuda: la resolución del caso es tuya.',
      'Tus resoluciones y los avales que firmes a las fichas quedan registrados con tu nombre y la fecha. Solo avala lo que hayas verificado.',
      'Si recomiendas productos para el control, que sean registrados ante el ICA, respetando las dosis, los periodos de carencia y las indicaciones de la etiqueta.',
    ],
  },
  {
    titulo: '5. Datos de los productores y confidencialidad',
    lineas: [
      'Según el caso, verás fotos, la ubicación de la captura, mensajes y, solo si el productor dio su permiso de contacto, sus datos de contacto. Úsalos únicamente para atender esa solicitud.',
      'No copies, divulgues, vendas ni uses estos datos con fines comerciales o publicitarios propios, ni contactes a un productor por fuera de la plataforma sin su permiso.',
      'Estas obligaciones de confidencialidad y de tratamiento adecuado de datos personales (Ley 1581 de 2012) se mantienen después de que termine tu relación con la plataforma.',
    ],
  },
  {
    titulo: '6. Tus datos personales',
    lineas: [
      'El responsable del tratamiento es el Servicio Nacional de Aprendizaje – SENA.',
      'Se tratan tu nombre, celular, correo, tarjeta profesional, especialidad, los documentos de acreditación y tu actividad en la plataforma (resoluciones, mensajes, avales y accesos).',
      'Se usan para validar tu identidad y acreditación, asignarte casos, comunicarnos contigo (incluidas notificaciones por correo y en el panel), mantener la seguridad y la auditoría del sistema y generar estadísticas del programa.',
      'Los documentos de acreditación se guardan en almacenamiento privado y solo los revisa el personal administrador.',
      'Tienes derecho a conocer, actualizar y rectificar tus datos, pedir prueba de esta autorización, revocarla y solicitar la supresión de tus datos cuando no exista un deber legal de conservarlos (por ejemplo, el registro de las resoluciones y avales que emitiste). También puedes presentar quejas ante la Superintendencia de Industria y Comercio.',
      'Para ejercer tus derechos, usa el canal de protección de datos personales del SENA publicado en su sitio oficial (sena.edu.co).',
      'Al aceptar estos términos autorizas este tratamiento. La plataforma guarda la versión que aceptaste y la fecha como prueba de la autorización.',
    ],
  },
  {
    titulo: '7. Uso adecuado',
    lineas: [
      'No puedes acceder a información que no te corresponde, intentar vulnerar la seguridad de la plataforma, hacer ingeniería inversa, automatizar el acceso, suplantar a otra persona ni usarla para fines ilícitos.',
      'El acceso no autorizado a sistemas informáticos y el uso indebido de datos personales pueden tener consecuencias penales y sancionatorias (Ley 1273 de 2009 y Ley 1581 de 2012).',
    ],
  },
  {
    titulo: '8. Propiedad intelectual',
    lineas: [
      'La plataforma, su software, su diseño y sus marcas pertenecen a sus titulares y no se transfieren con estos términos. Recibes un derecho personal, no exclusivo y revocable de uso, solo para atender casos.',
      'Los conceptos, resoluciones y fichas que redactes siguen siendo tuyos como autor (Ley 23 de 1982), pero autorizas que se muestren a los productores y se usen dentro del programa. Las fotos y datos de los productores no son tuyos.',
    ],
  },
  {
    titulo: '9. Disponibilidad y responsabilidad',
    lineas: [
      'La plataforma es una herramienta de apoyo del programa y se ofrece sin garantía de disponibilidad continua: puede haber mantenimientos o interrupciones.',
      'El concepto que emites es responsabilidad profesional tuya. En la medida que permita la ley, la plataforma, el SENA y el equipo del proyecto no responden por las decisiones de manejo que un productor tome con base en él.',
    ],
  },
  {
    titulo: '10. Suspensión y terminación',
    lineas: [
      'Puedes pedir en cualquier momento que se retire tu cuenta.',
      'El administrador puede desactivarla si incumples estos términos, si tu acreditación deja de estar vigente o si el programa lo requiere. Se conservan los registros que la ley o la auditoría exijan.',
    ],
  },
  {
    titulo: '11. Cambios y ley aplicable',
    lineas: [
      'Si estos términos cambian se publicará una nueva versión con su número, y la aceptación se registra por versión.',
      'Se rigen por las leyes de la República de Colombia. Cualquier controversia se resolverá ante las autoridades colombianas competentes.',
    ],
  },
]
