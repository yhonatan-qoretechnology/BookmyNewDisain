/* ============================================================
   Las direcciones de la web pública, en un solo sitio
   ------------------------------------------------------------
   La landing estática enlazaba archivos ("plan-basic.html"). Al
   pasarla a Next cada archivo se convierte en una ruta, y si esas
   rutas quedan escritas a mano por las trece páginas, el día que
   una cambie hay que cazarlas una a una. Aquí están todas.

   DOS CAMBIOS DE DIRECCIÓN respecto a la web que está viva hoy:

     /bookmy-free     → /planes/basic
     /bookmy-crm-pro  → /planes/pro

   Las dos antiguas las tiene indexadas Google, así que NO
   desaparecen: next.config.mjs las redirige con un 301 permanente,
   que es la señal que le dice al buscador «esto se ha mudado, pasa
   el posicionamiento a la nueva». Si algún día se quita esa
   redirección, se pierde ese tráfico.
============================================================ */

export const WEB = {
  /** El portal: elegir entre la app y el CRM. */
  portada: "/",

  /* ── El mundo de la app ─────────────────────────────────── */
  app: "/app",
  appEmpresas: "/app/empresas",

  /* ── El mundo del CRM ───────────────────────────────────── */
  crm: "/crm",
  comoFunciona: "/como-funciona",
  planes: "/planes",
  planBasic: "/planes/basic",
  planPro: "/planes/pro",
  calculadora: "/planes#calculadora",
  asistenteIa: "/asistente-ia",
  quienesSomos: "/quienes-somos",

  /* ── Comunes ────────────────────────────────────────────── */
  crearCuenta: "/crear-cuenta",
  contacto: "/contacto",
  privacidad: "/privacidad",
  cookies: "/cookies",
  login: "/login",
} as const;

/** Enlaces fuera de casa. Juntos para poder revisarlos de un vistazo. */
export const FUERA = {
  instagram: "https://www.instagram.com/appbookmy/",
  facebook: "https://www.facebook.com/appbookmy",
  whatsapp: "https://wa.me/34651026700",
  googlePlay: "https://play.google.com/store/search?q=bookmy",
  appStore: "https://apps.apple.com/search?term=bookmy",
  /** El .apk se sirve como archivo estático desde /public. */
  apk: "/descargas/bookmy.apk",
} as const;

/**
 * Los dos mundos de la web. Cada uno tiene su color, su cabecera y
 * su pie: la app es el verde del logo y el CRM el lima del logo CRM.
 */
export type Mundo = "app" | "crm";
