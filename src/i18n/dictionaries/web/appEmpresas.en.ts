/* ============================================================
   Public site · the app seen by the BUSINESS (/app/empresas) — EN
   ------------------------------------------------------------
   Same keys as appEmpresas.es.ts, one by one: the AppEmpresasWeb
   type does not let them drift. A key missing here would show up
   raw on the English site, so `npx tsc --noEmit` catches it first.

   Written as English marketing copy, not as a word-for-word
   translation of the Spanish. Two things to keep when editing:

     · {dias} and {importe} have to survive — the component fills
       the first from oferta.ts and the second from money.ts.
     · the **bold stretches** in crmNota… are rendered as <b>.

   The clock stays on the 24-hour format, like the Spanish: the
   time column inside the phone mock is 34 px wide (.bizapp__list
   li) and "4:30 PM" does not fit in it.
============================================================ */
import type { AppEmpresasWeb } from "./appEmpresas.es";

const appEmpresasEn: AppEmpresasWeb = {
  /* ── Hero ─────────────────────────────────────────────────── */
  heroTitulo: "Your business in the app.",
  heroTituloMint: "Your bookings, in your pocket.",
  heroLead:
    "Get listed on Bookmy, take bookings around the clock and run your calendar, your clients and your payments from your phone. No phone calls, nothing written down by hand.",
  ctaAlta: "Register my business",
  heroPruebaConPrueba: "{dias} days free · no card · no lock-in",
  heroPruebaSinPrueba: "Start on Plan Basic · no card · no lock-in",
  movilAria:
    "The Bookmy app for businesses: today's calendar with its bookings, a free slot and a new booking",

  /* ── The phone screen (.bizapp mock) ──────────────────────── */
  movilFecha: "Tuesday, 17 November",
  movilHoy: "Today",
  movilIniciales: "EA",
  movilCitasValor: "8",
  movilCitas: "bookings",
  movilHuecosValor: "2",
  movilHuecos: "free slots",
  movilNotaValor: "4.9",
  movilNota: "rating",

  agenda1Hora: "10:00",
  agenda1Titulo: "Cut & beard",
  agenda1Sub: "Laura M. · with Andrea",
  agenda2Hora: "11:30",
  agenda2Titulo: "Hair colour",
  agenda2Sub: "Marta G. · with Paula",
  agenda3Hora: "13:00",
  agenda3Titulo: "Free slot",
  agenda3Sub: "Visible in the app",
  agenda4Hora: "16:30",
  agenda4Titulo: "Manicure",
  agenda4Sub: "Lucía M. · from the app",
  agenda5Hora: "18:00",
  agenda5Titulo: "Relaxing massage",
  agenda5Sub: "Sofía P. · with Irene",
  agenda6Hora: "19:30",
  agenda6Titulo: "Pedicure",
  agenda6Sub: "Elena V. · with Paula",
  agendaNueva: "New",

  /* ── The three alerts floating next to the phone ──────────── */
  chip1Titulo: "New booking",
  chip1Texto: "Manicure · today, 16:30",
  chip2Titulo: "Payment received",
  chip2Texto: "{importe} · online",
  chip3Titulo: "Reminder sent",
  chip3Texto: "Tomorrow · 10:00",

  /* ── The four steps (#pasos) ──────────────────────────────── */
  pasosTitulo: "From your profile to your first booking,",
  pasosTituloMint: "in four steps.",
  pasosLead:
    "Nothing to install, nothing to learn. You set it up once and the app starts bringing you clients.",
  paso1Titulo: "Create your account",
  paso1ConPrueba:
    "Sign up for the Bookmy CRM in under a minute and pick Plan Basic or Plan Pro. The first {dias} days are free.",
  paso1SinPrueba:
    "Sign up for the Bookmy CRM in under a minute and start on Plan Basic. We never ask for a card, and you move up to Pro when you need it.",
  paso2Titulo: "Fill in your profile",
  paso2Texto:
    "Services, prices, opening hours, photos and staff. This is how your clients will see you in the app.",
  paso3Titulo: "Show up in the app",
  paso3Texto:
    "Your clients find you, pick a service, a professional and a time, and book in seconds.",
  paso4Titulo: "Run it from your phone",
  paso4Texto:
    "We alert you about every booking. Confirm, move or cancel appointments and take payment from your phone.",

  /* ── What you get (the five-card bento) ───────────────────── */
  ventajasTitulo: "Your whole business,",
  ventajasTituloStroke: "in one hand.",
  ventajasLead:
    "Everything you need to serve, charge and keep your clients, inside the same app they book you with.",

  avisosTitulo: "Alerts the moment they happen",
  avisosTexto:
    "Every booking, change or cancellation reaches your phone right away. Nothing slips past you, not even with a client in the chair.",
  aviso1Titulo: "New booking",
  aviso1Texto: "Lucía M. · Manicure · Fri 16:30",
  aviso1Tiempo: "now",
  aviso2Titulo: "Appointment moved",
  aviso2Texto: "Marta G. · from 11:00 to 12:30",
  aviso2Tiempo: "5 min",
  aviso3Titulo: "Cancelled in good time",
  aviso3Texto: "The slot is free again",
  aviso3Tiempo: "1 h",
  aviso4Titulo: "New five-star review",
  aviso4Texto: "Lucía M. · Manicure",
  aviso4Tiempo: "2 h",

  agendaTitulo: "Your calendar in your pocket",
  agendaTexto: "The day, the week and every free slot across your team, wherever you are.",
  semanaDia1: "Mon",
  semanaFecha1: "16",
  semanaDia2: "Tue",
  semanaFecha2: "17",
  semanaDia3: "Wed",
  semanaFecha3: "18",
  semanaHoraA: "10:00",
  semanaA1: "Cut",
  semanaA1Sub: "Andrea",
  semanaA2: "Colour",
  semanaA2Sub: "Paula",
  semanaA3: "Slot",
  semanaA3Sub: "free",
  semanaHoraB: "16:30",
  semanaB1: "Nails",
  semanaB1Sub: "Irene",
  semanaB2: "Manicure",
  semanaB2Sub: "Andrea",
  semanaB3: "Massage",
  semanaB3Sub: "Irene",

  cobrosTitulo: "Online payments",
  cobrosTexto: "Your clients pay when they book or at the counter, whichever you prefer.",
  cobrosPagado: "paid at booking",

  ausenciasTitulo: "Fewer no-shows",
  ausenciasTexto: "Automatic reminders before every appointment.",
  ausenciasAvisoTitulo: "Reminder",
  ausenciasAvisoTexto: "sent to Lucía",

  clientesTitulo: "Clients who come back",
  clientesTexto:
    "Every client's history, preferences and reviews, right there in front of you, so you look after them better and they book again.",
  clienteIniciales: "LM",
  clienteNombre: "Lucía Martín",
  clienteDesde: "Client since 2024",
  clienteTag: "Regular",
  clienteVisitasValor: "14",
  clienteVisitas: "visits",
  clienteFrecuenciaValor: "3 wks",
  clienteFrecuencia: "how often",
  clientePrefiereValor: "Afternoons",
  clientePrefiere: "prefers",
  resena: "Booking took seconds and they reminded me the day before.",
  resenaPie: "Review in the app · 2 days ago",

  /* ── The bridge to the CRM ────────────────────────────────── */
  crmTitulo: "The app is your shop window.",
  crmTituloMint: "The CRM is your control room.",
  crmLead:
    "Everything that happens in the app lands in your Bookmy CRM dashboard: invoicing, stock, staff, several locations, live stats and an AI assistant that sells for you.",
  crmNotaConPrueba:
    "The plans belong to the CRM: **Plan Basic** and **Plan Pro**, both with {dias} days free. The app itself is free for your clients.",
  crmNotaSinPrueba:
    "The plans belong to the CRM: **Plan Basic**, to start taking bookings, and **Plan Pro**, for when you want invoicing, stats and stock. The app itself is free for your clients.",
  ctaVerPlanes: "See the plans",
  crmSincronizado: "In sync with the app",
  modReservas: "Bookings",
  modClientes: "Clients",
  modFacturacion: "Invoicing",
  modEquipo: "Staff",
  modInventario: "Stock",
  modSedes: "Locations",
  modEstadisticas: "Stats",
  crmSubida: "+18%",
  crmSubidaTexto: "bookings this month",

  /* ── Frequently asked questions (#faq) ────────────────────── */
  faqTitulo: "What businesses ask us.",
  faqDuda: "Something else on your mind?",
  faqAsistente: "Ask the assistant",
  faqAsistentePregunta: "I run a business and I want to be listed in the Bookmy app",
  faq1P: "How does my business show up in the app?",
  faq1R:
    "Create your account in the Bookmy CRM and fill in your profile with services, opening hours and photos. From then on your clients can find you and book from the app.",
  faq2P: "What does it cost?",
  faq2RConPrueba:
    "The app is free for your clients. Your business needs a CRM account on Plan Basic or Plan Pro, and both come with {dias} days free to try, no card and no lock-in.",
  faq2RSinPrueba:
    "The app is free for your clients. Your business needs a CRM account: Plan Basic costs nothing and already lets you take bookings, and Plan Pro adds invoicing, stats and stock. No card, no lock-in.",
  faq3P: "Can I manage bookings from my phone?",
  faq3R:
    "Yes. You get an alert with every booking, and you can confirm, move or cancel appointments from your phone. For everything else there is the CRM dashboard on a computer or a tablet.",
  faq4P: "Do my clients have to download the app?",
  faq4R:
    "They don't have to: they can also book from your public profile, the one you share on Instagram, WhatsApp or your website. With the app they also get reminders and keep their appointments to hand.",
  faq5P: "How do I take payment for bookings?",
  faq5R:
    "Online when they book or at the counter, whichever you prefer. Plan Pro also gives you invoicing and a trail for every payment inside the CRM.",
  faq6P: "What if I already use another calendar?",
  faq6RConPrueba:
    "Run Bookmy alongside it for {dias} days, with no card, and compare. If you decide to switch, the team helps you move everything over.",
  faq6RSinPrueba:
    "Open your account on Plan Basic and run Bookmy alongside it, with no card, until you are sure. If you decide to switch, the team helps you move everything over.",

  /* ── The call to action on top of the footer (#descargar) ──── */
  ctaTitulo: "Let your clients find you",
  ctaTituloEm: "today.",
  ctaLeadConPrueba:
    "Register your business, try it {dias} days free and run your bookings from your phone.",
  ctaLeadSinPrueba: "Register your business for free and run your bookings from your phone.",
  ctaCrm: "Explore the CRM",
};

export default appEmpresasEn;
