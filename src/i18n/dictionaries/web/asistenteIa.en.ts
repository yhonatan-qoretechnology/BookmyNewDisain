/* ============================================================
   Public site · /asistente-ia — EN
   ------------------------------------------------------------
   Mirror of asistenteIa.es.ts. The type below is what keeps the
   two honest: a key that only exists in Spanish stops the build
   instead of showing up raw on the English site.

   Written as English marketing copy, not as a word-for-word
   translation: «ticket» stays «ticket» because that is what a
   salon owner calls the average spend, and times are written the
   way a British client reads them (4:30pm, not 16:30).

   {dias}, {precio}, {total} and {importe} come from the page, so
   neither the number of trial days nor any amount is spelled out
   here either.
============================================================ */
import type { AsistenteIaWeb } from "./asistenteIa.es";

const asistenteIaEn: AsistenteIaWeb = {
  /* ── 1 · Hero with the particle core ────────────────────── */
  hero: {
    titulo1: "Your assistant doesn't just answer.",
    titulo2: "It sells.",
    lead:
      "It looks after your clients 24/7, fills the gaps in your calendar, recommends exactly the right add-on and wins back whoever stopped coming. With your prices, your real calendar and your rules.",
    ctaConPrueba: "Try the Pro plan free for {dias} days",
    ctaSinPrueba: "Create my free account",
    ctaAsistente: "Talk to our assistant",
  },

  /* ── 2 · How it works: the annotated conversation ───────── */
  demo: {
    titulo1: "One conversation. One booking closed.",
    titulo2: "A bigger ticket.",
    lead:
      "See how the assistant turns a simple question into a sale, using what Bookmy already knows about your business and about every client.",

    nota1Titulo: "It knows every client",
    nota1Texto: "Who they are, what they had done and when — straight from the CRM.",
    nota2Titulo: "It offers real openings",
    nota2Texto: "It checks your calendar, your staff and your availability rules.",
    nota3Titulo: "It sells with purpose",
    nota3Texto: "It offers the add-on that fits their history, not one picked at random.",
    nota4Titulo: "It closes and keeps them",
    nota4Texto: "It confirms the booking and schedules the reminder so nobody forgets.",

    chatEtiqueta: "Example conversation between a client and the AI assistant",
    chatNegocio: "Estudio Aura assistant",
    chatEstado: "Online",
    chatRepetir: "Play the conversation again",

    msg1: "Hi! Do you have anything free for a manicure this Friday afternoon?",
    msg2: "Hi Lucía! Lovely to see you back. Gel again, like last time?",
    msg2Nota: "Client recognised · 14 visits",
    msg3: "Yes please.",
    msg4: "On Friday I have 4:30pm with Andrea or 6:00pm with Paula. Which suits you better?",
    msg5: "4:30pm.",
    msg6:
      "Done! You loved the paraffin treatment last time. Shall I add it for {precio}? Your hands will thank you.",
    msg6Nota: "Suggested from her history",
    msg7: "Go on then, yes!",
    msg8:
      "All set: {total} in total, Friday at 4:30pm with Andrea. I'll send you a reminder on Thursday. See you Friday!",
    msg8Nota: "Reminder scheduled",
  },

  /* ── 3 · Eight jobs off your plate ──────────────────────── */
  trabajos: {
    titulo: "Eight jobs you never have to do again.",
    lead:
      "The assistant is wired into your calendar, your services, your team and your CRM. That is why it never gives generic answers: it gives yours.",
    t1Titulo: "On duty 24/7",
    t1Texto: "Answers questions about prices, services, opening hours and where you are on the spot, after hours too.",
    t2Titulo: "Books, moves and cancels",
    t2Texto: "With your real availability and your rules: duration, staff member and location.",
    t3Titulo: "Smart cross-selling",
    t3Texto: "Suggests the add-on or the next service that fits each client's history.",
    t4Titulo: "Fills the gaps",
    t4Texto: "When an appointment frees up, it goes first to whoever usually books that time.",
    t5Titulo: "Wins clients back",
    t5Texto: "Spots who hasn't been in for weeks and invites them back with a personal message.",
    t6Titulo: "Asks for reviews at the right moment",
    t6Texto: "Right after a good experience, it invites the client to leave a review.",
    t7Titulo: "Your business analyst",
    t7Texto: "Ask it “how much did I take this month at the Centre branch?” and it answers with your own numbers.",
    t8Titulo: "Your team's copilot",
    t8Texto: "Settles questions about the dashboard on the spot: “how do I create a service?”.",
  },

  /* ── 4 · The pipeline and three conversations ───────────── */
  flujo: {
    titulo1: "It walks every client from the first question",
    titulo2: "to the next visit.",

    p1Titulo: "Attract",
    p1Texto: "Replies the moment someone lands on your profile or your website. No waiting.",
    p2Titulo: "Convert",
    p2Texto: "Closes the booking in that same conversation, with real openings.",
    p3Titulo: "Raise the ticket",
    p3Texto: "Offers add-ons that make sense for what each client already buys.",
    p4Titulo: "Keep them",
    p4Texto: "Reminders, a follow-up after the appointment and a nudge for a review.",
    p5Titulo: "Win them back",
    p5Texto: "Reactivates whoever stops coming, before they end up somewhere else.",

    c1Titulo: "Winning clients back",
    c1Asistente:
      "Hi Marta. It's been 8 weeks since your brow shaping. This week I have Tuesday at 11:00am and Thursday at 6:00pm free. Shall I hold one for you?",
    c1Cliente: "Thursday!",
    c2Titulo: "Filling the gaps",
    c2Asistente:
      "A slot has just opened up tomorrow at 6:00pm with Paula! You usually come at that time, so you get first refusal. Want it?",
    c2Cliente: "Yes, I'll take it.",
    c3Titulo: "For the owner",
    c3Cliente: "How much have we taken this month at the Centre branch?",
    c3Asistente:
      "{importe} so far, 9% up on October. Your star service is the gel manicure, with 126 appointments.",
  },

  /* ── 5 · What sets it apart from a chatbot ──────────────── */
  diferencia: {
    titulo1: "A chatbot replies.",
    titulo2: "The Bookmy assistant sells.",
    resumen: "Differences between a generic chatbot and the Bookmy AI assistant",
    colTrabajo: "What it does",
    colChatbot: "Generic chatbot",
    colBookmy: "Bookmy AI assistant",
    si: "Yes",
    no: "No",
    f1: "Answers frequently asked questions",
    f2: "Available 24/7",
    f3: "Books against your real calendar",
    f4: "Knows every client's history",
    f5: "Suggests add-ons and services",
    f6: "Fills gaps and wins clients back",
    f7: "Answers questions about your business data",
    f8: "Hands the conversation over to your team",
  },

  /* ── 6 · Control and trust ──────────────────────────────── */
  control: {
    titulo: "Powerful, and always on your terms.",
    lead:
      "An AI that sells has to be trustworthy. So it works to your rules, says plainly what it is, and never leaves a client without a human to turn to.",
    g1Titulo: "You set the rules",
    g1Texto: "Which services to push, which tone to use and how far it can go with an offer.",
    g2Titulo: "Upfront",
    g2Texto: "It always introduces itself as an AI virtual assistant. No tricks.",
    g3Titulo: "Your data, protected",
    g3Texto: "Encryption, access control and GDPR. Your data is yours, and it is never sold.",
    g4Titulo: "There is always a human",
    g4Texto: "When a conversation calls for one, it hands over to your team with the whole context.",
  },

  /* ── 7 · Getting it running ─────────────────────────────── */
  pasos: {
    titulo: "Up and running in three steps.",
    s1Titulo: "Your catalogue is already there",
    s1Texto:
      "Services, prices, staff and opening hours come straight from your Bookmy dashboard. Nothing to type twice.",
    s2Titulo: "Set the tone and the rules",
    s2Texto: "Warm or formal, what to offer, when to hand over to a person. Change it whenever you like.",
    s3Titulo: "Switch it on and measure",
    s3Texto: "It starts answering on your booking profile, and your stats show you exactly what it sells.",
  },

  /* ── 8 · The closing call that crowns the footer ────────── */
  cta: {
    titulo1: "Put your new",
    titulo2: "best salesperson to work.",
    leadConPrueba:
      "Try the Pro plan free for {dias} days, no card and no lock-in. Questions? Ask our assistant right now.",
    leadSinPrueba:
      "Create your free account, no card and no lock-in, and see the assistant from the inside. Questions? Ask it right now.",
    botonConPrueba: "Try the Pro plan free for {dias} days",
    botonSinPrueba: "Create my free account",
    botonAsistente: "Talk to the assistant",
  },
};

export default asistenteIaEn;
