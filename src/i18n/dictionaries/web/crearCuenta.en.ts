/* ============================================================
   Public site · create account — EN
   ------------------------------------------------------------
   Mirror of crearCuenta.es.ts. The form itself is the real signup
   wizard, whose copy lives under `signup` in the main dictionary.
============================================================ */
import type { CrearCuentaWeb } from "./crearCuenta.es";

const crearCuentaEn: CrearCuentaWeb = {
  meta: {
    tituloConPrueba: "Create account · Try Bookmy free for {dias} days",
    tituloSinPrueba: "Create account · Start free with Bookmy",
    descripcionConPrueba:
      "Pick Plan Basic or Plan Pro, leave us your details and start your {dias}-day trial. No card, no lock-in.",
    descripcionSinPrueba:
      "Create your Bookmy account in under two minutes and start taking bookings today. No card, no lock-in.",
  },

  volver: "See the plans",

  tituloConPrueba: { antes: "Start your free trial of", acento: "{dias} days." },
  tituloSinPrueba: { antes: "Your business, taking bookings", acento: "from today." },

  leadConPrueba:
    "Pick your plan, leave us your details and we'll set your account up. No card, no lock-in.",
  leadSinPrueba:
    "Three steps and you're in your dashboard, with the calendar ready to take bookings. No card, no lock-in.",

  motivos: {
    todo: {
      titulo: "Ready from day one",
      texto: "Bookings, reminders and your public page running in minutes.",
    },
    sinTarjeta: {
      titulo: "No card needed",
      texto: "We don't ask for payment details, so nothing can be charged automatically.",
    },
    acompanamos: {
      titulo: "We walk you through it",
      texto: "Someone from the team helps you set your account up.",
    },
  },

  cta: {
    tituloAntes: "Rather talk it through",
    tituloAcento: "with a person?",
    lead: "We'll help you pick a plan and set your account up. Message us and we'll get straight back to you.",
    whatsapp: "Message us on WhatsApp",
    asistente: "Talk to the assistant",
  },
};

export default crearCuentaEn;
