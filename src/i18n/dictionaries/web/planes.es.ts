/* ============================================================
   Web pública · /planes — comparar Plan Basic y Plan Pro (ES)
   ------------------------------------------------------------
   Sale de planes.html del rediseño. Aquí está TODO el texto de esa
   pantalla; el marcado lo pone src/app/(web)/planes/Planes.tsx.

   Lo que NO está aquí, a propósito:
     · la cabecera, el pie y el menú → comun.es.ts,
     · el nombre de los planes, «Más popular» y «Nuevo», que
       también son de comun.es.ts para que se llamen igual en toda
       la web (nav.planBasic, nav.planPro, nav.masPopular…),
     · los nombres de los 23 países de la calculadora, que los
       escribe el motor desde src/lib/web/money.ts.

   LA PRUEBA GRATUITA VA ESCRITA DOS VECES
   El original prometía «7 días gratis» en diez sitios de esta sola
   página. Hoy esa prueba está apagada (src/lib/web/oferta.ts: el
   backend no concede ninguna y los cobros todavía no funcionan),
   así que cada texto que la mencionaba tiene dos versiones:

     …ConPrueba  · la que volverá el día que se encienda.
     …SinPrueba  · la que se ve HOY en pantalla.

   Las dos están cuidadas igual; la de hoy es la que lee la gente.
   Y los días NUNCA se escriben con un número: van como {dias} y
   los rellena DIAS_DE_PRUEBA al pintar el texto.
============================================================ */

const planesEs = {
  /* El <head> de la página. Lo lee page.tsx, que es de servidor y
     no puede usar el hook de traducción, así que de estas cuatro
     claves solo se usa la versión española: la web no tiene una
     dirección distinta por idioma. */
  meta: {
    tituloConPrueba: "Planes del CRM · Plan Basic y Plan Pro, con {dias} días gratis",
    tituloSinPrueba: "Planes del CRM · Plan Basic gratis y Plan Pro a medida",
    descripcionConPrueba:
      "Plan Basic y Plan Pro del CRM Bookmy: pruébalos {dias} días gratis, sin tarjeta y sin permanencia. Compara planes y calcula lo que recuperas.",
    descripcionSinPrueba:
      "Plan Basic y Plan Pro del CRM Bookmy: empieza gratis con el Basic, sin tarjeta y sin permanencia, y pasa a Pro cuando lo necesites. Compara planes y calcula lo que recuperas.",
    imagenAlt: "El panel del CRM Bookmy",
  },

  /* ── Héroe: los dos planes como monolitos ───────────────── */
  hero: {
    titulo: "Un plan para empezar.",
    /* La segunda frase va en verde menta, por eso es otra clave. */
    tituloMint: "Otro para no parar.",
    leadConPrueba:
      "Los planes del CRM Bookmy para tu negocio: recibe reservas hoy mismo con el Plan Basic o desbloquea todo el sistema con el Plan Pro. Los dos, {dias} días gratis, sin tarjeta y sin permanencia.",
    leadSinPrueba:
      "Los planes del CRM Bookmy para tu negocio: recibe reservas hoy mismo con el Plan Basic, que es gratis, y desbloquea todo el sistema con el Plan Pro cuando te haga falta. Sin tarjeta y sin permanencia.",
  },

  basic: {
    desc: "Organiza tus reservas fácilmente y deja el teléfono. Ideal si estás dando tus primeros pasos.",
    /* EL PRECIO TODAVÍA NO SE PUBLICA. En el original, donde iría la
       cifra grande va la prueba («7 días · gratis para probarlo»).
       Sin prueba, lo que se anuncia es la verdad del alta de hoy: el
       Plan Basic no cuesta nada. */
    precioConPrueba: "{dias} días",
    precioPieConPrueba: "gratis para probarlo",
    precioSinPrueba: "Gratis",
    precioPieSinPrueba: "para empezar hoy mismo",
    nota: "Sin tarjeta y sin permanencia. Empieza a recibir reservas en minutos.",

    /* Las cinco líneas de la lista. La clave que acaba en B es la
       parte en negrita, con su puntuación incluida, y la otra el
       resto de la frase. */
    reservasB: "Gestión básica de reservas:",
    reservas: "recibe y organiza las citas desde un panel simple.",
    agendaB: "Agenda digital 24/7:",
    agenda: "tu negocio, disponible para reservar a cualquier hora.",
    confirmacionesB: "Confirmaciones automáticas",
    confirmaciones: "al instante, sin llamar ni escribir.",
    movilB: "Acceso desde móvil y tablet,",
    movil: "sin instalar software adicional.",
    perfilB: "Perfil público para clientes,",
    perfil: "fácil de compartir.",

    ctaConPrueba: "Probar Plan Basic {dias} días gratis",
    ctaSinPrueba: "Empezar gratis con el Plan Basic",
    ctaPie: "Puedes pasar a Pro cuando lo necesites.",
    ver: "Ver todo lo que incluye",
  },

  pro: {
    desc: "Automatiza procesos, optimiza recursos y administra cada área de tu empresa. Para negocios en crecimiento y con varias sedes.",
    precioConPrueba: "{dias} días",
    precioPieConPrueba: "gratis para probarlo",
    precioSinPrueba: "A medida",
    precioPieSinPrueba: "según el tamaño de tu negocio",
    notaConPrueba: "Sin tarjeta y sin permanencia. Después, un precio adaptado a tu negocio.",
    notaSinPrueba: "Sin permanencia. Nos cuentas cómo trabajas y te pasamos un precio adaptado a tu negocio.",

    todoBasic: "Todo lo del Plan Basic, y además:",
    crmB: "CRM de clientes:",
    crm: "historial de visitas, preferencias y consumo.",
    facturacionB: "Facturación y pagos",
    facturacion: "online o en el local, con trazabilidad.",
    reservasB: "Gestión avanzada de reservas:",
    reservas: "reglas de disponibilidad, recordatorios y reprogramaciones.",
    equipoB: "Administración de trabajadores:",
    equipo: "roles, horarios y servicios.",
    inventarioB: "Control de inventario",
    inventario: "sincronizado con reservas y ventas.",
    /* Esta línea del original va entera en negrita y sin resto. */
    estadisticasB: "Estadísticas en tiempo real.",
    sedesB: "Múltiples sucursales",
    sedes: "desde un panel central.",
    iaB: "Asistente IA vendedor",

    ctaConPrueba: "Probar Plan Pro {dias} días gratis",
    ctaSinPrueba: "Quiero el Plan Pro",
    ventas: "Hablar con ventas",
    /* Lo que el botón le dice al asistente: se escribe en el chat
       como si lo hubiera tecleado el visitante. */
    ventasPregunta: "Quiero hablar con ventas sobre el precio del Plan Pro",
    ver: "Ver todo lo que incluye",
  },

  /* La franja de debajo de las tarjetas: cadenas y franquicias. */
  cadena: {
    titulo: "¿Cadena, franquicia o muchas sedes?",
    texto: "Te preparamos una propuesta a medida.",
    cta: "Pedir propuesta",
    pregunta: "Tengo varias sedes y quiero una propuesta a medida",
  },

  /* ── La comparativa ─────────────────────────────────────── */
  comparar: {
    titulo: "Todo lo que incluye cada plan.",
    /* Para quien escucha la página con un lector de pantalla. */
    resumen: "Comparativa del Plan Basic y el Plan Pro",
    funcionalidad: "Funcionalidad",
    basic: "Basic",
    pro: "Pro",
    basicPieConPrueba: "{dias} días gratis",
    basicPieSinPrueba: "Gratis",
    proPieConPrueba: "{dias} días gratis",
    proPieSinPrueba: "Precio a medida",
    incluido: "Incluido",
    noIncluido: "No incluido",

    grupoReservas: "Reservas",
    grupoClientes: "Clientes y ventas",
    grupoNegocio: "Gestión del negocio",
    grupoSiempre: "Siempre incluido",

    agenda: "Agenda digital 24/7",
    confirmaciones: "Confirmaciones automáticas",
    perfil: "Perfil público para clientes",
    reservas: "Gestión de reservas",
    reservasBasic: "Básica",
    reservasPro: "Avanzada",
    reglas: "Reglas de disponibilidad",
    recordatorios: "Recordatorios automáticos",
    reprogramaciones: "Reprogramaciones sin fricciones",
    crm: "CRM de clientes",
    crmNota: "Historial, preferencias y consumo",
    facturacion: "Facturación y pagos",
    facturacionNota: "Online o en el local",
    ia: "Asistente IA vendedor",
    equipo: "Administración de trabajadores",
    equipoNota: "Roles, horarios y servicios",
    inventario: "Control de inventario",
    estadisticas: "Estadísticas en tiempo real",
    sedes: "Múltiples sucursales",
    movil: "Acceso desde móvil y tablet",
    movilNota: "App iOS y Android",

    /* La única fila que cambia con la promesa: con prueba enseña los
       días que dura y, sin ella, lo que cuesta cada plan. */
    promesaConPrueba: "Prueba gratis",
    promesaBasicConPrueba: "{dias} días",
    promesaProConPrueba: "{dias} días",
    promesaSinPrueba: "Precio",
    promesaBasicSinPrueba: "Gratis",
    promesaProSinPrueba: "A medida",

    tarjeta: "Tarjeta para empezar",
    tarjetaValor: "No",
    permanencia: "Permanencia",
    permanenciaValor: "No",
  },

  /* ── La calculadora (#calculadora) ──────────────────────── */
  calculadora: {
    titulo: "¿Cuánto te cuestan las citas que no se presentan?",
    lead: "Mueve los valores con los datos de tu negocio. Verás lo que pierdes hoy y lo que puedes recuperar con recordatorios y reprogramaciones automáticas.",
    aria: "Calculadora de pérdidas por ausencias",

    pais: "País de tu negocio",
    /* El único país escrito a mano: es el que se ve antes de que
       arranque el JavaScript, que es quien pone los 23 de money.ts. */
    paisPorDefecto: "España · euro (€)",
    citas: "Citas a la semana",
    ticket: "Precio medio por cita",
    ausencias: "Citas que no se presentan o cancelan tarde",
    recupera: "Ausencias que evitas con recordatorios",
    recuperaNota: "Estimación tuya: ajústala a lo que creas realista para tu negocio.",

    pierdes: "Pierdes",
    recuperas: "Recuperas",
    hoyPierdes: "Hoy pierdes cada mes",
    puedesRecuperar: "Con Bookmy puedes recuperar",
    alMes: "al mes ·",
    alAnio: "al año",
    aviso: "Cálculo orientativo en la moneda de tu país: citas semanales × 4,33 semanas × precio medio × % de ausencias. No es una garantía de resultados.",

    /* Dos piezas de formato, no frases: el sufijo de los
       porcentajes (en español va con espacio antes del signo) y el
       molde del importe que se enseña antes de saber el país. El
       número sale de money.ts, nunca escrito aquí. */
    porciento: " %",
    importe: "{valor} €",

    ctaAsistente: "Calcularlo con el asistente",
    ctaAsistenteEtiqueta: "Quiero calcularlo con el asistente",
  },

  /* ── Preguntas ──────────────────────────────────────────── */
  faq: {
    titulo: "Sin letra pequeña.",
    dudas: "¿Dudas entre Basic y Pro?",
    recomendar: "Que me lo recomiende el asistente",
    recomendarEtiqueta: "Recomiéndame un plan",

    q1ConPrueba: "¿Cuánto dura la prueba gratis?",
    a1ConPrueba:
      "{dias} días, con el Plan Basic o con el Plan Pro, el que elijas. Tienes el plan completo desde el primer día, sin tarjeta y sin permanencia.",
    q1SinPrueba: "¿El Plan Basic es gratis de verdad?",
    a1SinPrueba:
      "Sí. Creas tu cuenta, publicas tu agenda y empiezas a recibir reservas sin pagar nada y sin dejar una tarjeta. El Plan Pro, que añade clientes, cobros, equipo, inventario y estadísticas, tiene un precio a medida: nos cuentas cómo es tu negocio y te lo pasamos.",

    q2: "¿Necesito tarjeta para probarlo?",
    a2: "No. Creas tu cuenta en minutos sin dejar ningún dato de pago.",

    q3ConPrueba: "¿Qué pasa cuando terminan los {dias} días?",
    a3ConPrueba:
      "Tú decides si continúas y con qué plan. Como no pedimos tarjeta para la prueba, no hay cargos automáticos ni sorpresas.",
    q3SinPrueba: "¿Me vais a cobrar algo sin avisar?",
    a3SinPrueba:
      "No. El Plan Basic es gratis y no pedimos tarjeta para crear la cuenta, así que no hay cargos automáticos ni sorpresas. Si algún día pasas a Pro, el precio lo acordamos antes contigo.",

    q4: "¿Hay permanencia?",
    a4: "No. Puedes dejar de usar Bookmy cuando quieras.",

    q5: "¿Puedo empezar con Basic y pasar a Pro más adelante?",
    a5: "Sí. Empieza con Basic y, cuando necesites CRM, cobros, equipo, inventario o varias sedes, pasa a Pro sin cambiar de herramienta. Si tienes dudas, el equipo te ayuda.",

    q6: "¿Cuál me conviene?",
    a6: "Si trabajas solo, con una sede, y lo que necesitas es recibir reservas online, Basic es perfecto. Si tienes equipo, varias sedes o quieres controlar clientes, cobros y estadísticas, Pro.",

    q7: "¿Los planes incluyen la app?",
    a7: "Los planes son del CRM, para tu negocio. La app para reservar es gratis para tus clientes, que la descargan de Google Play o App Store.",
    a7Enlace: "Así funciona la app para empresas",
  },

  /* ── La llamada que corona el pie (.f-cta) ──────────────── */
  cta: {
    tituloConPrueba: "Pruébalo {dias} días.",
    tituloSinPrueba: "Empieza gratis hoy.",
    /* La segunda frase va en cursiva dentro del mismo titular. */
    tituloEm: "Decide con tus propios números.",
    leadConPrueba: "Sin tarjeta, sin permanencia y con todo el plan desbloqueado desde el primer día.",
    leadSinPrueba: "Sin tarjeta, sin permanencia y con el Plan Basic entero desde el primer día.",
    proConPrueba: "Probar Plan Pro gratis",
    proSinPrueba: "Quiero el Plan Pro",
    basicConPrueba: "Probar Plan Basic",
    basicSinPrueba: "Empezar con el Plan Basic",
  },
};

export default planesEs;
export type PlanesWeb = typeof planesEs;
