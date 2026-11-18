/* ============================================================
   Public site · the front-door portal — EN
   ------------------------------------------------------------
   Mirror of portal.es.ts. The headline is split word by word
   because each word animates on its own turn, so the split has to
   read naturally in English too — it is not a word-for-word
   translation of the Spanish one.
============================================================ */
import type { PortalWeb } from "./portal.es";

const portalEn: PortalWeb = {
  meta: {
    titulo: "Bookmy · What would you like to see?",
    descripcion:
      "Bookmy: the app that books appointments in seconds, and the AI-powered CRM that runs and grows your service business. Pick what you'd like to see.",
  },

  hola: ["Hi,", "this", "is", "Bookmy."],
  titulo: {
    antes: ["What", "would", "you", "like", "to"],
    acento: "discover",
    despues: ["today?"],
  },

  elige: "Choose what you'd like to see",
  entrarPanel: "Go to the dashboard",

  puertas: {
    app: { nombre: "The app", sub: "Book or take appointments" },
    crm: { nombre: "The CRM", sub: "To run your business" },
  },

  abriendo: {
    app: "Opening the app…",
    crm: "Opening the CRM…",
    generica: "Opening…",
  },

  flotantes: {
    cita: { titulo: "Booking confirmed", sub: "Today · 10:30 · Cut and beard" },
    cliente: { titulo: "New client", sub: "Laura M. · first visit" },
    pago: { titulo: "Payment received", sub: "€45.00 · Colour" },
    recordatorio: { titulo: "Reminder sent", sub: "Tomorrow · 17:00" },
    resena: { titulo: "Five-star review", sub: "“I'll definitely be back!”" },
    ingresos: { titulo: "Revenue +18%", sub: "This month against last" },
    asistente: { titulo: "AI assistant", sub: "Booking closed over chat" },
    stock: { titulo: "Running low", sub: "Repair shampoo · 3 left" },
  },

  pie: {
    planes: "Plans",
    quienesSomos: "About us",
    privacidad: "Privacy",
    cookies: "Cookies",
    configurarCookies: "Cookie settings",
  },
};

export default portalEn;
