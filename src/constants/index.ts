import type { NavItem } from "@/models";

/* ── Constantes de rutas ─────────────────────────────────── */
export const ROUTES = {
  login: "/",
  dashboard: "/dashboard",
  employeeDashboard: "/employee-dashboard",
  empresas: "/empresas",
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
  comunicacion: "/comunicacion",
  configuracion: "/configuracion",
} as const;

/* ── Navegación por rol ──────────────────────────────────── */
const COMMON_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: ROUTES.dashboard, icon: "layout" },
  { id: "reservas", label: "Reservas", href: ROUTES.reservas, icon: "calendar" },
  { id: "clientes", label: "Clientes", href: ROUTES.clientes, icon: "users" },
  { id: "servicios", label: "Servicios", href: ROUTES.servicios, icon: "scissors" },
  { id: "personal", label: "Personal", href: ROUTES.personal, icon: "user" },
  { id: "calendario", label: "Calendario", href: ROUTES.calendario, icon: "calendar" },
  { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

const ADMIN_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: ROUTES.dashboard, icon: "layout" },
  { id: "reservas", label: "Reservas", href: ROUTES.reservas, icon: "calendar" },
  { id: "clientes", label: "Clientes", href: ROUTES.clientes, icon: "users" },
  { id: "servicios", label: "Servicios", href: ROUTES.servicios, icon: "scissors" },
  { id: "personal", label: "Personal", href: ROUTES.personal, icon: "user" },
  { id: "calendario", label: "Calendario", href: ROUTES.calendario, icon: "calendar" },
  { id: "comunicacion", label: "Comunicación", href: ROUTES.comunicacion, icon: "message" },
  { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

const EMPLOYEE_ITEMS: NavItem[] = [
  { id: "emp-main", label: "Mis Reservas", href: ROUTES.employeeDashboard, icon: "calendar" },
  { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
];

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  superadmin: [
    { id: "dashboard", label: "Dashboard", href: ROUTES.dashboard, icon: "layout" },
    { id: "empresas", label: "Empresas", href: ROUTES.empresas, icon: "building" },
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
    { id: "comunicacion", label: "Comunicación", href: ROUTES.comunicacion, icon: "message" },
    { id: "configuracion", label: "Configuración", href: ROUTES.configuracion, icon: "settings" },
    { id: "logout", label: "Cerrar sesión", href: ROUTES.login, icon: "logOut" },
  ],
  owner: ADMIN_ITEMS,
  admin: ADMIN_ITEMS,
  employee: EMPLOYEE_ITEMS,
};

/* ── Constantes de almacenamiento ─────────────────────────── */
export const THEME_STORAGE_KEY = "bookmy-theme";
export const SESSION_STORAGE_KEY = "bookmy-session";

/* ── Constantes de formato ────────────────────────────────── */
export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* ── Agenda por defecto del asistente de reservas ────────── */
/** Horario laboral por defecto para generar franjas cuando el
    backend no expone GET /horario-sede por sede. Sustituible por
    un HorarioProvider real sin tocar el asistente (OCP). */
export const HORARIO_DEFECTO = { apertura: "08:00", cierre: "20:00" } as const;
/** Días hacia adelante que el calendario permite agendar */
export const DIAS_AGENDABLES = 60;

/* ── Estados de reservas ─────────────────────────────────── */
export const ESTADOS_RESERVA = ["todos", "pendiente", "confirmada", "atendida", "cancelado", "noShow"] as const;

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
