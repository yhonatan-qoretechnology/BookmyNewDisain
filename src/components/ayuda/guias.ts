/* ============================================================
   Guías de la página de Ayuda / Documentación
   ------------------------------------------------------------
   Contenido en datos (no en el diccionario): son textos largos
   que solo usa esta página. Cada guía dice para qué roles es y a
   qué pantalla lleva, para que cada uno vea solo lo suyo.
============================================================ */
import { ROUTES } from "@/constants";
import type { Rol } from "@/models";

export interface Guia {
  id: string;
  icono: string;
  roles: Rol[];
  ruta?: string;
  titulo: string;
  resumen: string;
  pasos: string[];
}

export interface Pregunta {
  roles: Rol[];
  p: string;
  r: string;
}

const NEGOCIO: Rol[] = ["superadmin", "owner", "admin"];
const TODOS: Rol[] = ["superadmin", "owner", "admin", "employee"];

const ES: { guias: Guia[]; preguntas: Pregunta[] } = {
  guias: [
    {
      id: "empezar", icono: "play", roles: NEGOCIO, ruta: ROUTES.dashboard,
      titulo: "Primeros pasos",
      resumen: "Lo mínimo para empezar a recibir reservas.",
      pasos: [
        "Completa los datos del negocio y sube el logo en Configuración.",
        "Crea al menos una sede en Sedes, con su horario y su dirección.",
        "Da de alta tus servicios con su precio y duración en Servicios.",
        "Añade a tu equipo en Personal y asígnale servicios en cada sede.",
        "Empieza a agendar desde Reservas; las reservas de la app de clientes también llegan ahí.",
      ],
    },
    {
      id: "reservas", icono: "calendar", roles: NEGOCIO, ruta: ROUTES.reservaNueva,
      titulo: "Crear y gestionar reservas",
      resumen: "Agendar, reagendar, cancelar y marcar como atendida.",
      pasos: [
        "En Reservas pulsa «Nueva reserva» y sigue los pasos: sede, cliente, profesional, servicio, fecha y hora.",
        "En el paso Servicio usa el menú de categorías para ir directo a la que buscas.",
        "Los días festivos y sin huecos salen bloqueados en el calendario.",
        "Desde el listado puedes reagendar, cancelar o marcar la cita como atendida.",
      ],
    },
    {
      id: "clientes", icono: "users", roles: NEGOCIO, ruta: ROUTES.clientes,
      titulo: "Clientes",
      resumen: "Tu cartera de clientes y cómo dar de alta uno a mano.",
      pasos: [
        "Los clientes que reservan aparecen solos en Clientes.",
        "Con «+ Nuevo cliente» creas uno a mano; recibe una contraseña para la app o puede usar «Olvidé mi contraseña».",
        "Abre la ficha de un cliente para ver su historial, editar sus datos o darlo de baja.",
      ],
    },
    {
      id: "servicios", icono: "scissors", roles: NEGOCIO, ruta: ROUTES.servicios,
      titulo: "Servicios y categorías",
      resumen: "Qué ofreces, cuánto cuesta y cuánto dura.",
      pasos: [
        "Agrupa los servicios por categoría: así se ordenan en la reserva.",
        "Cada servicio puede tener varias tarifas según la duración.",
        "Un servicio sin profesional asignado no aparece al reservar en esa sede.",
      ],
    },
    {
      id: "personal", icono: "user", roles: NEGOCIO, ruta: ROUTES.personal,
      titulo: "Personal y accesos",
      resumen: "Tu equipo, su acceso al panel y su estado.",
      pasos: [
        "Da de alta a cada integrante con su sede y teléfono.",
        "Con el icono de llave le das (o cambias) el acceso al panel de especialista.",
        "Si alguien deja de trabajar contigo, desactívalo: se conserva su historial. Solo el superadmin puede volver a activarlo.",
      ],
    },
    {
      id: "calendario", icono: "calendar-check", roles: TODOS, ruta: ROUTES.calendario,
      titulo: "Calendario",
      resumen: "Todas las citas del mes de un vistazo.",
      pasos: [
        "Cambia de mes con las flechas y pulsa una cita para ver su detalle.",
        "Los festivos de tu sede salen en rojo con su nombre.",
      ],
    },
    {
      id: "facturacion", icono: "invoice", roles: NEGOCIO, ruta: ROUTES.facturacion,
      titulo: "Facturación y gastos",
      resumen: "Facturas de cada cita, adicionales y gastos del negocio.",
      pasos: [
        "Cada cita cobrada genera su factura; ábrela para imprimirla o descargar el PDF.",
        "«Nueva factura» registra un cobro hecho fuera de una reserva: elige servicio, pon el precio cobrado y añade otros conceptos libres. Sale ya pagada.",
        "En Gastos apuntas lo que pagas (productos, alquiler…) para ver el beneficio real.",
      ],
    },
    {
      id: "sedes", icono: "mapPin", roles: NEGOCIO, ruta: ROUTES.sedes,
      titulo: "Sedes y horarios",
      resumen: "Dónde atiendes y cuándo abres.",
      pasos: [
        "Cada sede tiene su dirección, horario, fotos y equipo.",
        "Marca los días que cierras; los festivos oficiales se cargan solos.",
      ],
    },
    {
      id: "pagos", icono: "wallet", roles: ["superadmin", "owner"], ruta: ROUTES.configuracion,
      titulo: "Pagos online",
      resumen: "Dónde recibes el dinero de los cobros online.",
      pasos: [
        "En Configuración → «Configurar pagos online» elige Wise o cuenta bancaria.",
        "En Colombia se piden banco, documento del titular y dirección, como exige Wise.",
      ],
    },
    {
      id: "plan", icono: "star", roles: ["owner"], ruta: ROUTES.plan,
      titulo: "Plan Pro y prueba",
      resumen: "Qué incluye Bookmy CRM Pro y cómo probarlo.",
      pasos: [
        "En Plan ves qué módulos incluye Pro (facturación, estadísticas, stock, comunicación…).",
        "Puedes activar 30 días de prueba gratis una sola vez.",
      ],
    },
    {
      id: "verificacion", icono: "shield", roles: ["owner"], ruta: ROUTES.verificacion,
      titulo: "Verificación del negocio",
      resumen: "Sube tus documentos para verificar tu identidad.",
      pasos: [
        "Sube la documentación que se pide (imagen o PDF).",
        "Mientras se revisa puedes trabajar con normalidad; te avisamos al terminar.",
      ],
    },
    {
      id: "referidos", icono: "send", roles: ["owner"], ruta: ROUTES.referidos,
      titulo: "Invita y gana",
      resumen: "Comparte tu código y gana puntos.",
      pasos: [
        "Comparte tu enlace de invitación desde Referidos.",
        "Cuando el negocio invitado paga Pro por primera vez, recibes tus puntos.",
      ],
    },
    {
      id: "empleado", icono: "calendar", roles: ["employee"], ruta: ROUTES.employeeDashboard,
      titulo: "Mis reservas",
      resumen: "Tu agenda del día y tus próximas citas.",
      pasos: [
        "En Mis reservas ves tus citas de hoy y las siguientes.",
        "En Calendario ves todo el mes; pulsa una cita para su detalle.",
        "Si no puedes atender una cita, avisa a administración para que la reagende.",
      ],
    },
    {
      id: "empresas", icono: "building", roles: ["superadmin"], ruta: ROUTES.empresas,
      titulo: "Empresas (superadmin)",
      resumen: "Alta, edición, planes y desactivación de negocios.",
      pasos: [
        "«+ Nueva empresa» pide los mismos datos que Bookmy-Admin y el país, que ya no se cambia.",
        "«Gestionar empresa» te pone a operar como ese negocio; el menú ⋯ tiene Sedes, Editar, Verificación, Cambiar plan y Desactivar.",
        "Desactivar no borra nada: sus admins no entran y sus sedes no admiten reservas hasta que la reactives.",
      ],
    },
    {
      id: "control", icono: "chart", roles: ["superadmin"], ruta: ROUTES.planMonitoreo,
      titulo: "Monitoreo, telemetría y seguimiento",
      resumen: "Uso de cada negocio, visitas y accesos.",
      pasos: [
        "Monitoreo Pro: cobros de Pro y uso del panel de todas las empresas, con avisos por correo.",
        "Telemetría: visitas del panel y la web, aperturas de la app y su evolución.",
        "Seguimiento y Control: IP, país, ubicación y dispositivo de cada acceso.",
      ],
    },
    {
      id: "automatizaciones", icono: "bot", roles: ["superadmin"], ruta: ROUTES.automatizaciones,
      titulo: "Automatizaciones y campañas",
      resumen: "Correos que se envían solos y campañas puntuales.",
      pasos: [
        "Crea reglas del tipo «cuando pase X, envía Y».",
        "Las campañas mandan un correo a un grupo de negocios en la fecha que elijas.",
        "En Historial ves qué se envió y si falló algo.",
      ],
    },
  ],
  preguntas: [
    { roles: TODOS, p: "Olvidé mi contraseña", r: "En la pantalla de acceso pulsa «¿Olvidaste tu contraseña?». Te llega un código al correo para crear una nueva." },
    { roles: NEGOCIO, p: "Un cliente no aparece al crear una reserva", r: "Búscalo por correo o teléfono completos: si existe en otra empresa, se puede traer. Si no tiene cuenta, créalo con «+ Nuevo cliente»." },
    { roles: NEGOCIO, p: "No me deja elegir un día", r: "Ese día es festivo, ya pasó, está fuera de la ventana de reservas o el profesional no tiene huecos libres para ese servicio." },
    { roles: NEGOCIO, p: "Un servicio no sale al reservar", r: "Revisa en Sedes → Servicios que tenga al menos un profesional asignado en esa sede." },
    { roles: ["owner", "admin"], p: "Veo un módulo bloqueado", r: "Es un módulo de Bookmy CRM Pro. Desde Plan puedes activar la prueba de 30 días." },
  ],
};

const EN: { guias: Guia[]; preguntas: Pregunta[] } = {
  guias: [
    { id: "empezar", icono: "play", roles: NEGOCIO, ruta: ROUTES.dashboard, titulo: "Getting started", resumen: "The minimum to start taking bookings.",
      pasos: ["Fill in your business details and upload the logo in Settings.", "Create at least one branch in Branches, with its hours and address.", "Add your services with price and duration in Services.", "Add your team in Staff and assign them services at each branch.", "Start booking from Bookings; bookings from the client app arrive there too."] },
    { id: "reservas", icono: "calendar", roles: NEGOCIO, ruta: ROUTES.reservaNueva, titulo: "Creating and managing bookings", resumen: "Book, reschedule, cancel and mark as attended.",
      pasos: ["In Bookings press «New booking» and follow the steps: branch, client, professional, service, date and time.", "In the Service step use the category menu to jump to the one you need.", "Holidays and fully booked days are blocked in the calendar.", "From the list you can reschedule, cancel or mark the booking as attended."] },
    { id: "clientes", icono: "users", roles: NEGOCIO, ruta: ROUTES.clientes, titulo: "Clients", resumen: "Your client list and how to add one by hand.",
      pasos: ["Clients who book show up in Clients automatically.", "«+ New client» creates one by hand; they get a password for the app or can use «Forgot my password».", "Open a client to see their history, edit their details or close the account."] },
    { id: "servicios", icono: "scissors", roles: NEGOCIO, ruta: ROUTES.servicios, titulo: "Services and categories", resumen: "What you offer, its price and duration.",
      pasos: ["Group services by category: that is the order shown when booking.", "Each service can have several rates depending on duration.", "A service with no professional assigned won't show up when booking at that branch."] },
    { id: "personal", icono: "user", roles: NEGOCIO, ruta: ROUTES.personal, titulo: "Staff and access", resumen: "Your team, their panel access and status.",
      pasos: ["Add each member with their branch and phone.", "The key icon gives (or changes) their access to the specialist panel.", "If someone stops working with you, deactivate them: their history is kept. Only the superadmin can activate them again."] },
    { id: "calendario", icono: "calendar-check", roles: TODOS, ruta: ROUTES.calendario, titulo: "Calendar", resumen: "Every booking of the month at a glance.",
      pasos: ["Change month with the arrows and click a booking to see it.", "Your branch's holidays show in red with their name."] },
    { id: "facturacion", icono: "invoice", roles: NEGOCIO, ruta: ROUTES.facturacion, titulo: "Billing and expenses", resumen: "Invoices, extra items and business expenses.",
      pasos: ["Each paid booking creates its invoice; open it to print or download the PDF.", "«New invoice» records a payment made outside a booking: pick the service, enter the price charged and add other free items. It is saved as paid.", "In Expenses you log what you pay (products, rent…) to see real profit."] },
    { id: "sedes", icono: "mapPin", roles: NEGOCIO, ruta: ROUTES.sedes, titulo: "Branches and hours", resumen: "Where you work and when you open.",
      pasos: ["Each branch has its address, hours, photos and team.", "Mark the days you close; official holidays load automatically."] },
    { id: "pagos", icono: "wallet", roles: ["superadmin", "owner"], ruta: ROUTES.configuracion, titulo: "Online payments", resumen: "Where you receive online payments.",
      pasos: ["In Settings → «Set up online payments» choose Wise or a bank account.", "In Colombia Wise asks for the bank, the holder's ID and address."] },
    { id: "plan", icono: "star", roles: ["owner"], ruta: ROUTES.plan, titulo: "Pro plan and trial", resumen: "What Bookmy CRM Pro includes and how to try it.",
      pasos: ["In Plan you see the modules Pro includes (billing, statistics, stock, communication…).", "You can start a free 30-day trial once."] },
    { id: "verificacion", icono: "shield", roles: ["owner"], ruta: ROUTES.verificacion, titulo: "Business verification", resumen: "Upload your documents to verify your identity.",
      pasos: ["Upload the requested documents (image or PDF).", "You can keep working while it's reviewed; we'll let you know."] },
    { id: "referidos", icono: "send", roles: ["owner"], ruta: ROUTES.referidos, titulo: "Invite and earn", resumen: "Share your code and earn points.",
      pasos: ["Share your invite link from Referrals.", "When the invited business pays Pro for the first time, you get your points."] },
    { id: "empleado", icono: "calendar", roles: ["employee"], ruta: ROUTES.employeeDashboard, titulo: "My bookings", resumen: "Today's agenda and upcoming bookings.",
      pasos: ["My bookings shows today's bookings and the next ones.", "Calendar shows the whole month; click a booking for details.", "If you can't attend a booking, tell the admin so they reschedule it."] },
    { id: "empresas", icono: "building", roles: ["superadmin"], ruta: ROUTES.empresas, titulo: "Companies (superadmin)", resumen: "Create, edit, plans and deactivation.",
      pasos: ["«+ New company» asks for the same data as Bookmy-Admin plus the country, which can't change later.", "«Manage company» switches you to operate as that business; the ⋯ menu has Branches, Edit, Verification, Change plan and Deactivate.", "Deactivating deletes nothing: its admins can't sign in and its branches stop taking bookings until you reactivate it."] },
    { id: "control", icono: "chart", roles: ["superadmin"], ruta: ROUTES.planMonitoreo, titulo: "Monitoring, telemetry and tracking", resumen: "Each business's usage, visits and sign-ins.",
      pasos: ["Pro monitoring: Pro payments and panel usage of every company, with email notices.", "Telemetry: panel and web visits, app opens and their trend.", "Tracking: IP, country, location and device of each sign-in."] },
    { id: "automatizaciones", icono: "bot", roles: ["superadmin"], ruta: ROUTES.automatizaciones, titulo: "Automations and campaigns", resumen: "Emails sent automatically and one-off campaigns.",
      pasos: ["Create rules like «when X happens, send Y».", "Campaigns email a group of businesses on the date you choose.", "History shows what was sent and any failures."] },
  ],
  preguntas: [
    { roles: TODOS, p: "I forgot my password", r: "On the sign-in screen press «Forgot your password?». You'll get a code by email to set a new one." },
    { roles: NEGOCIO, p: "A client doesn't show up when booking", r: "Search by full email or phone: if they exist in another company they can be brought in. If they have no account, create one with «+ New client»." },
    { roles: NEGOCIO, p: "I can't pick a day", r: "That day is a holiday, already past, outside the booking window, or the professional has no free slots for that service." },
    { roles: NEGOCIO, p: "A service doesn't show up when booking", r: "Check in Branches → Services that it has at least one professional assigned at that branch." },
    { roles: ["owner", "admin"], p: "A module is locked", r: "It's a Bookmy CRM Pro module. From Plan you can start the 30-day trial." },
  ],
};

export function contenidoAyuda(locale: string) {
  return locale === "en" ? EN : ES;
}
