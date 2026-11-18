/* ============================================================
   Web pública · Quiénes somos — ES
   ------------------------------------------------------------
   Todo el texto de /quienes-somos (el quienes-somos.html de la
   web estática). Lo del armazón —cabecera, pie, menú y el «Entrar
   al panel»— NO se repite aquí: vive en comun.es.ts y se pide con
   w("comun.…").

   DOS VERSIONES DE LA PROMESA
   El original cerraba con «Prueba Bookmy 7 días gratis». Hoy esa
   prueba está apagada (SE_OFRECE_PRUEBA, en src/lib/web/oferta.ts)
   porque el backend no concede ninguna y los cobros todavía no
   funcionan, así que cada texto que la prometía tiene aquí su
   gemelo sin ella (…ConPrueba / …SinPrueba) y la página elige con
   ese interruptor. La que se ve hoy es la de SIN prueba. El número
   de días no se escribe nunca: entra como {dias}.

   LO QUE NO ESTÁ AQUÍ
   Los nombres propios no se traducen y viven como datos en el
   componente: las ciudades (Marbella, Bogotá…), los nombres de
   quien firma cada testimonio y el correo, el teléfono y el
   usuario de Instagram de las tarjetas de contacto.
============================================================ */

const quienesSomosEs = {
  /* ── Héroe: el globo con España y Colombia ──────────────── */
  heroTitulo: "Hacemos que los negocios de servicios",
  heroTituloMint: "funcionen solos.",
  heroLead:
    "Quien da un servicio debería dedicarse a sus clientes, no a perseguir citas, cuadrar la caja o recordar quién vino hace tres meses. Para eso existe Bookmy.",
  heroEspana: "España · Costa del Sol",
  heroColombia: "Colombia · Bogotá y Medellín",

  /* ── Historia ───────────────────────────────────────────── */
  historiaTitulo: "Empezamos por las reservas.",
  historiaTituloMint: "Nos quedamos por todo lo demás.",
  historiaStatement:
    "Detrás de cada cita hay alguien que madruga, que conoce a sus clientes por su nombre y que quiere hacer bien su trabajo. Y, demasiadas veces, ese alguien pierde horas con el teléfono, la libreta y las hojas de cálculo.",
  historiaParrafo1:
    "Por eso creamos Bookmy: para dar a los negocios de servicios la tecnología que antes solo tenían las grandes empresas, sin su complejidad. Empezamos por las reservas y hoy somos un sistema completo: CRM, cobros, equipo, inventario, sedes, estadísticas y un asistente con inteligencia artificial.",
  historiaParrafo2:
    "Trabajamos codo con codo con negocios reales, de la estética a la tecnología, y mejoramos Bookmy con lo que nos cuentan. Porque la mejor herramienta es la que se usa cada día sin pensarlo.",

  /* ── Misión y visión ────────────────────────────────────── */
  misionTitulo: "Misión",
  misionTexto:
    "Que cualquier negocio de servicios pueda organizarse, vender y crecer con la tecnología de una gran empresa, sin su complejidad.",
  visionTitulo: "Visión",
  visionTexto:
    "Ser la plataforma de referencia para gestionar y hacer crecer negocios de servicios en España y Latinoamérica.",

  /* ── Principios ─────────────────────────────────────────── */
  principiosTitulo: "Seis principios que se notan en el producto.",
  principioSimplicidadTitulo: "Simplicidad",
  principioSimplicidadTexto: "Si algo necesita un manual, lo rediseñamos. Lo importante, siempre a un toque.",
  principioCercaniaTitulo: "Cercanía",
  principioCercaniaTexto: "Hablamos tu idioma y respondemos como personas, no como un ticket.",
  principioDatosTitulo: "Datos con propósito",
  principioDatosTexto: "Medimos para que decidas mejor, no para llenar pantallas de gráficos.",
  principioPrivacidadTitulo: "Privacidad por diseño",
  principioPrivacidadTexto: "Tus datos y los de tus clientes son tuyos. Los protegemos y no los vendemos.",
  principioMejoraTitulo: "Mejora continua",
  principioMejoraTexto: "Escuchamos a quien usa Bookmy cada día y convertimos su feedback en producto.",
  principioIaTitulo: "IA responsable",
  principioIaTexto: "Tecnología que ayuda, transparente y siempre con una persona detrás.",

  /* ── Cifras ─────────────────────────────────────────────────
     El valor que lleva el marcado es lo que se ve antes de que el
     contador arranque (y lo único que se ve sin JavaScript), así
     que va escrito con la puntuación de cada idioma. El único
     sufijo que cambia de idioma es el del porcentaje: en español
     lleva un espacio antes del signo y en inglés va pegado. */
  cifrasEtiqueta: "Bookmy en cifras",
  cifraReservas: "+25K",
  cifraReservasTexto: "reservas gestionadas",
  cifraConfirmadas: "98 %",
  cifraConfirmadasSufijo: " %",
  cifraConfirmadasTexto: "confirmadas al instante",
  cifraValoracion: "4,9★",
  cifraValoracionTexto: "de valoración en tiendas",
  cifraCiudades: "7",
  cifraCiudadesTexto: "ciudades en 2 países",

  /* ── Dónde estamos ──────────────────────────────────────── */
  dondeTitulo: "De la Costa del Sol",
  dondeTituloMint: "a Colombia.",
  dondeLead: "Negocios de dos países ya gestionan sus reservas, clientes y equipos con Bookmy.",
  dondeEspana: "España",
  dondeEspanaZona: "Costa del Sol",
  dondeColombia: "Colombia",
  dondeColombiaZona: "Latinoamérica",

  /* ── Testimonios ────────────────────────────────────────── */
  vocesTitulo: "Lo que dicen los negocios que confían en nosotros.",
  voz1Cita:
    "“Bookmy transformó por completo nuestra gestión de reservas. Hoy tenemos una agenda organizada, menos cancelaciones y clientes más felices.”",
  voz1Cargo: "Gerente · Glow Experience",
  voz2Cita:
    "“Necesitábamos centralizar reservas y clientes. Con Bookmy automatizamos procesos y mejoramos el seguimiento comercial del equipo.”",
  voz2Cargo: "Gerente · Qore Technology",
  vozAnterior: "Testimonio anterior",
  vozSiguiente: "Siguiente testimonio",

  /* ── Contacto ───────────────────────────────────────────── */
  contactoTitulo: "Estamos aquí para ayudarte.",
  contactoLead: "Ventas, soporte o cualquier duda sobre Bookmy: escríbenos por el canal que prefieras.",
  contactoEmail: "Email",
  contactoWhatsapp: "WhatsApp",
  contactoInstagram: "Instagram",
  contactoAcceso: "Acceso clientes",

  /* ── Cierre: la llamada a la acción que corona el pie ────── */
  ctaTitulo: "Haz que tu negocio funcione solo.",
  ctaTituloEm: "Empieza hoy.",
  ctaLeadConPrueba: "Prueba Bookmy {dias} días gratis, sin tarjeta y sin permanencia.",
  ctaLeadSinPrueba: "Empieza gratis, sin tarjeta y sin permanencia. Tú decides cuándo crecer.",
  ctaBotonConPrueba: "Prueba {dias} días gratis",
  ctaBotonSinPrueba: "Crear cuenta gratis",
  ctaSecundario: "Hablar con el equipo",
  /* Lo que el botón le pone en la boca al visitante cuando abre el
     asistente (data-assistant-ask), así que se lee en primera
     persona y se traduce como cualquier otra frase. */
  ctaPregunta: "Quiero hablar con el equipo de Bookmy",
};

export default quienesSomosEs;
export type QuienesSomosWeb = typeof quienesSomosEs;
