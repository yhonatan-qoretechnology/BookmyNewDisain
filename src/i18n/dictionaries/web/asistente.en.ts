/* ============================================================
   Assistant copy for the public website — English
   ------------------------------------------------------------
   Mismas claves que asistente.es.ts, una por una: la interfaz
   TextosAsistente no deja que se desvíen. Si aquí falta una clave,
   `npx tsc --noEmit` lo canta antes de llegar al navegador.

   Ojo al traducir: las {variables} y el markdown mínimo
   (**negrita**, listas con «- », [texto](destino)) tienen que
   sobrevivir, porque el guion rellena las primeras y el componente
   pinta el segundo.
============================================================ */
import type { TextosAsistente } from "@/lib/web/asistente/guion";

const asistenteEn: TextosAsistente = {
  /* Marco de la ventana ------------------------------------- */
  nombre: "Bookmy Assistant",
  tagIa: "AI",
  abrirAria: "Open the {nombreAsistente}",
  cerrarAria: "Close the assistant",
  reiniciarAria: "Start over",
  cerrarSugerenciaAria: "Dismiss suggestion",
  teaserIa: "AI assistant · replies instantly",
  teaserSinIa: "Replies instantly",
  enLinea: "Online · replies instantly",
  campoAria: "Type your message",
  marcador: "Ask me anything…",
  enviarAria: "Send",
  pieIa: "AI assistant · it can get things wrong",
  pieSinIa: "Bookmy virtual assistant",
  piePrivacidad: "Privacy",
  avisoIa:
    "I'm a virtual assistant powered by artificial intelligence, so I can get things wrong. For anything to do with your account or your payments I'll put you through to the team. [How we handle your data]({privacidadAsistente}).",
  avisoSinIa:
    "I'm Bookmy's virtual assistant. For anything to do with your account or your payments I'll put you through to the team. [How we handle your data]({privacidadAsistente}).",

  /* Arranque de la conversación ----------------------------- */
  hola: "Hi there!",
  holaNombre: "Hi {nombre}!",
  aperturaNegocio:
    "Hi there! I'm Bookmy's assistant. I can help you **choose a plan**, **work out how much you could win back** with Bookmy, or answer anything else. Where shall we start?",
  aperturaConsumidor:
    "Hi there! I'm Bookmy's assistant. I can help you **book your appointment**, **download the app** or, if you run a business, **get listed on it**. Where shall we start?",
  aperturaCorta: "Hi there! I'm Bookmy's assistant.",
  reinicio: "Let's start over. How can I help?",
  abiertoEnPestana: "Done! I've opened it in a new tab. If anything comes up, I'm still here.",
  empujon:
    "By the way: would you like a recommendation made for you? It's 3 questions and I'll tell you which plan fits.",

  /* Chips del menú ------------------------------------------ */
  chipQueEs: "What is Bookmy?",
  chipRecomendar: "Recommend me a plan",
  chipRoi: "What do no-shows cost me?",
  chipPlanes: "Plans and pricing",
  chipTrial: "Try Plan Pro free for {dias} days",
  chipBasic: "Try Plan Basic free for {dias} days",
  chipDescargar: "Download the app",
  chipReservar: "How do I book an appointment?",
  chipNegocio: "I run a business",
  chipDemo: "Talk to a person",
  chipIa: "What does the AI do?",
  chipFunciona: "How do I get started?",

  /* Sectores ------------------------------------------------ */
  chipSectorEstetica: "Beauty",
  chipSectorPeluqueria: "Hair or barber salon",
  chipSectorSalud: "Health",
  chipSectorOtro: "Another sector",
  nombreSectorEstetica: "beauty",
  nombreSectorPeluqueria: "hair and barbering",
  nombreSectorSalud: "health",
  nombreSectorBienestar: "sport and wellness",
  nombreSectorTatuajes: "tattooing",
  nombreSectorConstruccion: "construction and renovation",
  nombreSectorTecnologia: "technology",
  nombreSectorServicios: "services",

  /* Discurso por sector ------------------------------------- */
  pitchEstetica:
    "In **beauty**, every empty slot and every client who doesn't come back costs money. With Bookmy your clients book 24/7, get a reminder, and you keep a profile for each one with their treatments and preferences. You also keep track of products and supplies, and the AI can suggest the next service at exactly the right moment.",
  pitchPeluqueria:
    "In **hair and barbering** the day never stops. Bookmy gets the phone off your back: your clients pick their stylist and their time on their own, they get a reminder, and you see the whole team's diary in real time along with every client's history.",
  pitchSalud:
    "In **health** the diary is everything. Bookmy organises appointments by practitioner, sends automatic confirmations and reminders, and keeps each patient's visit history, with access controlled per user.",
  pitchBienestar:
    "In **sport and wellness** Bookmy organises appointments and sessions by trainer and time slot, and helps you get clients coming back with automatic reminders and messages.",
  pitchTatuajes:
    "In **tattooing and piercing** Bookmy organises each artist's diary, keeps every client's history and lets you take payment online or at the studio with a full audit trail.",
  pitchConstruccion:
    "In **construction and renovation** Bookmy is where you book site visits and client meetings, coordinate your crew and keep every client's history in a single dashboard.",
  pitchTecnologia:
    "In **technology** Bookmy schedules demos, site visits and support calls, assigns them to the right person and gives you the stats to see where the time goes.",
  pitchServicios:
    "For **professional services** Bookmy brings appointments, clients, payments and staff together, so your diary fills itself and you get on with the work.",

  /* Piezas que se reutilizan -------------------------------- */
  textoPrueba: "**{dias} days free**, no card and no lock-in",
  precioCon: "costs **{precio}**",
  precioSin: "is priced according to your business",
  enlaceGooglePlay: "Google Play",
  enlaceAppStore: "App Store",
  enlaceApk: "Android APK",
  soporteWaTexto: "Hi, I'm a Bookmy customer and I need help with my account.",

  /* Respuestas guionizadas ---------------------------------- */
  resSaludoNegocio: "{hola} What kind of business do you run? That way I can tell you exactly how Bookmy would help you.",
  resSaludoConsumidor: "{hola} Would you like to book an appointment, or do you run a business?",
  resQueEs:
    "**Bookmy isn't just a booking app: it's the system that runs your business and helps it grow.** In one dashboard you get:\n- Online booking 24/7 with instant confirmation\n- A CRM with every client's profile and history\n- Payments, invoicing and stock\n- Staff, schedules and several locations\n- Real-time stats and an AI assistant\n\nWhat kind of business do you run? I'll tell you how you'd use it.",
  resSector: "{pitch}\n\nHow many of you are there in the team? With that I can tell you which plan fits.",
  resPrecio:
    "The plans are for the CRM, for your business. There are two ([Plan Basic]({planBasic}) and [Plan Pro]({planPro})):\n- **Plan Basic**: online booking, a 24/7 diary, automatic confirmations and a public profile. {precioBasicCap}.\n- **Plan Pro**: the whole system (CRM, payments, staff, stock, locations, stats and AI). {precioProCap}.\n\nYou can try either one {prueba}. Shall I tell you which works out better for you?",
  resPrueba:
    "You can try **Plan Basic** or **Plan Pro** {prueba}. You pick the plan when you sign up and, when the trial ends, you decide whether to carry on. No surprise charges. Shall we start?",
  resPermanencia:
    "**No lock-in.** You're not tied to anything, and the trial lasts {dias} days with no card. If you ever need a hand with your subscription, the team is at [{email}](mailto:{email}).",
  resCaro:
    "I get it: every euro counts. Try this sum: what is one no-show worth in your business? If Bookmy saves you just a few a month, it pays for itself fast. And you can try whichever plan you like {prueba}. Shall we run the numbers with yours?",
  resAusencias:
    "Appointments that never show up are money you don't get back. Bookmy sends **automatic confirmations and reminders**, and Plan Pro adds **availability rules and friction-free rescheduling**. Shall we work out what they're costing you today? It's 4 quick answers.",
  resReservas:
    "Your clients book **24/7** from your public profile or the app: they choose the service, the date and the professional, and get **instant confirmation**. You see the diary update in real time, with no phone calls and no crossed messages.",
  resReservar:
    "Booking is easy:\n- **1.** Download the Bookmy app (it's free)\n- **2.** Find your salon or clinic and pick a service\n- **3.** Choose the specialist, the day and the time\n- **4.** Pay online or in person, whichever you prefer\n\nYou get instant confirmation and a reminder before your appointment. {tiendas}",
  resCancelar:
    "From **“My bookings”** in your profile you can change or cancel your appointment free of charge, as long as you do it in good time. The slot goes back up for someone else.",
  resGratisApp:
    "Yes: **the Bookmy app is free**. You only pay for the service you book, online or in person. {tiendas}",
  resDescargar:
    "Download **Bookmy for free**:\n- {tiendas}\n\nThe APK is for Android phones without Google Play: your phone will ask for permission to install it.",
  resApk:
    "You can install Bookmy on Android with the APK file: [download the APK]({apk}). When you open it, your phone will ask for permission to install apps from this source. It's also on [Google Play]({playStore}) and the [App Store]({appStore}).",
  resEmpresasApp:
    "With **Bookmy for business** your business appears in the app: clients find you, book and pay in seconds, and you manage the appointments from your phone. To get listed you need a CRM account (Plan Basic or Plan Pro), with {prueba}. [Here's how it works]({appEmpresas}).",
  resCrm:
    "**Bookmy's CRM** keeps a profile for every client: visits, services, preferences and spend. You know who hasn't been in for a while, who spends the most and what to offer them. With the AI you can **win back inactive clients** with personalised messages. It's part of **Plan Pro**.",
  resPagos:
    "With **Plan Pro** you take payment **online or in person** and get a **full audit trail for every transaction**, together with invoicing, on the same platform. Payments are processed by certified providers: Bookmy never stores full card details.",
  resEquipo:
    "In **Plan Pro** you assign **roles, schedules and services** to each person on the team, and each one sees only what concerns them. How many of you are there?",
  resSedes:
    "**Plan Pro** is built for businesses with several locations: you run **all of them from one dashboard**, switch location in a click and give each user access to theirs.",
  resStock:
    "Plan Pro's **stock control** keeps products and supplies **in sync with every booking or sale**, so you never run out of materials halfway through the week.",
  resEstadisticas:
    "Your dashboard shows **clients, revenue for the month, bookings and average rating** in real time, and the stats tell you which services and which professionals perform best. You decide with data, not by eye.",
  resResenas:
    "Bookmy collects your clients' **reviews** and shows your average rating on the dashboard. With the AI you can ask for the review right after the service, which is when the client is happiest.",
  resComunicacion:
    "From **Messaging** you talk to your clients straight from the dashboard, and with the AI you can send personalised messages, for example to anyone who hasn't been in for weeks.",
  resAutomatizar:
    "Bookmy automates the repetitive part: **confirmations, reminders and rescheduling**. You set the rules once and the system works on its own, even on your busiest days.",
  resIa:
    "**Bookmy's AI assistant** looks after your clients 24/7, books according to your real availability, **suggests add-ons** based on each client's history, wins back inactive clients and answers your questions about your business. [See it here]({asistenteIa}).",
  resAppConsumidor:
    "The **Bookmy app** is free on iOS and Android: find your salon or clinic, choose the service, the specialist and the time, and pay online or in person. {tiendas}",
  resAppNegocio:
    "Yes: **Bookmy is on iOS and Android**. Your clients download it for free, find you, choose the service, the specialist and the time, and pay online or in person. You manage your appointments from your phone and everything else from the dashboard. [App for business]({appEmpresas}) · {tiendas}",
  resSeguridad:
    "Your data is protected with **encryption in transit, access control and continuous monitoring**. Payments are processed by certified providers and **we don't sell your data**. The details are in the [privacy policy]({privacidad}).",
  resYaUso:
    "Great, then you already know what an online diary is worth! The difference is that Bookmy doesn't stop at the booking: it brings **CRM, payments, staff, stock, locations, stats and AI** into one dashboard, so you stop jumping between tools. Run it alongside yours for {dias} days, with no card, and compare. Would you like the team to help you move over?",
  resTiempo:
    "That's exactly what it's built for. You create the account in under a minute, add your services and opening hours, and share your booking link. From then on, Bookmy works on its own. And if you'd rather, the team walks you through the setup.",
  resWhatsapp:
    "You can keep using WhatsApp and Instagram: share your **Bookmy booking link** there and your clients book on their own, 24/7, with no back and forth. You just see the confirmed appointment in your diary.",
  resIdioma: "The platform is available in **Spanish and English**.",
  resQuienes:
    "Bookmy is a management platform for service businesses. We work with businesses on the **Costa del Sol** (Benalmádena, Fuengirola, Marbella, Málaga, Torremolinos) and in **Colombia** (Bogotá and Medellín). [Get to know us]({quienesSomos}).",
  resFunciona:
    "Getting started is easy:\n- **1.** Create your account (under a minute)\n- **2.** Add services, schedules and staff\n- **3.** Share your booking profile\n- **4.** Turn on reminders and let Bookmy work\n\nThe first {dias} days are free. [See the step by step]({comoFunciona}). Shall I recommend a plan?",
  resSoporte:
    "If you're already a customer, the fastest route is support: [WhatsApp]({soporteWa}) or [{email}](mailto:{email}). And you can [sign in to your dashboard]({login}) here.",
  resGracias: "Any time! If you like, here are the next steps:",
  resDespedida:
    "Perfect! For whenever you decide: both **Plan Basic** and **Plan Pro** come with {prueba}. Leave me your email and the team will send you the details.",
  resFallbackConsumidor:
    "I'd rather not give you the wrong answer. I can explain how to book, where to download the app or, if you run a business, how to get listed on it. Which would you like?",
  resFallbackNegocio:
    "Good question. I'd rather not give you the wrong answer, so here are two options: I put you through to someone on the team, or I walk you through the essentials of Bookmy. Which would you like?",

  /* Flujo «recomiéndame un plan» ---------------------------- */
  flujoRecomendarIntro: "Perfect. I'll recommend a plan in 3 questions.",
  pasoEquipo: "How many of you serve clients in your business?",
  opEquipoSolo: "Just me",
  opEquipoPocos: "2 to 5",
  opEquipoMedio: "6 to 15",
  opEquipoMuchos: "More than 15",
  pasoSedes: "How many locations do you have?",
  opSedesUna: "1",
  opSedesPocas: "2 or 3",
  opSedesMuchas: "4 or more",
  pasoPrioridad: "What would you like to improve first?",
  opPrioridadAgenda: "Taking bookings online",
  opPrioridadAusencias: "Cutting down no-shows",
  opPrioridadCobros: "Payments and invoicing",
  opPrioridadEquipo: "Staff and locations",
  opPrioridadVentas: "Selling more to my clients",

  /* Flujo «cuánto pierdo por ausencias» --------------------- */
  flujoRoiIntro: "Let's work it out with 4 quick answers. First, so the sums are in your currency:",
  pasoPais: "Which country is your business in?",
  opOtroPais: "Another country",
  reintentoPais:
    "I didn't catch the country. Pick one from the list or write it another way, for example “Colombia” or “Mexico”.",
  pasoMoneda: "Which country are you in? Or just tell me the currency, if you prefer.",
  opEuros: "Euros (€)",
  opDolares: "Dollars (US$)",
  reintentoMoneda: "I didn't catch that. Pick an option or write your country or your currency.",
  pasoCitas: "Roughly how many appointments do you handle a week?",
  pasoTicket: "How much do you charge per appointment on average, in {moneda}?",
  pasoTasa: "Out of every 10 appointments, how many fall through with no notice or at the last minute?",
  opTasaCasiNinguna: "Hardly any",
  opTasaMuchas: "3 or more",

  /* Recomendación ------------------------------------------- */
  recPro: "From what you tell me, I'd recommend **Plan Pro**:",
  recProSector: "From what you tell me, I'd recommend **Plan Pro** for your {sector} business:",
  recBasic: "To get going, **Plan Basic** is a perfect fit:",
  recProCierre: "Would you rather try it yourself, or have someone from the team show you with your own case?",
  recBasicCierre: "Try it free for {dias} days and move up to Pro when you grow. Anything else I can help with?",
  tarjetaPro: "Plan Pro",
  tarjetaBasic: "Plan Basic",
  tarjetaRecomendado: "Recommended",
  tarjetaProbar: "Try it free for {dias} days",
  tarjetaGarantia: "No card · no lock-in",
  motivoEquipo: "Staff with roles, schedules and services per person",
  motivoSedes: "All your locations in one dashboard",
  motivoAusencias: "Automatic reminders and friction-free rescheduling",
  motivoCobros: "Payments online or in person, and invoicing with an audit trail",
  motivoVentas: "A CRM with every client's history, so you sell to them better",
  motivoEquipoSolo: "Staff and location management",
  motivoEstadisticas: "Real-time stats, so you decide with data",
  motivoReservas: "Online booking 24/7 from your public profile",
  motivoConfirmaciones: "Automatic confirmations",
  motivoMovil: "Run it from your phone or tablet",
  motivoCrecer: "You can move up to Pro when you grow",

  /* Resultado del ROI --------------------------------------- */
  roiIntro: "Here's your estimate, in {moneda}:",
  roiTitulo: "What you lose every month",
  roiDetalle:
    "From {citasPerdidas} no-shows a month ({citas} appointments a week · {ticket} on average).",
  roiRecupera:
    "If reminders and rescheduling prevent just **1 in 3**, you win back **{mes} a month** · **{anio} a year**.",
  roiNota: "Rough estimate in {moneda} ({cur}). Every business is different.",
  roiNotaPais: "Rough estimate in {moneda} ({cur}) · {pais}. Every business is different.",
  roiCierre:
    "That's money you're already making and letting slip. The fastest way to check: **try Plan Pro free for {dias} days**, with no card, and turn the reminders on today.",

  /* Captación de contactos ---------------------------------- */
  leadIntro:
    "Of course! Leave me your details and someone from the team will get in touch shortly to show you Bookmy with your own case.",
  leadIntroRepetido:
    "We already have your details and the team will write to you shortly. If you like, add another way to reach you:",
  leadTitulo: "Talk to the team",
  leadNombre: "Name",
  leadNombrePh: "Your name",
  leadEmail: "Email",
  leadEmailPh: "Email",
  leadTelefono: "Phone",
  leadTelefonoPh: "Phone (optional)",
  leadTipo: "Type of business",
  tipoSalud: "Health",
  tipoEstetica: "Beauty",
  tipoConstruccion: "Construction",
  tipoTecnologia: "Technology",
  tipoServicios: "Services",
  tipoOtros: "Other",
  leadConsentimiento:
    "I agree to Bookmy using these details to answer my enquiry. You can exercise your rights of access, rectification and erasure at any time. More in the [privacy policy]({privacidadAsistente}).",
  leadEnviar: "Please get in touch with me",
  leadEnviando: "Sending…",
  leadErrNombre: "Tell us your name.",
  leadErrContacto: "Leave us a valid email or phone number.",
  leadErrConsentimiento: "We need your consent before we can contact you.",
  leadGracias:
    "Thanks, {nombre}! We've got it and the team will be in touch shortly. In the meantime, you can [start your {dias}-day trial]({crearCuenta}) today.",
  leadGraciasManual:
    "Thanks, {nombre}! One last step: send us your enquiry on whichever channel you prefer and we'll reply right away.",
  envioTitulo: "Send your enquiry",
  envioWhatsapp: "Send on WhatsApp",
  envioEmail: "Send by email",
  envioAsunto: "I'd like to know more about Bookmy",
  resumenHola: "Hello Bookmy, I'm {nombre}{tipo}. I'm interested in Bookmy.",
  resumenEquipo: "Team: {equipo}.",
  resumenSolo: "just me",
  resumenPersonas: "around {n} people",
  resumenSedes: "Locations: {n}.",
  resumenPrioridad: "Priority: {prioridad}.",
  resumenContacto: "Contact: {contacto}.",

  /* Sugerencias flotantes por página ------------------------ */
  teaserCrm: "How much are no-shows costing you? I'll work it out in your currency in 20 seconds.",
  teaserCrmEtiqueta: "Work it out for me",
  teaserApp: "Shall I help you book your first appointment with Bookmy?",
  teaserAppEtiqueta: "How do I book an appointment?",
  teaserAppEmpresas: "Want your business listed in the app? I'll explain how in a minute.",
  teaserAppEmpresasEtiqueta: "I want to be listed in the app",
  teaserPlanBasic: "Is Basic enough, or is Pro the one for you? I'll tell you in 3 questions.",
  teaserPlanBasicEtiqueta: "Recommend me a plan",
  teaserPlanPro: "How much would you win back with Pro? Let's run your numbers, in your currency.",
  teaserPlanProEtiqueta: "Work it out for me",
  teaserPlanes: "Basic or Pro? I'll tell you which fits in 3 questions.",
  teaserPlanesEtiqueta: "Recommend me a plan",
  teaserComoFunciona: "Shall we look at it for your business? I'll explain how to start in your case.",
  teaserComoFuncionaEtiqueta: "How do I get started?",
  teaserAsistenteIa: "Put me to the test: ask me what a client would ask you.",
  teaserAsistenteIaEtiqueta: "What can the AI do for my business?",
  teaserQuienesSomos: "Shall we talk? I'll put you in touch with the team in a moment.",
  teaserQuienesSomosEtiqueta: "I'd like to talk to the team",
  /* Replaces the keys above when SE_OFRECE_PRUEBA is false
     (src/lib/web/oferta.ts). See the Spanish file for the why. */
  sinPrueba: {
    chipTrial: "See what Plan Pro includes",
    chipBasic: "Start free on Plan Basic",
    textoPrueba: "**free to start**, no card and no lock-in",
    tarjetaProbar: "Start for free",
    recBasicCierre:
      "Start on Basic, which is free, and move up to Pro when you need it. Anything else I can help with?",
    resPermanencia:
      "**No lock-in.** Nothing ties you down: Plan Basic is free and Pro is paid month to month, no small print. If you need a hand with your subscription, the team is on [{email}](mailto:{email}).",
    resYaUso:
      "Good — so you already know what an online calendar does for you. The difference is that Bookmy doesn't stop at the booking: it puts **CRM, payments, staff, stock, locations, reports and AI** in one place, so you stop hopping between tools. Run Basic alongside what you have, no card needed, and compare. Want the team to help you move across?",
    resFunciona:
      "Getting started is quick:\n- **1.** Create your account (under a minute)\n- **2.** Add services, hours and staff\n- **3.** Share your booking page\n- **4.** Turn on reminders and let Bookmy work\n\nPlan Basic is free, so you can start today. [See the walkthrough]({comoFunciona}). Want me to suggest a plan?",
    roiCierre:
      "That's money you're already earning and losing on the way out. Quickest way to see it: **create your free account** and turn reminders on today.",
    leadGracias:
      "Thanks, {nombre}! We've got it and the team will be in touch shortly. In the meantime you can [create your free account]({crearCuenta}) today.",
  },
};

export default asistenteEn;
