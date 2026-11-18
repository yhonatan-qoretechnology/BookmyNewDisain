/* ============================================================
   Public site · /privacidad — privacy policy (EN)
   ------------------------------------------------------------
   Mirror of privacidad.es.ts, key by key: the PrivacidadWeb type
   won't let the two drift, so a forgotten key shows up in
   `npx tsc --noEmit` instead of as a raw key on the page.

   THIS ONE IS NOT MARKETING COPY
   The Spanish is the binding document; this is a courtesy
   translation and it has to say EXACTLY the same thing. Not one
   obligation more, not one less, not a different retention
   period, and where the Spanish is vague the English is just as
   vague. Nothing has been "tidied up" in passing.

   SAME WORDS AS THE POLICY THAT IS LIVE TODAY
   There was already an English version of this policy in the
   project (`privacy` in web.en.ts, the one LegalPage renders), so
   where the content is the same the wording is reused: "Who we
   share your data with", "How long we keep your data",
   "Information security", "International transfers", "right to
   be forgotten", "encryption in transit", "foolproof",
   "Identification and contact data: name, email address and
   phone number"… The point is one vocabulary, not two.

   British spelling, like the rest of the site ("organisational",
   "anonymise", "personalised") and en-GB dates ("17 November
   2026"). The GDPR terms are the official English ones:
   controller, processor, joint controller, standard contractual
   clauses, adequacy decision.

   Two names are deliberately the ones the user actually sees in
   the interface: the “Create account” form and the assistant's
   “Start over” button (asistente.en.ts: reiniciarAria).
============================================================ */
import type { PrivacidadWeb } from "./privacidad.es";

const privacidadEn: PrivacidadWeb = {
  meta: {
    titulo: "Privacy policy · Bookmy",
    descripcion:
      "What data Bookmy processes, what for, on what legal basis, for how long and how to exercise your rights.",
    imagenAlt: "The Bookmy CRM dashboard",
  },

  /* ── The policy's opening ───────────────────────────────── */
  hero: {
    titulo: "Privacy policy",
    lead:
      "At Bookmy we take protecting your data seriously. Here we explain, plainly, what data we process, what for, on what legal basis, how long we keep it and how to exercise your rights.",
    actualizado: "Last updated: 17 November 2026",
    normativa: "GDPR and LOPDGDD",
  },

  /* ── Side contents ─────────────────────────────────────────
     The numbers are part of the label, as in the Spanish. */
  indice: {
    etiqueta: "Contents of the policy",
    titulo: "Contents",
    responsable: "1. Controller",
    alcance: "2. Who it applies to",
    datos: "3. Data we process",
    finalidades: "4. Purposes and legal bases",
    asistente: "5. Virtual assistant",
    destinatarios: "6. Who we share it with",
    transferencias: "7. International transfers",
    conservacion: "8. How long we keep it",
    derechos: "9. Your rights",
    menores: "10. Minors",
    seguridad: "11. Security",
    cambios: "12. Changes",
    escribenos: "Contact us",
  },

  /* The subject line of the rights email. It is used both in the
     `mailto:` and inside the sentence that asks you to use it. */
  asunto: "Data protection",

  /* ── 1 · Controller ─────────────────────────────────────── */
  responsable: {
    titulo: "Who the controller is",
    intro:
      "The controller of the personal data collected on this website and on the Bookmy platform is:",
    filaTitular: "Owner",
    /* The square brackets are from the original: company details
       still to be filled in, shown in amber by the design. */
    titularPendiente: "[Legal name]",
    titularResto: ", trading under the Bookmy brand",
    filaNif: "Tax ID (NIF)",
    nifPendiente: "[NIF]",
    filaDomicilio: "Address",
    domicilioPendiente: "[Full postal address]",
    filaEmail: "Email",
    filaWhatsapp: "WhatsApp",
    filaDpd: "Data Protection Officer",
    dpdPendiente: "[DPO email, if one has been appointed]",
  },

  /* ── 2 · Who it applies to ──────────────────────────────── */
  alcance: {
    titulo: "Who this policy applies to",
    intro:
      "Bookmy is a booking management and CRM platform for businesses in health, beauty, construction, technology and services. Our role is different depending on who you are:",
    webFuerte: "If you visit the website, talk to the assistant or ask us for information",
    webResto: ", Bookmy is the controller of your data.",
    crmFuerte: "If you have a business account on the Bookmy CRM",
    crmRestoConPrueba:
      " (Basic plan or Pro plan, including the {dias}-day trial), Bookmy is the controller of your account data, your billing and your relationship with us.",
    crmRestoSinPrueba:
      " (Basic plan or Pro plan), Bookmy is the controller of your account data, your billing and your relationship with us.",
    appFuerte: "If you use the Bookmy app to book",
    appResto:
      ", Bookmy is the controller of your account data in the app (profile, sign-in and preferences).",
    clienteFuerte: "If you are a client of a business that uses Bookmy",
    clienteResto:
      " and you book an appointment with it, the controller of your data is that business. Bookmy processes it on the business's behalf as a processor, in accordance with article 28 of the GDPR and the processing agreement signed with each business. To exercise your rights, contact the business; if you write to us, we will pass your request on to it.",
  },

  /* ── 3 · Data we process ────────────────────────────────── */
  datos: {
    titulo: "Data we process",
    contactoFuerte: "Identification and contact data",
    contactoResto: ": name, email address and phone number.",
    negocioFuerte: "Your business data",
    negocioResto: ": trade name, type of company, country, locations, services and staff.",
    usoFuerte: "Usage data",
    usoResto: ": pages visited, actions taken within the platform and language or theme preferences.",
    tecnicosFuerte: "Technical data",
    tecnicosResto: ": IP address, device type, browser and cookie identifiers.",
    chatFuerte: "Conversations with the virtual assistant",
    chatResto:
      ": what you write in the chat and the information you choose to give us (type of business, size of your team, number of locations).",
    pagoFuerte: "Payment data",
    pagoResto:
      " (paid plans): processed by certified payment providers. Bookmy does not store your full card details.",
    nota:
      "We do not need special category data (health data, for example) to answer your enquiries. Please do not include any in the chat or in the forms.",
  },

  /* ── 4 · Purposes and legal bases ───────────────────────────
     The GDPR articles are quoted exactly as the Spanish quotes
     them, including "art. 21.2 LSSI", which is the Spanish
     e-commerce act. */
  finalidades: {
    titulo: "What we use your data for and on what legal basis",
    columnaFinalidad: "Purpose",
    columnaBase: "Legal basis (GDPR)",

    cuentaFin:
      "Creating and managing your account and your bookings, and providing the service you signed up for.",
    cuentaBase: "Performance of a contract (art. 6.1.b).",

    avisosFin: "Sending you confirmations, reminders and service notices.",
    avisosBase: "Performance of a contract (art. 6.1.b).",

    altaFinConPrueba:
      "Handling your sign-up and {dias}-day free trial request from the “Create account” form, and contacting you to activate it.",
    altaFinSinPrueba:
      "Handling your sign-up request from the “Create account” form, and contacting you to activate it.",
    altaBase: "Pre-contractual measures taken at your request (art. 6.1.b).",

    soporteFin:
      "Answering your requests for information, contact, a demo or support, including those you make through the assistant.",
    soporteBase:
      "Pre-contractual measures taken at your request (art. 6.1.b) and your consent (art. 6.1.a).",

    facturarFin: "Invoicing and meeting our accounting and tax obligations.",
    facturarBase: "Legal obligation (art. 6.1.c).",

    newsletterFin: "Sending you the newsletter and marketing communications.",
    newsletterBase:
      "Your consent (art. 6.1.a). If you are already a client, legitimate interest in telling you about similar products (art. 21.2 LSSI), with an unsubscribe option in every message.",

    protegerFin: "Protecting the platform, preventing fraud and improving the service with aggregated data.",
    protegerBase: "Legitimate interest (art. 6.1.f).",

    cookiesFin: "Measuring use of the website and showing personalised advertising through cookies.",
    cookiesBaseA: "Your consent (art. 6.1.a), which you can withdraw at any time. See the ",
    cookiesEnlace: "cookie policy",
    cookiesBaseB: ".",

    nota:
      "We do not take decisions based solely on automated processing that produce legal effects on you or significantly affect you.",
  },

  /* ── 5 · The virtual assistant ──────────────────────────── */
  asistente: {
    titulo: "The virtual assistant",
    intro:
      "The chat on this website is a virtual assistant that answers your questions about Bookmy, recommends a plan and, if you ask it to, passes your request on to our team. It always introduces itself as a virtual assistant and it can get things wrong: for anything to do with your account or your payments, it will put you through to a person.",
    queFuerte: "What we process",
    queResto:
      ": the messages you write and the data you choose to give us. If you leave us your name and your email address or phone number, we use them only to answer your request, with your consent.",
    dondeFuerte: "Where the conversation is kept",
    dondeResto:
      ": in your own browser, for the session. It is only kept between visits if you accept functional cookies. You can delete it with the “Start over” button.",
    iaFuerte: "Artificial intelligence",
    iaResto:
      ": when the assistant runs on an AI model, your messages are sent to our AI provider, which acts as a processor, solely to generate the reply. We do not ask for or need sensitive data: please do not include any.",
    derechosFuerte: "Your rights",
    derechosResto: ": you can exercise them as explained in section 9.",
  },

  /* ── 6 · Who we share your data with ────────────────────── */
  destinatarios: {
    titulo: "Who we share your data with",
    intro:
      "We do not sell your data. We only share it when it is necessary to provide the service, with providers that act as processors and are bound by contract and confidentiality:",
    infraestructura: "Infrastructure, hosting and email providers.",
    qoreA: "Qore Technology, which receives a copy of sign-up requests to help us handle them ",
    qorePendiente: "[confirm its role: processor or joint controller]",
    qoreB: ".",
    pagos: "Certified payment processors (paid plans).",
    analitica: "Analytics and advertising tools, only if you accept those cookies.",
    ia: "The assistant's artificial intelligence provider, when it is switched on.",
    recaptcha: "Google reCAPTCHA, which protects the platform's contact, sign-up and sign-in forms.",
    tipografias: "Web font provider, which receives your IP address when the page loads.",
    autoridades: "Authorities and public bodies, when the law requires it.",
  },

  /* ── 7 · International transfers ────────────────────────── */
  transferencias: {
    titulo: "International transfers",
    texto:
      "Some of our providers may be outside the European Economic Area. In that case, we only work with those that offer appropriate safeguards: countries with an adequacy decision from the European Commission (including, for companies that have signed up to it, the EU-US Data Privacy Framework) or standard contractual clauses approved by the Commission.",
  },

  /* ── 8 · How long we keep your data ─────────────────────── */
  conservacion: {
    titulo: "How long we keep your data",
    cuentaFuerte: "Account and service",
    cuentaResto:
      ": for as long as your account is active. After that, blocked for the limitation periods of any liabilities that may arise.",
    facturacionFuerte: "Invoicing",
    facturacionResto: ": for the periods required by commercial and tax law (up to 6 years).",
    solicitudesFuerte: "Information and sign-up requests",
    solicitudesResto: ": up to 12 months from our last contact if you do not go on to sign up.",
    newsletterFuerte: "Newsletter",
    newsletterResto: ": until you unsubscribe.",
    cookiesFuerte: "Cookies",
    cookiesRestoA: ": for the periods set out in the ",
    cookiesEnlace: "cookie policy",
    cookiesRestoB: ".",
    nota:
      "When you ask us to delete your account, we will erase or anonymise your data, except for what we have to keep by legal obligation.",
  },

  /* ── 9 · Your rights ────────────────────────────────────── */
  derechos: {
    titulo: "Your rights",
    intro: "You can exercise the following rights at any time:",
    accesoFuerte: "Access",
    accesoResto: " to the data we hold about you.",
    rectificacionFuerte: "Rectification",
    rectificacionResto: " of inaccurate or incomplete data.",
    supresionFuerte: "Erasure",
    supresionResto: " (the “right to be forgotten”).",
    oposicionFuerte: "Objection",
    oposicionResto: " to certain processing, including marketing.",
    limitacionFuerte: "Restriction",
    limitacionResto: " of processing.",
    portabilidadFuerte: "Portability",
    portabilidadResto: " of your data to another provider.",
    consentimientoFuerte: "Withdrawing your consent",
    consentimientoResto: ", without affecting processing carried out beforehand.",
    contactoA: "Write to us at ",
    contactoB:
      " with “{asunto}” as the subject, telling us which right you want to exercise. If we have reasonable doubts about your identity, we may ask you for further information to confirm it. We will reply within one month, extendable in the cases the GDPR provides for.",
    reclamacionA:
      "If you believe we have not handled your request properly, you can lodge a complaint with the Spanish Data Protection Agency (",
    reclamacionB: "), C/ Jorge Juan, 6, 28001 Madrid.",
  },

  /* ── 10 · Minors ────────────────────────────────────────── */
  menores: {
    titulo: "Minors",
    texto:
      "Bookmy is intended for businesses and for people over the age of 14. We do not knowingly process the data of children under 14 without the consent of their parents or guardians. If we find that we have, we will delete it.",
  },

  /* ── 11 · Security ──────────────────────────────────────── */
  seguridad: {
    titulo: "Information security",
    texto:
      "We apply technical and organisational measures to protect your data, such as encryption in transit, access control per user and per location, and continuous monitoring. No system is foolproof, so we also recommend that you protect your passwords and do not share them.",
  },

  /* ── 12 · Changes ───────────────────────────────────────── */
  cambios: {
    titulo: "Changes to this policy",
    texto:
      "We may update this policy to reflect legal changes or changes in our services. We will publish the new version on this page with its update date and, if the change is significant, we will let you know.",
    notaA: "Questions about your data? Write to us at ",
    notaB: " and we will help you.",
  },

  /* ── The call to action that crowns the footer ──────────────
     Word for word the one in crm.en.ts: it is the same call in
     the same place, so it says the same thing. */
  cta: {
    titulo: "Your next booking could land",
    tituloEm: "while you read this.",
    leadConPrueba: "Try Bookmy free for {dias} days on the Basic or the Pro plan. No card and no lock-in.",
    leadSinPrueba: "Create your account for free and start taking bookings today. No card and no lock-in.",
    botonConPrueba: "Try it free for {dias} days",
    botonSinPrueba: "Start for free",
    botonDudas: "I have questions",
  },
};

export default privacidadEn;
