/* ============================================================
   Web pública · /asistente-ia — ES
   ------------------------------------------------------------
   Puerto de asistente-ia.html: la pantalla que EXPLICA el
   asistente. El widget que de verdad conversa es otra cosa y
   tiene su propio diccionario (web/asistente.es.ts), así que aquí
   no hay ni una frase suya: los dos botones que lo abren llevan
   data-assistant-open y nada más.

   LA PRUEBA GRATUITA, ESCRITA DOS VECES
   El original prometía «7 días gratis» en el héroe y en el cierre.
   Mientras src/lib/web/oferta.ts tenga SE_OFRECE_PRUEBA en false
   esa promesa no se puede hacer —el alta no la concede y los
   cobros no están en marcha—, así que cada uno de esos textos
   está escrito dos veces: …ConPrueba y …SinPrueba. Hoy se lee la
   segunda, de modo que es la que hay que cuidar más.
   Los días NUNCA se escriben: entran por {dias}.

   Los importes del ejemplo tampoco se escriben: entran por
   {precio}, {total} e {importe}, y los pone money.ts con el
   formato de España, que es de donde es el estudio del ejemplo.
============================================================ */

const asistenteIaEs = {
  /* ── 1 · Héroe con el núcleo de partículas ──────────────── */
  hero: {
    titulo1: "Tu asistente no solo responde.",
    titulo2: "Vende.",
    lead:
      "Atiende a tus clientes 24/7, llena huecos de la agenda, recomienda el extra perfecto y recupera a quien dejó de venir. Con tus precios, tu agenda real y tus reglas.",
    ctaConPrueba: "Probar Plan Pro {dias} días gratis",
    ctaSinPrueba: "Crear mi cuenta gratis",
    ctaAsistente: "Habla con nuestro asistente",
  },

  /* ── 2 · Así trabaja: la conversación anotada ───────────── */
  demo: {
    titulo1: "Una conversación. Una cita cerrada.",
    titulo2: "Un ticket más alto.",
    lead:
      "Mira cómo el asistente usa lo que Bookmy ya sabe de tu negocio y de cada cliente para convertir una pregunta en una venta.",

    /* Las cuatro anotaciones se encienden solas al ritmo del chat */
    nota1Titulo: "Reconoce a cada cliente",
    nota1Texto: "Sabe quién es, qué se hizo y cuándo, gracias al CRM.",
    nota2Titulo: "Ofrece huecos reales",
    nota2Texto: "Consulta tu agenda, tus profesionales y tus reglas de disponibilidad.",
    nota3Titulo: "Vende con sentido",
    nota3Texto: "Propone el extra que encaja con su historial, no uno al azar.",
    nota4Titulo: "Cierra y fideliza",
    nota4Texto: "Confirma la cita y programa el recordatorio para que no falle.",

    chatEtiqueta: "Ejemplo de conversación entre una clienta y el asistente IA",
    chatNegocio: "Asistente de Estudio Aura",
    chatEstado: "En línea",
    chatRepetir: "Repetir la conversación",

    msg1: "¡Hola! ¿Tenéis hueco para manicura este viernes por la tarde?",
    msg2: "¡Hola, Lucía! Qué bien volver a verte. ¿Semipermanente, como la última vez?",
    msg2Nota: "Cliente reconocida · 14 visitas",
    msg3: "Sí, porfa.",
    msg4: "El viernes tengo libre a las 16:30 con Andrea o a las 18:00 con Paula. ¿Cuál prefieres?",
    msg5: "A las 16:30.",
    msg6:
      "¡Hecho! La última vez te encantó el tratamiento de parafina. ¿Te lo añado por {precio}? Tus manos te lo agradecerán.",
    msg6Nota: "Sugerencia según su historial",
    msg7: "¡Venga, sí!",
    msg8:
      "Listo: {total} en total, viernes a las 16:30 con Andrea. Te mando un recordatorio el jueves. ¡Hasta el viernes!",
    msg8Nota: "Recordatorio programado",
  },

  /* ── 3 · Ocho trabajos que ya no haces tú ───────────────── */
  trabajos: {
    titulo: "Ocho trabajos que ya no tienes que hacer tú.",
    lead:
      "El asistente está conectado a tu agenda, tus servicios, tu equipo y tu CRM. Por eso no da respuestas genéricas: da las de tu negocio.",
    t1Titulo: "Atiende 24/7",
    t1Texto: "Resuelve dudas de precios, servicios, horarios y ubicación al momento, también fuera de horario.",
    t2Titulo: "Reserva, cambia y cancela",
    t2Texto: "Con tu disponibilidad real y tus reglas: duración, profesional y sede.",
    t3Titulo: "Venta cruzada inteligente",
    t3Texto: "Sugiere el extra o el siguiente servicio según el historial de cada cliente.",
    t4Titulo: "Rellena huecos",
    t4Texto: "Cuando se libera una cita, la ofrece primero a quien suele reservar a esa hora.",
    t5Titulo: "Recupera clientes",
    t5Texto: "Detecta quién lleva semanas sin venir y le invita a volver con un mensaje personal.",
    t6Titulo: "Pide reseñas a tiempo",
    t6Texto: "Tras una buena experiencia, invita al cliente a dejar su opinión.",
    t7Titulo: "Analista de tu negocio",
    t7Texto: "Pregúntale «¿cuánto facturé este mes en la sede Centro?» y te responde con tus datos.",
    t8Titulo: "Copiloto del equipo",
    t8Texto: "Resuelve dudas de uso del panel al instante: «¿cómo creo un servicio?».",
  },

  /* ── 4 · La tubería y las tres conversaciones ───────────── */
  flujo: {
    titulo1: "Acompaña a cada cliente de la primera duda",
    titulo2: "a la siguiente visita.",

    p1Titulo: "Atrae",
    p1Texto: "Responde al instante a quien llega a tu perfil o a tu web, sin esperas.",
    p2Titulo: "Convierte",
    p2Texto: "Cierra la reserva en la misma conversación, con huecos reales.",
    p3Titulo: "Sube el ticket",
    p3Texto: "Propone extras con sentido según lo que cada cliente ya compra.",
    p4Titulo: "Fideliza",
    p4Texto: "Recordatorios, seguimiento tras la cita y petición de reseña.",
    p5Titulo: "Recupera",
    p5Texto: "Reactiva a quien deja de venir antes de que se vaya a otro sitio.",

    c1Titulo: "Recuperar clientes",
    c1Asistente:
      "Hola, Marta. Hace 8 semanas de tu diseño de cejas. Esta semana tengo huecos el martes a las 11:00 y el jueves a las 18:00. ¿Te guardo uno?",
    c1Cliente: "¡El jueves!",
    c2Titulo: "Rellenar huecos",
    c2Asistente:
      "¡Se acaba de liberar un hueco mañana a las 18:00 con Paula! Como sueles venir a esa hora, te lo ofrezco a ti primero. ¿Lo quieres?",
    c2Cliente: "Sí, me lo quedo.",
    c3Titulo: "Para el dueño",
    c3Cliente: "¿Cuánto llevamos facturado este mes en la sede Centro?",
    c3Asistente:
      "{importe} hasta hoy, un 9 % más que en octubre. Tu servicio estrella es la manicura semipermanente, con 126 citas.",
  },

  /* ── 5 · La diferencia con un chatbot ───────────────────── */
  diferencia: {
    titulo1: "Un chatbot contesta.",
    titulo2: "El asistente de Bookmy vende.",
    resumen: "Diferencias entre un chatbot genérico y el asistente IA de Bookmy",
    colTrabajo: "Lo que hace",
    colChatbot: "Chatbot genérico",
    colBookmy: "Asistente IA de Bookmy",
    si: "Sí",
    no: "No",
    f1: "Responde preguntas frecuentes",
    f2: "Disponible 24/7",
    f3: "Reserva con tu agenda real",
    f4: "Conoce el historial de cada cliente",
    f5: "Sugiere extras y servicios",
    f6: "Rellena huecos y recupera clientes",
    f7: "Responde sobre los datos de tu negocio",
    f8: "Pasa la conversación a tu equipo",
  },

  /* ── 6 · Control y confianza ────────────────────────────── */
  control: {
    titulo: "Potente, pero siempre a tu manera.",
    lead:
      "Una IA que vende tiene que ser fiable. Por eso trabaja con tus reglas, se presenta como lo que es y nunca deja a un cliente sin respuesta humana.",
    g1Titulo: "Tú pones las reglas",
    g1Texto: "Qué servicios promocionar, qué tono usar y hasta dónde puede llegar con las ofertas.",
    g2Titulo: "Transparente",
    g2Texto: "Siempre se presenta como asistente virtual con IA. Sin trucos.",
    g3Titulo: "Datos protegidos",
    g3Texto: "Cifrado, control de accesos y RGPD. Tus datos son tuyos y no se venden.",
    g4Titulo: "Siempre hay un humano",
    g4Texto: "Cuando una conversación lo necesita, la pasa a tu equipo con todo el contexto.",
  },

  /* ── 7 · Puesta en marcha ───────────────────────────────── */
  pasos: {
    titulo: "Activo en tres pasos.",
    s1Titulo: "Tu catálogo ya está",
    s1Texto:
      "Servicios, precios, profesionales y horarios salen de tu panel de Bookmy. No tienes que escribir nada dos veces.",
    s2Titulo: "Define tono y reglas",
    s2Texto: "Cercano o formal, qué ofrecer, cuándo pasar a una persona. Lo ajustas cuando quieras.",
    s3Titulo: "Actívalo y mide",
    s3Texto: "Empieza a atender en tu perfil de reservas y mira en tus estadísticas lo que vende.",
  },

  /* ── 8 · El cierre que corona el pie ────────────────────── */
  cta: {
    titulo1: "Pon a trabajar a tu nuevo",
    titulo2: "mejor vendedor.",
    leadConPrueba:
      "Prueba Plan Pro {dias} días gratis, sin tarjeta y sin permanencia. ¿Dudas? Pregúntale ahora mismo a nuestro asistente.",
    leadSinPrueba:
      "Crea tu cuenta gratis, sin tarjeta y sin permanencia, y mira el asistente por dentro. ¿Dudas? Pregúntale ahora mismo a él.",
    botonConPrueba: "Probar Plan Pro {dias} días gratis",
    botonSinPrueba: "Crear mi cuenta gratis",
    botonAsistente: "Hablar con el asistente",
  },
};

export default asistenteIaEs;
export type AsistenteIaWeb = typeof asistenteIaEs;
