/* ============================================================
   Public site · Pro plan (/planes/pro) — EN
   ------------------------------------------------------------
   Mirror of planPro.es.ts, key by key: the PlanProWeb type does
   not let the two drift, so a missing key fails `npx tsc --noEmit`
   instead of showing up raw on the English site.

   Watch out when editing:
     · {dias} is filled in by DIAS_DE_PRUEBA — never write "7".
     · the ConPrueba / SinPrueba pairs are both live copy; today the
       SinPrueba half is what visitors read (see lib/web/oferta.ts).
     · amounts here are examples of what a salon charges ITS
       clients, so they stay in euros like the Spanish page; only
       the calculator changes currency, and it does it from
       lib/web/money.ts.
============================================================ */
import type { PlanProWeb } from "./planPro.es";

const planProEn: PlanProWeb = {
  meta: {
    titulo: "Pro plan · Run and grow your whole business",
    descripcionConPrueba:
      "Invoicing, inventory, client CRM, team, real-time analytics, multiple locations and an AI assistant in a single dashboard. {dias} days free, no card.",
    descripcionSinPrueba:
      "Invoicing, inventory, client CRM, team, real-time analytics, multiple locations and an AI assistant in a single dashboard. Create your account free, no card.",
  },

  /* ── Hero ───────────────────────────────────────────────── */
  hero: {
    volver: "All plans",
    titulo: "Take your business to the ",
    tituloDestacado: "next level.",
    lead:
      "Automate the busywork, get more out of what you already have and run every part of your company from one professional platform built to grow.",

    precioConPrueba: "{dias} days",
    precioNotaConPrueba: "free to try it out",
    precioSinPrueba: "Tailored",
    precioNotaSinPrueba: "your rate fits the size of your business",

    nota: "No card · no lock-in · for growing businesses and multi-location teams",

    orbita: {
      crm: "Client CRM",
      facturacion: "Invoicing",
      reservas: "Bookings",
      equipo: "Team",
      asistente: "AI assistant",
      sedes: "Locations",
      estadisticas: "Analytics",
      inventario: "Inventory",
    },
  },

  cta: {
    probarConPrueba: "Try the Pro plan free for {dias} days",
    probarSinPrueba: "Create my free account",
    ventas: "Talk to sales",
    ventasPregunta: "I want to talk to sales about the Pro plan",
  },

  /* ── Modules (the gallery you scroll sideways) ───────────── */
  modulos: {
    titulo: "Here is everything the Pro plan gives you.",
    lead: "Everything in the Basic plan, plus every part of your business connected in the same dashboard.",

    reservas: {
      titulo: "Advanced booking management",
      texto: "Availability rules, automatic reminders and rescheduling without the back and forth.",
      d1: "Mon",
      d1Numero: "17",
      d2: "Tue",
      d2Numero: "18",
      d3: "Wed",
      d3Numero: "19",
      h1: "9 am",
      h2: "11 am",
      h3: "4:30 pm",
      ev1: "Manicure",
      ev1Quien: "Andrea",
      ev2: "Massage",
      ev2Quien: "Paula",
      ev3: "Brows",
      ev3Quien: "Andrea",
      ev4: "Lashes",
      ev4Quien: "Paula",
      ev5: "Facial",
      ev5Quien: "Irene",
      ev6: "Haircut",
      ev6Quien: "Irene",
      ev7: "Spa",
      ev7Quien: "Paula",
      ev8: "Gap",
      ev8Quien: "open",
      ev9: "Nails",
      ev9Quien: "Andrea",
    },

    crm: {
      titulo: "Client CRM",
      texto: "The full history of every client: visits, preferences and spend.",
      iniciales: "LM",
      nombre: "Lucía Martín",
      desde: "Client since 2024",
      etiqueta: "VIP",
      visitas: "14",
      visitasNota: "visits",
      consumo: "€486",
      consumoNota: "spend",
      frecuencia: "3 wks",
      frecuenciaNota: "how often",
    },

    facturacion: {
      titulo: "Invoicing and payments",
      texto: "Charge online or at the counter and keep track of every transaction in the same platform.",
      cliente1: "Lucía Martín",
      importe1: "€33.00",
      canal1: "Online",
      cliente2: "Sofía Pérez",
      importe2: "€45.00",
      canal2: "In person",
      cliente3: "Carmen Ruiz",
      importe3: "€40.00",
      canal3: "Online",
    },

    estadisticas: {
      titulo: "Real-time analytics",
      texto: "See how the business is doing with reports and figures that update as it happens.",
      ocupacion: "78%",
      ocupacionNota: "booked",
    },

    equipo: {
      titulo: "Team management",
      texto: "Give every member of your team their own role, hours and services.",
      iniciales1: "AN",
      nombre1: "Andrea",
      area1: "Nails",
      iniciales2: "PA",
      nombre2: "Paula",
      area2: "Spa",
      iniciales3: "IR",
      nombre3: "Irene",
      area3: "Beauty",
    },

    sedes: {
      titulo: "Multiple locations",
      texto: "Run all of your locations from one central dashboard.",
      sede1: "Downtown",
      estado1: "Active",
      sede2: "Harbour",
      estado2: "18 bookings today",
      sede3: "Beachfront",
      estado3: "14 bookings today",
    },

    inventario: {
      titulo: "Inventory control",
      texto: "Keep products and supplies in sync with every booking and every sale.",
      producto1: "Gel polish",
      producto2: "Warm wax",
      producto3: "Individual lashes",
    },
  },

  /* ── The AI assistant, seen from the Pro plan ────────────── */
  asistente: {
    etiqueta: "New · AI sales assistant",
    titulo: "A salesperson who answers, books and sells 24/7.",
    lead:
      "It replies to your clients with your real prices and your real calendar, offers extras based on what they usually book and wins back the ones who stopped coming.",
    cta: "Meet the AI assistant",
    chatAria: "Example conversation with the assistant",
    burbuja1: "Any openings on Friday afternoon?",
    burbuja2:
      "We do! 4:30 pm with Andrea or 6 pm with Paula. Shall I add the paraffin for €8, like last time?",
    burbuja2Nota: "Suggested from her history",
  },

  /* ── Who it is for ──────────────────────────────────────── */
  publico: {
    titulo: "Built for growing businesses and several locations.",
    titulo1: "Salons with a team",
    texto1: "Every professional with their own calendar, services and hours. You, with the whole picture.",
    titulo2: "Chains and franchises",
    texto2: "All of your locations in one dashboard, with users per location and performance side by side.",
    titulo3: "Businesses that want to sell more",
    texto3: "CRM, reminders and AI so your clients come back and spend more on every visit.",
  },

  /* ── No-show calculator ─────────────────────────────────── */
  roi: {
    titulo: "How much could your business win back with Pro?",
    lead: "Set the sliders to your own numbers and see what no-shows are costing you today.",
    grupoAria: "No-show loss calculator",

    pais: "Where your business is",
    citas: "Appointments a week",
    ticket: "Average price per appointment",
    ausencias: "Appointments that no-show or cancel late",
    recupera: "No-shows you avoid with reminders",
    recuperaNota: "Your own estimate: set it to whatever feels realistic for your business.",
    /* English writes it tight to the figure: 8%, not 8 %. */
    unidadPorcentaje: "%",

    citasInicial: "80",
    ticketInicial: "€35",
    ausenciasInicial: "8%",
    recuperaInicial: "35%",
    importeInicial: "€0",

    columnaPierdes: "You lose",
    columnaRecuperas: "You win back",
    resultadoPierdes: "Today you lose every month",
    resultadoRecuperas: "With Pro you could win back",
    alMes: "a month · ",
    alAnio: " a year",
    nota:
      "A rough figure in your country's currency: weekly appointments × 4.33 weeks × average price × no-show rate. Not a promise of results.",
    asistente: "Work it out with the assistant",
    asistenteEtiqueta: "I want to work it out with the assistant",
  },

  /* ── Testimonial ────────────────────────────────────────── */
  testimonio: {
    cita:
      "“We needed our bookings and our clients in one place. With Bookmy we automated the routine work and the team follows up on business far better.”",
    iniciales: "JC",
    autor: "Johan Castillo",
    papel: "Manager · Qore Technology",
  },

  /* ── Questions ──────────────────────────────────────────── */
  faq: {
    tituloConPrueba: "Try it, risk-free.",
    tituloSinPrueba: "Get started, risk-free.",

    q1ConPrueba: "What does the {dias}-day trial include?",
    a1ConPrueba:
      "The whole Pro plan: client CRM, invoicing and payments, advanced bookings, team, inventory, analytics, multiple locations and the AI assistant. No card and no lock-in.",
    q1SinPrueba: "What does the Pro plan include?",
    a1SinPrueba:
      "Client CRM, invoicing and payments, advanced bookings, team, inventory, analytics, multiple locations and the AI assistant. Everything in the Basic plan, plus every part of the business connected in the same dashboard.",

    q2ConPrueba: "What happens when the trial ends?",
    a2ConPrueba:
      "You decide whether to carry on with Pro, drop down to Basic or leave it there. We never ask for a card for the trial, so nothing is charged automatically.",
    q2SinPrueba: "Can I start without paying anything?",
    a2SinPrueba:
      "You can. Open your account on the Basic plan, which is free, and start taking bookings today. When you want to move up to Pro, tell us and the team sets it up for you: we do not ask for a card, so there are no automatic charges and no lock-in.",

    q3: "How much does the Pro plan cost?",
    a3ConPrueba:
      "The price follows the size of your business. Try it free for {dias} days and talk to the team to get your rate.",
    a3SinPrueba:
      "The price follows the size of your business: the locations you run and the team behind you. Talk to the team and we will put your rate together.",
    a3Boton: "Ask for a price",
    a3Pregunta: "I want to know the price of the Pro plan",

    q4: "Can I manage several locations?",
    a4: "Yes. You run all of your locations from one central dashboard and give each user access to their own.",

    q5: "Will you help me get started?",
    /* One sentence cut in three by the two links it carries:
       "Yes. Email us at [address] or message us on [WhatsApp] and
       the team will walk you through signing up." */
    a5Inicio: "Yes. Email us at ",
    a5Correo: "contacto@bookmy.es",
    a5Medio: " or message us on ",
    a5Whatsapp: "WhatsApp",
    a5Fin: " and the team will walk you through signing up.",
  },

  /* ── Closing call, on top of the footer ─────────────────── */
  cierre: {
    tituloConPrueba: "{dias} days to see what Pro does ",
    tituloSinPrueba: "See what Pro can do ",
    tituloDestacado: "for your business.",
    leadConPrueba:
      "Set up your account in minutes and start taking bookings today. {dias} days free, no card and no lock-in.",
    leadSinPrueba:
      "Set up your account in minutes and start taking bookings today. No card and no lock-in.",
  },
};

export default planProEn;
