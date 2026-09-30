import type { NavItem } from "@/models";

/* ── Constantes de rutas ─────────────────────────────────── */
export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  employeeDashboard: "/employee-dashboard",
  employeeCalendario: "/employee-dashboard/calendario",
  empresas: "/empresas",
  administradores: "/administradores",
  reservas: "/reservas",
  reservaNueva: "/reservas/nueva",
  clientes: "/clientes",
  facturacion: "/facturacion",
  facturas: "/facturacion",
  gastos: "/facturacion/gastos",
  estadisticas: "/estadisticas",
  servicios: "/servicios",
  calendario: "/calendario",
  personal: "/personal",
  resenas: "/resenas",
  sedes: "/sedes",
  stock: "/stock",
  comunicacion: "/comunicacion",
  configuracion: "/configuracion",
} as const;

/** Vista de edición de una sede (Datos + Imágenes) — reemplaza el
    modal anterior; se navega en vez de abrirse encima de la pantalla. */
export const sedeEditarPath = (id: number | string) => `/sedes/${id}/editar`;

/* ── Navegación por rol y plan ───────────────────────────── */
/**
 * Menú de un negocio con el plan gratuito: reservas, clientes, servicios,
 * personal, calendario, reseñas y sedes. Reseñas y Sedes faltaban y solo
 * se llegaba a ellas escribiendo la dirección a mano.
 */
const ADMIN_ITEMS_FREE: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: ROUTES.dashboard, icon: "layout" },
  { id: "reservas", label: "Reservas", href: ROUTES.reservas, icon: "calendar" },
  { id: "clientes", label: "Clientes", href: ROUTES.clientes, icon: "users" },
  { id: "servicios", label: "Servicios", href: ROUTES.servicios, icon: "scissors" },
  { id: "personal", label: "Personal", href: ROUTES.personal, icon: "user" },
  { id: "calendario", label: "Calendario", href: ROUTES.calendario, icon: "calendar" },
  { id: "resenas", label: "Reseñas", href: ROUTES.resenas, icon: "star" },
  { id: "sedes", label: "Sedes", href: ROUTES.sedes, icon: "mapPin" },
  { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

/** Lo que añade Bookmy CRM Pro (contratado o durante la prueba). */
const ADMIN_ITEMS_PRO: NavItem[] = [
  ...ADMIN_ITEMS_FREE.slice(0, 7),
  {
    id: "facturacion",
    label: "Facturación",
    href: ROUTES.facturacion,
    icon: "dollar",
    children: [
      { id: "facturas", label: "Facturas", href: ROUTES.facturas, icon: "invoice" },
      { id: "gastos", label: "Gastos", href: ROUTES.gastos, icon: "receipt" },
    ],
  },
  { id: "estadisticas", label: "Estadísticas", href: ROUTES.estadisticas, icon: "barChart" },
  { id: "sedes", label: "Sedes", href: ROUTES.sedes, icon: "mapPin" },
  { id: "stock", label: "Stock e insumos", href: ROUTES.stock, icon: "box" },
  { id: "comunicacion", label: "Comunicación", href: ROUTES.comunicacion, icon: "message" },
  { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

/**
 * Módulos que solo entran en Bookmy CRM Pro. Quien no lo tenga no los ve
 * en el menú y, si escribe la ruta, el panel le enseña qué se está
 * perdiendo en vez de un error.
 *
 * Basta con la ruta padre: también cubre lo que cuelga de ella
 * (`/facturacion/gastos`).
 */
export const RUTAS_DE_PAGO: readonly string[] = [
  ROUTES.stock,
  ROUTES.comunicacion,
  ROUTES.facturacion,
  ROUTES.estadisticas,
];

/** Nombre del módulo de pago al que pertenece una ruta, si es de pago. */
export function moduloDePago(pathname: string): string | null {
  const ruta = RUTAS_DE_PAGO.find(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (!ruta) return null;
  return (
    {
      [ROUTES.stock]: "stock",
      [ROUTES.comunicacion]: "comunicacion",
      [ROUTES.facturacion]: "facturacion",
      [ROUTES.estadisticas]: "estadisticas",
    }[ruta] ?? null
  );
}

const EMPLOYEE_ITEMS: NavItem[] = [
  { id: "emp-main", label: "Mis Reservas", href: ROUTES.employeeDashboard, icon: "calendar" },
  { id: "calendario", label: "Calendario", href: ROUTES.employeeCalendario, icon: "calendar" },
  /* La pantalla de Configuración es enteramente personal (perfil propio,
     cambiar su contraseña, tema, idioma) — no depende de permisos de
     admin, así que el profesional también debe poder entrar ahí. */
  { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

/** @deprecated Usa `navParaSesion`: el menú depende del plan, no solo del rol. */
export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  superadmin: [
    { id: "dashboard", label: "Dashboard", href: ROUTES.dashboard, icon: "layout" },
    { id: "empresas", label: "Empresas", href: ROUTES.empresas, icon: "building" },
    { id: "administradores", label: "Administradores", href: ROUTES.administradores, icon: "shield" },
    { id: "reservas", label: "Reservas", href: ROUTES.reservas, icon: "calendar" },
    { id: "clientes", label: "Clientes", href: ROUTES.clientes, icon: "users" },
    {
      id: "facturacion",
      label: "Facturación",
      href: ROUTES.facturacion,
      icon: "dollar",
      /* Submenú: Facturación se despliega en Facturas y Gastos */
      children: [
        { id: "facturas", label: "Facturas", href: ROUTES.facturas, icon: "invoice" },
        { id: "gastos", label: "Gastos", href: ROUTES.gastos, icon: "receipt" },
      ],
    },
    { id: "estadisticas", label: "Estadísticas", href: ROUTES.estadisticas, icon: "barChart" },
    { id: "servicios", label: "Servicios", href: ROUTES.servicios, icon: "scissors" },
    { id: "calendario", label: "Calendario", href: ROUTES.calendario, icon: "calendar" },
    { id: "personal", label: "Personal", href: ROUTES.personal, icon: "user" },
    { id: "resenas", label: "Reseñas", href: ROUTES.resenas, icon: "star" },
    { id: "sedes", label: "Sedes", href: ROUTES.sedes, icon: "mapPin" },
    { id: "stock", label: "Stock e insumos", href: ROUTES.stock, icon: "box" },
    { id: "comunicacion", label: "Comunicación", href: ROUTES.comunicacion, icon: "message" },
    { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
    { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
  ],
  owner: ADMIN_ITEMS_FREE,
  admin: ADMIN_ITEMS_FREE,
  employee: EMPLOYEE_ITEMS,
};

/**
 * Menú de la sesión: el superadmin lo ve todo; un negocio ve el plan
 * gratuito y, si tiene Pro (contratado o de prueba), los cuatro módulos
 * de pago.
 */
export function navParaSesion(role: string, pro: boolean): NavItem[] {
  if (role === "superadmin" || role === "employee") return NAV_BY_ROLE[role] ?? [];
  return pro ? ADMIN_ITEMS_PRO : ADMIN_ITEMS_FREE;
}

/* ── Constantes de almacenamiento ─────────────────────────── */
export const THEME_STORAGE_KEY = "bookmy-theme";
export const SESSION_STORAGE_KEY = "bookmy-session";

/* ── Constantes de formato ────────────────────────────────── */
export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* ── Agenda por defecto del asistente de reservas ────────── */
/**
 * @deprecated Horario inventado: no corresponde a ninguna sede real y
 * hacía que el asistente ofreciera franjas que el backend rechazaba
 * con 400 (fuera de horario o en domingo).
 *
 * El horario real se resuelve en `@/lib/disponibilidad` → resolverHorario,
 * que replica la precedencia del backend: tabla `horario_sede` y, si no
 * hay filas, el JSON `sede.horario`.
 *
 * Solo sigue aquí porque lo usa BookingWizardController, que está sin uso.
 */
export const HORARIO_DEFECTO = { apertura: "08:00", cierre: "20:00" } as const;
/** Días hacia adelante que el calendario permite agendar */
export const DIAS_AGENDABLES = 60;

/* ── Estados de reservas ─────────────────────────────────── */
export const ESTADOS_RESERVA = ["todos", "pendiente", "confirmada", "atendida", "cancelado", "noShow"] as const;

/* ── Imágenes servidas por el backend ────────────────────── */
/** Base de las imágenes (fotos de perfil, logos, fotos de sede) */
export const IMG_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_IMG || "https://bookmy.es/";

/**
 * URL absoluta de una imagen del backend. Las rutas que ya vienen
 * absolutas (http/https o data:) se devuelven tal cual.
 * @param ruta Ruta relativa guardada en la BD (p. ej. "uploads/ab.jpg").
 */
export function fotoUrl(ruta: string | null | undefined): string | null {
  if (!ruta) return null;
  return /^(https?:|data:)/.test(ruta) ? ruta : `${IMG_BASE_URL}${ruta}`;
}

/* ── Helpers de formato compartidos ──────────────────────── */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function fmtFechaCorta(fecha: string): string {
  // 2026-10-02 → 02.10.2026
  return fecha.split("-").reverse().join(".");
}

export function fmtFechaLarga(fecha: string): string {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d} ${MESES_CORTOS[+m - 1]} ${y}`;
}

/** Importe con símbolo de moneda según el código ISO (EUR → 25,00 €) */
export function fmtMoneda(valor: number, moneda: string): string {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda }).format(valor);
  } catch {
    return `${valor.toFixed(2)} ${moneda}`;
  }
}

/* ── Horario semanal de sedes ────────────────────────────── */
const DIAS_SEMANA: ReadonlyArray<{ key: string; label: string }> = [
  { key: "lunes", label: "Lun" },
  { key: "martes", label: "Mar" },
  { key: "miércoles", label: "Mié" },
  { key: "jueves", label: "Jue" },
  { key: "viernes", label: "Vie" },
  { key: "sábado", label: "Sáb" },
  { key: "domingo", label: "Dom" },
];

/**
 * Resume el horario semanal agrupando días consecutivos iguales.
 * { lunes:"10:00-19:00", …, domingo:"Cerrado" } →
 * ["Lun–Sáb: 10:00-19:00", "Dom: Cerrado"]
 */
export function resumenHorario(horario: Record<string, string> | null | undefined): string[] {
  if (!horario) return [];
  const dias = DIAS_SEMANA
    .map((d) => ({ ...d, valor: (horario[d.key] || "").trim() }))
    .filter((d) => d.valor);
  const grupos: Array<{ desde: string; hasta: string; valor: string }> = [];
  for (const d of dias) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.valor === d.valor) ultimo.hasta = d.label;
    else grupos.push({ desde: d.label, hasta: d.label, valor: d.valor });
  }
  return grupos.map((g) =>
    `${g.desde === g.hasta ? g.desde : `${g.desde}–${g.hasta}`}: ${g.valor}`
  );
}
