/* ============================================================
   Web pública · /planes/basic — el Plan Basic (ES)
   ------------------------------------------------------------
   El texto de una sola pantalla. Lo del armazón (cabecera, pie,
   menú) está en comun.es.ts y aquí no se repite.

   EL NOMBRE COMERCIAL ES «PLAN BASIC»
   El backend llama FREE a este plan, pero la web nunca lo dice:
   de cara al visitante se llama Plan Basic y así se queda.

   LOS TEXTOS QUE VAN POR PAREJAS (…ConPrueba / …SinPrueba)
   El diseño original prometía siete días de prueba en el héroe,
   en la lista de «es para ti», en la tabla, en tres preguntas y
   en la llamada final. Esa prueba HOY NO EXISTE (ver
   src/lib/web/oferta.ts: el backend no concede ninguna y los
   cobros aún no funcionan), así que cada uno de esos textos está
   escrito dos veces y `SE_OFRECE_PRUEBA` elige cuál se enseña.

   La versión SinPrueba no es un parche: es la que está en
   pantalla hoy, y se apoya en algo que sí es verdad —el Plan
   Basic no cuesta nada—, así que no promete ni un día de nada.

   Donde se habla de días nunca aparece el número escrito: va
   como {dias} y lo pone DIAS_DE_PRUEBA.
============================================================ */

const planBasicEs = {
  /* Lo que ve Google y lo que se lee en una pestaña */
  meta: {
    titulo: "Plan Basic · Organiza tus reservas desde hoy",
    descripcionConPrueba:
      "El Plan Basic del CRM Bookmy: agenda digital 24/7, confirmaciones automáticas, perfil público y acceso desde móvil o tablet. {dias} días gratis.",
    descripcionSinPrueba:
      "El Plan Basic del CRM Bookmy: agenda digital 24/7, confirmaciones automáticas, perfil público y acceso desde móvil o tablet. Gratis y sin tarjeta.",
  },

  /* ── 1 · Héroe ─────────────────────────────────────────── */
  hero: {
    volver: "Todos los planes",
    /* El titular va partido porque la segunda mitad se pinta en
       verde menta, igual que en el diseño. */
    tituloA: "Tus reservas, organizadas",
    tituloB: "desde hoy.",
    lead:
      "El Plan Basic te da lo esencial para recibir reservas online y dejar el teléfono: agenda 24/7, confirmaciones automáticas y tu perfil público. Ideal si estás dando tus primeros pasos.",

    /* El bloque grande del precio: la cifra y su pie. */
    precioCifraConPrueba: "{dias} días",
    precioPieConPrueba: "gratis para probarlo",
    precioCifraSinPrueba: "Gratis",
    precioPieSinPrueba: "para empezar, sin tarjeta",

    ctaConPrueba: "Probar Plan Basic gratis",
    ctaSinPrueba: "Empezar con el Plan Basic",
    ctaComparar: "Comparar con Plan Pro",
    nota: "Sin tarjeta · sin permanencia · para profesionales y negocios con una sede",

    /* El teléfono y la agenda que flotan a su lado */
    telefonoAlt: "Tus clientes eligen día y hora desde la app Bookmy",
    agendaHoy: "Hoy",
    agendaReservas: "3 reservas",
    agendaAbierta: "Abierta 24/7",
    chipNuevaTitulo: "Nueva reserva",
    chipNuevaTexto: "Confirmada automáticamente",
    chipHorarioTitulo: "Agenda abierta 24/7",
    chipHorarioTexto: "También fuera de horario",
  },

  /* Las reservas de ejemplo. Salen dos veces (en la agenda del
     héroe y en la primera tarjeta del bento), así que viven
     juntas y no duplicadas. */
  reservas: {
    manicura: "Manicura · Lucía M.",
    cejas: "Cejas · Marta G.",
    masaje: "Masaje · Sofía P.",
    corte: "Corte · Elena V.",
    confirmada: "Confirmada",
    pendiente: "Pendiente",
  },

  /* ── 2 · Qué incluye (el bento) ────────────────────────── */
  incluye: {
    titulo: "Esto es lo que obtienes con el Plan Basic.",
    lead: "Lo esencial para dejar de gestionar citas por teléfono y WhatsApp, listo en minutos.",

    gestionTitulo: "Gestión básica de reservas",
    gestionTexto:
      "Recibe y organiza las reservas de tus clientes desde un panel simple, sin curva de aprendizaje.",
    gestionPanelTitulo: "Reservas de hoy",
    gestionPanelSede: "Sede única",
    gestionPanelDirecto: "En directo",

    agendaTitulo: "Agenda digital 24/7",
    agendaTexto:
      "Tu negocio queda disponible para reservar en cualquier momento, incluso fuera de tu horario de atención.",
    agendaRecibida: "Reserva recibida",
    agendaDomingo: "Domingo",
    agendaLunes: "Lunes",
    agendaFestivo: "Festivo",

    confirmaTitulo: "Confirmaciones automáticas",
    confirmaTexto: "Cada reserva se confirma al instante, sin que tengas que llamar o escribir.",
    confirmaToastTitulo: "Confirmada",
    confirmaToastTexto: "al instante",

    dispositivosTitulo: "Acceso desde móvil y tablet",
    dispositivosTexto: "Gestiona tu agenda desde cualquier dispositivo, sin instalar software adicional.",
    dispositivosMovil: "Móvil",
    dispositivosTablet: "Tablet",

    perfilTitulo: "Perfil público para clientes",
    perfilTexto:
      "Tus clientes encuentran tu negocio, servicios y disponibilidad en un perfil fácil de compartir.",
    perfilWeb: "Tu web",
  },

  /* ── 3 · ¿Es para ti? ──────────────────────────────────── */
  perfecto: {
    titulo: "El Plan Basic es perfecto si…",
    p1: "Trabajas por tu cuenta o estás empezando tu negocio.",
    p2: "Tienes un solo local y una agenda que organizar.",
    p3: "Quieres dejar el teléfono y el WhatsApp para gestionar citas.",
    p4ConPrueba: "Quieres probar Bookmy {dias} días, sin tarjeta y sin compromiso.",
    p4SinPrueba: "Quieres probar Bookmy sin tarjeta y sin compromiso.",
    asideTexto:
      "Empiezas, trabajas por tu cuenta o quieres probar Bookmy sin compromiso. Cuando crezcas, das el salto a Pro sin cambiar de herramienta.",
    asideTitulo: "¿Tienes equipo, varias sedes o quieres controlar cobros y clientes?",
    asideEnlace: "Mira el Plan Pro",
  },

  /* ── 4 · Tres pasos ────────────────────────────────────── */
  pasos: {
    titulo: "Tres pasos y recibes tu primera reserva.",
    unoTitulo: "Crea tu cuenta",
    unoTexto: "Regístrate en menos de un minuto, sin tarjeta.",
    dosTitulo: "Añade tus servicios",
    dosTexto: "Duración, precio y horario. Listo para recibir citas.",
    tresTitulo: "Comparte tu perfil",
    tresTexto: "En tus redes, en WhatsApp o en tu web. Tus clientes reservan solos.",
  },

  /* ── 5 · Basic frente a Pro ────────────────────────────── */
  comparar: {
    tituloA: "Basic para empezar.",
    tituloB: "Pro para no parar.",
    /* Resumen de la tabla para quien navega con lector de pantalla */
    resumen: "Qué incluye el Plan Basic y qué añade el Plan Pro",
    colFuncion: "Funcionalidad",
    colBasic: "Basic",
    colPro: "Pro",
    notaBasicConPrueba: "{dias} días gratis",
    notaProConPrueba: "{dias} días gratis",
    notaBasicSinPrueba: "Gratis para empezar",
    notaProSinPrueba: "El sistema completo",
    si: "Incluido",
    no: "No incluido",
    f1: "Reservas online 24/7 y perfil público",
    f2: "Confirmaciones automáticas",
    f3: "Recordatorios y reprogramaciones",
    f4: "CRM de clientes",
    f5: "Facturación y pagos",
    f6: "Equipo, inventario y varias sedes",
    f7: "Estadísticas en tiempo real",
    f8: "Asistente IA vendedor",
    /* Sin prueba que ofrecer, el botón deja de invitar a un alta en
       Pro (que el backend crearía en Basic) y lleva a conocerlo. */
    ctaProConPrueba: "Probar Plan Pro {dias} días gratis",
    ctaProSinPrueba: "Ver el Plan Pro",
    ctaCompleta: "Ver la comparativa completa",
  },

  /* ── 6 · Preguntas ─────────────────────────────────────── */
  faq: {
    titulo: "Sin letra pequeña.",
    q1ConPrueba: "¿Cuánto dura la prueba gratis?",
    a1ConPrueba:
      "{dias} días, con todo el Plan Basic desde el primer momento. No pedimos tarjeta, así que no hay cargos automáticos.",
    q1SinPrueba: "¿El Plan Basic es gratis?",
    a1SinPrueba:
      "Sí. El Plan Basic no cuesta nada: creas tu cuenta, montas tus servicios y empiezas a recibir reservas. No pedimos tarjeta, así que no hay cargos automáticos.",
    q2: "¿Necesito tarjeta para darme de alta?",
    a2: "No. Creas tu cuenta en minutos sin dejar ningún dato de pago.",
    q3ConPrueba: "¿Qué pasa cuando terminan los {dias} días?",
    a3ConPrueba: "Tú decides si continúas con Basic, si pasas a Pro o si lo dejas. Sin permanencia.",
    q3SinPrueba: "¿Puedo dejarlo cuando quiera?",
    a3SinPrueba:
      "Sí. No hay permanencia: usas el Plan Basic el tiempo que te convenga y lo dejas el día que quieras.",
    q4: "¿Puedo pasarme a Pro más adelante?",
    a4ConPrueba:
      "Sí, cuando lo necesites y sin cambiar de herramienta. También puedes probar Pro directamente {dias} días gratis.",
    a4SinPrueba:
      "Sí, cuando lo necesites y sin cambiar de herramienta: tu agenda, tus servicios y tus clientes se quedan donde están.",
    q5: "¿Desde qué dispositivos puedo usarlo?",
    /* La respuesta lleva un enlace en medio, así que va en tres
       trozos: lo de antes, el enlace y lo de después. */
    a5Antes:
      "Desde el móvil, la tablet o el ordenador, sin instalar software adicional. Tus clientes reservan desde tu perfil público o desde la",
    a5Enlace: "app Bookmy",
    a5Despues: ", que para ellos es gratis.",
  },

  /* ── 7 · Llamada final, encima del pie ─────────────────── */
  cierre: {
    tituloA: "Organiza tus reservas fácilmente.",
    tituloB: "Desde hoy.",
    leadConPrueba:
      "Crea tu cuenta en minutos y empieza a recibir reservas hoy mismo. Los primeros {dias} días son gratis.",
    leadSinPrueba:
      "Crea tu cuenta en minutos y empieza a recibir reservas hoy mismo. El Plan Basic no cuesta nada.",
    ctaConPrueba: "Probar Plan Basic {dias} días gratis",
    ctaSinPrueba: "Crear mi cuenta gratis",
    ctaAsistente: "¿Basic o Pro?",
    /* Lo que el asistente enseña escrito en el chat al pulsarlo */
    ctaAsistenteFrase: "¿Basic o Pro? Recomiéndame un plan",
  },
};

export default planBasicEs;
export type PlanBasicWeb = typeof planBasicEs;
