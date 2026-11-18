/* ============================================================
   Diccionario de la web publica (bookmy.es) — espanol
   ------------------------------------------------------------
   Sale del js/script.js de la web estatica original. Se cuelga
   del diccionario del panel bajo la clave `web`, asi que se usa
   con t("web.nav.home") y el idioma lo manda el mismo selector
   que en el panel.

   El pais (ES/CO) es otro eje: las claves que chirrian a un
   colombiano se desdoblan con porPais({ ES, CO }) igual que en
   es.ts (ver alli el PUNTO DE CONFIGURACION #7). Antes del alta no
   hay empresa y el pais es ES, asi que la web espanola no cambia.
============================================================ */
import { porPais } from "../pais";
/* ── Web 2.0 ───────────────────────────────────────────────
   Los textos del rediseño viven en archivos propios dentro de
   ./web/, uno por pantalla, porque son muchos y mezclarlos aquí
   dejaría un archivo de miles de líneas imposible de revisar.
   Este índice solo los cuelga del diccionario. */
import comun from "./web/comun.es";
import portal from "./web/portal.es";
import app from "./web/app.es";
import appEmpresas from "./web/appEmpresas.es";
import asistenteIa from "./web/asistenteIa.es";
import comoFunciona from "./web/comoFunciona.es";
import crearCuenta from "./web/crearCuenta.es";
import cookies from "./web/cookies.es";
import privacidad from "./web/privacidad.es";
import crm from "./web/crm.es";
import planBasic from "./web/planBasic.es";
import planes from "./web/planes.es";
import planPro from "./web/planPro.es";
import quienesSomos from "./web/quienesSomos.es";

const webEs = {
  nav: {
    panel: "Entrar al panel",
    themeDark: "Cambiar a modo oscuro",
    themeLight: "Cambiar a modo claro",
    home: "Inicio",
    app: "App Bookmy",
    how: "Cómo funciona",
    plans: "Planes",
    contact: "Contacto",
    cta: "Descargar Bookmy",
    langLabel: "Idioma",
    menuLabel: "Menú",
    planFree: "Bookmy Free",
    planFreeDesc: "Empieza gratis",
    planPro: "Bookmy CRM Pro",
    planProDesc: "Para crecer sin límites",
  },
  /* ── Aviso de cookies ──────────────────────────────────────
     Dos capas, como exige la guía de la AEPD: en la primera,
     "Rechazar todas" y "Aceptar todas" con el mismo peso; en la
     segunda, el consentimiento por categorías. Este texto es el
     que la política de cookies describe, así que si cambia uno
     hay que cambiar el otro. */
  cookie: {
    titulo: "Tu privacidad, tus reglas",
    etiqueta: "Aviso de cookies",
    texto:
      "Usamos cookies propias y de terceros para que la web funcione, recordar tus preferencias, medir el uso y, si lo aceptas, personalizar publicidad. Puedes aceptarlas, rechazarlas o elegir cuáles.",
    politica: "Política de cookies",
    rechazar: "Rechazar todas",
    aceptar: "Aceptar todas",
    configurar: "Configurar",
    guardar: "Guardar selección",
    cerrar: "Cerrar",
    panelTitulo: "Preferencias de cookies",
    panelTexto:
      "Elige qué categorías permites. Puedes cambiarlo cuando quieras desde «Configurar cookies», en el pie de página.",
    panelDetalle: "Detalle de cada cookie, proveedor y duración en la",
    siempre: "Siempre activas",
    cats: {
      necessary: {
        nombre: "Técnicas y necesarias",
        desc: "Imprescindibles para que la web funcione: seguridad, navegación y recordar tu elección sobre cookies. No requieren consentimiento.",
      },
      functional: {
        nombre: "Funcionales",
        desc: "Recuerdan tus preferencias, como la conversación con el asistente entre visitas o el plan que estabas consultando.",
      },
      analytics: {
        nombre: "Analíticas",
        desc: "Nos ayudan a entender de forma agregada cómo se usa la web (páginas vistas, origen de las visitas) para mejorarla.",
      },
      marketing: {
        nombre: "Marketing",
        desc: "Permiten medir campañas y mostrarte contenido de Bookmy relevante en otras plataformas.",
      },
    },
  },
  contact: {
    back: "← Volver al inicio",
    eyebrow: "Hablemos",
    title1: "Estamos aquí",
    title2: "para ayudarte.",
    text: "Escríbenos sobre ventas, soporte técnico o cualquier duda sobre Bookmy. Nuestro equipo te responderá lo antes posible.",
    formTitle: "Envíanos un mensaje",
    name: "Nombre completo",
    namePh: "Ej. María González",
    email: "Correo electrónico",
    emailPh: "tucorreo@email.com",
    phone: "Teléfono",
    phonePh: porPais({ ES: "+34 600 000 000", CO: "+57 300 000 0000" }),
    subject: "Motivo de tu consulta",
    subjectSelect: "Selecciona una opción",
    subjectSales: "Ventas",
    subjectSupport: "Soporte técnico",
    subjectBilling: "Facturación",
    subjectOther: "Otro",
    message: "Mensaje",
    messagePh: "Cuéntanos en qué podemos ayudarte...",
    submit: "Enviar mensaje",
    error: "No pudimos enviar tu mensaje. Vuelve a intentarlo o escríbenos directamente.",
    successTitle: "¡Mensaje enviado!",
    successText: "Gracias por escribirnos. Nuestro equipo revisará tu mensaje y te contactará muy pronto.",
    successBack: "Volver al inicio",
    infoTitle: "Otras formas de contacto",
    infoEmail: "Escríbenos directamente",
    infoSocial: "Síguenos en redes",
  },
  panelAccess: {
    eyebrow: "Acceso para negocios",
    title1: "¿Ya trabajas con Bookmy?",
    title2: "Entra a tu panel",
    text: "Gestiona reservas, clientes, equipo y sedes desde el panel administrativo. Si aún no tienes cuenta, empieza gratis con Bookmy Free.",
    cta: "Entrar al panel administrativo",
    secondary: "Quiero una cuenta",
    point1: "Agenda y reservas en tiempo real",
    point2: "Tu equipo y tus sedes en un sitio",
    point3: "Reseñas y estadísticas de tu negocio",
  },
  signup: {
    paisHereda: "Tu negocio trabajará en {moneda}, con {impuesto} y los festivos oficiales de {pais}.",
    invitadoPor: "🎁 Te invita {empresa}: cuando actives Bookmy CRM Pro te regalamos 1 mes gratis.",
    /* Cabecera */
    back: "← Volver",
    eyebrow: "Crea tu cuenta",
    title1: "Tu negocio, funcionando",
    title2: "en menos de dos minutos",
    lead: "Sin llamadas ni comerciales. Rellenas tres pasos y entras directo a tu panel, con la agenda lista para recibir reservas.",
    /* Pasos */
    step1: "Tu negocio",
    step2: "Tu primera sede",
    step3: "Tu acceso",
    stepOf: "Paso {n} de 3",
    next: "Continuar",
    prev: "Atrás",
    submit: "Crear mi cuenta",
    submitting: "Creando tu cuenta…",
    /* Campos */
    empresaNombre: "Nombre del negocio",
    empresaNombrePh: "Ej. Glow Experience",
    /* El «os dedicáis» es de España; en Colombia se trata de usted. */
    rubro: porPais({ ES: "¿A qué os dedicáis?", CO: "¿A qué se dedican?" }),
    rubroPh: "Selecciona tu sector",
    rubroSalud: "Salud y bienestar",
    rubroEstetica: "Estética y belleza",
    rubroBarberia: "Peluquería y barbería",
    rubroDeporte: "Deporte y fitness",
    rubroServicios: "Servicios profesionales",
    rubroOtro: "Otro",
    telefono: "Teléfono de contacto",
    telefonoPh: porPais({ ES: "+34 600 000 000", CO: "+57 300 000 0000" }),
    sedeNombre: "Nombre de la sede",
    sedeNombrePh: "Ej. Sede Centro",
    direccion: "Dirección",
    direccionPh: "Empieza a escribir y elige tu dirección",
    direccionAyuda: "La usamos para que tus clientes te encuentren en la app.",
    /* Los rótulos de la dirección los manda GET /paises
       (etiquetaMunicipio, etiquetaRegion): «Ciudad» y «Departamento» en
       Colombia. En el alta no hay sesión todavía, así que no se leen con
       useRegion() sino del país que se acaba de elegir en el desplegable
       (ver SignupWizard). Estos dos solo quedan de respaldo, para cuando
       /paises no contesta. */
    municipio: "Municipio",
    provincia: "Provincia",
    firstName: "Nombre",
    lastName: "Apellidos",
    email: "Correo electrónico",
    emailPh: "tucorreo@tunegocio.com",
    emailAyuda: "Con este correo entrarás a tu panel.",
    password: "Contraseña",
    passwordAyuda: "Mínimo 7 caracteres, con mayúscula, minúscula, número y símbolo.",
    acepta: "He leído y acepto los {terminos} y la {privacidad}.",
    aceptaTerminos: "términos",
    aceptaPrivacidad: "política de privacidad",
    /* Resumen del plan */
    resumenTitulo: "Lo que vas a activar",
    /* Los nombres COMERCIALES, que son los que ve el cliente: la web
       nueva los llama Plan Basic y Plan Pro. El backend los sigue
       llamando FREE y PRO, y así se quedan: cambiar un enum de la base
       de datos por un cambio de marca no compensa. */
    /* Lo que trae cada plan, en la tarjeta de la derecha del alta.
       Vivía en la sección `pricing`, que era de la web anterior y se
       retiró con ella; como el alta sigue enseñándolo, se queda aquí.
       Van como claves sueltas y no como una lista porque una de ellas
       cambia según el país y eso solo lo resuelve w(). */
    basicF1: "Gestión básica de reservas",
    basicF2: "Agenda digital 24/7",
    basicF3: "Confirmaciones automáticas",
    basicF4: porPais({ ES: "Acceso desde móvil y tablet", CO: "Acceso desde celular y tablet" }),
    basicF5: "Perfil público para clientes",
    proF1: "Facturación y pagos",
    proF2: "Gestión avanzada de reservas",
    proF3: "Administración de trabajadores",
    proF4: "Control de inventario",
    proF5: "Estadísticas en tiempo real",
    proF6: "Múltiples sucursales",
    planFree: "Plan Basic",
    planFreeSub: "Gratis, para siempre",
    planPro: "Plan Pro",
    /* Dos versiones: la promesa de la prueba pasa por SE_OFRECE_PRUEBA
       (src/lib/web/oferta.ts) y los días nunca se escriben a mano. */
    planProSub: "{dias} días gratis · sin tarjeta",
    planProSubSinPrueba: "Todo el sistema, sin límites",
    planBadge: "{dias} días",
    cambiarAFree: "Prefiero empezar solo con lo gratuito",
    cambiarAPro: "Añadir 30 días de Pro gratis",
    nudgeTitle: "Añade 30 días de Pro, gratis",
    nudgeText: "Facturación, estadísticas, stock y comunicación durante un mes. No pedimos tarjeta y al acabar vuelves a Free sin perder nada.",
    nudgeCta: "Sí, quiero probarlo",
    incluyeFree: "Incluye",
    incluyePro: "Incluye, además de todo lo gratuito",
    garantia: "Sin tarjeta · Sin permanencia · Tus datos siempre son tuyos",
    /* Errores y éxito */
    errorNombre: "Dinos cómo se llama tu negocio.",
    errorTelefono: "Necesitamos un teléfono de contacto.",
    errorSede: "Ponle nombre a tu primera sede.",
    errorDireccion: "Escribe la dirección de la sede.",
    errorPersona: "Dinos tu nombre y tus apellidos.",
    errorEmail: "Ese correo no parece válido.",
    errorPassword: "La contraseña no cumple las reglas.",
    errorAcepta: "Hay que aceptar los términos para continuar.",
    errorGeneral: "No pudimos crear la cuenta. Revisa los datos e inténtalo otra vez.",
    exitoTitulo: "¡Tu cuenta está lista!",
    exitoTexto: "Te llevamos a tu panel…",
  },
  /* ── Web 2.0 ─────────────────────────────────────────── */
  comun,
  portal,
  app,
  appEmpresas,
  asistenteIa,
  comoFunciona,
  crearCuenta,
  cookies,
  privacidad,
  crm,
  planBasic,
  planes,
  planPro,
  quienesSomos,
};

export default webEs;
export type WebDictionary = typeof webEs;
