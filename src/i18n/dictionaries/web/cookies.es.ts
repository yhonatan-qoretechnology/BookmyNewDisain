/* ============================================================
   Web pública · Política de cookies — ES
   ------------------------------------------------------------
   Todo el texto de /cookies (el cookies.html de la web nueva). El
   marcado vive en src/app/(web)/cookies/, y ahí no hay ni una
   frase escrita: cada cadena sale de aquí con w("cookies.clave").

   ESTO ES UN DOCUMENTO LEGAL, NO UN TEXTO DE MARKETING
   El español está portado PALABRA POR PALABRA del original. No se
   ha resumido, mejorado ni actualizado nada: ni un plazo, ni un
   nombre de cookie, ni una duración, ni el correo de contacto. Si
   algo hay que cambiar, se cambia porque lo decida quien responde
   del documento, no al pasarlo a Next.

   Por eso aquí dentro está TAMBIÉN lo que en otras pantallas
   viviría en el componente: los nombres de las cookies
   (bookmy_consent, _GRECAPTCHA…) y el titular de cada una
   (Bookmy, Google). Es la tabla que la ley obliga a enseñar y se
   revisa de un vistazo, en un solo sitio, fila por fila. En el
   inglés esos identificadores se copian tal cual: no se traducen.

   LAS DOS FILAS CON HUECOS
   Las filas 6 y 7 de la lista llegan sin rellenar en el original
   («[Cookies de analítica, si se activan]», «[Proveedor]»,
   «[Duración]») y van en <mark class="fill">, que el CSS pinta en
   ámbar. Se portan igual, hueco incluido: rellenarlas sería
   inventarse un proveedor y una duración.

   LA PRUEBA GRATUITA
   La llamada del pie prometía «7 días gratis». Hoy esa prueba no
   se concede (SE_OFRECE_PRUEBA, en src/lib/web/oferta.ts), así que
   esas frases están escritas dos veces (…ConPrueba / …SinPrueba) y
   la página elige con ese interruptor. Los días nunca se escriben:
   entran como {dias} desde DIAS_DE_PRUEBA.

   El inglés está en cookies.en.ts con las mismas claves; el tipo
   CookiesWeb obliga a que no falte ninguna.
============================================================ */

const cookiesEs = {
  /* ── Héroe ───────────────────────────────────────────────── */
  heroTitulo: "Política de cookies",
  heroLead:
    "Qué son las cookies, cuáles usa Bookmy, para qué sirven, cuánto duran y cómo puedes aceptarlas, rechazarlas o cambiar de opinión en cualquier momento.",
  /* La fecha va escrita, como en el original: es la fecha de esta
     versión del documento, no «hoy». No se calcula nunca. */
  heroActualizado: "Última actualización: 16 de noviembre de 2026",
  heroConfigurar: "Configurar mis cookies",

  /* ── Índice lateral ──────────────────────────────────────── */
  indiceAria: "Índice de la política",
  indiceTitulo: "Índice",
  indice1: "1. Qué son las cookies",
  indice2: "2. Tipos que usamos",
  indice3: "3. Lista de cookies",
  indice4: "4. Terceros",
  indice5: "5. Cómo gestionarlas",
  indice6: "6. Tu consentimiento",
  indice7: "7. Cambios y contacto",
  indiceConfigurar: "Configurar cookies",

  /* ── 1 · Qué son las cookies ─────────────────────────────── */
  queSonTitulo: "Qué son las cookies",
  queSonParrafo1:
    "Las cookies son pequeños archivos que una web guarda en tu navegador para recordar información sobre tu visita. Tecnologías parecidas, como el almacenamiento local del navegador (localStorage y sessionStorage), cumplen la misma función, así que en esta política las tratamos igual.",
  queSonParrafo2:
    "Las usamos para que la web funcione, recordar tus preferencias y, solo si lo aceptas, entender cómo se usa la web y medir nuestras campañas.",

  /* ── 2 · Tipos de cookies (primera tabla) ────────────────── */
  tiposTitulo: "Tipos de cookies que usamos",
  tiposColCategoria: "Categoría",
  tiposColParaQue: "Para qué sirven",
  tiposColConsentimiento: "¿Necesitan tu consentimiento?",

  /* Fila 1 · técnicas */
  tipo1Categoria: "Técnicas y necesarias",
  tipo1ParaQue:
    "Funcionamiento básico: seguridad, navegación, recordar tu elección de cookies y mantener la conversación con el asistente mientras navegas.",
  tipo1Consentimiento: "No. Son imprescindibles para el servicio que pides.",
  /* Fila 2 · funcionales */
  tipo2Categoria: "Funcionales",
  tipo2ParaQue: "Recuerdan tus preferencias entre visitas, como la conversación con el asistente.",
  tipo2Consentimiento: "Sí.",
  /* Fila 3 · analíticas */
  tipo3Categoria: "Analíticas",
  tipo3ParaQue: "Nos ayudan a entender, de forma agregada, cómo se usa la web para mejorarla.",
  tipo3Consentimiento: "Sí.",
  /* Fila 4 · marketing */
  tipo4Categoria: "Marketing",
  tipo4ParaQue: "Permiten medir campañas y mostrarte contenido relevante en otras plataformas.",
  tipo4Consentimiento: "Sí.",

  tiposNota:
    "Esta web no activa cookies analíticas ni de marketing hasta que las aceptas. Si las rechazas, puedes navegar igual.",

  /* ── 3 · Lista de cookies (segunda tabla) ────────────────── */
  listaTitulo: "Lista de cookies y almacenamiento",
  listaColNombre: "Nombre",
  listaColTitular: "Titular",
  listaColFinalidad: "Finalidad",
  listaColDuracion: "Duración",
  listaColCategoria: "Categoría",

  /* Fila 1 · la elección de cookies */
  cookie1Nombre: "bookmy_consent",
  cookie1Titular: "Bookmy",
  cookie1Finalidad: "Guarda tus preferencias de cookies (almacenamiento local).",
  cookie1Duracion: "12 meses",
  cookie1Categoria: "Técnica",
  /* Fila 2 · el asistente, durante la visita */
  cookie2Nombre: "bookmy_ai",
  cookie2Titular: "Bookmy",
  cookie2Finalidad:
    "Mantiene la conversación con el asistente mientras navegas (almacenamiento de sesión).",
  cookie2Duracion: "Sesión",
  cookie2Categoria: "Técnica",
  /* Fila 3 · el asistente, entre visitas (mismo nombre, otra finalidad) */
  cookie3Nombre: "bookmy_ai",
  cookie3Titular: "Bookmy",
  cookie3Finalidad:
    "Recuerda la conversación con el asistente entre visitas (almacenamiento local).",
  cookie3Duracion: "Hasta que la borres o retires el consentimiento",
  cookie3Categoria: "Funcional",
  /* Fila 4 · la sugerencia del asistente */
  cookie4Nombre: "bookmy_ai_teaser",
  cookie4Titular: "Bookmy",
  cookie4Finalidad: "Recuerda que has cerrado la sugerencia del asistente.",
  cookie4Duracion: "Sesión",
  cookie4Categoria: "Técnica",
  /* Fila 5 · reCAPTCHA, que es de Google */
  cookie5Nombre: "_GRECAPTCHA",
  cookie5Titular: "Google",
  cookie5Finalidad:
    "Protege los formularios de contacto, alta e inicio de sesión de la plataforma frente a bots.",
  cookie5Duracion: "6 meses",
  cookie5Categoria: "Técnica",
  /* ── Filas 8, 9 y 10 · lo que faltaba ─────────────────────
     La tabla se titula «Lista de cookies Y ALMACENAMIENTO» y no
     declaraba tres claves que el sitio SÍ usa en estas mismas
     páginas: el tema, el idioma y la puerta de acceso. Las dos
     primeras las lee el script del layout raíz en CADA carga, antes
     de pintar; la tercera la lee ese mismo script y la escribe
     /login y el alta de un negocio, que es web pública.

     Están exentas de pedir consentimiento (son técnicas: guardan una
     elección del propio visitante), pero el deber de INFORMAR de la
     AEPD alcanza también a las exentas, y una tabla que dice cubrir
     el almacenamiento y se deja tres claves fuera no informa. */
  cookie8Nombre: "bookmy-theme",
  cookie8Titular: "Bookmy",
  cookie8Finalidad:
    "Recuerda si prefieres el tema claro u oscuro, para no cambiártelo en cada visita (almacenamiento local).",
  cookie8Duracion: "Hasta que la borres",
  cookie8Categoria: "Técnica",
  cookie9Nombre: "bm_lang",
  cookie9Titular: "Bookmy",
  cookie9Finalidad:
    "Recuerda el idioma que has elegido, español o inglés (almacenamiento local).",
  cookie9Duracion: "Hasta que la borres",
  cookie9Categoria: "Técnica",
  cookie10Nombre: "bm_login_origen",
  cookie10Titular: "Bookmy",
  cookie10Finalidad:
    "Recuerda por qué pantalla de acceso has entrado, para devolverte a la misma al cerrar sesión (almacenamiento de sesión).",
  cookie10Duracion: "Sesión",
  cookie10Categoria: "Técnica",
  /* Fila 6 · hueco: analítica, si algún día se activa */
  cookie6Nombre: "[Cookies de analítica, si se activan]",
  cookie6Titular: "[Proveedor]",
  cookie6Finalidad: "Medición agregada del uso de la web.",
  cookie6Duracion: "[Duración]",
  cookie6Categoria: "Analítica",
  /* Fila 7 · hueco: marketing, si algún día se activa */
  cookie7Nombre: "[Cookies de marketing, si se activan]",
  cookie7Titular: "[Proveedor]",
  cookie7Finalidad: "Medición de campañas y publicidad personalizada.",
  cookie7Duracion: "[Duración]",
  cookie7Categoria: "Marketing",

  /* ── 4 · Terceros ────────────────────────────────────────── */
  tercerosTitulo: "Cookies y servicios de terceros",
  /* El párrafo lleva dos enlaces a Google por dentro, así que va
     partido: trozo, enlace, trozo, enlace, trozo. */
  terceros1A:
    "Algunos proveedores pueden instalar sus propias cookies cuando usas contenido o funciones que dependen de ellos. Los formularios de la plataforma (contacto, crear cuenta e inicio de sesión) están protegidos con Google reCAPTCHA; se aplican la ",
  terceros1Privacidad: "política de privacidad",
  terceros1B: " y las ",
  terceros1Condiciones: "condiciones",
  terceros1C: " de Google.",
  terceros2A:
    "La web también carga sus tipografías desde un proveedor externo. Ese servicio no instala cookies, pero recibe la dirección IP de tu dispositivo para entregar los archivos. Más información en la ",
  terceros2Privacidad: "política de privacidad",
  terceros2B: ".",

  /* ── 5 · Cómo gestionar tus preferencias ─────────────────── */
  gestionarTitulo: "Cómo gestionar tus preferencias",
  gestionar1A: "Puedes aceptar, rechazar o elegir por categorías en cualquier momento desde el botón ",
  /* El nombre del botón, en negrita y entre comillas latinas. Tiene
     que decir lo mismo que el botón del pie (comun.pie.configurarCookies):
     si uno cambia, el otro también. */
  gestionar1Boton: "«Configurar cookies»",
  gestionar1B: ", que tienes en esta página y en el pie de toda la web.",
  gestionarBoton: "Configurar mis cookies",
  gestionar2:
    "También puedes bloquear o borrar las cookies desde la configuración de privacidad de tu navegador (Chrome, Safari, Firefox, Edge u otro). Ten en cuenta que, si bloqueas las técnicas, algunas partes de la web pueden no funcionar bien.",

  /* ── 6 · Tu consentimiento ───────────────────────────────── */
  consentimientoTitulo: "Tu consentimiento",
  /* Los nombres de los dos botones del aviso, en negrita. */
  consentimiento1A: "En el primer aviso tienes los botones ",
  consentimiento1Rechazar: "«Rechazar todas»",
  consentimiento1B: " y ",
  consentimiento1Aceptar: "«Aceptar todas»",
  consentimiento1C: " al mismo nivel, y la opción de configurar por categorías.",
  consentimiento2A: "Guardamos tu elección durante ",
  consentimiento2Plazo: "12 meses",
  consentimiento2B: ". Pasado ese tiempo, o si cambiamos las cookies que usamos, te la volveremos a pedir.",
  consentimiento3: "Puedes retirar tu consentimiento cuando quieras, tan fácilmente como lo diste.",

  /* ── 7 · Cambios y contacto ──────────────────────────────── */
  cambiosTitulo: "Cambios y contacto",
  cambios1:
    "Podemos actualizar esta política para reflejar cambios en las cookies que usamos. Publicaremos la nueva versión en esta página con su fecha de actualización.",
  /* El correo no está aquí: es un dato, vive en el componente y se
     usa a la vez como texto y como destino del mailto, para que no
     puedan acabar diciendo cosas distintas. */
  cambios2A: "Para cualquier duda sobre cookies o sobre tus datos, escríbenos a ",
  cambios2B: " o consulta nuestra ",
  cambios2Privacidad: "política de privacidad",
  cambios2C: ".",

  /* ── La llamada a la acción que corona el pie ─────────────── */
  ctaTitulo: "Tu próxima reserva puede llegar",
  ctaTituloEm: "mientras lees esto.",
  ctaLeadConPrueba: "Prueba Bookmy {dias} días gratis con Plan Basic o Plan Pro. Sin tarjeta y sin permanencia.",
  ctaLeadSinPrueba: "Crea tu cuenta gratis con Plan Basic o Plan Pro. Sin tarjeta y sin permanencia.",
  ctaConPrueba: "Prueba {dias} días gratis",
  ctaSinPrueba: "Empieza gratis",
  ctaDudas: "Tengo dudas",
};

export default cookiesEs;
export type CookiesWeb = typeof cookiesEs;
