/* ============================================================
   Public site · /crm — the door to the CRM — English
   ------------------------------------------------------------
   Mirror of crm.es.ts: the same keys, nothing missing. The CrmWeb
   type makes TypeScript shout if a key is forgotten, because a
   missing key falls back to Spanish and the English page would
   quietly show half a sentence in another language.

   Written as English marketing copy, not word-for-word: "Calcula
   lo que pierdes" became "See what you're losing", and the demo
   dashboard speaks English too (services, statuses, dates and
   amounts), because every bit of it is on screen.

   Times stay on the 24-hour clock, like the rest of the mock-up,
   and amounts keep the euro of the Costa del Sol business that
   stars in it — they are its invoices, not Bookmy's prices.
============================================================ */
import type { CrmWeb } from "./crm.es";

const crmEn: CrmWeb = {
  /* ── The <head> ────────────────────────────────────────── */
  meta: {
    titulo: "Bookmy CRM · Bookings, clients, payments and AI for service businesses",
    descripcionConPrueba:
      "Online bookings, client CRM, payments, team, stock, locations and an AI assistant that sells for you. Try it free for {dias} days.",
    descripcionSinPrueba:
      "Online bookings, client CRM, payments, team, stock, locations and an AI assistant that sells for you. Create your free account and start today.",
  },

  /* ── The made-up business in the mock-ups ──────────────── */
  demo: {
    negocio: "Estudio Aura",
    inicial: "A",
    plataforma: "Bookmy · Booking platform",
    sedeCentro: "Centre branch",
    sedePuerto: "Port branch",
    sedePlaya: "Beach branch",
  },

  gente: {
    lucia: "Lucía Martín",
    luciaCorto: "Lucía M.",
    luciaIni: "LM",
    carmen: "Carmen Ruiz",
    carmenCorto: "Carmen R.",
    carmenIni: "CR",
    marta: "Marta Gil",
    martaCorto: "Marta G.",
    martaIni: "MG",
    sofia: "Sofía Pérez",
    sofiaCorto: "Sofía P.",
    sofiaIni: "SP",
    elena: "Elena Vidal",
    elenaCorto: "Elena V.",
    elenaIni: "EV",
    andrea: "Andrea",
    andreaIni: "AN",
    paula: "Paula",
    paulaIni: "PA",
    irene: "Irene",
    ireneIni: "IR",
    direccion: "Management",
    direccionIni: "MN",
    clara: "Clara B.",
    eva: "Eva R.",
    ana: "Ana T.",
    rosa: "Rosa D.",
    nuria: "Nuria L.",
    ines: "Inés M.",
    laura: "Laura S.",
  },

  serv: {
    manicuraSemi: "Gel manicure",
    liftingPestanas: "Lash lift",
    cejasHilo: "Brow threading",
    masajeRelajante: "Relaxing massage",
    cortePeinado: "Cut and style",
    manicuraParafina: "Manicure + paraffin",
    manicura: "Manicure",
    masaje: "Massage",
    cejas: "Brows",
    pestanas: "Lashes",
    facial: "Facial",
    corte: "Haircut",
    spa: "Spa",
    unas: "Nails",
    lifting: "Lash lift",
    hueco: "Free slot",
  },

  /* The headers of the sample calendar */
  dias: {
    lun: "Mon",
    mar: "Tue",
    mie: "Wed",
    jue: "Thu",
  },

  importes: {
    e12: "€12.00",
    e25: "€25.00",
    e32: "€32.00",
    e33: "€33.00",
    e40: "€40.00",
    e45: "€45.00",
    mes: "€18,940",
    consumo: "€486",
    extra: "+€8",
    sedeMes: "€7,820",
  },

  etiquetas: {
    online: "Online",
    local: "In store",
    enLocal: "In store",
    vip: "VIP",
    enDirecto: "Live",
    enTiempoReal: "Real time",
  },

  /* ── 1 · Hero: the dashboard that assembles itself ─────── */
  hero: {
    titulo: "The AI-powered CRM that fills your calendar and",
    tituloVende: "sells for you.",
    lead:
      "Bookings around the clock, reminders, payments, team and locations in a single dashboard. Plus an artificial-intelligence assistant that answers and sells while you work.",
    ctaConPrueba: "Try it free for {dias} days",
    ctaSinPrueba: "Start for free",
    ctaCalculadora: "See what you're losing",
    pie: "Your whole business.",
    piePanel: "One dashboard.",
  },

  /* The Bookmy desktop that assembles in the hero */
  panel: {
    alt:
      "The Bookmy dashboard with clients, revenue this month, bookings, average rating and the latest bookings",
    url: "bookmy.es/dashboard",
    rol: "Location user",
    idioma: "EN",
    miga: "Pages / Dashboard",
    titulo: "Dashboard",
    sedeUsuario: "CB",
    nav: {
      dashboard: "Dashboard",
      reservas: "Bookings",
      clientes: "Clients",
      servicios: "Services",
      personal: "Staff",
      calendario: "Calendar",
      resenas: "Reviews",
      facturacion: "Invoicing",
      estadisticas: "Statistics",
      sedes: "Locations",
      stock: "Stock and supplies",
      comunicacion: "Messaging",
      automatizaciones: "Automations",
    },
    kpi: {
      clientes: "Total clients",
      clientesValor: "1,284",
      clientesPie: "+38 new this month",
      ingresos: "Revenue this month",
      ingresosPie: "+12% vs. October",
      reservas: "Total bookings",
      reservasValor: "342",
      reservasPie: "32 bookings today",
      valoracion: "Average rating",
      valoracionValor: "4.9 ★",
      valoracionPie: "from reviews",
    },
    ultimas: {
      titulo: "Latest bookings",
      sub: "Most recent activity at {negocio}",
      boton: "+ Add a booking",
      buscar: "Search by service, client, specialist or ID…",
    },
    col: {
      servicio: "Service",
      cliente: "Client",
      fecha: "Date",
      hora: "Time",
      duracion: "Length",
      precio: "Price",
      estado: "Status",
    },
    estado: {
      confirmada: "Confirmed",
      pendiente: "Pending",
      completada: "Completed",
      cancelada: "Cancelled",
    },
    fecha: {
      dia18: "18 Nov 2026",
      dia19: "19 Nov 2026",
      oct28: "28 Oct 2026",
      oct07: "7 Oct 2026",
      sep16: "16 Sep 2026",
    },
    duracion: {
      m15: "15 min",
      m45: "45 min",
      m50: "50 min",
      m60: "60 min",
    },
    /* The three alerts floating over the dashboard */
    aviso1: {
      titulo: "Booking confirmed",
      texto: "{cliente} · {servicio} · Fri 16:30",
      cuando: "just now",
    },
    aviso2: {
      titulo: "The AI sold an add-on",
      texto: "Paraffin {importe} · {cliente}",
      cuando: "1 min",
    },
    aviso3: {
      titulo: "Payment received",
      texto: "{importe} online · {cliente}",
      cuando: "8 min",
    },
  },

  /* ── 2 · The manifesto that lights up as you scroll ───── */
  manifiesto: {
    p1: "Bookmy is not another online calendar. It is the",
    em1: "operating system",
    p2:
      "of your business: every booking creates a client, every client leaves data behind and every piece of data turns into",
    em2: "more sales.",
  },

  /* ── 3 · Businesses and cities already on board ────────── */
  confianza: {
    etiqueta: "Businesses and cities already working with Bookmy",
    negocio1: "Glow Experience",
    negocio2: "Rituals by Glow",
    negocio3: "Qore Technology",
    negocio4: "Lash by Glow",
    negocio5: "Ink Nova",
    ciudad1: "Benalmádena",
    ciudad2: "Fuengirola",
    ciudad3: "Marbella",
    ciudad4: "Málaga",
    ciudad5: "Torremolinos",
    ciudad6: "Bogotá",
    ciudad7: "Medellín",
  },

  /* ── 4 · Modules: the bento and the "and also" list ───── */
  modulos: {
    titulo1: "A complete CRM, not another appointment",
    titulo2: "app.",
    lead:
      "Everything you see in your Bookmy dashboard works together: from the first booking to the invoice, from your first client to your next location.",

    reservas: {
      titulo: "Bookings and calendar in real time",
      texto:
        "Your clients book around the clock from your profile or the app and get their confirmation instantly. Availability rules, automatic reminders and rescheduling without a single phone call.",
      semana: "Week 47",
      sub: "{sede} · 32 appointments today",
      huecoNota: "The AI offers it",
    },

    clientes: {
      titulo: "Client CRM",
      texto:
        "The full record of every client: visits, preferences and spend. You know who is coming back and what to offer them.",
      desde: "Client since 2024 · Prefers afternoons",
      visitas: "14",
      visitasPie: "visits",
      consumoPie: "spend",
      frecuencia: "3 wks",
      frecuenciaPie: "frequency",
    },

    facturacion: {
      titulo: "Invoicing and payments",
      texto: "Take payment online or in store, with a trail for every transaction.",
    },

    estadisticas: {
      titulo: "Statistics in real time",
      texto: "Revenue, bookings and your best-performing services, instantly.",
    },

    equipo: {
      titulo: "Team and locations in a single dashboard",
      texto:
        "Roles, schedules and services for every professional. Switch location in one click and give each user access to theirs alone.",
      equipo: "Team",
      personas: "4 people",
      oficioUnas: "Nails",
      oficioSpa: "Spa",
      oficioEstetica: "Beauty",
      sedeActiva: "Active",
      sedeReservas18: "18 bookings today",
      sedeReservas14: "14 bookings today",
    },

    mas: {
      titulo: "And, in that same dashboard",
      stock: "Stock and supplies",
      stockTexto: "Inventory synced with every booking or sale.",
      servicios: "Services",
      serviciosTexto: "Length, price and professional for each service.",
      calendario: "Calendar",
      calendarioTexto: "A monthly view of bookings and free slots.",
      resenas: "Reviews",
      resenasTexto: "Your average rating and every opinion, in the dashboard.",
      comunicacion: "Messaging",
      comunicacionTexto: "Talk to your clients from the platform.",
      automatizaciones: "Automations",
      automatizacionesTexto: "Confirmations and reminders that take care of themselves.",
      roles: "Roles and access",
      rolesTexto: "Users per location and permissions per profile.",
      app: "iOS and Android app",
      appTexto: "Book and manage from any device.",
      idioma: "Language and dark mode",
      idiomaTexto: "In Spanish or English, by day or by night.",
      asistente: "AI assistant",
      asistenteTexto: "It answers, books and sells for you 24/7.",
    },
  },

  /* ── 5 · How it works: the four cards that stack ───────── */
  flujo: {
    titulo: "This is what Bookmy does for you, every single day.",
    lead:
      "One dashboard. Your whole business. Four jobs that stop stealing your time from day one.",

    agenda: {
      titulo: "Your calendar fills itself, 24/7.",
      texto:
        "Your clients pick the service, the date and the specialist from your profile or the app. You see every confirmed appointment in real time, by professional and by location.",
      check1: "Instant confirmation",
      check2: "Automatic reminders",
      check3: "Rescheduling without the friction",
      panel: "Calendar",
      panelSub: "Week 47 · {sede}",
      citasHoy: "32 appointments today",
      hueco18: "18:00",
      pista:
        "Free slot on Thursday at 18:00. The AI can offer it to 6 clients who usually book at that time.",
    },

    ficha: {
      titulo: "Know every client as if they were the only one.",
      texto:
        "Visit history, preferences and spend in one record. You know who is coming back, who is cooling off and what to offer each of them.",
      check1: "The full history",
      check2: "Preferences and notes",
      check3: "Suggestions from the AI",
      desde: "Client since March 2024 · Prefers afternoons",
      visitas: "14",
      visitasPie: "visits",
      consumoPie: "total spend",
      frecuencia: "3 wks",
      frecuenciaPie: "frequency",
      pista:
        "Lucía usually comes back every 3 weeks. Offer her a slot this week and the paraffin treatment ({importe}).",
    },

    cobros: {
      titulo: "Get paid without chasing anyone.",
      texto:
        "Payments online or in store, invoicing and a trail for every transaction, in the same place where you run your appointments.",
      check1: "100% protected payments",
      check2: "Online or in store",
      check3: "Invoicing built in",
      panel: "Invoicing",
      panelSub: "November 2026",
      subida: "+12%",
      ingresosPie: "Revenue this month",
      factura1: "F-2026-0412",
      factura2: "F-2026-0411",
      factura3: "F-2026-0410",
      factura4: "F-2026-0409",
      pagosOnline: "Paid online",
      pagosOnlineValor: "64%",
    },

    datos: {
      titulo: "Decide with data, not by eye.",
      texto:
        "Occupancy, revenue, star services and performance by professional and location, updated as it happens.",
      check1: "Statistics in real time",
      check2: "Locations side by side",
      check3: "Reviews and average rating",
      panel: "Statistics",
      panelSub: "All locations · last 4 weeks",
      ocupacion: "78%",
      ocupacionPie: "occupancy",
      semana44: "W44",
      semana45: "W45",
      semana46: "W46",
      semana47: "W47",
      estrella: "{servicio}",
      estrellaPie: "126 appointments",
      mejorSede: "{sede}, best of the month",
    },
  },

  /* ── 6 · The AI assistant ──────────────────────────────── */
  ia: {
    titulo: "Your best salesperson never sleeps.",
    tituloComision: "And never takes a cut.",
    lead:
      "The Bookmy AI assistant looks after your clients at any hour, books against your real availability and suggests the perfect add-on from what each client already buys.",
    cap1: "On duty 24/7",
    cap1Texto:
      "It settles questions about prices, services and opening hours on the spot, Sunday at 23:40 included.",
    cap2: "Books and reschedules",
    cap2Texto:
      "It offers real gaps from your calendar and leaves the appointment confirmed without you lifting a finger.",
    cap3: "Sells more at every appointment",
    cap3Texto: "It suggests add-ons and services based on what each client already buys.",
    cap4: "Wins clients back",
    cap4Texto:
      "It spots who has not been in for a while and invites them back with a personal message.",
    cta: "Meet the AI assistant",
    ctaHablar: "Talk to it now",

    chatTitulo: "{negocio} assistant",
    chatEstado: "Online",
    chatRepetir: "Play the conversation again",
    chat1: "Hi! Do you have a slot for a manicure this Friday afternoon?",
    chat2:
      "Hi Lucía! On Friday I have 16:30 free with Andrea, or 18:00 with Paula. Which one suits you better?",
    chat3: "16:30 is perfect.",
    chat4:
      "Done! Gel manicure on Friday at 16:30 with Andrea. You loved the paraffin last time: shall I add it for €8?",
    chat4Nota: "Suggested from her history",
    chat5: "Go on then, yes!",
    chat6: "All set: €33 in total. I'll send you a reminder on Thursday. See you Friday!",
    toast: "+€8 on this appointment",
    toastPie: "Add-on suggested by the AI",
  },

  /* ── 7 · Sectors ───────────────────────────────────────── */
  sectores: {
    titulo: "It keeps up with the rhythm of your business.",
    lead:
      "Health, beauty, construction, technology or services: if you work by appointment, Bookmy works for you.",

    estetica: "Beauty and aesthetics",
    esteticaTexto: "Fill the gaps, cut the no-shows and make every client come back.",
    esteticaTag1: "Nails",
    esteticaTag2: "Lashes and brows",
    esteticaTag3: "Waxing",
    esteticaTag4: "Spa and massage",

    peluqueria: "Hair and barbering",
    peluqueriaTexto: "Every client picks their professional and their time; you put the phone down.",
    peluqueriaTag1: "Cut and colour",
    peluqueriaTag2: "Barbering",
    peluqueriaTag3: "Treatments",

    salud: "Health",
    saludTexto:
      "A calendar per professional, reminders and the visit history of every patient.",
    saludTag1: "Physiotherapy",
    saludTag2: "Clinics",
    saludTag3: "Psychology",
    saludTag4: "Nutrition",

    construccion: "Construction and renovation",
    construccionTexto: "Site visits and client meetings, coordinated with your team.",
    construccionTag1: "Renovations",
    construccionTag2: "Installations",
    construccionTag3: "Site visits",

    tecnologia: "Technology",
    tecnologiaTexto: "Demos, technical support and repairs, with no calendar clashes.",
    tecnologiaTag1: "Support",
    tecnologiaTag2: "Repairs",
    tecnologiaTag3: "Consulting",

    servicios: "Services",
    serviciosTexto:
      "Any business that lives off its calendar, better organised and more profitable.",
    serviciosTag1: "Training",
    serviciosTag2: "Advisers",
    serviciosTag3: "Photography",
    serviciosTag4: "Workshops",
  },

  /* ── 8 · The numbers ───────────────────────────────────── */
  cifras: {
    etiqueta: "Bookmy in numbers",
    reservas: "+25K",
    reservasPrefijo: "+",
    reservasSufijo: "K",
    reservasPie: "bookings handled",
    confirmadas: "98%",
    confirmadasSufijo: "%",
    confirmadasPie: "confirmed instantly",
    valoracion: "4.9★",
    valoracionSufijo: "★",
    valoracionPie: "rating in the app stores",
    minutos: "2 min",
    minutosSufijo: " min",
    minutosPie: "to confirm a booking",
  },

  /* ── 9 · Testimonials ──────────────────────────────────── */
  voces: {
    titulo: "Businesses already working with Bookmy.",
    anterior: "Previous testimonial",
    siguiente: "Next testimonial",
    voz1:
      "“Bookmy completely transformed the way we handle bookings. Our calendar is in order, we get fewer cancellations and our clients are happier.”",
    voz1Quien: "Antonella Dávila",
    voz1Cargo: "Manager · Glow Experience",
    voz1Ini: "AD",
    voz2:
      "“We needed bookings and clients in one place. With Bookmy we automated our processes and the team follows up on sales far better.”",
    voz2Quien: "Johan Castillo",
    voz2Cargo: "Manager · Qore Technology",
    voz2Ini: "JC",
    voz3:
      "“The app is intuitive and quick to roll out. Our clients book in seconds and we keep an eye on everything from anywhere.”",
    voz3Quien: "Samantha",
    voz3Cargo: "Manager · Glow Experience Marbella",
    voz3Ini: "S",
  },

  /* ── 10 · Plans ────────────────────────────────────────── */
  planes: {
    tituloConPrueba: "Try it free. Grow without limits.",
    tituloSinPrueba: "Start for free. Grow without limits.",
    leadConPrueba:
      "Take bookings today with the Basic plan or unlock the whole system with the Pro plan. Both of them free for {dias} days.",
    leadSinPrueba:
      "Take bookings today with the Basic plan or see everything the Pro plan adds. Creating your account is free and we never ask for a card.",
    comparar: "Compare the plans in detail",
    verTodo: "See everything it includes",

    basic: {
      desc: "Get your bookings in order the easy way and put the phone down.",
      precioConPrueba: "{dias} days",
      precioPieConPrueba: "free to try it out",
      precioSinPrueba: "Free",
      precioPieSinPrueba: "to get started today",
      check1: "Basic booking management",
      check2: "Digital calendar 24/7",
      check3: "Automatic confirmations",
      check4: "Access from phone and tablet",
      check5: "A public profile for your clients",
      ctaConPrueba: "Try the Basic plan",
      ctaSinPrueba: "Start with the Basic plan",
      notaConPrueba: "{dias} days free · no card · no lock-in",
      notaSinPrueba: "No card · no lock-in · leave whenever you like",
    },

    pro: {
      desc: "Take your business up a level, with one location or with many.",
      precioConPrueba: "{dias} days",
      precioPieConPrueba: "free to try it out",
      precioSinPrueba: "No limits",
      precioPieSinPrueba: "the whole system, all at once",
      check1: "Everything in the Basic plan, and on top of that:",
      check2: "Client CRM",
      check3: "Invoicing and payments",
      check4: "Advanced booking management",
      check5: "Staff management",
      check6: "Inventory control",
      check7: "Statistics in real time",
      check8: "Multiple locations",
      ctaConPrueba: "Try the Pro plan",
      ctaSinPrueba: "I want the Pro plan",
      notaConPrueba: "{dias} days free · no card · no lock-in",
      notaSinPrueba: "No card · no lock-in · leave whenever you like",
    },
  },

  /* ── 11 · The app for businesses ───────────────────────── */
  app: {
    titulo: "Your business, in the app as well.",
    tituloClientes: "Your clients, one tap from booking.",
    lead:
      "Your CRM account puts you inside the Bookmy app: your clients find you, book and pay in seconds, and you run every appointment from your phone, wherever you happen to be.",
    check1: "Bookings in real time",
    check2: "Alerts the moment they land",
    check3: "Automatic reminders",
    check4: "Take payment from your phone",
    enlace: "See how the app for businesses works",
    alt:
      "The Bookmy app on two phones: choosing a specialist and a date, and the confirmed booking",
  },

  /* ── 12 · Frequently asked questions ───────────────────── */
  faq: {
    titulo: "Let's clear up your doubts.",
    lead: "Still got one?",
    leadBoton: "Ask the assistant",

    q1: "Is Bookmy just a booking app?",
    a1:
      "No. Bookings are the front door, but Bookmy is a complete system: client CRM, payments and invoicing, team, inventory, several locations, statistics in real time and an AI assistant, all in the same dashboard.",

    q2: "How does the CRM help me stay on top of my bookings?",
    a2:
      "It brings bookings, clients and services together on a single platform. Every appointment is tied to the client's record, with their history, preferences and spend, so you run your business more efficiently and sell better.",

    q3: "Can I try it for free?",
    a3ConPrueba:
      "Yes. Both the Basic plan and the Pro plan can be tried free for {dias} days, with no card and no lock-in. When the trial is over, you decide whether to stay and on which plan.",
    a3SinPrueba:
      "Yes. Creating your account is free and you can start taking bookings today, with no card and no lock-in.",

    q4: "Can my clients choose which professional looks after them?",
    a4:
      "Yes. As they book they pick the service, the date and whichever available specialist best fits their schedule or their preferences, and the confirmation arrives straight away.",

    q5: "What if a client needs to change or cancel their appointment?",
    a5:
      "They can change it or cancel it from their profile, at no extra cost, as long as they do it in advance. Your calendar updates itself and the slot goes back up for grabs.",

    q6: "Does it work if I have several locations?",
    a6:
      "Yes. With the Pro plan you run every location from one central dashboard and give each user access to their own.",

    q7: "What exactly does the AI assistant do?",
    a7:
      "It looks after your clients 24/7, books against your real availability, suggests add-ons from each client's history and helps you win back anyone who has not been in for a while.",
    a7Enlace: "Take a look",
  },

  /* ── 13 · The call that crowns the footer ──────────────── */
  cta: {
    titulo: "Your next booking could land",
    tituloEm: "while you read this.",
    leadConPrueba:
      "Try Bookmy free for {dias} days on the Basic or the Pro plan. No card and no lock-in.",
    leadSinPrueba:
      "Create your account for free and start taking bookings today. No card and no lock-in.",
    botonConPrueba: "Try it free for {dias} days",
    botonSinPrueba: "Start for free",
    botonDudas: "I have questions",
  },
};

export default crmEn;
