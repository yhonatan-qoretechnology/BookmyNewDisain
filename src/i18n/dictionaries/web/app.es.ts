/* ============================================================
   /app · la app para personas — español
   ------------------------------------------------------------
   Todo el texto de la pantalla, que sale de app.html de la web
   nueva. Lo pinta src/app/(web)/app/PantallaApp.tsx con
   w("app.loQueSea"); los textos de la cabecera y del pie NO están
   aquí, que son de comun.es.ts.

   DOS COSAS QUE HAY QUE SABER ANTES DE TOCAR ESTE ARCHIVO

   1. LA PROMESA DE LA PRUEBA GRATUITA
      El puente al mundo de los negocios (la sección «¿Tienes un
      negocio?») tiene DOS versiones del texto de entrada:
      `negocio.leadConPrueba` y `negocio.leadSinPrueba`. Cuál se
      enseña lo decide SE_OFRECE_PRUEBA de src/lib/web/oferta.ts, y
      hoy está en false: lo que se ve es la versión SIN prueba.
      Las dos están redactadas para leerse solas, así que al
      cambiar una hay que cuidar la otra.
      Los días nunca van escritos: la versión con prueba lleva
      {dias} y los rellena DIAS_DE_PRUEBA.

   2. EL PRECIO DE EJEMPLO
      Los dos avisos que enseñan un cobro llevan {precio}, que
      rellena src/lib/web/money.ts con la moneda del visitante. No
      se escribe «33 €» a mano: a quien mira desde Bogotá eso no
      le dice nada.

   El inglés vive en app.en.ts con exactamente estas mismas
   claves; el tipo TextosApp no deja que se desvíen.
============================================================ */

const appEs = {
  /* ── Héroe: el teléfono 3D y su órbita de avisos ─────────── */
  hero: {
    titulo: "Reserva tus citas en segundos.",
    tituloMint: "Todo desde un solo lugar.",
    lead:
      "Encuentra tu centro, elige servicio, especialista y hora, y paga online o en el local. Recibe la confirmación al instante y un recordatorio antes de tu cita.",
    /* El teléfono es un role="img": esto es lo que lee un lector de
       pantalla, porque la imagen de dentro va con alt vacío. */
    telefonoAlt: "App Bookmy: pantalla para elegir especialista, día y hora en un centro",
    orbita1: "Reserva confirmada",
    orbita1Sub: "Manicura · vie 16:30",
    orbita2: "Recordatorio",
    orbita2Sub: "Mañana a las 12:00",
    orbita3: "Pago seguro",
    orbita3Sub: "Online o en el local",
  },

  /* ── Los cinco pasos (#pasos) ────────────────────────────── */
  pasos: {
    titulo: "De la idea a la cita confirmada en cinco toques.",

    descarga: {
      alt: "Pantalla de bienvenida de la app Bookmy",
      titulo: "Descarga Bookmy",
      texto:
        "Gratis en Google Play y App Store, o como archivo APK para Android. Explora, reserva y disfruta, todo desde un solo lugar.",
      check1: "iPhone y Android",
      check2: "Ligera y rápida",
      chip: "Descarga gratis",
      chipSub: "iPhone y Android",
    },

    entrar: {
      alt: "Pantalla para entrar en la app con correo y contraseña o con Face ID",
      titulo: "Entra en un minuto",
      texto:
        "Regístrate con tu email o entra con Google, Apple o Facebook. Tus datos y tus reservas quedan guardados.",
      check1: "Inicio de sesión social",
      check2: "Recordar mi sesión",
      chip: "Sesión iniciada",
      chipSub: "Con Google en un toque",
    },

    elegir: {
      alt: "Pantalla para elegir el día y la hora de la reserva",
      titulo: "Elige día, hora y especialista",
      texto:
        "Busca tu servicio, mira solo los huecos libres de verdad y elige a la profesional que prefieres.",
      check1: "Disponibilidad en tiempo real",
      check2: "Tu especialista favorita",
      chip: "Hueco libre",
      chipSub: "Vie 16:30 · Andrea",
    },

    pagar: {
      alt: "Pantalla para elegir el método de pago",
      titulo: "Paga como prefieras",
      texto:
        "Online con tarjeta o en el establecimiento. Ves el precio final antes de confirmar, sin sorpresas.",
      check1: "Pago online protegido",
      check2: "O paga al llegar",
      chip: "Pago protegido",
      /* {precio}: un importe de ejemplo en la moneda del visitante. */
      chipSub: "{precio} · online",
    },

    confirmar: {
      alt: "Pantalla de reserva confirmada",
      titulo: "Confirmación al instante",
      texto:
        "Tu cita queda confirmada en el momento y te avisamos antes para que no se te olvide.",
      check1: "Todo en «Mis reservas»",
      check2: "Recordatorio automático",
      chip: "¡Cita confirmada!",
      chipSub: "Te avisamos el jueves",
    },
  },

  /* ── Las ocho ventajas ───────────────────────────────────── */
  ventajas: {
    titulo: "Todo lo que esperas de reservar.",
    tituloStroke: "Y nada de lo que te molesta.",
    lead:
      "Sin llamadas, sin esperas y sin mensajes que nadie contesta. Solo tú, tu cita y un par de toques.",

    centroTitulo: "Encuentra tu centro",
    centroTexto: "Descubre negocios cerca de ti con sus servicios, precios y valoraciones.",
    especialistaTitulo: "Elige especialista",
    especialistaTexto: "Reserva con la persona que prefieres según su disponibilidad.",
    huecosTitulo: "Huecos reales",
    huecosTexto: "Solo ves horas libres de verdad, actualizadas al momento.",
    pagoTitulo: "Paga como quieras",
    pagoTexto: "Online con tarjeta o en el establecimiento, tú eliges.",
    confirmacionTitulo: "Confirmación inmediata",
    confirmacionTexto: "Tu cita queda confirmada en el momento, con todos los detalles.",
    recordatoriosTitulo: "Recordatorios",
    recordatoriosTexto: "Te avisamos antes de tu cita para que no se te pase.",
    cambiosTitulo: "Cambia o cancela",
    cambiosTexto: "Desde tu perfil, sin coste, siempre que sea con antelación.",
    historialTitulo: "Historial y reseñas",
    historialTexto: "Tus reservas en un solo sitio y tu opinión cuando terminas.",
  },

  /* ── Día y noche: el conmutador de modo ──────────────────── */
  tema: {
    titulo: "Clara de día.",
    tituloMint: "Elegante de noche.",
    lead:
      "Un diseño limpio, pensado para reservar con una mano y encontrar lo que buscas sin pensarlo. Y en modo oscuro, para que reservar a última hora también sea un placer.",
    grupoEtiqueta: "Ver la app en modo claro u oscuro",
    claro: "Modo claro",
    oscuro: "Modo oscuro",
    check1: "Modo claro y modo oscuro",
    check2: "Fotos del centro y de cada servicio",
    check3: "Precio, duración y valoraciones a la vista",
    altClaro: "App Bookmy en modo claro: la pantalla de inicio con los negocios cercanos y la ficha de un negocio con sus especialistas y servicios",
    altOscuro: "App Bookmy en modo oscuro: la pantalla de inicio y la lista de tus reservas, con reagendar y cancelar",
  },

  /* ── El puente a las empresas ────────────────────────────── */
  negocio: {
    titulo: "¿Tienes un negocio?",
    tituloMint: "Que tus clientes te reserven aquí.",
    /* La de arriba se enseña si SE_OFRECE_PRUEBA está encendido y la
       de abajo si no. Hoy manda la de abajo. */
    leadConPrueba:
      "Con Bookmy para empresas tu negocio aparece en la app, recibe reservas 24/7 y lo gestionas todo desde el móvil. Pruébalo {dias} días gratis: sin llamadas y sin apuntar nada a mano.",
    leadSinPrueba:
      "Con Bookmy para empresas tu negocio aparece en la app, recibe reservas 24/7 y lo gestionas todo desde el móvil. Sin llamadas y sin apuntar nada a mano.",
    ctaEmpresas: "Bookmy para empresas",
    ctaRegistrar: "Registrar mi negocio",
    beamApp: "App",
    beamNegocio: "Tu negocio",

    feedReservaTitulo: "Nueva reserva desde la app",
    feedReservaSub: "Lucía M. · Manicura · vie 16:30",
    feedReservaTag: "Confirmada",
    feedPagoTitulo: "Pago online recibido",
    feedPagoSub: "{precio} · con parafina",
    feedPagoTag: "Cobrado",
    feedAvisoTitulo: "Recordatorio programado",
    feedAvisoSub: "Jueves a las 16:30",
    feedAvisoTag: "Automático",
    feedClienteTitulo: "Ficha de cliente actualizada",
    feedClienteSub: "15 visitas · prefiere tardes",
    feedClienteTag: "Historial",
  },

  /* ── Preguntas frecuentes (#faq) ─────────────────────────── */
  faq: {
    titulo: "Resolvemos tus dudas.",
    otraPregunta: "¿Tienes otra pregunta?",
    asistente: "Pregúntale al asistente",

    gratisQ: "¿La app es gratis?",
    gratisA:
      "Sí. Descargar Bookmy y reservar con la app es gratis. Solo pagas el servicio que reservas, online o en el local.",
    reservarQ: "¿Cómo puedo reservar un servicio?",
    reservarA:
      "Descarga la app, crea tu cuenta y elige el servicio que necesitas. En pocos pasos tendrás tu reserva confirmada.",
    profesionalQ: "¿Puedo elegir el profesional que me atenderá?",
    profesionalA:
      "Sí. Puedes seleccionar al especialista disponible que mejor se adapte a tu horario o preferencias.",
    confirmadaQ: "¿Cómo sé si mi reserva fue confirmada?",
    confirmadaA:
      "Recibirás una confirmación inmediata en la aplicación y una notificación con todos los detalles de tu cita.",
    pagarQ: "¿Cómo puedo pagar?",
    pagarA:
      "Online con tarjeta o en el establecimiento, según las opciones que ofrezca cada negocio. Verás el precio antes de confirmar.",
    cambiarQ: "¿Qué pasa si necesito cambiar o cancelar mi reserva?",
    cambiarA:
      "Desde tu perfil puedes modificar o cancelar una cita sin coste adicional, siempre que lo hagas con antelación.",
    socialQ: "¿Puedo entrar con Google o Apple?",
    socialA: "Sí. Puedes registrarte con tu email o iniciar sesión con Google, Apple o Facebook.",

    /* La última respuesta lleva un enlace dentro, así que va en tres
       trozos: lo de antes, el texto del enlace y lo de después. El
       componente los une con un espacio. */
    apkQ: "¿Puedo instalarla sin Google Play?",
    apkA1: "Sí. En Android puedes",
    apkEnlace: "descargar el archivo APK",
    apkA2:
      "desde esta web e instalarlo. Tu móvil te pedirá permiso para instalar apps de esta fuente.",
  },

  /* ── El bloque de descarga que corona el pie (#descargar) ── */
  cta: {
    titulo: "Tu próxima cita,",
    tituloEm: "a dos toques.",
    lead:
      "Descarga Bookmy gratis y reserva en tus centros favoritos cuando quieras, donde quieras.",
  },
};

export default appEs;
export type TextosApp = typeof appEs;
