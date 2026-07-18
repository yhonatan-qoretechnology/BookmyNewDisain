/* ============================================================
   BookMy — Modelos e interfaces (capa Model · MVC)
   Todas las entidades del dominio están tipadas aquí.
============================================================ */

/* ── Roles y estados ─────────────────────────────────────── */
/** Roles de la plataforma:
    - superadmin: control total (operador de BookMy, ve todas las empresas)
    - owner:      dueño de negocio (empresa)
    - admin:      usuario de sede
    - employee:   usuario empleado */
export type Rol = "superadmin" | "owner" | "admin" | "employee";

/** Métodos de pago disponibles al agendar una cita */
/** Métodos de pago del panel — espejo del enum PaymentMethod
    del backend: efectivo→CASH · tarjeta→CARD */
export type MetodoPago = "efectivo" | "tarjeta";

/** Estados alineados con AppointmentStatus del backend:
    PENDING→pendiente · CONFIRMED→confirmada · COMPLETED→atendida
    CANCELLED→cancelado · NO_SHOW→noShow */
export type EstadoReserva = "pendiente" | "confirmada" | "atendida" | "cancelado" | "noShow";
export type EstadoFactura = "pagado" | "pendiente" | "cancelado";

/* ── Entidades ───────────────────────────────────────────── */
/** Cliente de la plataforma: negocio dueño de una o varias sedes */
export interface Negocio {
  id: string;
  nombre: string;
  /** Descripción/rubro (columna descripcion de empresas) */
  rubro: string;
  activo: boolean;
}

export interface Sede {
  /** Negocio (tenant) al que pertenece la sede */
  negocioId: string;
  id: string;
  nombre: string;
  ciudad: string;
  activa: boolean;
}

export interface SedeDetalle {
  /** Negocio (tenant) dueño de la sede */
  negocioId: string;
  id: number;
  nombre: string;
  direccion: string;
  equipo: number;
  activa: boolean;
}

/** Sesión activa guardada en sessionStorage */
export interface Session {
  id: string;
  name: string;
  role: Rol;
  email: string;
  negocioId: string;
  negocioName: string;
  sedeId: string | null;
  sedeName: string | null;
  especialidad: string | null;
  /** Parámetro de idioma tal como viene de la BD (tabla usuarios) */
  idioma: string;
}

export interface Reserva {
  id: string;
  /** id numérico real en la BD (modo API) */
  apiId?: number;
  servicio: string;
  cliente: string;
  telefono: string;
  email: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  precio: number;
  estado: EstadoReserva;
  sedeId: string;
  empleadoId: string;
  /** Nombres resueltos por el API (includes de Prisma) */
  sedeName?: string;
  empleadoName?: string;
  notas: string;
  /** Método de pago elegido al agendar */
  metodoPago?: MetodoPago;
}


export interface Cliente {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  visitas: number;
  ultima: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  categoria: string;
  duracion: number;
  precio: number;
  activo: boolean;
}

export interface Factura {
  id: string;
  cliente: string;
  fecha: string;
  total: number;
  estado: EstadoFactura;
}

export interface Resena {
  id: number;
  cliente: string;
  estrellas: number;
  texto: string;
  fecha: string;
  respondida: boolean;
}

export interface Empleado {
  id: number;
  nombre: string;
  rol: string;
  sede: string;
  reservas: number;
  activo: boolean;
}

/* ── Asistente de creación de reservas (wizard) ──────────── */
/** Cliente final seleccionable en el paso 1 del asistente */
export interface ClienteOpcion {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  /** Documento u otro identificador si el backend lo expone */
  documento?: string;
}

/** Tarjeta de profesional para el carrusel del paso 2 */
export interface ProfesionalCard {
  id: string;
  nombre: string;
  especialidad: string;
  foto?: string | null;
  disponible: boolean;
}

/** Servicio seleccionable en el paso 3 (precio/duración de la BD) */
export interface ServicioOpcion {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion: number; // minutos
  precio: number;
  moneda: string;
}

/** Franja horaria disponible en el paso 5 */
export interface SlotHora {
  hora: string;      // HH:mm
  inicioISO: string; // ISO completo del inicio
  finISO: string;    // ISO completo del fin
}

/**
 * Estado global del asistente. Se conserva completo durante todo
 * el flujo (empresa → sede → cliente → profesional → servicio →
 * fecha → hora → pago) para no volver a solicitar datos.
 */
export interface BookingDraft {
  empresaId: string | null;
  empresaNombre: string | null;
  sedeId: string | null;
  sedeNombre: string | null;
  cliente: ClienteOpcion | null;
  profesional: ProfesionalCard | null;
  servicio: ServicioOpcion | null;
  fecha: string | null; // YYYY-MM-DD
  slot: SlotHora | null;
  metodoPago: MetodoPago | null;
  card?: { number: string; expiry: string; cvv: string };
}

/* ── Comunicación entre sedes ────────────────────────────── */
export interface Canal {
  id: string;
  nombre: string;
  sub: string;
  online: boolean;
  unread: number;
  /** Email del contacto (requerido por SendMessageDto del backend) */
  email?: string;
}

export interface Mensaje {
  dir: "in" | "out";
  ini?: string;
  texto: string;
  hora: string;
}

/* ── Estadísticas ────────────────────────────────────────── */
export interface VentaMes {
  mes: string;
  valor: number;
}

export interface ServicioTop {
  nombre: string;
  valor: number;
  color: string;
}

/* ── Navegación ──────────────────────────────────────────── */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

/* ── Cuentas demo del login ──────────────────────────────── */
export interface DemoAccount {
  email: string;
  pass: string;
  name: string;
  sub: string;
  av: string;
  cls: "" | "admin" | "emp";
}
