/* ============================================================
   Public site · About us — EN
   ------------------------------------------------------------
   Mirror of quienesSomos.es.ts: same keys, nothing missing — a
   key that only exists in Spanish shows up raw on the English
   site, and the QuienesSomosWeb type is there to catch it.

   British spelling, to match comun.en.ts ("organised",
   "favourite", en-GB numbers). This is marketing copy, not a
   word-for-word translation: the Spanish plays with "funcionen
   solos" and the English plays with "run themselves".
============================================================ */
import type { QuienesSomosWeb } from "./quienesSomos.es";

const quienesSomosEn: QuienesSomosWeb = {
  /* ── Hero: the globe with Spain and Colombia ────────────── */
  heroTitulo: "We make service businesses",
  heroTituloMint: "run themselves.",
  heroLead:
    "If you provide a service, your time belongs to your clients: not to chasing appointments, balancing the till or trying to remember who came in three months ago. That is what Bookmy is for.",
  heroEspana: "Spain · Costa del Sol",
  heroColombia: "Colombia · Bogotá and Medellín",

  /* ── The story ──────────────────────────────────────────── */
  historiaTitulo: "We started with bookings.",
  historiaTituloMint: "We stayed for everything else.",
  historiaStatement:
    "Behind every appointment there is someone who gets up early, who knows their clients by name and who wants to do the job well. And far too often, that someone loses hours to the phone, the notebook and the spreadsheet.",
  historiaParrafo1:
    "That is why we built Bookmy: to give service businesses the technology only big companies used to have, without the complexity that came with it. We started with bookings and today we are a complete system: CRM, payments, staff, stock, locations, reporting and an assistant with artificial intelligence.",
  historiaParrafo2:
    "We work side by side with real businesses, from beauty studios to tech firms, and we shape Bookmy around what they tell us. Because the best tool is the one you use every day without thinking about it.",

  /* ── Mission and vision ─────────────────────────────────── */
  misionTitulo: "Mission",
  misionTexto:
    "That any service business can get organised, sell and grow with the technology of a large company, and none of its complexity.",
  visionTitulo: "Vision",
  visionTexto:
    "To be the platform of choice for running and growing service businesses in Spain and Latin America.",

  /* ── Principles ─────────────────────────────────────────── */
  principiosTitulo: "Six principles you can feel in the product.",
  principioSimplicidadTitulo: "Simplicity",
  principioSimplicidadTexto: "If something needs a manual, we redesign it. What matters is always one tap away.",
  principioCercaniaTitulo: "Close to you",
  principioCercaniaTexto: "We speak your language and we answer like people, not like a ticket number.",
  principioDatosTitulo: "Data with a purpose",
  principioDatosTexto: "We measure so you can decide better, not to fill screens with charts.",
  principioPrivacidadTitulo: "Privacy by design",
  principioPrivacidadTexto: "Your data and your clients' data are yours. We protect them and we never sell them.",
  principioMejoraTitulo: "Always improving",
  principioMejoraTexto: "We listen to the people who use Bookmy every day and turn what they tell us into product.",
  principioIaTitulo: "Responsible AI",
  principioIaTexto: "Technology that helps: transparent, and always with a person behind it.",

  /* ── The numbers ────────────────────────────────────────── */
  cifrasEtiqueta: "Bookmy in numbers",
  cifraReservas: "+25K",
  cifraReservasTexto: "bookings handled",
  cifraConfirmadas: "98%",
  cifraConfirmadasSufijo: "%",
  cifraConfirmadasTexto: "confirmed instantly",
  cifraValoracion: "4.9★",
  cifraValoracionTexto: "rating in the app stores",
  cifraCiudades: "7",
  cifraCiudadesTexto: "cities across 2 countries",

  /* ── Where we are ───────────────────────────────────────── */
  dondeTitulo: "From the Costa del Sol",
  dondeTituloMint: "to Colombia.",
  dondeLead: "Businesses in two countries already run their bookings, clients and teams on Bookmy.",
  dondeEspana: "Spain",
  dondeEspanaZona: "Costa del Sol",
  dondeColombia: "Colombia",
  dondeColombiaZona: "Latin America",

  /* ── Testimonials ───────────────────────────────────────── */
  vocesTitulo: "What the businesses that trust us have to say.",
  voz1Cita:
    "“Bookmy completely transformed the way we handle bookings. Our calendar is in order, we get fewer cancellations and our clients are happier.”",
  voz1Cargo: "Manager · Glow Experience",
  voz2Cita:
    "“We needed our bookings and our clients in one place. With Bookmy we automated the routine work and the team follows up on every client properly.”",
  voz2Cargo: "Manager · Qore Technology",
  vozAnterior: "Previous testimonial",
  vozSiguiente: "Next testimonial",

  /* ── Contact ────────────────────────────────────────────── */
  contactoTitulo: "We are here to help.",
  contactoLead: "Sales, support or any question about Bookmy: write to us on whichever channel suits you best.",
  contactoEmail: "Email",
  contactoWhatsapp: "WhatsApp",
  contactoInstagram: "Instagram",
  contactoAcceso: "Client access",

  /* ── The call to action that crowns the footer ──────────── */
  ctaTitulo: "Make your business run itself.",
  ctaTituloEm: "Start today.",
  ctaLeadConPrueba: "Try Bookmy free for {dias} days, with no card and no commitment.",
  ctaLeadSinPrueba: "Start for free, with no card and no commitment. You decide when to grow.",
  ctaBotonConPrueba: "Try {dias} days free",
  ctaBotonSinPrueba: "Create your free account",
  ctaSecundario: "Talk to the team",
  ctaPregunta: "I would like to talk to the Bookmy team",
};

export default quienesSomosEn;
