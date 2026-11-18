/* ============================================================
   Web pública · textos del armazón (cabecera, pie y menú) — ES
   ------------------------------------------------------------
   Solo lo que se repite en todas las páginas. El texto propio de
   cada pantalla vive en su archivo (portal, app, crm, planes…).
============================================================ */

const comunEs = {
  marca: {
    alt: "Bookmy, ir a la portada",
    nombre: "Bookmy",
  },

  saltar: {
    contenido: "Saltar al contenido",
    opciones: "Saltar a las opciones",
  },

  /* El conmutador App / CRM que preside las dos cabeceras */
  mundos: {
    etiqueta: "Elige producto",
    app: "App",
    crm: "CRM",
  },

  nav: {
    principal: "Principal",
    menuMovil: "Menú móvil",
    abrirMenu: "Abrir menú",
    cerrarMenu: "Cerrar menú",
    entrar: "Entrar",
    entrarPanel: "Entrar al panel",
    pruebaGratis: "Prueba gratis",
    /* La alternativa de src/lib/web/oferta.ts cuando la prueba no se ofrece. */
    empiezaGratis: "Empieza gratis",
    descargar: "Descargar",
    nuevo: "Nuevo",

    /* Mundo app */
    laApp: "La app",
    personas: "Personas",
    personasSub: "Reserva tus citas en segundos",
    empresas: "Empresas",
    empresasSub: "Recibe reservas desde el móvil",
    descargarApp: "Descargar la app",
    archivoApk: "Archivo APK",
    comoReservar: "Cómo funciona",
    preguntas: "Preguntas",

    /* Mundo CRM */
    elCrm: "El CRM",
    comoFunciona: "Cómo funciona",
    planes: "Planes",
    planBasic: "Plan Basic",
    planBasicSub: "Tus reservas, organizadas",
    planPro: "Plan Pro",
    planProSub: "Todo el sistema, sin límites",
    masPopular: "Más popular",
    compararPlanes: "Comparar planes",
    compararPlanesSub: "Basic frente a Pro y calculadora",
    calculadora: "Calculadora",
    asistenteIa: "Asistente IA",
    quienesSomos: "Quiénes somos",
    contacto: "Contacto",
  },

  pie: {
    appDescripcion:
      "La app para reservar tus citas en segundos y para que los negocios reciban reservas desde el móvil. En iOS y Android.",
    crmDescripcion:
      "El sistema con el que un negocio de servicios lleva su agenda, sus cobros, su equipo y sus clientes desde un solo sitio.",
    columnaApp: "La app",
    columnaDescargar: "Descargar",
    columnaCrm: "El CRM",
    columnaEmpresa: "Empresa",
    columnaLegal: "Legal",
    googlePlay: "Google Play",
    appStore: "App Store",
    apk: "Archivo APK (Android)",
    privacidad: "Privacidad",
    cookies: "Cookies",
    configurarCookies: "Configurar cookies",
    derechos: "Bookmy",
    copyright: "Bookmy. Todos los derechos reservados.",
    hablarAsistente: "Hablar con el asistente",

    /* Cada mundo enseña la puerta del otro, que es de lo que iba
       el portal de la portada. */
    negocioTitulo: "¿Tienes un negocio?",
    negocioTexto:
      "Gestiona reservas, clientes, cobros y equipo con el CRM Bookmy. Pruébalo 7 días gratis.",
    negocioCta: "Conoce el CRM",
    cambiarACrm: "Bookmy CRM para negocios",
    appTitulo: "¿Buscas cita?",
    appTexto:
      "Descarga la app y reserva en tus centros favoritos cuando quieras, en segundos y sin llamar.",
    appCta: "Conoce la app",
    cambiarAApp: "Bookmy, la app para reservar",
  },

  /* Las tres tarjetas de descarga que cierran el mundo de la app */
  /* ── Textos que escribe el motor de animación ──────────────
     No están en ninguna plantilla: los pinta src/lib/web/motor.ts
     desde JavaScript, así que si no se le pasan traducidos salen
     siempre en español. */
  motor: {
    localeNumeros: "es-ES",
    /* Los dos países genéricos de la calculadora: no son países de
       verdad, así que Intl no sabe su nombre y va aquí. */
    paisEuros: "Otro país (euros)",
    paisDolares: "Otro país (dólares)",
    newsletterHecho: "¡Hecho! Te escribimos pronto.",
    newsletterFallo: "No se ha podido enviar. Inténtalo de nuevo.",
    newsletterPorCorreo: "Abriendo tu correo…",
    newsletterAsunto: "Quiero saber más de Bookmy",
  },

  tiendas: {
    disponibleEn: "Disponible en",
    descargalaEn: "Descárgala en",
    archivoAndroid: "Archivo para Android",
    descargarApk: "Descargar APK",
  },
};

export default comunEs;
export type ComunWeb = typeof comunEs;
