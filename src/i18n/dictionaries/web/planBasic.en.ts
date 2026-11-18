/* ============================================================
   Public site · /planes/basic — the Basic plan (EN)
   ------------------------------------------------------------
   Mirror of planBasic.es.ts. Same keys, nothing missing: a key
   that only exists in Spanish shows up in Spanish on the English
   site, which is worse than a clumsy translation.

   The plan is called "Basic" here too — it is the commercial
   name, not a description, so it is never swapped for "Free"
   (which is only what the backend calls it internally).

   Pairs ending in ConPrueba / SinPrueba are the two versions of
   the same line: with the free trial and without it. Today the
   trial is switched off (src/lib/web/oferta.ts), so the
   SinPrueba half is the one on screen — it is written to stand
   on its own, not as a stopgap.
============================================================ */
import type { PlanBasicWeb } from "./planBasic.es";

const planBasicEn: PlanBasicWeb = {
  meta: {
    titulo: "Basic plan · Get your bookings in order today",
    descripcionConPrueba:
      "The Basic plan of the Bookmy CRM: a 24/7 online diary, automatic confirmations, a public profile and access from your phone or tablet. Free for {dias} days.",
    descripcionSinPrueba:
      "The Basic plan of the Bookmy CRM: a 24/7 online diary, automatic confirmations, a public profile and access from your phone or tablet. Free, and no card needed.",
  },

  /* ── 1 · Hero ──────────────────────────────────────────── */
  hero: {
    volver: "All plans",
    tituloA: "Your bookings, in order",
    tituloB: "from today.",
    lead:
      "The Basic plan gives you the essentials to take bookings online and put the phone down: a 24/7 diary, automatic confirmations and your own public profile. Just right if you are taking your first steps.",

    precioCifraConPrueba: "{dias} days",
    precioPieConPrueba: "free to try it out",
    precioCifraSinPrueba: "Free",
    precioPieSinPrueba: "to get started, no card",

    ctaConPrueba: "Try the Basic plan free",
    ctaSinPrueba: "Get started on Basic",
    ctaComparar: "Compare with the Pro plan",
    nota: "No card · no lock-in · for solo professionals and single-site businesses",

    telefonoAlt: "Your clients pick a day and a time in the Bookmy app",
    agendaHoy: "Today",
    agendaReservas: "3 bookings",
    agendaAbierta: "Open 24/7",
    chipNuevaTitulo: "New booking",
    chipNuevaTexto: "Confirmed automatically",
    chipHorarioTitulo: "Diary open 24/7",
    chipHorarioTexto: "Out of hours too",
  },

  reservas: {
    manicura: "Manicure · Lucía M.",
    cejas: "Brows · Marta G.",
    masaje: "Massage · Sofía P.",
    corte: "Haircut · Elena V.",
    confirmada: "Confirmed",
    pendiente: "Pending",
  },

  /* ── 2 · What you get ──────────────────────────────────── */
  incluye: {
    titulo: "Here is what you get on the Basic plan.",
    lead: "The essentials to stop juggling appointments by phone and WhatsApp, up and running in minutes.",

    gestionTitulo: "Simple booking management",
    gestionTexto:
      "Take your clients' bookings and keep them in order from one plain dashboard, with nothing to learn first.",
    gestionPanelTitulo: "Today's bookings",
    gestionPanelSede: "Single site",
    gestionPanelDirecto: "Live",

    agendaTitulo: "A 24/7 online diary",
    agendaTexto:
      "Your business stays open for bookings at any hour, even when you are not there to answer.",
    agendaRecibida: "Booking received",
    agendaDomingo: "Sunday",
    agendaLunes: "Monday",
    agendaFestivo: "Bank holiday",

    confirmaTitulo: "Automatic confirmations",
    confirmaTexto: "Every booking is confirmed on the spot, with no call or message from you.",
    confirmaToastTitulo: "Confirmed",
    confirmaToastTexto: "on the spot",

    dispositivosTitulo: "Works on phone and tablet",
    dispositivosTexto: "Run your diary from any device, with no extra software to install.",
    dispositivosMovil: "Phone",
    dispositivosTablet: "Tablet",

    perfilTitulo: "A public profile for your clients",
    perfilTexto:
      "Your clients find your business, your services and your free slots on a profile that is easy to share.",
    perfilWeb: "Your site",
  },

  /* ── 3 · Is it for you? ────────────────────────────────── */
  perfecto: {
    titulo: "The Basic plan is spot on if…",
    p1: "You work for yourself, or you are just starting your business.",
    p2: "You have one place and one diary to keep in order.",
    p3: "You want to stop booking people in by phone and WhatsApp.",
    p4ConPrueba: "You want to try Bookmy for {dias} days, with no card and no commitment.",
    p4SinPrueba: "You want to try Bookmy with no card and no commitment.",
    asideTexto:
      "You are starting out, you work for yourself, or you simply want to try Bookmy with no strings attached. When you grow, you step up to Pro without changing tools.",
    asideTitulo: "Got a team, several sites, or want to keep an eye on payments and clients?",
    asideEnlace: "Take a look at the Pro plan",
  },

  /* ── 4 · Three steps ───────────────────────────────────── */
  pasos: {
    titulo: "Three steps to your first booking.",
    unoTitulo: "Create your account",
    unoTexto: "Sign up in under a minute, with no card.",
    dosTitulo: "Add your services",
    dosTexto: "Length, price and opening hours. Ready to take appointments.",
    tresTitulo: "Share your profile",
    tresTexto: "On social, on WhatsApp or on your own site. Your clients book themselves in.",
  },

  /* ── 5 · Basic against Pro ─────────────────────────────── */
  comparar: {
    /* The Spanish plays empezar off parar; English keeps the beat
       with going, which lands the same way. */
    tituloA: "Basic to get going.",
    tituloB: "Pro to keep going.",
    resumen: "What the Basic plan includes and what the Pro plan adds",
    colFuncion: "Feature",
    colBasic: "Basic",
    colPro: "Pro",
    notaBasicConPrueba: "Free for {dias} days",
    notaProConPrueba: "Free for {dias} days",
    notaBasicSinPrueba: "Free to start",
    notaProSinPrueba: "The whole system",
    si: "Included",
    no: "Not included",
    f1: "24/7 online bookings and public profile",
    f2: "Automatic confirmations",
    f3: "Reminders and rescheduling",
    f4: "Client CRM",
    f5: "Invoicing and payments",
    f6: "Team, stock and several sites",
    f7: "Live statistics",
    f8: "AI sales assistant",
    ctaProConPrueba: "Try the Pro plan free for {dias} days",
    ctaProSinPrueba: "See the Pro plan",
    ctaCompleta: "See the full comparison",
  },

  /* ── 6 · Questions ─────────────────────────────────────── */
  faq: {
    titulo: "No small print.",
    q1ConPrueba: "How long does the free trial last?",
    a1ConPrueba:
      "{dias} days, with the whole Basic plan from the first minute. We never ask for a card, so nothing is charged automatically.",
    q1SinPrueba: "Is the Basic plan really free?",
    a1SinPrueba:
      "It is. The Basic plan costs nothing: create your account, set up your services and start taking bookings. We never ask for a card, so nothing is charged automatically.",
    q2: "Do I need a card to sign up?",
    a2: "No. You create your account in minutes without leaving any payment details.",
    q3ConPrueba: "What happens when the {dias} days are up?",
    a3ConPrueba: "You decide: stay on Basic, move up to Pro, or walk away. No lock-in.",
    q3SinPrueba: "Can I stop whenever I want?",
    a3SinPrueba:
      "Yes. There is no lock-in: use the Basic plan for as long as it suits you and leave the day it does not.",
    q4: "Can I move up to Pro later on?",
    a4ConPrueba:
      "Yes, whenever you need to and without changing tools. You can also try Pro straight away, free for {dias} days.",
    a4SinPrueba:
      "Yes, whenever you need to and without changing tools: your diary, your services and your clients stay exactly where they are.",
    q5: "Which devices can I use it on?",
    a5Antes:
      "On your phone, your tablet or your computer, with no extra software to install. Your clients book from your public profile or from the",
    a5Enlace: "Bookmy app",
    a5Despues: ", which is free for them.",
  },

  /* ── 7 · Closing call, above the footer ────────────────── */
  cierre: {
    tituloA: "Getting your bookings in order is easy.",
    tituloB: "Starting today.",
    leadConPrueba:
      "Create your account in minutes and start taking bookings today. The first {dias} days are free.",
    leadSinPrueba:
      "Create your account in minutes and start taking bookings today. The Basic plan costs nothing.",
    ctaConPrueba: "Try the Basic plan free for {dias} days",
    ctaSinPrueba: "Create my free account",
    ctaAsistente: "Basic or Pro?",
    ctaAsistenteFrase: "Basic or Pro? Recommend me a plan",
  },
};

export default planBasicEn;
