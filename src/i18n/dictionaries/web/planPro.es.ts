/* ============================================================
   Web pública · Plan Pro (/planes/pro) — ES
   ------------------------------------------------------------
   Todo el texto de la pantalla, que antes vivía escrito a mano en
   plan-pro.html. El componente es
   src/components/web/PlanPro.tsx y lo lee con w("planPro.…").

   LA PROMESA DE LA PRUEBA, DOS VECES
   El original prometía «7 días gratis» en el héroe, en la
   calculadora, en dos preguntas y en la llamada final. Hoy la
   prueba está apagada (src/lib/web/oferta.ts: SE_OFRECE_PRUEBA),
   así que cada uno de esos textos está escrito DOS veces:

     algoConPrueba  · lo que se dice cuando la prueba se ofrece
     algoSinPrueba  · lo que se dice mientras no se ofrece  ← HOY

   Las dos versiones están redactadas en serio: la que se ve en
   pantalla ahora mismo es la segunda. La que lleva el número de
   días NO dice «7»: lleva {dias} y lo rellena DIAS_DE_PRUEBA.

   Los importes en euros (33, 45, 40 €, los 8 € de la parafina)
   son ejemplos de lo que un negocio cobra y van escritos: la
   calculadora, que sí cambia de moneda, saca los suyos de
   src/lib/web/money.ts.
============================================================ */

const planProEs = {
  /* Cabeza del documento. La lee page.tsx, que es de servidor y no
     puede usar el hook de traducción: por eso el <title> y la
     descripción salen de aquí, del idioma base, igual que en el
     original. */
  meta: {
    titulo: "Plan Pro · Gestiona y haz crecer todo tu negocio",
    descripcionConPrueba:
      "Facturación, inventario, CRM de clientes, equipo, estadísticas en tiempo real, varias sedes y asistente IA en un único panel. {dias} días gratis, sin tarjeta.",
    descripcionSinPrueba:
      "Facturación, inventario, CRM de clientes, equipo, estadísticas en tiempo real, varias sedes y asistente IA en un único panel. Crea tu cuenta gratis, sin tarjeta.",
  },

  /* ── Héroe ──────────────────────────────────────────────── */
  hero: {
    volver: "Todos los planes",
    titulo: "Lleva tu negocio al ",
    tituloDestacado: "siguiente nivel.",
    lead:
      "Automatiza procesos, optimiza recursos y administra cada área de tu empresa desde una plataforma profesional pensada para crecer.",

    /* El bloque grande de debajo del lead: un dato en cuerpo enorme
       y una línea pequeña que lo explica. */
    precioConPrueba: "{dias} días",
    precioNotaConPrueba: "gratis para probarlo",
    precioSinPrueba: "A medida",
    precioNotaSinPrueba: "tu tarifa, según el tamaño de tu negocio",

    nota: "Sin tarjeta · sin permanencia · para negocios en crecimiento y con varias sedes",

    /* Los módulos que giran alrededor de la escultura de partículas */
    orbita: {
      crm: "CRM de clientes",
      facturacion: "Facturación",
      reservas: "Reservas",
      equipo: "Equipo",
      asistente: "Asistente IA",
      sedes: "Sedes",
      estadisticas: "Estadísticas",
      inventario: "Inventario",
    },
  },

  /* Los botones se repiten en el héroe, en la calculadora y en la
     llamada del pie: un solo texto para los tres sitios. */
  cta: {
    probarConPrueba: "Probar Plan Pro {dias} días gratis",
    probarSinPrueba: "Crear mi cuenta gratis",
    ventas: "Hablar con ventas",
    /* Lo que el visitante «dice» al asistente al pulsar el botón. */
    ventasPregunta: "Quiero hablar con ventas sobre el Plan Pro",
  },

  /* ── Módulos (la galería que se recorre en horizontal) ───── */
  modulos: {
    titulo: "Esto es lo que obtienes con el Plan Pro.",
    lead: "Todo lo del Plan Basic y, además, cada área de tu negocio conectada en el mismo panel.",

    reservas: {
      titulo: "Gestión avanzada de reservas",
      texto: "Reglas de disponibilidad, recordatorios automáticos y reprogramaciones sin fricciones.",
      /* La agenda de ejemplo: tres días, tres horas y nueve citas. */
      d1: "Lun",
      d1Numero: "17",
      d2: "Mar",
      d2Numero: "18",
      d3: "Mié",
      d3Numero: "19",
      h1: "09:00",
      h2: "11:00",
      h3: "16:30",
      ev1: "Manicura",
      ev1Quien: "Andrea",
      ev2: "Masaje",
      ev2Quien: "Paula",
      ev3: "Cejas",
      ev3Quien: "Andrea",
      ev4: "Pestañas",
      ev4Quien: "Paula",
      ev5: "Facial",
      ev5Quien: "Irene",
      ev6: "Corte",
      ev6Quien: "Irene",
      ev7: "Spa",
      ev7Quien: "Paula",
      ev8: "Hueco",
      ev8Quien: "libre",
      ev9: "Uñas",
      ev9Quien: "Andrea",
    },

    crm: {
      titulo: "CRM de clientes",
      texto: "Historial completo de cada cliente: visitas, preferencias y consumo.",
      iniciales: "LM",
      nombre: "Lucía Martín",
      desde: "Clienta desde 2024",
      etiqueta: "VIP",
      visitas: "14",
      visitasNota: "visitas",
      consumo: "486 €",
      consumoNota: "consumo",
      frecuencia: "3 sem.",
      frecuenciaNota: "frecuencia",
    },

    facturacion: {
      titulo: "Facturación y pagos",
      texto: "Cobra online o en local y lleva el control de cada transacción desde la misma plataforma.",
      cliente1: "Lucía Martín",
      importe1: "33,00 €",
      canal1: "Online",
      cliente2: "Sofía Pérez",
      importe2: "45,00 €",
      canal2: "En local",
      cliente3: "Carmen Ruiz",
      importe3: "40,00 €",
      canal3: "Online",
    },

    estadisticas: {
      titulo: "Estadísticas en tiempo real",
      texto: "Visualiza el rendimiento de tu negocio con reportes y métricas actualizadas al instante.",
      ocupacion: "78 %",
      ocupacionNota: "ocupación",
    },

    equipo: {
      titulo: "Administración de trabajadores",
      texto: "Asigna roles, horarios y servicios a cada miembro de tu equipo.",
      iniciales1: "AN",
      nombre1: "Andrea",
      area1: "Uñas",
      iniciales2: "PA",
      nombre2: "Paula",
      area2: "Spa",
      iniciales3: "IR",
      nombre3: "Irene",
      area3: "Estética",
    },

    sedes: {
      titulo: "Múltiples sucursales",
      texto: "Administra todas tus sedes desde un mismo panel central.",
      sede1: "Sede Centro",
      estado1: "Activa",
      sede2: "Sede Puerto",
      estado2: "18 reservas hoy",
      sede3: "Sede Playa",
      estado3: "14 reservas hoy",
    },

    inventario: {
      titulo: "Control de inventario",
      texto: "Lleva el stock de productos o insumos sincronizado con cada reserva o venta.",
      producto1: "Esmalte semipermanente",
      producto2: "Cera tibia",
      producto3: "Pestañas pelo a pelo",
    },
  },

  /* ── El asistente IA, contado desde el Plan Pro ──────────── */
  asistente: {
    etiqueta: "Nuevo · Asistente IA vendedor",
    titulo: "Un vendedor que atiende, reserva y vende 24/7.",
    lead:
      "Responde a tus clientes con tus precios y tu agenda real, sugiere extras según su historial y recupera a quien deja de venir.",
    cta: "Conoce el asistente IA",
    chatAria: "Ejemplo de conversación con el asistente",
    burbuja1: "¿Tenéis hueco el viernes por la tarde?",
    burbuja2:
      "¡Sí! A las 16:30 con Andrea o a las 18:00 con Paula. ¿Te añado la parafina por 8 €, como la última vez?",
    burbuja2Nota: "Sugerencia según su historial",
  },

  /* ── Para quién es ──────────────────────────────────────── */
  publico: {
    titulo: "Negocios en crecimiento y con varias sedes.",
    titulo1: "Centros con equipo",
    texto1: "Cada profesional con su agenda, sus servicios y su horario. Tú, con la visión de todo.",
    titulo2: "Cadenas y franquicias",
    texto2: "Todas tus sedes en un panel, con usuarios por sede y comparativas de rendimiento.",
    titulo3: "Negocios que quieren vender más",
    texto3: "CRM, recordatorios e IA para que tus clientes vuelvan y gasten más en cada visita.",
  },

  /* ── Calculadora de lo que se pierde por ausencias ───────── */
  roi: {
    titulo: "¿Cuánto podría recuperar tu negocio con Pro?",
    lead: "Mueve los valores con tus datos y mira lo que pierdes hoy por citas que no se presentan.",
    grupoAria: "Calculadora de pérdidas por ausencias",

    pais: "País de tu negocio",
    citas: "Citas a la semana",
    ticket: "Precio medio por cita",
    ausencias: "Citas que no se presentan o cancelan tarde",
    recupera: "Ausencias que evitas con recordatorios",
    recuperaNota: "Estimación tuya: ajústala a lo que creas realista para tu negocio.",
    /* Lo que el motor pega detrás del número de los dos porcentajes
       (va en el data-unit del mando, como en el original). */
    unidadPorcentaje: " %",

    /* Lo que se ve antes de que el motor calcule nada: los valores de
       partida de España. En cuanto arranca, los reescribe con el
       formato y la moneda del país elegido. */
    citasInicial: "80",
    ticketInicial: "35 €",
    ausenciasInicial: "8 %",
    recuperaInicial: "35 %",
    importeInicial: "0 €",

    columnaPierdes: "Pierdes",
    columnaRecuperas: "Recuperas",
    resultadoPierdes: "Hoy pierdes cada mes",
    resultadoRecuperas: "Con Pro puedes recuperar",
    alMes: "al mes · ",
    alAnio: " al año",
    nota:
      "Cálculo orientativo en la moneda de tu país: citas semanales × 4,33 semanas × precio medio × % de ausencias. No es una garantía de resultados.",
    asistente: "Calcularlo con el asistente",
    asistenteEtiqueta: "Quiero calcularlo con el asistente",
  },

  /* ── Testimonio ─────────────────────────────────────────── */
  testimonio: {
    cita:
      "“Necesitábamos centralizar reservas y clientes. Con Bookmy automatizamos procesos y mejoramos el seguimiento comercial del equipo.”",
    iniciales: "JC",
    autor: "Johan Castillo",
    papel: "Gerente · Qore Technology",
  },

  /* ── Preguntas ──────────────────────────────────────────── */
  faq: {
    tituloConPrueba: "Pruébalo sin riesgo.",
    tituloSinPrueba: "Empieza sin riesgo.",

    q1ConPrueba: "¿Qué incluye la prueba de {dias} días?",
    a1ConPrueba:
      "Todo el Plan Pro: CRM de clientes, facturación y pagos, reservas avanzadas, equipo, inventario, estadísticas, varias sedes y asistente IA. Sin tarjeta y sin permanencia.",
    q1SinPrueba: "¿Qué incluye el Plan Pro?",
    a1SinPrueba:
      "CRM de clientes, facturación y pagos, reservas avanzadas, equipo, inventario, estadísticas, varias sedes y asistente IA. Todo lo del Plan Basic y, además, cada área del negocio conectada en el mismo panel.",

    q2ConPrueba: "¿Qué pasa cuando termina la prueba?",
    a2ConPrueba:
      "Tú decides si continúas con Pro, si pasas a Basic o si lo dejas. Como no pedimos tarjeta para la prueba, no hay cargos automáticos.",
    q2SinPrueba: "¿Puedo empezar sin pagar nada?",
    a2SinPrueba:
      "Sí. Crea tu cuenta con el Plan Basic, que es gratis, y empieza a recibir reservas hoy. Cuando quieras dar el salto a Pro, nos lo dices y el equipo te lo prepara: no pedimos tarjeta, así que no hay cargos automáticos ni permanencia.",

    q3: "¿Cuánto cuesta el Plan Pro?",
    a3ConPrueba:
      "El precio se adapta al tamaño de tu negocio. Pruébalo {dias} días gratis y habla con el equipo para recibir tu tarifa.",
    a3SinPrueba:
      "El precio se adapta al tamaño de tu negocio: las sedes que gestionas y el equipo que tienes detrás. Habla con el equipo y te preparamos tu tarifa.",
    a3Boton: "Pedir precio",
    a3Pregunta: "Quiero conocer el precio del Plan Pro",

    q4: "¿Puedo gestionar varias sedes?",
    a4: "Sí. Administras todas tus sedes desde un mismo panel central y das a cada usuario acceso a la suya.",

    q5: "¿Me ayudáis a empezar?",
    /* Una sola frase partida por los dos enlaces que lleva dentro:
       «Sí. Escríbenos a [correo] o por [WhatsApp] y el equipo te
       acompaña en el alta.» */
    a5Inicio: "Sí. Escríbenos a ",
    a5Correo: "contacto@bookmy.es",
    a5Medio: " o por ",
    a5Whatsapp: "WhatsApp",
    a5Fin: " y el equipo te acompaña en el alta.",
  },

  /* ── Llamada final, encima del pie ──────────────────────── */
  cierre: {
    tituloConPrueba: "{dias} días para ver lo que Pro hace ",
    tituloSinPrueba: "Mira lo que Pro puede hacer ",
    tituloDestacado: "por tu negocio.",
    leadConPrueba:
      "Crea tu cuenta en minutos y empieza a recibir reservas hoy mismo. {dias} días gratis, sin tarjeta y sin permanencia.",
    leadSinPrueba:
      "Crea tu cuenta en minutos y empieza a recibir reservas hoy mismo. Sin tarjeta y sin permanencia.",
  },
};

export default planProEs;
export type PlanProWeb = typeof planProEs;
