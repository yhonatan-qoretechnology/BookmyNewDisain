/* ============================================================
   API · Mapeadores backend ⇄ modelos del panel
   ------------------------------------------------------------
   ⚙️ MAPEO DE ROLES (enum Role de schema.prisma → rol del panel)
     SUPER_ADMIN  → superadmin  (control total de la plataforma)
     COMPANY_ADMIN→ owner       (dueño de negocio / empresa)
     BRANCH_ADMIN → admin       (usuario sede)
     EMPLOYEE     → employee    (usuario empleado)
     CLIENT       → sin acceso al panel (usa la app de clientes)
============================================================ */
import type { MetodoPago, Reserva, Rol, Session } from "@/models";
import type { ApiAppointment, ApiAppointmentStatus, ApiRole, ApiUser } from "./types";

export const ROLE_MAP: Record<ApiRole, Rol | null> = {
  SUPER_ADMIN: "superadmin",
  COMPANY_ADMIN: "owner",
  BRANCH_ADMIN: "admin",
  EMPLOYEE: "employee",
  CLIENT: null,
};

/** Estados de cita del backend → estados/badges del panel */
export const APPT_ESTADO_MAP: Record<ApiAppointmentStatus, Reserva["estado"]> = {
  PENDING: "pendiente",
  CONFIRMED: "confirmada",
  COMPLETED: "atendida",
  CANCELLED: "cancelado",
  NO_SHOW: "noShow",
};

export function mapUserToSession(u: ApiUser, opts: { negocioName?: string; sedeName?: string }): Session | null {
  const role = ROLE_MAP[u.role];
  if (!role) return null; // CLIENT no entra al panel
  return {
    id: String(u.id),
    name: u.UserData?.name || u.AdminProfile
      ? `${u.AdminProfile?.firstName ?? u.UserData?.name ?? ""} ${u.AdminProfile?.lastName ?? ""}`.trim() || u.email
      : u.UserData?.name || u.email,
    role,
    email: u.email,
    negocioId: u.AdminProfile?.empresaId != null ? String(u.AdminProfile.empresaId) : "",
    negocioName: opts.negocioName || "",
    sedeId: u.AdminProfile?.sedeId != null ? String(u.AdminProfile.sedeId) : null,
    sedeName: opts.sedeName || null,
    especialidad: null,
    /* ⚙️ PARÁMETRO DE BD: user_data.idioma viaja del login a la
       sesión; el I18nProvider lo aplica automáticamente. */
    idioma: u.UserData?.idioma?.slice(0, 2).toLowerCase() || "es",
  };
}

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

/**
 * Convierte un Appointment del backend al modelo del panel.
 * `GET /appointments` incluye sede/profesional/user pero el servicio
 * llega sin traducciones (`service: true`), por eso se acepta un mapa
 * `serviceNames` construido con `GET /services?language=`.
 * @param a Cita cruda del API.
 * @param serviceNames Mapa id→nombre traducido del servicio.
 */
export function mapAppointment(a: ApiAppointment, serviceNames?: Map<number, string>): Reserva {
  const metodo: MetodoPago | undefined =
    a.Payment?.method === "CARD" ? "tarjeta" : a.Payment?.method === "CASH" ? "efectivo" : undefined;
  return {
    id: `R-${a.id}`,
    apiId: a.id,
    servicio:
      serviceNames?.get(a.serviceId) ||
      a.service?.translations?.[0]?.name ||
      (a.service as { name?: string })?.name ||
      `#${a.serviceId}`,
    cliente: a.user?.UserData?.name || a.user?.email || `#${a.userId}`,
    telefono: a.user?.UserData?.phone || "—",
    email: a.user?.email || "—",
    fecha: (a.fecha || a.horaInicio || "").slice(0, 10),
    hora: a.horaInicio ? hhmm(a.horaInicio) : "—",
    precio: a.Payment?.totalAmount ?? 0,
    estado: APPT_ESTADO_MAP[a.estado] ?? "pendiente",
    sedeId: String(a.sedeId),
    empleadoId: String(a.profesionalId),
    sedeName: a.sede?.nombre,
    empleadoName: a.profesional?.nombre,
    notas: a.notas || "",
    metodoPago: metodo,
  };
}
