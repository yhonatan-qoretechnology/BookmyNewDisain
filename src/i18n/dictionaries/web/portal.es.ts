/* ============================================================
   Web pública · el portal de la portada — ES
   ------------------------------------------------------------
   La portada no vende nada: pregunta. Dos puertas, la app y el
   CRM, y el visitante dice a qué viene. Todo lo que se lee aquí
   es muy corto a propósito.
============================================================ */

const portalEs = {
  meta: {
    titulo: "Bookmy · ¿Qué quieres descubrir?",
    descripcion:
      "Bookmy: la app para reservar citas en segundos y el CRM con IA para gestionar y hacer crecer tu negocio de servicios. Elige qué quieres conocer.",
  },

  /* El saludo entra palabra a palabra, así que va partido: cada
     elemento de la lista es una palabra con su propio turno. */
  hola: ["Hola,", "esto", "es", "Bookmy."],
  titulo: {
    antes: ["¿Qué", "quieres"],
    acento: "descubrir",
    despues: ["hoy?"],
  },

  elige: "Elige qué quieres conocer",
  entrarPanel: "Entrar al panel",

  puertas: {
    app: { nombre: "La app", sub: "Reserva o recibe citas" },
    crm: { nombre: "El CRM", sub: "Para gestionar tu negocio" },
  },

  /* Lo que se lee en voz alta al elegir una puerta. */
  abriendo: {
    app: "Abriendo la app…",
    crm: "Abriendo el CRM…",
    generica: "Abriendo…",
  },

  /* Las tarjetas que flotan alrededor: cosas que pasan de verdad en
     un negocio que usa Bookmy. El orden es el de la pantalla. */
  flotantes: {
    cita: { titulo: "Cita confirmada", sub: "Hoy · 10:30 · Corte y barba" },
    cliente: { titulo: "Nuevo cliente", sub: "Laura M. · primera visita" },
    pago: { titulo: "Pago online recibido", sub: "45,00 € · Coloración" },
    recordatorio: { titulo: "Recordatorio enviado", sub: "Mañana · 17:00" },
    resena: { titulo: "Reseña de 5 estrellas", sub: "«¡Volveré seguro!»" },
    ingresos: { titulo: "Ingresos +18 %", sub: "Este mes frente al anterior" },
    asistente: { titulo: "Asistente IA", sub: "Reserva cerrada por chat" },
    stock: { titulo: "Stock bajo", sub: "Champú reparador · 3 uds." },
  },

  pie: {
    planes: "Planes",
    quienesSomos: "Quiénes somos",
    privacidad: "Privacidad",
    cookies: "Cookies",
    configurarCookies: "Configurar cookies",
  },
};

export default portalEs;
export type PortalWeb = typeof portalEs;
