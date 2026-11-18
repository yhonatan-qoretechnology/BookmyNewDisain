/* ============================================================
   Web pública · /crm — la puerta del CRM — español
   ------------------------------------------------------------
   Es la pantalla más grande del sitio y la que vende el producto,
   así que aquí está TODO su texto: también el de los paneles de
   ejemplo (el escritorio del héroe, el calendario, las fichas, las
   facturas), que se ve en pantalla aunque vaya marcado como
   decorativo. Si se quedara escrito en el JSX, la web en inglés
   enseñaría medio panel en español.

   CÓMO ESTÁ ORGANIZADO
     · demo / gente / serv / importes / etiquetas → el negocio
       inventado que protagoniza las maquetas. Se repite por media
       página (panel, fichas, facturas, calendario), así que cada
       nombre vive una sola vez y lo reutiliza quien lo necesite.
     · después, una sección por cada bloque de la pantalla, en el
       mismo orden en que se ven.

   LA PRUEBA GRATUITA
   Cada texto que prometía los días de prueba está dos veces:
   «…ConPrueba» y «…SinPrueba». Quién manda es SE_OFRECE_PRUEBA de
   src/lib/web/oferta.ts, y los días nunca van escritos: llegan
   como {dias}. Hoy la prueba está apagada, así que lo que se lee
   en pantalla es siempre la versión «SinPrueba».

   POR QUÉ LOS IMPORTES NO SALEN DE money.ts
   Esta pantalla no enseña NINGÚN precio de Bookmy ni lleva
   calculadora: los euros que se ven son los de un negocio de
   ejemplo de la Costa del Sol (su panel, sus facturas). Son parte
   de la maqueta, como el nombre del negocio, y por eso se
   escriben aquí con sus céntimos tal cual los pintaba el diseño.
   Los precios de verdad y la calculadora viven en /planes, y esos
   sí salen de money.ts.
============================================================ */

const crmEs = {
  /* ── El <head> ─────────────────────────────────────────── */
  meta: {
    titulo: "CRM Bookmy · Reservas, clientes, cobros e IA para negocios de servicios",
    descripcionConPrueba:
      "Reservas online, CRM de clientes, cobros, equipo, inventario, sedes y un asistente IA que vende por ti. Pruébalo {dias} días gratis.",
    descripcionSinPrueba:
      "Reservas online, CRM de clientes, cobros, equipo, inventario, sedes y un asistente IA que vende por ti. Crea tu cuenta gratis y empieza hoy.",
  },

  /* ── El negocio de ejemplo de las maquetas ─────────────── */
  demo: {
    negocio: "Estudio Aura",
    inicial: "A",
    plataforma: "Bookmy · Plataforma de reservas",
    sedeCentro: "Sede Centro",
    sedePuerto: "Sede Puerto",
    sedePlaya: "Sede Playa",
  },

  gente: {
    lucia: "Lucía Martín",
    luciaCorto: "Lucía M.",
    luciaIni: "LM",
    carmen: "Carmen Ruiz",
    carmenCorto: "Carmen R.",
    carmenIni: "CR",
    marta: "Marta Gil",
    martaCorto: "Marta G.",
    martaIni: "MG",
    sofia: "Sofía Pérez",
    sofiaCorto: "Sofía P.",
    sofiaIni: "SP",
    elena: "Elena Vidal",
    elenaCorto: "Elena V.",
    elenaIni: "EV",
    andrea: "Andrea",
    andreaIni: "AN",
    paula: "Paula",
    paulaIni: "PA",
    irene: "Irene",
    ireneIni: "IR",
    direccion: "Dirección",
    direccionIni: "DV",
    clara: "Clara B.",
    eva: "Eva R.",
    ana: "Ana T.",
    rosa: "Rosa D.",
    nuria: "Nuria L.",
    ines: "Inés M.",
    laura: "Laura S.",
  },

  serv: {
    manicuraSemi: "Manicura semipermanente",
    liftingPestanas: "Lifting de pestañas",
    cejasHilo: "Depilación cejas con hilo",
    masajeRelajante: "Masaje relajante",
    cortePeinado: "Corte y peinado",
    manicuraParafina: "Manicura + parafina",
    manicura: "Manicura",
    masaje: "Masaje",
    cejas: "Cejas",
    pestanas: "Pestañas",
    facial: "Facial",
    corte: "Corte",
    spa: "Spa",
    unas: "Uñas",
    lifting: "Lifting",
    hueco: "Hueco libre",
  },

  /* Las cabeceras del calendario de ejemplo */
  dias: {
    lun: "Lun",
    mar: "Mar",
    mie: "Mié",
    jue: "Jue",
  },

  importes: {
    e12: "12,00 €",
    e25: "25,00 €",
    e32: "32,00 €",
    e33: "33,00 €",
    e40: "40,00 €",
    e45: "45,00 €",
    mes: "18.940 €",
    consumo: "486 €",
    extra: "+8 €",
    sedeMes: "7.820 €",
  },

  etiquetas: {
    online: "Online",
    local: "Local",
    enLocal: "En local",
    vip: "VIP",
    enDirecto: "En directo",
    enTiempoReal: "En tiempo real",
  },

  /* ── 1 · Héroe: el panel que se monta al bajar ─────────── */
  hero: {
    titulo: "El CRM con IA que llena tu agenda y",
    tituloVende: "vende por ti.",
    lead:
      "Reservas online 24/7, recordatorios, cobros, equipo y sedes en un solo panel. Y un asistente con inteligencia artificial que atiende y vende mientras tú trabajas.",
    ctaConPrueba: "Prueba {dias} días gratis",
    ctaSinPrueba: "Empieza gratis",
    ctaCalculadora: "Calcula lo que pierdes",
    pie: "Todo tu negocio.",
    piePanel: "Un solo panel.",
  },

  /* El escritorio de Bookmy que se ensambla en el héroe */
  panel: {
    alt:
      "Panel de Bookmy con clientes, ingresos del mes, reservas, valoración media y últimas reservas",
    url: "bookmy.es/dashboard",
    rol: "Usuario sede",
    idioma: "ES",
    miga: "Páginas / Dashboard",
    titulo: "Dashboard",
    sedeUsuario: "SC",
    nav: {
      dashboard: "Dashboard",
      reservas: "Reservas",
      clientes: "Clientes",
      servicios: "Servicios",
      personal: "Personal",
      calendario: "Calendario",
      resenas: "Reseñas",
      facturacion: "Facturación",
      estadisticas: "Estadísticas",
      sedes: "Sedes",
      stock: "Stock e insumos",
      comunicacion: "Comunicación",
      automatizaciones: "Automatizaciones",
    },
    kpi: {
      clientes: "Total de clientes",
      clientesValor: "1284",
      clientesPie: "+38 nuevos este mes",
      ingresos: "Ingresos del mes",
      ingresosPie: "+12 % vs. octubre",
      reservas: "Total de reservas",
      reservasValor: "342",
      reservasPie: "32 reservas hoy",
      valoracion: "Valoración media",
      valoracionValor: "4,9 ★",
      valoracionPie: "según reseñas",
    },
    ultimas: {
      titulo: "Últimas reservas",
      sub: "Actividad más reciente en {negocio}",
      boton: "+ Agregar una reserva",
      buscar: "Buscar por servicio, cliente, especialista o ID…",
    },
    col: {
      servicio: "Servicio",
      cliente: "Cliente",
      fecha: "Fecha",
      hora: "Hora",
      duracion: "Duración",
      precio: "Precio",
      estado: "Estado",
    },
    estado: {
      confirmada: "Confirmada",
      pendiente: "Pendiente",
      completada: "Completada",
      cancelada: "Cancelada",
    },
    fecha: {
      dia18: "18.11.2026",
      dia19: "19.11.2026",
      oct28: "28.10.2026",
      oct07: "07.10.2026",
      sep16: "16.09.2026",
    },
    duracion: {
      m15: "15 min",
      m45: "45 min",
      m50: "50 min",
      m60: "60 min",
    },
    /* Los tres avisos que flotan sobre el panel */
    aviso1: {
      titulo: "Reserva confirmada",
      texto: "{cliente} · {servicio} · vie 16:30",
      cuando: "ahora",
    },
    aviso2: {
      titulo: "La IA vendió un extra",
      texto: "Parafina {importe} · {cliente}",
      cuando: "1 min",
    },
    aviso3: {
      titulo: "Pago recibido",
      texto: "{importe} online · {cliente}",
      cuando: "8 min",
    },
  },

  /* ── 2 · Manifiesto que se ilumina al bajar ────────────── */
  manifiesto: {
    p1: "Bookmy no es otra agenda online. Es el",
    em1: "sistema operativo",
    p2:
      "de tu negocio: cada reserva crea un cliente, cada cliente deja datos y cada dato se convierte en",
    em2: "más ventas.",
  },

  /* ── 3 · Negocios y ciudades que ya lo usan ────────────── */
  confianza: {
    etiqueta: "Negocios y ciudades que ya trabajan con Bookmy",
    negocio1: "Glow Experience",
    negocio2: "Rituals by Glow",
    negocio3: "Qore Technology",
    negocio4: "Lash by Glow",
    negocio5: "Ink Nova",
    ciudad1: "Benalmádena",
    ciudad2: "Fuengirola",
    ciudad3: "Marbella",
    ciudad4: "Málaga",
    ciudad5: "Torremolinos",
    ciudad6: "Bogotá",
    ciudad7: "Medellín",
  },

  /* ── 4 · Módulos: el bento y la lista de «además» ──────── */
  modulos: {
    titulo1: "Un CRM completo, no otra app",
    titulo2: "de citas.",
    lead:
      "Todo lo que ves en tu panel de Bookmy trabaja junto: de la primera reserva a la factura, del primer cliente a tu próxima sede.",

    reservas: {
      titulo: "Reservas y calendario en tiempo real",
      texto:
        "Tus clientes reservan 24/7 desde tu perfil o la app y reciben confirmación al instante. Reglas de disponibilidad, recordatorios automáticos y reprogramaciones sin llamadas.",
      semana: "Semana 47",
      sub: "{sede} · 32 citas hoy",
      huecoNota: "La IA lo ofrece",
    },

    clientes: {
      titulo: "CRM de clientes",
      texto:
        "La ficha completa de cada cliente: visitas, preferencias y consumo. Sabes quién va a volver y qué ofrecerle.",
      desde: "Clienta desde 2024 · Prefiere tardes",
      visitas: "14",
      visitasPie: "visitas",
      consumoPie: "consumo",
      frecuencia: "3 sem.",
      frecuenciaPie: "frecuencia",
    },

    facturacion: {
      titulo: "Facturación y pagos",
      texto: "Cobra online o en el local, con la trazabilidad de cada transacción.",
    },

    estadisticas: {
      titulo: "Estadísticas en tiempo real",
      texto: "Ingresos, reservas y servicios que más rinden, al instante.",
    },

    equipo: {
      titulo: "Equipo y sedes, en un solo panel",
      texto:
        "Roles, horarios y servicios para cada profesional. Cambia de sede en un clic y da a cada usuario acceso solo a la suya.",
      equipo: "Equipo",
      personas: "4 personas",
      oficioUnas: "Uñas",
      oficioSpa: "Spa",
      oficioEstetica: "Estética",
      sedeActiva: "Activa",
      sedeReservas18: "18 reservas hoy",
      sedeReservas14: "14 reservas hoy",
    },

    mas: {
      titulo: "Y además, en el mismo panel",
      stock: "Stock e insumos",
      stockTexto: "Inventario sincronizado con cada reserva o venta.",
      servicios: "Servicios",
      serviciosTexto: "Duración, precio y profesional de cada servicio.",
      calendario: "Calendario",
      calendarioTexto: "Vista mensual de reservas y huecos libres.",
      resenas: "Reseñas",
      resenasTexto: "Tu valoración media y las opiniones, en el panel.",
      comunicacion: "Comunicación",
      comunicacionTexto: "Habla con tus clientes desde la plataforma.",
      automatizaciones: "Automatizaciones",
      automatizacionesTexto: "Confirmaciones y recordatorios que se hacen solos.",
      roles: "Roles y accesos",
      rolesTexto: "Usuarios por sede y permisos por perfil.",
      app: "App iOS y Android",
      appTexto: "Reserva y gestiona desde cualquier dispositivo.",
      idioma: "Idioma y modo oscuro",
      idiomaTexto: "En español o inglés, de día o de noche.",
      asistente: "Asistente IA",
      asistenteTexto: "Atiende, reserva y vende 24/7 por ti.",
    },
  },

  /* ── 5 · Así trabaja: las cuatro cartas que se apilan ──── */
  flujo: {
    titulo: "Así trabaja Bookmy por ti, cada día.",
    lead:
      "Un panel. Todo tu negocio. Cuatro tareas que dejan de quitarte tiempo desde el primer día.",

    agenda: {
      titulo: "Tu agenda se llena sola, 24/7.",
      texto:
        "Tus clientes eligen servicio, fecha y especialista desde tu perfil o la app. Tú ves cada cita confirmada en tiempo real, por profesional y por sede.",
      check1: "Confirmación inmediata",
      check2: "Recordatorios automáticos",
      check3: "Reprogramaciones sin fricciones",
      panel: "Calendario",
      panelSub: "Semana 47 · {sede}",
      citasHoy: "32 citas hoy",
      hueco18: "18:00",
      pista:
        "Hueco libre el jueves a las 18:00. La IA puede ofrecerlo a 6 clientas que suelen reservar a esa hora.",
    },

    ficha: {
      titulo: "Conoce a cada cliente como si fuera el único.",
      texto:
        "Historial de visitas, preferencias y consumo en una ficha. Sabes quién va a volver, quién se está enfriando y qué ofrecerle a cada uno.",
      check1: "Historial completo",
      check2: "Preferencias y notas",
      check3: "Sugerencias de la IA",
      desde: "Clienta desde marzo de 2024 · Prefiere tardes",
      visitas: "14",
      visitasPie: "visitas",
      consumoPie: "consumo total",
      frecuencia: "3 sem.",
      frecuenciaPie: "frecuencia",
      pista:
        "Lucía suele volver cada 3 semanas. Ofrécele cita esta semana y el tratamiento de parafina ({importe}).",
    },

    cobros: {
      titulo: "Cobra sin perseguir a nadie.",
      texto:
        "Pagos online o en el local, facturación y trazabilidad de cada transacción en el mismo sitio donde gestionas tus citas.",
      check1: "Pagos 100 % protegidos",
      check2: "Online o en local",
      check3: "Facturación integrada",
      panel: "Facturación",
      panelSub: "Noviembre 2026",
      subida: "+12 %",
      ingresosPie: "Ingresos del mes",
      factura1: "F-2026-0412",
      factura2: "F-2026-0411",
      factura3: "F-2026-0410",
      factura4: "F-2026-0409",
      pagosOnline: "Pagos online",
      pagosOnlineValor: "64 %",
    },

    datos: {
      titulo: "Decide con datos, no a ojo.",
      texto:
        "Ocupación, ingresos, servicios estrella y rendimiento por profesional y sede, actualizados al instante.",
      check1: "Estadísticas en tiempo real",
      check2: "Comparativas por sede",
      check3: "Reseñas y valoración media",
      panel: "Estadísticas",
      panelSub: "Todas las sedes · últimas 4 semanas",
      ocupacion: "78 %",
      ocupacionPie: "ocupación",
      semana44: "S44",
      semana45: "S45",
      semana46: "S46",
      semana47: "S47",
      estrella: "{servicio}",
      estrellaPie: "126 citas",
      mejorSede: "{sede}, mejor del mes",
    },
  },

  /* ── 6 · Asistente IA ──────────────────────────────────── */
  ia: {
    titulo: "Tu mejor vendedor no descansa.",
    tituloComision: "Ni cobra comisión.",
    lead:
      "El asistente IA de Bookmy atiende a tus clientes a cualquier hora, reserva con tu disponibilidad real y sugiere el extra perfecto según su historial.",
    cap1: "Atiende 24/7",
    cap1Texto:
      "Resuelve dudas de precios, servicios y horarios al momento, también un domingo a las 23:40.",
    cap2: "Reserva y reprograma",
    cap2Texto:
      "Ofrece huecos reales de tu agenda y deja la cita confirmada sin que muevas un dedo.",
    cap3: "Vende más en cada cita",
    cap3Texto: "Sugiere extras y servicios según lo que cada cliente ya compra.",
    cap4: "Recupera clientes",
    cap4Texto:
      "Detecta quién lleva tiempo sin venir y le invita a volver con un mensaje personal.",
    cta: "Conoce el asistente IA",
    ctaHablar: "Habla con él ahora",

    chatTitulo: "Asistente de {negocio}",
    chatEstado: "En línea",
    chatRepetir: "Repetir la conversación",
    chat1: "¡Hola! ¿Tenéis hueco para manicura este viernes por la tarde?",
    chat2:
      "¡Hola, Lucía! El viernes tengo libre a las 16:30 con Andrea o a las 18:00 con Paula. ¿Cuál te va mejor?",
    chat3: "A las 16:30, perfecto.",
    chat4:
      "¡Hecho! Manicura semipermanente el viernes a las 16:30 con Andrea. La última vez te encantó la parafina: ¿te la añado por 8 €?",
    chat4Nota: "Sugerencia según su historial",
    chat5: "¡Venga, sí!",
    chat6: "Listo: 33 € en total. Te envío un recordatorio el jueves. ¡Hasta el viernes!",
    toast: "+8 € en esta cita",
    toastPie: "Extra sugerido por la IA",
  },

  /* ── 7 · Sectores ──────────────────────────────────────── */
  sectores: {
    titulo: "Se adapta al ritmo de tu negocio.",
    lead:
      "Salud, estética, construcción, tecnología o servicios: si trabajas con citas, Bookmy trabaja para ti.",

    estetica: "Estética y belleza",
    esteticaTexto: "Llena huecos, reduce ausencias y haz que cada clienta repita.",
    esteticaTag1: "Uñas",
    esteticaTag2: "Pestañas y cejas",
    esteticaTag3: "Depilación",
    esteticaTag4: "Spa y masajes",

    peluqueria: "Peluquería y barbería",
    peluqueriaTexto: "Cada cliente elige profesional y hora; tú dejas el teléfono.",
    peluqueriaTag1: "Corte y color",
    peluqueriaTag2: "Barbería",
    peluqueriaTag3: "Tratamientos",

    salud: "Salud",
    saludTexto:
      "Agenda por profesional, recordatorios y el historial de visitas de cada paciente.",
    saludTag1: "Fisioterapia",
    saludTag2: "Clínicas",
    saludTag3: "Psicología",
    saludTag4: "Nutrición",

    construccion: "Construcción y reformas",
    construccionTexto: "Visitas técnicas y citas con clientes, coordinadas con tu equipo.",
    construccionTag1: "Reformas",
    construccionTag2: "Instalaciones",
    construccionTag3: "Visitas de obra",

    tecnologia: "Tecnología",
    tecnologiaTexto: "Demos, soporte técnico y reparaciones, sin choques de agenda.",
    tecnologiaTag1: "Soporte",
    tecnologiaTag2: "Reparaciones",
    tecnologiaTag3: "Consultoría",

    servicios: "Servicios",
    serviciosTexto:
      "Cualquier negocio que viva de su agenda, más ordenado y más rentable.",
    serviciosTag1: "Academias",
    serviciosTag2: "Asesorías",
    serviciosTag3: "Fotografía",
    serviciosTag4: "Talleres",
  },

  /* ── 8 · Cifras ────────────────────────────────────────── */
  cifras: {
    etiqueta: "Bookmy en cifras",
    reservas: "+25K",
    reservasPrefijo: "+",
    reservasSufijo: "K",
    reservasPie: "reservas gestionadas",
    confirmadas: "98 %",
    confirmadasSufijo: " %",
    confirmadasPie: "confirmadas al instante",
    valoracion: "4,9★",
    valoracionSufijo: "★",
    valoracionPie: "de valoración en tiendas",
    minutos: "2 min",
    minutosSufijo: " min",
    minutosPie: "de tiempo de confirmación",
  },

  /* ── 9 · Testimonios ───────────────────────────────────── */
  voces: {
    titulo: "Negocios que ya trabajan con Bookmy.",
    anterior: "Testimonio anterior",
    siguiente: "Siguiente testimonio",
    voz1:
      "“Bookmy transformó por completo nuestra gestión de reservas. Hoy tenemos una agenda organizada, menos cancelaciones y clientes más felices.”",
    voz1Quien: "Antonella Dávila",
    voz1Cargo: "Gerente · Glow Experience",
    voz1Ini: "AD",
    voz2:
      "“Necesitábamos centralizar reservas y clientes. Con Bookmy automatizamos procesos y mejoramos el seguimiento comercial del equipo.”",
    voz2Quien: "Johan Castillo",
    voz2Cargo: "Gerente · Qore Technology",
    voz2Ini: "JC",
    voz3:
      "“La aplicación es intuitiva y rápida de implementar. Nuestros clientes reservan en segundos y nosotros controlamos todo desde cualquier lugar.”",
    voz3Quien: "Samantha",
    voz3Cargo: "Gerente · Glow Experience Marbella",
    voz3Ini: "S",
  },

  /* ── 10 · Planes ───────────────────────────────────────── */
  planes: {
    tituloConPrueba: "Pruébalo gratis. Crece sin límites.",
    tituloSinPrueba: "Empieza gratis. Crece sin límites.",
    leadConPrueba:
      "Recibe reservas hoy mismo con el Plan Basic o desbloquea todo el sistema con el Plan Pro. Los dos, {dias} días gratis.",
    leadSinPrueba:
      "Recibe reservas hoy mismo con el Plan Basic o descubre todo lo que suma el Plan Pro. Crear tu cuenta es gratis y no pedimos tarjeta.",
    comparar: "Comparar planes en detalle",
    verTodo: "Ver todo lo que incluye",

    basic: {
      desc: "Organiza tus reservas fácilmente y deja el teléfono.",
      precioConPrueba: "{dias} días",
      precioPieConPrueba: "gratis para probarlo",
      precioSinPrueba: "Gratis",
      precioPieSinPrueba: "para empezar hoy mismo",
      check1: "Gestión básica de reservas",
      check2: "Agenda digital 24/7",
      check3: "Confirmaciones automáticas",
      check4: "Acceso desde móvil y tablet",
      check5: "Perfil público para clientes",
      ctaConPrueba: "Probar Plan Basic",
      ctaSinPrueba: "Empezar con el Plan Basic",
      notaConPrueba: "{dias} días gratis · sin tarjeta · sin permanencia",
      notaSinPrueba: "Sin tarjeta · sin permanencia · lo dejas cuando quieras",
    },

    pro: {
      desc: "Lleva tu negocio al siguiente nivel, con una o varias sedes.",
      precioConPrueba: "{dias} días",
      precioPieConPrueba: "gratis para probarlo",
      precioSinPrueba: "Sin límites",
      precioPieSinPrueba: "todo el sistema, de una vez",
      check1: "Todo lo del Plan Basic, y además:",
      check2: "CRM de clientes",
      check3: "Facturación y pagos",
      check4: "Gestión avanzada de reservas",
      check5: "Administración de trabajadores",
      check6: "Control de inventario",
      check7: "Estadísticas en tiempo real",
      check8: "Múltiples sucursales",
      ctaConPrueba: "Probar Plan Pro",
      ctaSinPrueba: "Quiero el Plan Pro",
      notaConPrueba: "{dias} días gratis · sin tarjeta · sin permanencia",
      notaSinPrueba: "Sin tarjeta · sin permanencia · lo dejas cuando quieras",
    },
  },

  /* ── 11 · La app para empresas ─────────────────────────── */
  app: {
    titulo: "Tu negocio, también en la app.",
    tituloClientes: "Tus clientes, a un toque de reservar.",
    lead:
      "Con tu cuenta del CRM apareces en la app Bookmy: tus clientes te encuentran, reservan y pagan en segundos, y tú gestionas las citas desde el móvil, estés donde estés.",
    check1: "Reservas en tiempo real",
    check2: "Avisos al instante",
    check3: "Recordatorios automáticos",
    check4: "Cobros desde el móvil",
    enlace: "Así funciona la app para empresas",
    alt:
      "La app Bookmy en dos móviles: elegir especialista y fecha, y la reserva confirmada",
  },

  /* ── 12 · Preguntas frecuentes ─────────────────────────── */
  faq: {
    titulo: "Resolvemos tus dudas.",
    lead: "¿Te queda alguna?",
    leadBoton: "Pregúntale al asistente",

    q1: "¿Bookmy es solo una app de reservas?",
    a1:
      "No. Las reservas son la puerta de entrada, pero Bookmy es un sistema completo: CRM de clientes, cobros y facturación, equipo, inventario, varias sedes, estadísticas en tiempo real y un asistente con IA, todo en el mismo panel.",

    q2: "¿Cómo ayuda el CRM a controlar mis reservas?",
    a2:
      "Centraliza reservas, clientes y servicios en una sola plataforma. Cada cita queda ligada a la ficha del cliente, con su historial, preferencias y consumo, para que gestiones tu negocio de forma más eficiente y vendas mejor.",

    q3: "¿Puedo probarlo gratis?",
    a3ConPrueba:
      "Sí. El Plan Basic y el Plan Pro se pueden probar {dias} días gratis, sin tarjeta y sin permanencia. Al terminar, tú decides si sigues y con qué plan.",
    a3SinPrueba:
      "Sí. Crear tu cuenta es gratis y puedes empezar a recibir reservas hoy mismo, sin tarjeta y sin permanencia.",

    q4: "¿Mis clientes pueden elegir al profesional que les atiende?",
    a4:
      "Sí. Al reservar eligen servicio, fecha y el especialista disponible que mejor se adapte a su horario o preferencias, y reciben la confirmación al instante.",

    q5: "¿Qué pasa si un cliente necesita cambiar o cancelar su cita?",
    a5:
      "Puede modificarla o cancelarla desde su perfil, sin coste adicional, siempre que lo haga con antelación. Tu agenda se actualiza sola y el hueco vuelve a quedar disponible.",

    q6: "¿Funciona si tengo varias sedes?",
    a6:
      "Sí. Con el Plan Pro administras todas tus sedes desde un mismo panel central y das a cada usuario acceso a la suya.",

    q7: "¿Qué hace exactamente el asistente IA?",
    a7:
      "Atiende a tus clientes 24/7, reserva con tu disponibilidad real, sugiere extras según el historial de cada cliente y ayuda a recuperar a quien lleva tiempo sin venir.",
    a7Enlace: "Descúbrelo",
  },

  /* ── 13 · La llamada que corona el pie ─────────────────── */
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

export default crmEs;
export type CrmWeb = typeof crmEs;
