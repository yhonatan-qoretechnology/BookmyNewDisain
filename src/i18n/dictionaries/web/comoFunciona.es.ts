/* ============================================================
   Web pública · «Cómo funciona» — ES
   ------------------------------------------------------------
   Todo el texto de /como-funciona. El marcado vive en
   src/app/(web)/como-funciona/, y ahí no hay ni una frase
   escrita: cada cadena sale de aquí con w("comoFunciona.clave").

   LAS CLAVES ...ConPrueba / ...SinPrueba
   La página original prometía «7 días gratis» en el héroe, en el
   primer paso, en la tarjeta de «pruébalo en paralelo», en el
   cierre del día y en la llamada del pie. Esa prueba hoy NO se
   concede (src/lib/web/oferta.ts lo explica: el backend la tiene
   apagada y los cobros no funcionan), así que cada una de esas
   frases está escrita DOS veces y el componente elige con
   SE_OFRECE_PRUEBA. La versión sin prueba no es un apaño: es la
   que se está viendo, así que se cuida igual que la otra.

   Los días nunca se escriben: van como {dias} y los rellena
   DIAS_DE_PRUEBA. Si mañana la prueba pasa a catorce días, aquí
   no se toca nada.

   El inglés está en comoFunciona.en.ts con las mismas claves; el
   tipo ComoFuncionaWeb obliga a que no falte ninguna.
============================================================ */

const comoFuncionaEs = {
  /* ── Héroe ───────────────────────────────────────────────── */
  heroTitulo: "De cero a tu negocio en",
  heroTituloMint: "piloto automático.",
  heroLead:
    "Configura Bookmy en minutos y deja que trabaje por ti: reservas, recordatorios, cobros, clientes y ventas, todo conectado en un mismo panel.",
  heroAsistente: "Que me guíe el asistente",
  heroAsistentePregunta: "Guíame para empezar con Bookmy paso a paso",

  /* El botón principal, que se repite en el héroe, en el final del
     día y en el pie. Con prueba invita a probarla; sin ella, a
     crear la cuenta, que es lo que de verdad pasa al pulsarlo. */
  ctaConPrueba: "Prueba {dias} días gratis",
  ctaSinPrueba: "Crea tu cuenta gratis",

  /* ── El túnel de los cinco pasos ─────────────────────────── */
  tunelAria: "Cómo empezar con Bookmy en cinco pasos",

  paso1Titulo: "Crea tu cuenta",
  paso1ConPrueba:
    "Regístrate en menos de un minuto. Elige el Plan Basic o el Plan Pro y pruébalo {dias} días gratis, sin tarjeta y sin permanencia.",
  paso1SinPrueba:
    "Regístrate en menos de un minuto. Elige el Plan Basic o el Plan Pro y empieza hoy mismo: sin tarjeta, sin permanencia y sin instalar nada.",
  paso1CampoNegocio: "Nombre del negocio",
  paso1Negocio: "Estudio Aura",
  paso1CampoTipo: "Tipo de empresa",
  paso1Tipo: "Estética",
  paso1CheckConPrueba: "Plan Pro · {dias} días gratis",
  paso1CheckSinPrueba: "Plan Pro · sin permanencia",
  paso1Boton: "Crear mi cuenta",

  paso2Titulo: "Añade servicios, equipo y sedes",
  paso2Texto:
    "Da de alta tus servicios con su duración y precio, tu equipo con sus horarios y roles, y tus sedes. Todo desde el panel, sin instalar nada.",
  paso2Servicio1: "Manicura semipermanente",
  paso2Servicio1Detalle: "60 min · Andrea, Paula",
  paso2Servicio2: "Lifting de pestañas",
  paso2Servicio2Detalle: "45 min · Paula",
  paso2Activo: "Activo",
  paso2Persona1: "Andrea",
  paso2Persona1Inicial: "AN",
  paso2Persona1Horario: "L–V 9–17 h",
  paso2Persona2: "Paula",
  paso2Persona2Inicial: "PA",
  paso2Persona2Horario: "M–S 12–20 h",
  paso2Sede1: "Sede Centro",
  paso2Sede1Nota: "Principal",
  paso2Sede2: "Sede Puerto",
  paso2Sede2Nota: "Nueva",

  paso3Titulo: "Comparte tu perfil de reservas",
  paso3Texto:
    "Tu negocio tiene un perfil público con servicios, profesionales y disponibilidad. Compártelo en Instagram, WhatsApp, Google o tu web, y tus clientes reservarán solos, 24/7, también desde la app Bookmy.",
  paso3Enlace: "bookmy.es/estudio-aura",
  paso3Copiar: "Copiar",
  paso3Instagram: "Instagram",
  paso3Whatsapp: "WhatsApp",
  paso3Google: "Google",
  paso3Web: "Tu web",
  paso3App: "App Bookmy",
  paso3Aviso: "Nueva reserva · Lucía M.",
  paso3AvisoDetalle: "Manicura · viernes 16:30 · Andrea",
  paso3Confirmada: "Confirmada",

  paso4Titulo: "Deja que Bookmy trabaje solo",
  paso4Texto:
    "Confirmaciones inmediatas, recordatorios automáticos y reprogramaciones sin llamadas. Y, si quieres, el asistente IA atiende, reserva y vende por ti a cualquier hora.",
  paso4Auto1: "Confirmación automática",
  paso4Auto2: "Recordatorio 24 h antes",
  paso4Auto3: "Reprogramación online",
  paso4Auto4: "Asistente IA vendedor",

  paso5Titulo: "Mide, decide y vende más",
  paso5Texto:
    "Estadísticas en tiempo real, la ficha de cada cliente en el CRM y tus reseñas en un mismo sitio. Sabes qué funciona, quién vuelve y dónde crecer.",
  paso5Ocupacion: "Ocupación de la semana",
  paso5OcupacionValor: "78 %",
  paso5Repiten: "Clientes que repiten",
  paso5RepitenValor: "64 %",

  /* El raíl de abajo: una palabra por paso */
  railCrea: "Crea",
  railConfigura: "Configura",
  railComparte: "Comparte",
  railAutomatiza: "Automatiza",
  railCrece: "Crece",

  /* ── Para quién: clientes, equipo y tú ───────────────────── */
  quienTitulo: "Fácil para tus clientes. Útil para tu equipo.",
  quienTituloMint: "Clave para ti.",
  quienAria: "Para quién",
  quienTabClientes: "Tus clientes",
  quienTabEquipo: "Tu equipo",
  quienTabTu: "Tú",

  cli1Titulo: "Abre Bookmy",
  cli1Texto: "Desde la app (iOS y Android) o desde tu perfil de reservas.",
  cli2Titulo: "Crea su cuenta",
  cli2Texto: "Registra sus datos en menos de un minuto.",
  cli3Titulo: "Reserva",
  cli3Texto: "Busca el servicio y elige fecha y especialista.",
  cli4Titulo: "Elige cómo pagar",
  cli4Texto: "Selecciona cómo y dónde quiere pagar.",
  cli5Titulo: "Confirmada",
  cli5Texto: "Recibe la confirmación al instante y su recordatorio antes de la cita.",
  cliMas: "Ver la app por dentro, pantalla a pantalla",

  eq1Titulo: "Su agenda, siempre al día",
  eq1Texto: "Cada profesional ve sus citas del día y de la semana en tiempo real.",
  eq2Titulo: "La ficha antes de atender",
  eq2Texto: "Historial y preferencias del cliente para dar un servicio a medida.",
  eq3Titulo: "Solo lo que le toca",
  eq3Texto: "Roles y permisos por persona y por sede.",
  eq4Titulo: "Avisos al momento",
  eq4Texto: "Notificaciones de nuevas reservas y cambios en su agenda.",

  tu1Titulo: "Todo de un vistazo",
  tu1Texto: "Clientes, ingresos del mes, reservas y valoración media en tu dashboard.",
  tu2Titulo: "Todas tus sedes",
  tu2Texto: "Cambia de sede en un clic y compara su rendimiento.",
  tu3Titulo: "La caja, cuadrada",
  tu3Texto: "Facturación y cobros con trazabilidad de cada transacción.",
  tu4Titulo: "Un vendedor 24/7",
  tu4Texto: "El asistente IA atiende y vende mientras tú te dedicas a lo tuyo.",

  /* ── Un día con Bookmy ───────────────────────────────────── */
  diaTitulo: "Así se ve tu día cuando el sistema trabaja por ti.",

  dia1Hora: "08:00",
  dia1Titulo: "Abres el panel con un café",
  dia1Texto: "Ves las 32 citas del día, quién viene y qué servicio se hace. Sin sorpresas.",
  dia2Hora: "09:12",
  dia2Titulo: "Reserva nueva mientras atiendes",
  dia2Texto: "Una clienta reserva desde Instagram. Ya está en tu agenda, confirmada.",
  dia3Hora: "10:00",
  dia3Titulo: "Recordatorios automáticos",
  dia3Texto: "Los clientes de mañana reciben su recordatorio. Menos olvidos, menos huecos.",
  dia4Hora: "13:30",
  dia4Titulo: "Una cancelación, un hueco recuperado",
  dia4Texto: "El hueco vuelve a la agenda y la IA lo ofrece a quien suele reservar a esa hora.",
  dia5Hora: "17:00",
  dia5Titulo: "Cobro y factura al momento",
  dia5Texto: "Pago online o en el local, con la trazabilidad de cada transacción.",
  dia6Hora: "19:30",
  dia6Titulo: "Una reseña de cinco estrellas",
  dia6Texto: "Tras la cita, tu clienta deja su opinión. Tu valoración media sube.",
  dia7Hora: "23:40",
  dia7Titulo: "Mientras duermes",
  dia7Texto: "El asistente responde una consulta y cierra una cita para el sábado.",
  dia8Hora: "Mañana",
  dia8Titulo: "Otra vez. Sin esfuerzo.",
  dia8Texto: "Así es tener un sistema y no solo una agenda.",

  /* ── Cambiar es fácil ────────────────────────────────────── */
  cambiarTitulo: "¿Vienes del papel, de Excel o de otra app?",
  cambiarLead:
    "No necesitas parar tu negocio para cambiar. Empieza hoy y deja que Bookmy demuestre lo que vale.",
  cambiar1Titulo: "Alta en minutos",
  cambiar1Texto: "Creas tu cuenta en menos de un minuto y recibes reservas el mismo día.",
  cambiar2Titulo: "Pruébalo en paralelo",
  cambiar2ConPrueba: "Con {dias} días gratis y sin tarjeta, lo pruebas sin dejar tu sistema actual.",
  cambiar2SinPrueba:
    "Sin tarjeta y sin permanencia, lo pruebas a tu ritmo sin dejar tu sistema actual.",
  cambiar3Titulo: "Personas al otro lado",
  cambiar3Texto: "¿Dudas con la configuración? Escríbenos por email o WhatsApp y te ayudamos.",

  /* ── Seguridad ───────────────────────────────────────────── */
  segTitulo: "Tu negocio y tus clientes, en buenas manos.",
  segLead:
    "Bookmy funciona en la nube, desde cualquier dispositivo, con medidas técnicas y organizativas para proteger la información.",
  segPrivacidad: "Lee nuestra política de privacidad",
  seg1Titulo: "Cifrado en tránsito",
  seg1Texto: "La información viaja cifrada entre tu dispositivo y la plataforma.",
  seg2Titulo: "Control de accesos",
  seg2Texto: "Roles por usuario y por sede, y monitorización continua.",
  seg3Titulo: "Pagos certificados",
  seg3Texto: "Proveedores certificados. Bookmy no guarda los datos completos de las tarjetas.",
  seg4Titulo: "RGPD",
  seg4Texto: "Tratamos los datos conforme a la normativa europea. No los vendemos.",
  seg5Titulo: "En la nube",
  seg5Texto: "Sin instalar software: entra desde el navegador, el móvil o la tablet.",
  seg6Titulo: "Español e inglés",
  seg6Texto: "Tu equipo y tus clientes, cada uno en su idioma.",

  /* ── Preguntas ───────────────────────────────────────────── */
  faqTitulo: "Todo lo que te preguntas antes de empezar.",

  faq1Pregunta: "¿Tengo que instalar algo?",
  /* Las respuestas con un enlace dentro van partidas en tres: lo
     que va antes, el texto del enlace y lo que va después. */
  faq1RespuestaA:
    "No. Gestionas tu agenda desde el móvil, la tablet o el ordenador, sin instalar software adicional. Y si lo prefieres, tienes la ",
  faq1Enlace: "app para iOS y Android",
  faq1RespuestaB: ".",

  faq2Pregunta: "¿Cuánto tardo en empezar a recibir reservas?",
  faq2Respuesta:
    "Creas la cuenta en menos de un minuto. En cuanto añadas tus servicios y horarios, puedes compartir tu perfil y empezar a recibir reservas el mismo día.",

  faq3Pregunta: "¿Mis clientes necesitan descargar la app?",
  faq3Respuesta:
    "Pueden reservar desde la app Bookmy o desde tu perfil público, el que compartes en tus redes y tu web. Eligen servicio, fecha y especialista y reciben la confirmación al instante.",

  faq4Pregunta: "¿Cómo cobro a mis clientes?",
  faq4Respuesta:
    "Con el Plan Pro puedes cobrar online o en el local y tener la trazabilidad de cada transacción, junto con la facturación, en la misma plataforma.",

  faq5Pregunta: "¿Y si un cliente cambia o cancela su cita?",
  faq5Respuesta:
    "Puede modificarla o cancelarla desde su perfil, sin coste adicional, siempre que lo haga con antelación. Tu agenda se actualiza sola.",

  faq6Pregunta: "¿Qué pasa con mis datos si un día me voy?",
  faq6RespuestaA:
    "Son tuyos. Puedes solicitar su portabilidad o su supresión en cualquier momento, como explicamos en la ",
  faq6Enlace: "política de privacidad",
  faq6RespuestaB: ".",

  /* ── La llamada a la acción que corona el pie ────────────── */
  ctaTitulo: "Cinco pasos.",
  ctaTituloEm: "Un negocio que funciona solo.",
  ctaLeadConPrueba: "Prueba Bookmy {dias} días gratis, sin tarjeta y sin permanencia.",
  ctaLeadSinPrueba: "Crea tu cuenta gratis, sin tarjeta y sin permanencia.",
  ctaPlanes: "Ver planes",
};

export default comoFuncionaEs;
export type ComoFuncionaWeb = typeof comoFuncionaEs;
