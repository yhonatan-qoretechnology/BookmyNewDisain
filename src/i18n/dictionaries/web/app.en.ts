/* ============================================================
   /app · the app for people — English
   ------------------------------------------------------------
   The same keys as app.es.ts, one by one: the TextosApp type does
   not let them drift. If a key is missing here, `npx tsc --noEmit`
   says so before the browser does.

   Watch out when editing:
     · {dias} (days of the free trial) and {precio} (an example
       amount in the visitor's currency) have to survive the
       translation — the component fills them in.
     · `negocio.leadConPrueba` / `negocio.leadSinPrueba` are the two
       halves of one promise. Today SE_OFRECE_PRUEBA is false, so
       the one on screen is the version WITHOUT the trial: it
       deserves the same care as the other.
============================================================ */
import type { TextosApp } from "./app.es";

const appEn: TextosApp = {
  /* ── Hero: the 3D phone and its orbit of alerts ──────────── */
  hero: {
    titulo: "Book your appointments in seconds.",
    tituloMint: "All from one place.",
    lead:
      "Find a place near you, choose the service, the specialist and the time, and pay online or in person. Your booking is confirmed instantly, and we remind you before your appointment.",
    telefonoAlt: "Bookmy app: choosing a specialist, a day and a time at a local business",
    orbita1: "Booking confirmed",
    orbita1Sub: "Manicure · Fri 4:30pm",
    orbita2: "Reminder",
    orbita2Sub: "Tomorrow at 12:00",
    orbita3: "Secure payment",
    orbita3Sub: "Online or in person",
  },

  /* ── The five steps (#pasos) ─────────────────────────────── */
  pasos: {
    titulo: "From idea to confirmed appointment in five taps.",

    descarga: {
      alt: "The Bookmy app welcome screen",
      titulo: "Download Bookmy",
      texto:
        "Free on Google Play and the App Store, or as an APK file for Android. Browse, book and enjoy, all from one place.",
      check1: "iPhone and Android",
      check2: "Light and fast",
      chip: "Free download",
      chipSub: "iPhone and Android",
    },

    entrar: {
      alt: "Sign-in screen with email and password, or Face ID",
      titulo: "Sign in in a minute",
      texto:
        "Sign up with your email or log in with Google, Apple or Facebook. Your details and your bookings stay saved.",
      check1: "Social login",
      check2: "Stay signed in",
      chip: "You're in",
      chipSub: "One tap with Google",
    },

    elegir: {
      alt: "Screen for choosing the day and time of the booking",
      titulo: "Pick the day, the time and the specialist",
      texto:
        "Search for your service, see only the slots that are genuinely free, and choose the professional you like best.",
      check1: "Real-time availability",
      check2: "Your favourite specialist",
      chip: "Slot free",
      chipSub: "Fri 4:30pm · Andrea",
    },

    pagar: {
      alt: "Screen for choosing how to pay",
      titulo: "Pay however you like",
      texto:
        "By card online, or in person when you get there. You see the final price before you confirm, with no surprises.",
      check1: "Protected online payment",
      check2: "Or pay on arrival",
      chip: "Payment protected",
      chipSub: "{precio} · online",
    },

    confirmar: {
      alt: "Booking confirmed screen",
      titulo: "Confirmed on the spot",
      texto:
        "Your appointment is confirmed the moment you book, and we give you a nudge beforehand so it doesn't slip your mind.",
      check1: "All under “My bookings”",
      check2: "Automatic reminder",
      chip: "Appointment confirmed!",
      chipSub: "We'll remind you on Thursday",
    },
  },

  /* ── The eight upsides ───────────────────────────────────── */
  ventajas: {
    titulo: "Everything you want from booking.",
    tituloStroke: "And none of what you don't.",
    lead:
      "No phone calls, no waiting and no messages nobody answers. Just you, your appointment and a couple of taps.",

    centroTitulo: "Find your place",
    centroTexto: "Discover businesses near you, with their services, their prices and their ratings.",
    especialistaTitulo: "Choose your specialist",
    especialistaTexto: "Book with the person you prefer, whenever they are free.",
    huecosTitulo: "Real availability",
    huecosTexto: "You only see times that are genuinely free, updated as they change.",
    pagoTitulo: "Pay your way",
    pagoTexto: "By card online or in person at the counter: up to you.",
    confirmacionTitulo: "Instant confirmation",
    confirmacionTexto: "Your appointment is confirmed on the spot, with every detail.",
    recordatoriosTitulo: "Reminders",
    recordatoriosTexto: "We give you a nudge before your appointment so it doesn't slip by.",
    cambiosTitulo: "Change or cancel",
    cambiosTexto: "From your profile, at no cost, as long as there is notice.",
    historialTitulo: "History and reviews",
    historialTexto: "Every booking in one place, and your say once it's done.",
  },

  /* ── Day and night: the mode switch ──────────────────────── */
  tema: {
    titulo: "Bright by day.",
    tituloMint: "Elegant by night.",
    lead:
      "A clean design, built for booking one-handed and finding what you want without thinking about it. And in dark mode, so booking last thing at night is a pleasure too.",
    grupoEtiqueta: "See the app in light or dark mode",
    claro: "Light mode",
    oscuro: "Dark mode",
    check1: "Light mode and dark mode",
    check2: "Photos of the place and of every service",
    check3: "Price, duration and ratings right there",
    altClaro: "The Bookmy app in light mode: the home screen with nearby businesses, and a business page with its specialists and services",
    altOscuro: "The Bookmy app in dark mode: the home screen and your bookings list, with reschedule and cancel",
  },

  /* ── The bridge to businesses ────────────────────────────── */
  negocio: {
    titulo: "Run a business?",
    tituloMint: "Let your clients book you right here.",
    leadConPrueba:
      "With Bookmy for business your place shows up in the app, takes bookings around the clock and runs from your phone. Try it free for {dias} days: no phone calls, nothing written down by hand.",
    leadSinPrueba:
      "With Bookmy for business your place shows up in the app, takes bookings around the clock and runs from your phone. No phone calls, nothing written down by hand.",
    ctaEmpresas: "Bookmy for business",
    ctaRegistrar: "Register my business",
    beamApp: "App",
    beamNegocio: "Your business",

    feedReservaTitulo: "New booking from the app",
    feedReservaSub: "Lucía M. · Manicure · Fri 4:30pm",
    feedReservaTag: "Confirmed",
    feedPagoTitulo: "Online payment received",
    feedPagoSub: "{precio} · with paraffin",
    feedPagoTag: "Paid",
    feedAvisoTitulo: "Reminder scheduled",
    feedAvisoSub: "Thursday at 4:30pm",
    feedAvisoTag: "Automatic",
    feedClienteTitulo: "Client record updated",
    feedClienteSub: "15 visits · prefers afternoons",
    feedClienteTag: "History",
  },

  /* ── Frequently asked questions (#faq) ───────────────────── */
  faq: {
    titulo: "Your questions, answered.",
    otraPregunta: "Got another question?",
    asistente: "Ask the assistant",

    gratisQ: "Is the app free?",
    gratisA:
      "Yes. Downloading Bookmy and booking with it costs nothing. You only pay for the service you book, online or in person.",
    reservarQ: "How do I book a service?",
    reservarA:
      "Download the app, create your account and pick the service you need. A few taps later your booking is confirmed.",
    profesionalQ: "Can I choose who looks after me?",
    profesionalA:
      "Yes. You can pick whichever available specialist suits your schedule or your preference best.",
    confirmadaQ: "How do I know my booking went through?",
    confirmadaA:
      "You get an instant confirmation in the app, plus a notification with every detail of your appointment.",
    pagarQ: "How can I pay?",
    pagarA:
      "By card online or in person, depending on what each business offers. You see the price before you confirm.",
    cambiarQ: "What if I need to change or cancel my booking?",
    cambiarA:
      "You can change or cancel an appointment from your profile at no extra cost, as long as you do it in good time.",
    socialQ: "Can I sign in with Google or Apple?",
    socialA: "Yes. You can sign up with your email or log in with Google, Apple or Facebook.",

    apkQ: "Can I install it without Google Play?",
    apkA1: "Yes. On Android you can",
    apkEnlace: "download the APK file",
    apkA2:
      "from this site and install it. Your phone will ask you to allow apps from this source.",
  },

  /* ── The download block that crowns the footer (#descargar) ─ */
  cta: {
    titulo: "Your next appointment,",
    tituloEm: "two taps away.",
    lead:
      "Download Bookmy free and book at your favourite places whenever you like, wherever you are.",
  },
};

export default appEn;
