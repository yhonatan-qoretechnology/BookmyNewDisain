/* ============================================================
   Public site · "How it works" — EN
   ------------------------------------------------------------
   Mirror of comoFunciona.es.ts: same keys, one by one. The
   ComoFuncionaWeb type below makes sure of it, so a key that only
   exists in Spanish breaks `npx tsc --noEmit` instead of showing
   up raw on the English site.

   Two things to keep in mind when touching this file:
     · {dias} has to survive: the number of trial days is filled
       in from DIAS_DE_PRUEBA, never written out.
     · the ...ConPrueba / ...SinPrueba pairs are two ways of
       saying the same thing, one promising the free trial and one
       without it. Today the trial is switched off, so the
       SinPrueba half is what visitors actually read.
============================================================ */
import type { ComoFuncionaWeb } from "./comoFunciona.es";

const comoFuncionaEn: ComoFuncionaWeb = {
  /* ── Hero ────────────────────────────────────────────────── */
  heroTitulo: "From zero to a business on",
  heroTituloMint: "autopilot.",
  heroLead:
    "Set Bookmy up in minutes and let it work for you: bookings, reminders, payments, clients and sales, all connected in one dashboard.",
  heroAsistente: "Let the assistant guide me",
  heroAsistentePregunta: "Walk me through getting started with Bookmy, step by step",

  ctaConPrueba: "Try it free for {dias} days",
  ctaSinPrueba: "Create your free account",

  /* ── The five-step tunnel ────────────────────────────────── */
  tunelAria: "Getting started with Bookmy in five steps",

  paso1Titulo: "Create your account",
  paso1ConPrueba:
    "Sign up in under a minute. Pick the Basic or the Pro plan and try it free for {dias} days, no card and no lock-in.",
  paso1SinPrueba:
    "Sign up in under a minute. Pick the Basic or the Pro plan and start today: no card, no lock-in and nothing to install.",
  paso1CampoNegocio: "Business name",
  paso1Negocio: "Estudio Aura",
  paso1CampoTipo: "Type of business",
  paso1Tipo: "Beauty",
  paso1CheckConPrueba: "Pro plan · {dias} days free",
  paso1CheckSinPrueba: "Pro plan · no lock-in",
  paso1Boton: "Create my account",

  paso2Titulo: "Add your services, your team and your locations",
  paso2Texto:
    "Set up your services with their length and price, your team with their hours and roles, and every location you run. All from the dashboard, with nothing to install.",
  paso2Servicio1: "Gel manicure",
  paso2Servicio1Detalle: "60 min · Andrea, Paula",
  paso2Servicio2: "Lash lift",
  paso2Servicio2Detalle: "45 min · Paula",
  paso2Activo: "Active",
  paso2Persona1: "Andrea",
  paso2Persona1Inicial: "AN",
  paso2Persona1Horario: "Mon–Fri 9am–5pm",
  paso2Persona2: "Paula",
  paso2Persona2Inicial: "PA",
  paso2Persona2Horario: "Tue–Sat 12–8pm",
  paso2Sede1: "Central salon",
  paso2Sede1Nota: "Main",
  paso2Sede2: "Harbour salon",
  paso2Sede2Nota: "New",

  paso3Titulo: "Share your booking page",
  paso3Texto:
    "Your business gets a public page with your services, your specialists and your availability. Share it on Instagram, WhatsApp, Google or your own site and clients book themselves, around the clock — or straight from the Bookmy app.",
  paso3Enlace: "bookmy.es/estudio-aura",
  paso3Copiar: "Copy",
  paso3Instagram: "Instagram",
  paso3Whatsapp: "WhatsApp",
  paso3Google: "Google",
  paso3Web: "Your site",
  paso3App: "Bookmy app",
  paso3Aviso: "New booking · Lucía M.",
  paso3AvisoDetalle: "Manicure · Friday 4:30pm · Andrea",
  paso3Confirmada: "Confirmed",

  paso4Titulo: "Let Bookmy do the running",
  paso4Texto:
    "Instant confirmations, automatic reminders and rescheduling without a single phone call. And, if you want it, the AI assistant answers, books and sells for you at any hour.",
  paso4Auto1: "Automatic confirmation",
  paso4Auto2: "Reminder 24 h before",
  paso4Auto3: "Online rescheduling",
  paso4Auto4: "AI sales assistant",

  paso5Titulo: "Measure, decide and sell more",
  paso5Texto:
    "Real-time stats, every client's record in the CRM and all your reviews in one place. You know what works, who comes back and where to grow.",
  paso5Ocupacion: "This week's occupancy",
  paso5OcupacionValor: "78%",
  paso5Repiten: "Clients who come back",
  paso5RepitenValor: "64%",

  railCrea: "Create",
  railConfigura: "Set up",
  railComparte: "Share",
  railAutomatiza: "Automate",
  railCrece: "Grow",

  /* ── Who it is for: clients, team and you ────────────────── */
  quienTitulo: "Easy for your clients. Useful for your team.",
  quienTituloMint: "Essential for you.",
  quienAria: "Who it is for",
  quienTabClientes: "Your clients",
  quienTabEquipo: "Your team",
  quienTabTu: "You",

  cli1Titulo: "They open Bookmy",
  cli1Texto: "From the app (iOS and Android) or from your booking page.",
  cli2Titulo: "They create an account",
  cli2Texto: "Their details take less than a minute.",
  cli3Titulo: "They book",
  cli3Texto: "They find the service and pick a date and a specialist.",
  cli4Titulo: "They choose how to pay",
  cli4Texto: "They decide how and where they want to pay.",
  cli5Titulo: "Confirmed",
  cli5Texto: "The confirmation lands straight away, and a reminder before the appointment.",
  cliMas: "See the app from the inside, screen by screen",

  eq1Titulo: "Their calendar, always current",
  eq1Texto: "Every professional sees their day and their week in real time.",
  eq2Titulo: "The client's record before they walk in",
  eq2Texto: "History and preferences, so the service fits the person.",
  eq3Titulo: "Only what concerns them",
  eq3Texto: "Roles and permissions per person and per location.",
  eq4Titulo: "Alerts as they happen",
  eq4Texto: "Notifications for new bookings and changes to their calendar.",

  tu1Titulo: "Everything at a glance",
  tu1Texto: "Clients, revenue this month, bookings and average rating on your dashboard.",
  tu2Titulo: "All your locations",
  tu2Texto: "Switch location in one click and compare how each one is doing.",
  tu3Titulo: "The books, balanced",
  tu3Texto: "Invoicing and payments, with a trail behind every transaction.",
  tu4Titulo: "A salesperson on duty 24/7",
  tu4Texto: "The AI assistant answers and sells while you get on with your work.",

  /* ── A day with Bookmy ───────────────────────────────────── */
  diaTitulo: "This is what your day looks like when the system does the work.",

  dia1Hora: "8:00 am",
  dia1Titulo: "You open the dashboard with a coffee",
  dia1Texto: "All 32 appointments for today, who is coming and what they booked. No surprises.",
  dia2Hora: "9:12 am",
  dia2Titulo: "A booking lands while you are working",
  dia2Texto: "A client books from Instagram. It is already in your calendar, confirmed.",
  dia3Hora: "10:00 am",
  dia3Titulo: "Reminders go out on their own",
  dia3Texto: "Tomorrow's clients get their reminder. Fewer no-shows, fewer gaps.",
  dia4Hora: "1:30 pm",
  dia4Titulo: "One cancellation, one slot rescued",
  dia4Texto: "The slot goes back on the calendar and the AI offers it to whoever usually books at that time.",
  dia5Hora: "5:00 pm",
  dia5Titulo: "Payment and invoice on the spot",
  dia5Texto: "Online or at the counter, with a trail behind every transaction.",
  dia6Hora: "7:30 pm",
  dia6Titulo: "A five-star review",
  dia6Texto: "After the appointment your client leaves her verdict. Your average rating goes up.",
  dia7Hora: "11:40 pm",
  dia7Titulo: "While you sleep",
  dia7Texto: "The assistant answers a question and closes an appointment for Saturday.",
  dia8Hora: "Tomorrow",
  dia8Titulo: "Again. Effortlessly.",
  dia8Texto: "That is what a system feels like, instead of just a calendar.",

  /* ── Switching is easy ───────────────────────────────────── */
  cambiarTitulo: "Coming from paper, a spreadsheet or another app?",
  cambiarLead:
    "You do not have to put your business on hold to switch. Start today and let Bookmy earn its place.",
  cambiar1Titulo: "Up and running in minutes",
  cambiar1Texto: "Your account takes less than a minute, and bookings can come in the same day.",
  cambiar2Titulo: "Run it alongside what you have",
  cambiar2ConPrueba: "With {dias} days free and no card, you can try it without dropping your current setup.",
  cambiar2SinPrueba:
    "No card and no lock-in: try it at your own pace without dropping your current setup.",
  cambiar3Titulo: "Real people at the other end",
  cambiar3Texto: "Stuck with the setup? Write to us by email or on WhatsApp and we will help.",

  /* ── Security ────────────────────────────────────────────── */
  segTitulo: "Your business and your clients, in good hands.",
  segLead:
    "Bookmy runs in the cloud, from any device, with technical and organisational measures in place to protect your information.",
  segPrivacidad: "Read our privacy policy",
  seg1Titulo: "Encrypted in transit",
  seg1Texto: "Information travels encrypted between your device and the platform.",
  seg2Titulo: "Access control",
  seg2Texto: "Roles per user and per location, plus continuous monitoring.",
  seg3Titulo: "Certified payments",
  seg3Texto: "Certified providers. Bookmy never stores full card details.",
  seg4Titulo: "GDPR",
  seg4Texto: "We handle data under European regulation. We never sell it.",
  seg5Titulo: "In the cloud",
  seg5Texto: "No software to install: open it in the browser, on your phone or on a tablet.",
  seg6Titulo: "Spanish and English",
  seg6Texto: "Your team and your clients, each in their own language.",

  /* ── Questions ───────────────────────────────────────────── */
  faqTitulo: "Everything you want to know before you start.",

  faq1Pregunta: "Do I have to install anything?",
  faq1RespuestaA:
    "No. You run your calendar from your phone, your tablet or your computer, with no extra software to install. And if you would rather have it on hand, there is the ",
  faq1Enlace: "app for iOS and Android",
  faq1RespuestaB: ".",

  faq2Pregunta: "How soon can I start taking bookings?",
  faq2Respuesta:
    "Creating the account takes less than a minute. As soon as you add your services and your hours you can share your page and start taking bookings the same day.",

  faq3Pregunta: "Do my clients need to download the app?",
  faq3Respuesta:
    "They can book from the Bookmy app or from your public page, the one you share on social media and on your site. They pick the service, the date and the specialist, and the confirmation arrives straight away.",

  faq4Pregunta: "How do I take payment?",
  faq4Respuesta:
    "On the Pro plan you can charge online or at the counter and keep a trail behind every transaction, together with your invoicing, on the same platform.",

  faq5Pregunta: "What if a client changes or cancels an appointment?",
  faq5Respuesta:
    "They can change it or cancel it from their profile at no extra cost, as long as they do it in advance. Your calendar updates itself.",

  faq6Pregunta: "What happens to my data if I leave one day?",
  faq6RespuestaA:
    "It is yours. You can ask us to export it or delete it whenever you like, as we explain in the ",
  faq6Enlace: "privacy policy",
  faq6RespuestaB: ".",

  /* ── The call to action that crowns the footer ───────────── */
  ctaTitulo: "Five steps.",
  ctaTituloEm: "A business that runs itself.",
  ctaLeadConPrueba: "Try Bookmy free for {dias} days, with no card and no lock-in.",
  ctaLeadSinPrueba: "Create your account for free, with no card and no lock-in.",
  ctaPlanes: "See the plans",
};

export default comoFuncionaEn;
