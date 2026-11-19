/* ============================================================
   Public site · Cookie policy — EN
   ------------------------------------------------------------
   Mirror of cookies.es.ts: same keys, one by one. The CookiesWeb
   type below makes sure of it, so a key that only exists in
   Spanish breaks `npx tsc --noEmit` instead of showing up raw on
   the English site.

   THIS IS A COURTESY TRANSLATION OF A LEGAL DOCUMENT
   The Spanish version is the one that binds the company. This
   file has to say EXACTLY the same thing: not one obligation
   more, not one less, the same deadlines, the same cookie names
   and the same durations. Where the Spanish is vague ("some
   providers", "an external provider"), the English is just as
   vague on purpose — it is not the place to be more precise than
   the document.

   Wording was taken from the English cookie policy already in the
   project (the `cookies` keys of web.en.ts) wherever the content
   is the same, so the site does not end up with two vocabularies:
   "Functional", "Analytics", "Marketing", "Duration", "privacy
   policy", and the reCAPTCHA sentence with Google's terms.

   WHAT IS NOT TRANSLATED
   The cookie names (bookmy_consent, bookmy_ai, _GRECAPTCHA) and
   the owner of each one (Bookmy, Google) are identifiers, not
   prose: they are copied across character for character. The two
   unfilled rows keep their brackets, because they are a gap in
   the document, not data.

   One more thing to keep in mind: {dias} has to survive. The
   number of trial days is filled in from DIAS_DE_PRUEBA, never
   written out, and the ...ConPrueba / ...SinPrueba pair is two
   ways of saying the same thing — one promising the free trial
   and one without it. Today the trial is switched off, so the
   SinPrueba half is what visitors actually read.
============================================================ */
import type { CookiesWeb } from "./cookies.es";

const cookiesEn: CookiesWeb = {
  /* ── Hero ────────────────────────────────────────────────── */
  heroTitulo: "Cookie Policy",
  heroLead:
    "What cookies are, which ones Bookmy uses, what they are for, how long they last, and how you can accept them, reject them or change your mind at any time.",
  heroActualizado: "Last updated: 16 November 2026",
  heroConfigurar: "Manage my cookies",

  /* ── Side index ──────────────────────────────────────────── */
  indiceAria: "Index of the policy",
  indiceTitulo: "Index",
  indice1: "1. What cookies are",
  indice2: "2. Types we use",
  indice3: "3. Cookie list",
  indice4: "4. Third parties",
  indice5: "5. How to manage them",
  indice6: "6. Your consent",
  indice7: "7. Changes and contact",
  indiceConfigurar: "Cookie settings",

  /* ── 1 · What cookies are ────────────────────────────────── */
  queSonTitulo: "What cookies are",
  queSonParrafo1:
    "Cookies are small files that a website stores in your browser to remember information about your visit. Similar technologies, such as the browser's local storage (localStorage and sessionStorage), serve the same purpose, so this policy treats them the same way.",
  queSonParrafo2:
    "We use them to make the site work, to remember your preferences and, only if you accept, to understand how the site is used and to measure our campaigns.",

  /* ── 2 · Types of cookies (first table) ──────────────────── */
  tiposTitulo: "Types of cookies we use",
  tiposColCategoria: "Category",
  tiposColParaQue: "What they are for",
  tiposColConsentimiento: "Do they need your consent?",

  /* Row 1 · technical */
  tipo1Categoria: "Technical and necessary",
  tipo1ParaQue:
    "Basic operation: security, navigation, remembering your cookie choice and keeping the conversation with the assistant going while you browse.",
  tipo1Consentimiento: "No. They are essential for the service you ask for.",
  /* Row 2 · functional */
  tipo2Categoria: "Functional",
  tipo2ParaQue: "They remember your preferences between visits, such as the conversation with the assistant.",
  tipo2Consentimiento: "Yes.",
  /* Row 3 · analytics */
  tipo3Categoria: "Analytics",
  tipo3ParaQue: "They help us understand, in aggregate, how the site is used so we can improve it.",
  tipo3Consentimiento: "Yes.",
  /* Row 4 · marketing */
  tipo4Categoria: "Marketing",
  tipo4ParaQue: "They let us measure campaigns and show you relevant content on other platforms.",
  tipo4Consentimiento: "Yes.",

  tiposNota:
    "This site does not switch on analytics or marketing cookies until you accept them. If you reject them, you can still browse just the same.",

  /* ── 3 · Cookie list (second table) ──────────────────────── */
  listaTitulo: "List of cookies and storage",
  listaColNombre: "Name",
  listaColTitular: "Owner",
  listaColFinalidad: "Purpose",
  listaColDuracion: "Duration",
  listaColCategoria: "Category",

  /* Row 1 · the cookie choice */
  cookie1Nombre: "bookmy_consent",
  cookie1Titular: "Bookmy",
  cookie1Finalidad: "Stores your cookie preferences (local storage).",
  cookie1Duracion: "12 months",
  cookie1Categoria: "Technical",
  /* Row 2 · the assistant, during the visit */
  cookie2Nombre: "bookmy_ai",
  cookie2Titular: "Bookmy",
  cookie2Finalidad:
    "Keeps the conversation with the assistant going while you browse (session storage).",
  cookie2Duracion: "Session",
  cookie2Categoria: "Technical",
  /* Row 3 · the assistant, between visits (same name, another purpose) */
  cookie3Nombre: "bookmy_ai",
  cookie3Titular: "Bookmy",
  cookie3Finalidad:
    "Remembers the conversation with the assistant between visits (local storage).",
  cookie3Duracion: "Until you delete it or withdraw your consent",
  cookie3Categoria: "Functional",
  /* Row 4 · the assistant's suggestion */
  cookie4Nombre: "bookmy_ai_teaser",
  cookie4Titular: "Bookmy",
  cookie4Finalidad: "Remembers that you closed the assistant's suggestion.",
  cookie4Duracion: "Session",
  cookie4Categoria: "Technical",
  /* Row 5 · reCAPTCHA, which is Google's */
  cookie5Nombre: "_GRECAPTCHA",
  cookie5Titular: "Google",
  cookie5Finalidad:
    "Protects the platform's contact, sign-up and sign-in forms against bots.",
  cookie5Duracion: "6 months",
  cookie5Categoria: "Technical",
  /* Row 6 · gap: analytics, if they are ever switched on */
  /* ── Rows 8, 9 and 10 ─────────────────────────────────────── */
  cookie8Nombre: "bookmy-theme",
  cookie8Titular: "Bookmy",
  cookie8Finalidad:
    "Remembers whether you prefer the light or dark theme, so it isn't reset on every visit (local storage).",
  cookie8Duracion: "Until you delete it",
  cookie8Categoria: "Technical",
  cookie9Nombre: "bm_lang",
  cookie9Titular: "Bookmy",
  cookie9Finalidad: "Remembers the language you chose, Spanish or English (local storage).",
  cookie9Duracion: "Until you delete it",
  cookie9Categoria: "Technical",
  cookie10Nombre: "bm_login_origen",
  cookie10Titular: "Bookmy",
  cookie10Finalidad:
    "Remembers which sign-in screen you came through, so you are returned to the same one when you log out (session storage).",
  cookie10Duracion: "Session",
  cookie10Categoria: "Technical",
  cookie6Nombre: "[Analytics cookies, if they are switched on]",
  cookie6Titular: "[Provider]",
  cookie6Finalidad: "Aggregate measurement of how the site is used.",
  cookie6Duracion: "[Duration]",
  cookie6Categoria: "Analytics",
  /* Row 7 · gap: marketing, if they are ever switched on */
  cookie7Nombre: "[Marketing cookies, if they are switched on]",
  cookie7Titular: "[Provider]",
  cookie7Finalidad: "Campaign measurement and personalized advertising.",
  cookie7Duracion: "[Duration]",
  cookie7Categoria: "Marketing",

  /* ── 4 · Third parties ───────────────────────────────────── */
  tercerosTitulo: "Cookies and third-party services",
  terceros1A:
    "Some providers may set their own cookies when you use content or features that rely on them. The platform's forms (contact, sign-up and sign-in) are protected by Google reCAPTCHA; Google's ",
  terceros1Privacidad: "privacy policy",
  terceros1B: " and ",
  terceros1Condiciones: "terms",
  terceros1C: " apply.",
  terceros2A:
    "The site also loads its fonts from an external provider. That service does not set cookies, but it does receive your device's IP address in order to deliver the files. More information in the ",
  terceros2Privacidad: "privacy policy",
  terceros2B: ".",

  /* ── 5 · How to manage your preferences ──────────────────── */
  gestionarTitulo: "How to manage your preferences",
  gestionar1A: "You can accept them, reject them or choose by category at any time from the ",
  /* The name of the button, in bold. It has to match the one in the
     footer (comun.pie.configurarCookies): if one changes, so does
     the other. */
  gestionar1Boton: "“Cookie settings”",
  gestionar1B: " button, which you have on this page and in the footer of every page of the site.",
  gestionarBoton: "Manage my cookies",
  gestionar2:
    "You can also block or delete cookies from your browser's privacy settings (Chrome, Safari, Firefox, Edge or another one). Keep in mind that, if you block the technical ones, some parts of the site may not work properly.",

  /* ── 6 · Your consent ────────────────────────────────────── */
  consentimientoTitulo: "Your consent",
  consentimiento1A: "In the first notice you get the ",
  consentimiento1Rechazar: "“Reject all”",
  consentimiento1B: " and ",
  consentimiento1Aceptar: "“Accept all”",
  consentimiento1C: " buttons at the same level, and the option to choose by category.",
  consentimiento2A: "We keep your choice for ",
  consentimiento2Plazo: "12 months",
  consentimiento2B: ". After that time, or if we change the cookies we use, we will ask you again.",
  consentimiento3: "You can withdraw your consent whenever you want, as easily as you gave it.",

  /* ── 7 · Changes and contact ─────────────────────────────── */
  cambiosTitulo: "Changes and contact",
  cambios1:
    "We may update this policy to reflect changes in the cookies we use. We will publish the new version on this page along with its update date.",
  cambios2A: "For any question about cookies or about your data, write to us at ",
  cambios2B: " or see our ",
  cambios2Privacidad: "privacy policy",
  cambios2C: ".",

  /* ── The call to action that crowns the footer ───────────── */
  ctaTitulo: "Your next booking could land",
  ctaTituloEm: "while you read this.",
  ctaLeadConPrueba: "Try Bookmy free for {dias} days on Plan Basic or Plan Pro. No card and no lock-in.",
  ctaLeadSinPrueba: "Create your account for free on Plan Basic or Plan Pro. No card and no lock-in.",
  ctaConPrueba: "Try it free for {dias} days",
  ctaSinPrueba: "Start for free",
  ctaDudas: "I have questions",
};

export default cookiesEn;
