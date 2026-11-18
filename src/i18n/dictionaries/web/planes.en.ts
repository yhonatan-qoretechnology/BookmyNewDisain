/* ============================================================
   Public site · /planes — Basic and Pro compared (EN)
   ------------------------------------------------------------
   Mismas claves que planes.es.ts, una por una: el tipo PlanesWeb
   no deja que se desvíen, así que una clave olvidada la canta
   `npx tsc --noEmit` antes de llegar al navegador.

   Al traducir, dos cosas tienen que sobrevivir:
     · las {variables} ({dias} de la prueba, {valor} del importe),
       porque las rellena el componente,
     · la pareja …ConPrueba / …SinPrueba, que es la promesa de la
       prueba gratuita encendida o apagada (src/lib/web/oferta.ts).
       Hoy se ve la de SinPrueba: está escrita para que se lea como
       una frase hecha a propósito, no como un hueco.

   No es una traducción palabra por palabra: es el mismo mensaje
   dicho como se diría en inglés. El juego del titular («empezar /
   no parar») se cambia por otro que rima en inglés.
============================================================ */
import type { PlanesWeb } from "./planes.es";

const planesEn: PlanesWeb = {
  meta: {
    tituloConPrueba: "CRM plans · Basic and Pro, with {dias} days free",
    tituloSinPrueba: "CRM plans · Basic for free and Pro priced for you",
    descripcionConPrueba:
      "The Basic and Pro plans of the Bookmy CRM: try them free for {dias} days, no card and no lock-in. Compare the plans and work out what you can win back.",
    descripcionSinPrueba:
      "The Basic and Pro plans of the Bookmy CRM: start for free on Basic, no card and no lock-in, and move up to Pro when you need it. Compare the plans and work out what you can win back.",
    imagenAlt: "The Bookmy CRM dashboard",
  },

  hero: {
    titulo: "One plan to get started.",
    tituloMint: "One that never holds you back.",
    leadConPrueba:
      "The Bookmy CRM plans for your business: take bookings today on the Basic plan, or unlock the whole system with Pro. Both free for {dias} days, no card and no lock-in.",
    leadSinPrueba:
      "The Bookmy CRM plans for your business: take bookings today on the Basic plan, which is free, and unlock the whole system with Pro the day you need it. No card and no lock-in.",
  },

  basic: {
    desc: "Keep your bookings in order and put the phone down. Just right if you are taking your first steps.",
    precioConPrueba: "{dias} days",
    precioPieConPrueba: "free to try it out",
    precioSinPrueba: "Free",
    precioPieSinPrueba: "to get started today",
    nota: "No card and no lock-in. Start taking bookings in minutes.",

    reservasB: "Everyday booking management:",
    reservas: "take appointments and keep them in order from one simple dashboard.",
    agendaB: "A diary open 24/7:",
    agenda: "your business ready to be booked at any hour.",
    confirmacionesB: "Automatic confirmations",
    confirmaciones: "the moment someone books, with no calls and no messages.",
    movilB: "Works on phone and tablet,",
    movil: "with no extra software to install.",
    perfilB: "A public profile for your clients,",
    perfil: "easy to share.",

    ctaConPrueba: "Try Basic free for {dias} days",
    ctaSinPrueba: "Start free on the Basic plan",
    ctaPie: "You can move up to Pro whenever you need it.",
    ver: "See everything it includes",
  },

  pro: {
    desc: "Automate the routine, make the most of your resources and run every corner of your company. For growing businesses and several locations.",
    precioConPrueba: "{dias} days",
    precioPieConPrueba: "free to try it out",
    precioSinPrueba: "Tailored",
    precioPieSinPrueba: "to the size of your business",
    notaConPrueba: "No card and no lock-in. After that, a price that fits your business.",
    notaSinPrueba: "No lock-in. Tell us how you work and we quote a price that fits your business.",

    todoBasic: "Everything in the Basic plan, and on top of that:",
    crmB: "Client CRM:",
    crm: "visit history, preferences and spend.",
    facturacionB: "Invoicing and payments",
    facturacion: "online or at the counter, every one of them traceable.",
    reservasB: "Advanced booking management:",
    reservas: "availability rules, reminders and easy rescheduling.",
    equipoB: "Staff management:",
    equipo: "roles, shifts and services.",
    inventarioB: "Stock control",
    inventario: "kept in step with bookings and sales.",
    estadisticasB: "Live statistics.",
    sedesB: "Several locations",
    sedes: "from one central dashboard.",
    iaB: "AI sales assistant",

    ctaConPrueba: "Try Pro free for {dias} days",
    ctaSinPrueba: "I want the Pro plan",
    ventas: "Talk to sales",
    ventasPregunta: "I would like to talk to sales about the price of the Pro plan",
    ver: "See everything it includes",
  },

  cadena: {
    titulo: "A chain, a franchise or plenty of locations?",
    texto: "We will put together a proposal that fits.",
    cta: "Ask for a proposal",
    pregunta: "I have several locations and I would like a tailored proposal",
  },

  comparar: {
    titulo: "Everything each plan gives you.",
    resumen: "The Basic plan compared with the Pro plan",
    funcionalidad: "Feature",
    basic: "Basic",
    pro: "Pro",
    basicPieConPrueba: "{dias} days free",
    basicPieSinPrueba: "Free",
    proPieConPrueba: "{dias} days free",
    proPieSinPrueba: "Tailored price",
    incluido: "Included",
    noIncluido: "Not included",

    grupoReservas: "Bookings",
    grupoClientes: "Clients and sales",
    grupoNegocio: "Running the business",
    grupoSiempre: "Always included",

    agenda: "A diary open 24/7",
    confirmaciones: "Automatic confirmations",
    perfil: "Public profile for clients",
    reservas: "Booking management",
    reservasBasic: "Everyday",
    reservasPro: "Advanced",
    reglas: "Availability rules",
    recordatorios: "Automatic reminders",
    reprogramaciones: "Rescheduling without the friction",
    crm: "Client CRM",
    crmNota: "History, preferences and spend",
    facturacion: "Invoicing and payments",
    facturacionNota: "Online or at the counter",
    ia: "AI sales assistant",
    equipo: "Staff management",
    equipoNota: "Roles, shifts and services",
    inventario: "Stock control",
    estadisticas: "Live statistics",
    sedes: "Several locations",
    movil: "Works on phone and tablet",
    movilNota: "iOS and Android app",

    promesaConPrueba: "Free trial",
    promesaBasicConPrueba: "{dias} days",
    promesaProConPrueba: "{dias} days",
    promesaSinPrueba: "Price",
    promesaBasicSinPrueba: "Free",
    promesaProSinPrueba: "Tailored",

    tarjeta: "Card to get started",
    tarjetaValor: "No",
    permanencia: "Lock-in",
    permanenciaValor: "No",
  },

  calculadora: {
    titulo: "What do the appointments nobody turns up to cost you?",
    lead: "Move the sliders to match your business. You will see what you lose today and what you can win back with automatic reminders and rescheduling.",
    aria: "Calculator for what no-shows cost",

    pais: "Where your business is",
    paisPorDefecto: "Spain · euro (€)",
    citas: "Appointments a week",
    ticket: "Average price per appointment",
    ausencias: "No-shows and late cancellations",
    recupera: "No-shows you head off with reminders",
    recuperaNota: "Your own estimate: set it wherever feels realistic for your business.",

    pierdes: "Lost",
    recuperas: "Won back",
    hoyPierdes: "What you lose every month today",
    puedesRecuperar: "What Bookmy can win back",
    alMes: "a month ·",
    alAnio: "a year",
    aviso: "A rough figure, in the currency of your country: weekly appointments × 4.33 weeks × average price × share of no-shows. It is not a promise of results.",

    porciento: "%",
    importe: "€{valor}",

    ctaAsistente: "Work it out with the assistant",
    ctaAsistenteEtiqueta: "I want to work it out with the assistant",
  },

  faq: {
    titulo: "No small print.",
    dudas: "Torn between Basic and Pro?",
    recomendar: "Let the assistant pick for me",
    recomendarEtiqueta: "Recommend me a plan",

    q1ConPrueba: "How long does the free trial last?",
    a1ConPrueba:
      "{dias} days, on the Basic plan or on the Pro plan, whichever you choose. You get the full plan from day one, with no card and no lock-in.",
    q1SinPrueba: "Is the Basic plan really free?",
    a1SinPrueba:
      "It is. You create your account, publish your diary and start taking bookings without paying a thing and without leaving a card. The Pro plan, the one that adds clients, payments, staff, stock and statistics, is priced for each business: tell us how yours works and we will quote it.",

    q2: "Do I need a card to try it?",
    a2: "No. You create your account in minutes without leaving any payment details.",

    q3ConPrueba: "What happens when the {dias} days are up?",
    a3ConPrueba:
      "You decide whether to carry on, and on which plan. As we never ask for a card for the trial, there are no automatic charges and no surprises.",
    q3SinPrueba: "Will anything be charged without telling me?",
    a3SinPrueba:
      "No. The Basic plan is free and we do not ask for a card to create your account, so there are no automatic charges and no surprises. If you ever move up to Pro, we agree the price with you first.",

    q4: "Is there a minimum term?",
    a4: "No. You can stop using Bookmy whenever you like.",

    q5: "Can I start on Basic and move up to Pro later?",
    a5: "Yes. Start on Basic and, when you need the CRM, payments, staff, stock or several locations, move up to Pro without changing tools. If you are unsure, the team will help you.",

    q6: "Which one suits me?",
    a6: "If you work on your own, from one place, and all you need is bookings coming in online, Basic is perfect. If you have a team, several locations, or you want a grip on clients, payments and statistics, go for Pro.",

    q7: "Do the plans include the app?",
    a7: "The plans are for the CRM, which is for your business. The booking app is free for your clients, who download it from Google Play or the App Store.",
    a7Enlace: "This is how the app works for businesses",
  },

  cta: {
    tituloConPrueba: "Try it for {dias} days.",
    tituloSinPrueba: "Start for free today.",
    tituloEm: "Decide on your own numbers.",
    leadConPrueba: "No card, no lock-in and the whole plan unlocked from day one.",
    leadSinPrueba: "No card, no lock-in and the whole Basic plan from day one.",
    proConPrueba: "Try Pro free",
    proSinPrueba: "I want the Pro plan",
    basicConPrueba: "Try Basic",
    basicSinPrueba: "Get started on Basic",
  },
};

export default planesEn;
