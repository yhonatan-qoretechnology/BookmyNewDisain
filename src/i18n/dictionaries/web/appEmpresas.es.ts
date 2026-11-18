/* ============================================================
   Web pública · la app vista por el NEGOCIO (/app/empresas) — ES
   ------------------------------------------------------------
   Sale de app-empresas.html de la web estática. Es la otra cara
   del mundo APP: la misma app, pero contada para quien RECIBE las
   reservas, no para quien las hace.

   Lo que se repite en todas las páginas (cabecera, pie, menú, las
   tres tarjetas de descarga) NO está aquí: vive en comun.es.ts y
   se pide con w("comun.…").

   PARES «ConPrueba» / «SinPrueba»
   El original prometía «7 días gratis» en seis sitios. Hoy esa
   prueba está apagada (src/lib/web/oferta.ts: SE_OFRECE_PRUEBA),
   porque el backend no concede ninguna y los cobros todavía no
   funcionan. Por eso cada una de esas seis frases está escrita dos
   veces y el componente elige. La versión «SinPrueba» es la que se
   ve hoy en pantalla: está redactada para leerse sola, no es un
   recorte de la otra. Y donde se dice el número de días va {dias},
   nunca un 7 escrito a mano.

   LO QUE SE VE DENTRO DEL MÓVIL Y DE LAS TARJETAS
   La agenda del negocio, los avisos, la semana del equipo y la
   ficha de la clienta son una maqueta: van marcadas aria-hidden en
   el marcado, pero se LEEN en pantalla, así que también se
   traducen. Las horas se quedan en reloj de 24 h en los dos
   idiomas porque la columna de la hora mide 34 px (.bizapp__list
   li) y un «4:30 PM» no entra.

   El importe de ejemplo no está aquí: lo pone money.ts en la
   moneda del visitante y entra como {importe}.
============================================================ */

const appEmpresasEs = {
  /* ── Héroe ────────────────────────────────────────────────
     «Tu negocio en la app. Tus reservas, en el bolsillo.» El
     segundo trozo va en verde (span.mint), así que son dos claves
     y no una. */
  heroTitulo: "Tu negocio en la app.",
  heroTituloMint: "Tus reservas, en el bolsillo.",
  heroLead:
    "Aparece en Bookmy, recibe reservas las 24 horas y gestiona tu agenda, tus clientes y tus cobros desde el móvil. Sin llamadas y sin apuntar nada a mano.",
  /* El botón principal de toda la página: lleva al alta del CRM. */
  ctaAlta: "Registrar mi negocio",
  heroPruebaConPrueba: "{dias} días gratis · sin tarjeta · sin permanencia",
  heroPruebaSinPrueba: "Empieza con el Plan Basic · sin tarjeta · sin permanencia",
  movilAria:
    "La app Bookmy para negocios: la agenda del día con las reservas, un hueco libre y una reserva nueva",

  /* ── La pantalla del móvil (maqueta .bizapp) ────────────── */
  movilFecha: "Martes, 17 de noviembre",
  movilHoy: "Hoy",
  /* Las iniciales del avatar del negocio. */
  movilIniciales: "EA",
  movilCitasValor: "8",
  movilCitas: "citas",
  movilHuecosValor: "2",
  movilHuecos: "huecos",
  movilNotaValor: "4,9",
  movilNota: "valoración",

  agenda1Hora: "10:00",
  agenda1Titulo: "Corte y barba",
  agenda1Sub: "Laura M. · con Andrea",
  agenda2Hora: "11:30",
  agenda2Titulo: "Coloración",
  agenda2Sub: "Marta G. · con Paula",
  agenda3Hora: "13:00",
  agenda3Titulo: "Hueco libre",
  agenda3Sub: "Visible en la app",
  agenda4Hora: "16:30",
  agenda4Titulo: "Manicura",
  agenda4Sub: "Lucía M. · desde la app",
  agenda5Hora: "18:00",
  agenda5Titulo: "Masaje relajante",
  agenda5Sub: "Sofía P. · con Irene",
  agenda6Hora: "19:30",
  agenda6Titulo: "Pedicura",
  agenda6Sub: "Elena V. · con Paula",
  agendaNueva: "Nueva",

  /* ── Los tres avisos que flotan junto al móvil ──────────── */
  chip1Titulo: "Nueva reserva",
  chip1Texto: "Manicura · hoy, 16:30",
  chip2Titulo: "Pago recibido",
  chip2Texto: "{importe} · online",
  chip3Titulo: "Recordatorio enviado",
  chip3Texto: "Mañana · 10:00",

  /* ── Los cuatro pasos (#pasos) ──────────────────────────── */
  pasosTitulo: "De tu perfil a tu primera reserva,",
  pasosTituloMint: "en cuatro pasos.",
  pasosLead:
    "Sin instalaciones ni formaciones. Lo configuras una vez y la app empieza a traerte clientes.",
  paso1Titulo: "Crea tu cuenta",
  paso1ConPrueba:
    "Regístrate en el CRM Bookmy en un minuto y elige Plan Basic o Plan Pro. Los primeros {dias} días son gratis.",
  paso1SinPrueba:
    "Regístrate en el CRM Bookmy en un minuto y empieza con el Plan Basic. No pedimos tarjeta y pasas a Pro cuando lo necesites.",
  paso2Titulo: "Completa tu perfil",
  paso2Texto:
    "Servicios, precios, horarios, fotos y equipo. Así es como te verán tus clientes en la app.",
  paso3Titulo: "Aparece en la app",
  paso3Texto:
    "Tus clientes te encuentran, eligen servicio, profesional y hora, y reservan en segundos.",
  paso4Titulo: "Gestiona desde el móvil",
  paso4Texto:
    "Te avisamos de cada reserva. Confirma, mueve o cancela citas y cobra desde tu teléfono.",

  /* ── Ventajas (el bento de cinco tarjetas) ──────────────── */
  ventajasTitulo: "Todo tu negocio,",
  /* En hueco (span.stroke), no en verde. */
  ventajasTituloStroke: "en una mano.",
  ventajasLead:
    "Lo que necesitas para atender, cobrar y fidelizar, en la misma app con la que tus clientes te reservan.",

  avisosTitulo: "Avisos al instante",
  avisosTexto:
    "Cada reserva, cambio o cancelación te llega al móvil en el momento. Nada se te escapa, aunque estés atendiendo.",
  aviso1Titulo: "Nueva reserva",
  aviso1Texto: "Lucía M. · Manicura · vie 16:30",
  aviso1Tiempo: "ahora",
  aviso2Titulo: "Cita movida",
  aviso2Texto: "Marta G. · de 11:00 a 12:30",
  aviso2Tiempo: "5 min",
  aviso3Titulo: "Cancelación con aviso",
  aviso3Texto: "El hueco vuelve a estar libre",
  aviso3Tiempo: "1 h",
  aviso4Titulo: "Nueva reseña de 5 estrellas",
  aviso4Texto: "Lucía M. · Manicura",
  aviso4Tiempo: "2 h",

  agendaTitulo: "Tu agenda en el bolsillo",
  agendaTexto: "El día, la semana y los huecos libres de todo tu equipo, estés donde estés.",
  semanaDia1: "Lun",
  semanaFecha1: "16",
  semanaDia2: "Mar",
  semanaFecha2: "17",
  semanaDia3: "Mié",
  semanaFecha3: "18",
  semanaHoraA: "10:00",
  semanaA1: "Corte",
  semanaA1Sub: "Andrea",
  semanaA2: "Color",
  semanaA2Sub: "Paula",
  semanaA3: "Hueco",
  semanaA3Sub: "libre",
  semanaHoraB: "16:30",
  semanaB1: "Uñas",
  semanaB1Sub: "Irene",
  semanaB2: "Manicura",
  semanaB2Sub: "Andrea",
  semanaB3: "Masaje",
  semanaB3Sub: "Irene",

  cobrosTitulo: "Cobros online",
  cobrosTexto: "Tus clientes pagan al reservar o en el local, como prefieras.",
  cobrosPagado: "pagado al reservar",

  ausenciasTitulo: "Menos ausencias",
  ausenciasTexto: "Recordatorios automáticos antes de cada cita.",
  ausenciasAvisoTitulo: "Recordatorio",
  ausenciasAvisoTexto: "enviado a Lucía",

  clientesTitulo: "Clientes que vuelven",
  clientesTexto:
    "El historial, las preferencias y las reseñas de cada cliente, a mano para atenderle mejor y que repita.",
  clienteIniciales: "LM",
  clienteNombre: "Lucía Martín",
  clienteDesde: "Clienta desde 2024",
  clienteTag: "Fiel",
  clienteVisitasValor: "14",
  clienteVisitas: "visitas",
  clienteFrecuenciaValor: "3 sem.",
  clienteFrecuencia: "frecuencia",
  clientePrefiereValor: "Tardes",
  clientePrefiere: "prefiere",
  resena: "Reservar fue facilísimo y me avisaron el día antes.",
  resenaPie: "Reseña en la app · hace 2 días",

  /* ── Puente al CRM ──────────────────────────────────────── */
  crmTitulo: "La app es tu escaparate.",
  crmTituloMint: "El CRM, tu centro de mando.",
  crmLead:
    "Todo lo que pasa en la app entra en tu panel del CRM Bookmy: facturación, inventario, equipo, varias sedes, estadísticas en tiempo real y un asistente IA que vende por ti.",
  /* Los **tramos** salen en negrita (.em-crm__note b), igual que
     escribe sus textos el asistente. */
  crmNotaConPrueba:
    "Los planes son del CRM: **Plan Basic** y **Plan Pro**, los dos con {dias} días gratis. La app es gratis para tus clientes.",
  crmNotaSinPrueba:
    "Los planes son del CRM: **Plan Basic**, para empezar a recibir reservas, y **Plan Pro**, cuando quieras facturación, estadísticas e inventario. La app es gratis para tus clientes.",
  ctaVerPlanes: "Ver planes",
  crmSincronizado: "Sincronizado con la app",
  modReservas: "Reservas",
  modClientes: "Clientes",
  modFacturacion: "Facturación",
  modEquipo: "Equipo",
  modInventario: "Inventario",
  modSedes: "Sedes",
  modEstadisticas: "Estadísticas",
  crmSubida: "+18 %",
  crmSubidaTexto: "reservas este mes",

  /* ── Preguntas frecuentes (#faq) ────────────────────────── */
  faqTitulo: "Lo que nos preguntan los negocios.",
  faqDuda: "¿Tienes otra duda?",
  faqAsistente: "Pregúntale al asistente",
  /* Lo que el botón le dice al asistente, no lo que se lee en él. */
  faqAsistentePregunta: "Tengo un negocio y quiero aparecer en la app Bookmy",
  faq1P: "¿Cómo aparece mi negocio en la app?",
  faq1R:
    "Crea tu cuenta en el CRM Bookmy y completa tu perfil con servicios, horarios y fotos. A partir de ahí, tus clientes pueden encontrarte y reservar desde la app.",
  faq2P: "¿Cuánto cuesta?",
  faq2RConPrueba:
    "La app es gratis para tus clientes. Tu negocio necesita una cuenta del CRM con el Plan Basic o el Plan Pro, y los dos se pueden probar {dias} días gratis, sin tarjeta y sin permanencia.",
  faq2RSinPrueba:
    "La app es gratis para tus clientes. Tu negocio necesita una cuenta del CRM: el Plan Basic no cuesta nada y ya te deja recibir reservas, y el Plan Pro añade facturación, estadísticas e inventario. Sin tarjeta y sin permanencia.",
  faq3P: "¿Puedo gestionar las reservas desde el móvil?",
  faq3R:
    "Sí. Recibes un aviso con cada reserva y puedes confirmar, mover o cancelar citas desde tu teléfono. Para todo lo demás tienes el panel del CRM en el ordenador o la tablet.",
  faq4P: "¿Mis clientes tienen que descargar la app?",
  faq4R:
    "No es obligatorio: también pueden reservar desde tu perfil público, que compartes en Instagram, WhatsApp o tu web. Con la app, además, reciben recordatorios y tienen sus citas a mano.",
  faq5P: "¿Cómo cobro las reservas?",
  faq5R:
    "Online al reservar o en el local, como prefieras. Con el Plan Pro tienes además la facturación y la trazabilidad de cada pago en el CRM.",
  faq6P: "¿Y si ya uso otra agenda?",
  faq6RConPrueba:
    "Prueba Bookmy {dias} días en paralelo, sin tarjeta, y compara. Si decides cambiar, el equipo te ayuda con el alta.",
  faq6RSinPrueba:
    "Abre tu cuenta con el Plan Basic y usa Bookmy en paralelo, sin tarjeta, hasta que lo tengas claro. Si decides cambiar, el equipo te ayuda con el alta.",

  /* ── La llamada a la acción que corona el pie (#descargar) ── */
  ctaTitulo: "Que tus clientes te encuentren",
  /* Va dentro de un <em>, que el CSS pinta en verde. */
  ctaTituloEm: "hoy mismo.",
  ctaLeadConPrueba:
    "Registra tu negocio, pruébalo {dias} días gratis y gestiona tus reservas desde el móvil.",
  ctaLeadSinPrueba: "Registra tu negocio gratis y gestiona tus reservas desde el móvil.",
  ctaCrm: "Conocer el CRM",
};

export default appEmpresasEs;
export type AppEmpresasWeb = typeof appEmpresasEs;
