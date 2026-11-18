/* ============================================================
   Web pública · /privacidad — la política de privacidad (ES)
   ------------------------------------------------------------
   Sale de privacidad.html del rediseño. Aquí está TODO el texto
   de esa pantalla; el marcado lo pone
   src/app/(web)/privacidad/Privacidad.tsx.

   ⚠️ ESTO NO ES TEXTO DE MARKETING
   Es el documento que obliga a la empresa frente a quien visita
   la web, así que el español está PORTADO PALABRA POR PALABRA del
   original: ni un plazo redondeado, ni un «hasta 6 años» que se
   convierta en «seis años», ni un correo distinto. Si alguna
   frase parece mejorable, se cambia con quien firma la política,
   no al traerla a Next.

   CUATRO HUECOS SIN RELLENAR, Y SON DEL ORIGINAL
   El zip trae cuatro datos de la empresa por completar (razón
   social, NIF, domicilio y correo del Delegado de Protección de
   Datos) y una duda sobre el papel de Qore Technology. Se portan
   tal cual, entre corchetes, porque los pinta <mark class="fill">:
   el diseño los enseña en ámbar justo para que canten hasta que
   alguien los rellene. No son claves olvidadas.

   LA PRUEBA GRATUITA, TAMBIÉN AQUÍ
   La política menciona la prueba de siete días en dos sitios (el
   alcance y la tabla de finalidades) y la llamada del pie la
   prometía. Hoy esa prueba está apagada (src/lib/web/oferta.ts:
   el backend no concede ninguna), y una política no puede
   describir un tratamiento que no existe, así que esos tres
   textos tienen dos versiones:

     …ConPrueba  · la que vuelve el día que se encienda.
     …SinPrueba  · la que se ve HOY, sin la prueba.

   Los días nunca se escriben con número: van como {dias}.

   LO QUE NO ESTÁ AQUÍ
   La cabecera, el pie y el menú son de comun.es.ts. El correo, el
   teléfono y la dirección de la AEPD son datos que no se
   traducen y viven en el componente.
============================================================ */

const privacidadEs = {
  /* El <head> de la página. Lo lee page.tsx, que es de servidor y
     no puede usar el hook de traducción, así que de estas claves
     solo se usa la versión española: la web no tiene una
     dirección distinta por idioma. */
  meta: {
    titulo: "Política de privacidad · Bookmy",
    descripcion:
      "Qué datos trata Bookmy, para qué, con qué base legal, durante cuánto tiempo y cómo ejercer tus derechos.",
    imagenAlt: "El panel del CRM Bookmy",
  },

  /* ── Portada de la política ─────────────────────────────── */
  hero: {
    titulo: "Política de privacidad",
    lead:
      "En Bookmy nos tomamos en serio la protección de tus datos. Aquí te explicamos, sin rodeos, qué datos tratamos, para qué, con qué base legal, cuánto tiempo los guardamos y cómo ejercer tus derechos.",
    /* La fecha es parte del documento: la cambia quien publica una
       versión nueva de la política, no el día de hoy. */
    actualizado: "Última actualización: 17 de noviembre de 2026",
    normativa: "RGPD y LOPDGDD",
  },

  /* ── Índice lateral ─────────────────────────────────────────
     Cada clave se llama igual que el id de su apartado, que es lo
     que enlaza el índice y lo que el motor va marcando al bajar.
     El número va dentro del texto, como en el original. */
  indice: {
    etiqueta: "Índice de la política",
    titulo: "Índice",
    responsable: "1. Responsable",
    alcance: "2. A quién se aplica",
    datos: "3. Qué datos tratamos",
    finalidades: "4. Finalidades y bases legales",
    asistente: "5. Asistente virtual",
    destinatarios: "6. Con quién los compartimos",
    transferencias: "7. Transferencias internacionales",
    conservacion: "8. Cuánto tiempo los guardamos",
    derechos: "9. Tus derechos",
    menores: "10. Menores",
    seguridad: "11. Seguridad",
    cambios: "12. Cambios",
    escribenos: "Escríbenos",
  },

  /* El asunto del correo de ejercicio de derechos. Está una sola
     vez porque va a dos sitios: el `mailto:` del índice y del
     apartado 9, y la frase que pide usarlo («con el asunto …»),
     que lo recibe como {asunto}. Si se escribiera dos veces, un
     día dirían cosas distintas. */
  asunto: "Protección de datos",

  /* ── 1 · Responsable ────────────────────────────────────── */
  responsable: {
    titulo: "Quién es el responsable",
    intro:
      "El responsable del tratamiento de los datos personales que se recogen en esta web y en la plataforma Bookmy es:",
    filaTitular: "Titular",
    /* Los corchetes son del original: es un dato de la empresa que
       todavía falta y el diseño lo enseña en ámbar. */
    titularPendiente: "[Razón social]",
    titularResto: ", que opera con la marca Bookmy",
    filaNif: "NIF",
    nifPendiente: "[NIF]",
    filaDomicilio: "Domicilio",
    domicilioPendiente: "[Dirección postal completa]",
    filaEmail: "Email",
    filaWhatsapp: "WhatsApp",
    filaDpd: "Delegado de Protección de Datos",
    dpdPendiente: "[Email del DPD, si se ha designado]",
  },

  /* ── 2 · A quién se aplica ──────────────────────────────────
     Cada punto empieza con un trozo en negrita y sigue en texto
     normal, así que va partido en dos claves (…Fuerte y …Resto).
     El «Resto» arranca con la coma o el paréntesis que lo une a la
     negrita: eso también es del original y no se toca. */
  alcance: {
    titulo: "A quién se aplica esta política",
    intro:
      "Bookmy es una plataforma de gestión de reservas y CRM para negocios de salud, estética, construcción, tecnología y servicios. Según quién seas, nuestro papel es distinto:",
    webFuerte: "Si visitas la web, hablas con el asistente o nos pides información",
    webResto: ", Bookmy es el responsable de tus datos.",
    crmFuerte: "Si tienes una cuenta de negocio en el CRM Bookmy",
    crmRestoConPrueba:
      " (Plan Basic o Plan Pro, incluida la prueba de {dias} días), Bookmy es el responsable de los datos de tu cuenta, facturación y relación con nosotros.",
    crmRestoSinPrueba:
      " (Plan Basic o Plan Pro), Bookmy es el responsable de los datos de tu cuenta, facturación y relación con nosotros.",
    appFuerte: "Si usas la app Bookmy para reservar",
    appResto:
      ", Bookmy es el responsable de los datos de tu cuenta en la app (perfil, inicio de sesión y preferencias).",
    clienteFuerte: "Si eres cliente de un negocio que usa Bookmy",
    clienteResto:
      " y reservas una cita con él, el responsable de tus datos es ese negocio. Bookmy los trata por su cuenta como encargado del tratamiento, conforme al artículo 28 del RGPD y al contrato de encargo firmado con cada negocio. Para ejercer tus derechos, dirígete al negocio; si nos escribes a nosotros, le trasladaremos tu solicitud.",
  },

  /* ── 3 · Qué datos tratamos ─────────────────────────────── */
  datos: {
    titulo: "Qué datos tratamos",
    contactoFuerte: "Identificación y contacto",
    contactoResto: ": nombre, email y teléfono.",
    negocioFuerte: "Datos de tu negocio",
    negocioResto: ": nombre comercial, tipo de empresa, país, sedes, servicios y equipo.",
    usoFuerte: "Datos de uso",
    usoResto: ": páginas visitadas, acciones dentro de la plataforma y preferencias de idioma o tema.",
    tecnicosFuerte: "Datos técnicos",
    tecnicosResto: ": dirección IP, tipo de dispositivo, navegador e identificadores de cookies.",
    chatFuerte: "Conversaciones con el asistente virtual",
    chatResto:
      ": lo que escribes en el chat y la información que decidas darnos (tipo de negocio, tamaño del equipo, número de sedes).",
    pagoFuerte: "Datos de pago",
    pagoResto:
      " (planes de pago): los procesan proveedores de pago certificados. Bookmy no almacena los datos completos de tu tarjeta.",
    nota:
      "No necesitamos datos de categorías especiales (por ejemplo, de salud) para atender tus consultas. Por favor, no los incluyas en el chat ni en los formularios.",
  },

  /* ── 4 · Finalidades y bases legales ────────────────────────
     Las ocho filas de la tabla: a la izquierda para qué, a la
     derecha el artículo del RGPD. Los artículos se portan tal
     cual, con su puntuación: «art. 6.1.b», «art. 21.2 LSSI». */
  finalidades: {
    titulo: "Para qué usamos tus datos y con qué base legal",
    columnaFinalidad: "Finalidad",
    columnaBase: "Base legal (RGPD)",

    cuentaFin: "Crear y gestionar tu cuenta, tus reservas y prestarte el servicio contratado.",
    cuentaBase: "Ejecución de un contrato (art. 6.1.b).",

    avisosFin: "Enviarte confirmaciones, recordatorios y avisos del servicio.",
    avisosBase: "Ejecución de un contrato (art. 6.1.b).",

    altaFinConPrueba:
      "Tramitar tu solicitud de alta y de prueba gratuita de {dias} días desde el formulario «Crear cuenta», y contactarte para activarla.",
    altaFinSinPrueba:
      "Tramitar tu solicitud de alta desde el formulario «Crear cuenta», y contactarte para activarla.",
    altaBase: "Aplicación de medidas precontractuales a petición tuya (art. 6.1.b).",

    soporteFin:
      "Responder a tus solicitudes de información, contacto, demostración o soporte, incluidas las que hagas a través del asistente.",
    soporteBase:
      "Aplicación de medidas precontractuales a petición tuya (art. 6.1.b) y tu consentimiento (art. 6.1.a).",

    facturarFin: "Facturar y cumplir nuestras obligaciones contables y fiscales.",
    facturarBase: "Obligación legal (art. 6.1.c).",

    newsletterFin: "Enviarte la newsletter y comunicaciones comerciales.",
    newsletterBase:
      "Tu consentimiento (art. 6.1.a). Si ya eres cliente, interés legítimo para informarte de productos similares (art. 21.2 LSSI), con opción de baja en cada envío.",

    protegerFin: "Proteger la plataforma, prevenir el fraude y mejorar el servicio con datos agregados.",
    protegerBase: "Interés legítimo (art. 6.1.f).",

    cookiesFin: "Medir el uso de la web y mostrar publicidad personalizada mediante cookies.",
    /* La celda lleva un enlace dentro, así que va en tres trozos:
       lo de antes, el texto del enlace y el punto final. */
    cookiesBaseA: "Tu consentimiento (art. 6.1.a), que puedes retirar en cualquier momento. Ver la ",
    cookiesEnlace: "política de cookies",
    cookiesBaseB: ".",

    nota:
      "No tomamos decisiones basadas únicamente en tratamientos automatizados que produzcan efectos jurídicos sobre ti o te afecten de forma significativa.",
  },

  /* ── 5 · El asistente virtual ───────────────────────────────
     Este apartado es el que enlaza /asistente-ia y el propio
     asistente del chat, que apuntan a /privacidad#asistente. */
  asistente: {
    titulo: "El asistente virtual",
    intro:
      "El chat de esta web es un asistente virtual que responde a tus dudas sobre Bookmy, te recomienda un plan y, si lo pides, pasa tu solicitud a nuestro equipo. Siempre se presenta como asistente virtual y puede cometer errores: para cuestiones de tu cuenta o de pagos, te derivará a una persona.",
    queFuerte: "Qué tratamos",
    queResto:
      ": los mensajes que escribes y los datos que decidas darnos. Si nos dejas tu nombre y tu email o teléfono, los usamos solo para responder a tu solicitud, con tu consentimiento.",
    dondeFuerte: "Dónde se guarda la conversación",
    dondeResto:
      ": en tu propio navegador, durante la sesión. Solo se conserva entre visitas si aceptas las cookies funcionales. Puedes borrarla con el botón «Empezar de nuevo».",
    iaFuerte: "Inteligencia artificial",
    iaResto:
      ": cuando el asistente funciona con un modelo de IA, tus mensajes se envían a nuestro proveedor de IA, que actúa como encargado del tratamiento, solo para generar la respuesta. No pedimos ni necesitamos datos sensibles: no los incluyas.",
    derechosFuerte: "Tus derechos",
    derechosResto: ": puedes ejercerlos como se explica en el apartado 9.",
  },

  /* ── 6 · Con quién compartimos tus datos ────────────────── */
  destinatarios: {
    titulo: "Con quién compartimos tus datos",
    intro:
      "No vendemos tus datos. Solo los compartimos cuando es necesario para prestar el servicio, con proveedores que actúan como encargados del tratamiento y están sujetos a contrato y confidencialidad:",
    infraestructura: "Proveedores de infraestructura, alojamiento y correo electrónico.",
    /* El punto de Qore Technology trae una duda sin resolver del
       original, en ámbar y entre corchetes: hay que confirmar su
       papel antes de publicar. Se porta tal cual. */
    qoreA: "Qore Technology, que recibe copia de las solicitudes de alta para ayudarnos a gestionarlas ",
    qorePendiente: "[confirma su papel: encargado del tratamiento o corresponsable]",
    qoreB: ".",
    pagos: "Procesadores de pago certificados (planes de pago).",
    analitica: "Herramientas de analítica y publicidad, solo si aceptas esas cookies.",
    ia: "Proveedor de inteligencia artificial del asistente, cuando está activo.",
    recaptcha:
      "Google reCAPTCHA, que protege los formularios de contacto, alta e inicio de sesión de la plataforma.",
    tipografias: "Proveedor de tipografías web, que recibe tu dirección IP al cargar la página.",
    autoridades: "Autoridades y organismos públicos, cuando la ley lo exija.",
  },

  /* ── 7 · Transferencias internacionales ─────────────────── */
  transferencias: {
    titulo: "Transferencias internacionales",
    texto:
      "Algunos de nuestros proveedores pueden estar fuera del Espacio Económico Europeo. En ese caso, solo trabajamos con quienes ofrecen garantías adecuadas: países con decisión de adecuación de la Comisión Europea (incluido, para empresas adheridas, el Marco de Privacidad de Datos UE-EE. UU.) o cláusulas contractuales tipo aprobadas por la Comisión.",
  },

  /* ── 8 · Cuánto tiempo los guardamos ────────────────────── */
  conservacion: {
    titulo: "Cuánto tiempo guardamos tus datos",
    cuentaFuerte: "Cuenta y servicio",
    cuentaResto:
      ": mientras tu cuenta esté activa. Después, bloqueados durante los plazos de prescripción de posibles responsabilidades.",
    facturacionFuerte: "Facturación",
    facturacionResto: ": durante los plazos que exige la normativa mercantil y fiscal (hasta 6 años).",
    solicitudesFuerte: "Solicitudes de información y de alta",
    solicitudesResto: ": hasta 12 meses desde nuestro último contacto si no llegas a contratar.",
    newsletterFuerte: "Newsletter",
    newsletterResto: ": hasta que te des de baja.",
    cookiesFuerte: "Cookies",
    cookiesRestoA: ": según los plazos de la ",
    cookiesEnlace: "política de cookies",
    cookiesRestoB: ".",
    nota:
      "Cuando pidas eliminar tu cuenta, suprimiremos o anonimizaremos tus datos, salvo los que debamos conservar por obligación legal.",
  },

  /* ── 9 · Tus derechos ───────────────────────────────────── */
  derechos: {
    titulo: "Tus derechos",
    intro: "Puedes ejercer en cualquier momento tus derechos de:",
    accesoFuerte: "Acceso",
    accesoResto: " a los datos que tenemos sobre ti.",
    rectificacionFuerte: "Rectificación",
    rectificacionResto: " de datos inexactos o incompletos.",
    supresionFuerte: "Supresión",
    supresionResto: " («derecho al olvido»).",
    oposicionFuerte: "Oposición",
    oposicionResto: " a determinados tratamientos, incluido el marketing.",
    limitacionFuerte: "Limitación",
    limitacionResto: " del tratamiento.",
    portabilidadFuerte: "Portabilidad",
    portabilidadResto: " de tus datos a otro proveedor.",
    consentimientoFuerte: "Retirar tu consentimiento",
    consentimientoResto: ", sin que afecte a los tratamientos anteriores.",
    /* El correo es el enlace del medio: va como dato en el
       componente, no como texto traducible. */
    contactoA: "Escríbenos a ",
    contactoB:
      " con el asunto «{asunto}», indicando el derecho que quieres ejercer. Si tenemos dudas razonables sobre tu identidad, podremos pedirte información adicional para confirmarla. Te responderemos en el plazo de un mes, ampliable en los casos que prevé el RGPD.",
    /* Entre las dos mitades va el enlace a www.aepd.es; la
       dirección postal de la Agencia es parte de la frase. */
    reclamacionA:
      "Si consideras que no hemos atendido bien tu solicitud, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (",
    reclamacionB: "), C/ Jorge Juan, 6, 28001 Madrid.",
  },

  /* ── 10 · Menores ───────────────────────────────────────── */
  menores: {
    titulo: "Menores de edad",
    texto:
      "Bookmy está dirigido a negocios y a personas mayores de 14 años. No tratamos conscientemente datos de menores de 14 años sin el consentimiento de sus padres o tutores. Si detectamos que lo hemos hecho, los eliminaremos.",
  },

  /* ── 11 · Seguridad ─────────────────────────────────────── */
  seguridad: {
    titulo: "Seguridad de la información",
    texto:
      "Aplicamos medidas técnicas y organizativas para proteger tus datos, como el cifrado en tránsito, el control de accesos por usuario y sede y la monitorización continua. Ningún sistema es infalible, por lo que te recomendamos también proteger tus contraseñas y no compartirlas.",
  },

  /* ── 12 · Cambios ───────────────────────────────────────── */
  cambios: {
    titulo: "Cambios en esta política",
    texto:
      "Podemos actualizar esta política para reflejar cambios legales o en nuestros servicios. Publicaremos la nueva versión en esta página con su fecha de actualización y, si el cambio es relevante, te lo comunicaremos.",
    notaA: "¿Tienes dudas sobre tus datos? Escríbenos a ",
    notaB: " y te ayudamos.",
  },

  /* ── La llamada que corona el pie ───────────────────────────
     Es la misma del original y la misma que cierra /crm, así que
     se dice igual que en crm.es.ts para que la web no tenga dos
     versiones de la misma promesa. */
  cta: {
    titulo: "Tu próxima reserva puede llegar",
    tituloEm: "mientras lees esto.",
    leadConPrueba:
      "Prueba Bookmy {dias} días gratis con Plan Basic o Plan Pro. Sin tarjeta y sin permanencia.",
    leadSinPrueba:
      "Crea tu cuenta gratis y empieza a recibir reservas hoy mismo. Sin tarjeta y sin permanencia.",
    botonConPrueba: "Prueba {dias} días gratis",
    botonSinPrueba: "Empieza gratis",
    botonDudas: "Tengo dudas",
  },
};

export default privacidadEs;
export type PrivacidadWeb = typeof privacidadEs;
