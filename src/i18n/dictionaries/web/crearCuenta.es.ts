/* ============================================================
   Web pública · crear cuenta — ES
   ------------------------------------------------------------
   Solo el envoltorio: el titular, los tres motivos y la llamada
   del pie. El formulario de dentro es el asistente de alta real
   (SignupWizard), que tiene sus propios textos bajo `signup` en
   el diccionario grande y NO se toca desde aquí.

   Cada clave que promete la prueba gratuita va desdoblada:
   SE_OFRECE_PRUEBA (src/lib/web/oferta.ts) elige cuál se enseña.
   Hoy está apagada, así que lo que se ve es la versión sin
   prueba: cuídala igual, que es la que está en pantalla.
============================================================ */

const crearCuentaEs = {
  meta: {
    tituloConPrueba: "Crear cuenta · Prueba Bookmy {dias} días gratis",
    tituloSinPrueba: "Crear cuenta · Empieza gratis con Bookmy",
    descripcionConPrueba:
      "Elige Plan Basic o Plan Pro, déjanos tus datos y empieza tu prueba de {dias} días. Sin tarjeta y sin permanencia.",
    descripcionSinPrueba:
      "Crea tu cuenta de Bookmy en menos de dos minutos y empieza a recibir reservas hoy. Sin tarjeta y sin permanencia.",
  },

  volver: "Ver los planes",

  tituloConPrueba: { antes: "Empieza tu prueba de", acento: "{dias} días gratis." },
  tituloSinPrueba: { antes: "Tu negocio, recibiendo reservas", acento: "desde hoy." },

  leadConPrueba:
    "Elige tu plan, déjanos tus datos y te activamos la cuenta. Sin tarjeta y sin permanencia.",
  leadSinPrueba:
    "Rellenas tres pasos y entras directo a tu panel, con la agenda lista para recibir reservas. Sin tarjeta y sin permanencia.",

  /* Los tres motivos de la columna izquierda. */
  motivos: {
    todo: {
      titulo: "Todo listo desde el primer día",
      texto: "Reservas, recordatorios y tu perfil público funcionando en minutos.",
    },
    sinTarjeta: {
      titulo: "Sin tarjeta",
      texto: "No te pedimos datos de pago, así que no hay cargos automáticos.",
    },
    acompanamos: {
      titulo: "Te acompañamos",
      texto: "Una persona del equipo te ayuda a configurar tu cuenta.",
    },
  },

  /* La llamada que cierra la página, encima del pie. */
  cta: {
    tituloAntes: "¿Prefieres hablarlo",
    tituloAcento: "con una persona?",
    lead: "Te ayudamos a elegir plan y a configurar tu cuenta. Escríbenos y te respondemos enseguida.",
    whatsapp: "Escribir por WhatsApp",
    asistente: "Hablar con el asistente",
  },
};

export default crearCuentaEs;
export type CrearCuentaWeb = typeof crearCuentaEs;
