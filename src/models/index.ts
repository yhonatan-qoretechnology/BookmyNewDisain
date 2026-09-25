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
  /** Logo de la empresa (columna logo_url); encabeza las facturas */
  logo?: string | null;
  /** Plan contratado y fecha de fin de prueba (GET /empresas) */
  plan?: "FREE" | "PRO";
  trialEndsAt?: string | null;
  /** true mientras la prueba de 30 días siga viva */
  enPrueba?: boolean;
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
  /** Rutas de sede.imagenes; se muestran al elegir sede en una reserva */
  imagenes: string[];
  telefono: string;
  provincia: string;
  latitud: number | null;
  longitud: number | null;
  /** Horario semanal { lunes: "10:00-19:00", domingo: "Cerrado", … } */
  horario: Record<string, string> | null;
  /** Fechas puntuales de cierre (YYYY-MM-DD) */
  diasCerrado: string[];
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
  /** Foto de perfil del usuario conectado (fotoPerfil / AdminProfile.photoUrl) */
  foto: string | null;
  /** Parámetro de idioma tal como viene de la BD (tabla usuarios) */
  idioma: string;
  /** Id del profesional vinculado (rol employee) — viene del JWT, no del
      body de POST /auth/login. Sede/especialidad de un employee se
      resuelven a partir de este id (GET /profesionales/:id/detalle). */
  profesionalId: string | null;
  /** Plan del negocio: decide qué módulos ve. El superadmin no tiene. */
  plan?: EstadoPlan | null;
}

/** Plan de un negocio y estado de su prueba (GET /empresas/:id/plan). */
export interface EstadoPlan {
  /** Lo contratado. */
  plan: "FREE" | "PRO";
  /** Lo que puede usar hoy: la prueba cuenta como PRO. */
  planEfectivo: "FREE" | "PRO";
  trialEndsAt: string | null;
  enPrueba: boolean;
  diasDePrueba: number;
  /** La prueba existió y se acabó: es el momento de vender. */
  pruebaCaducada: boolean;
  /** Todavía puede pedir los 30 días. */
  puedeProbar: boolean;
}

export interface Reserva {
  id: string;
  /** id numérico real en la BD (modo API) */
  apiId?: number;
  servicio: string;
  /** id del servicio (Appointment.serviceId) — para saber quién puede atenderla */
  servicioId?: number;
  cliente: string;
  /** id del usuario cliente (Appointment.userId), para cruzar con /clients */
  clienteId?: number;
  telefono: string;
  email: string;
  clienteFoto?: string | null;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
  /** Hora de fin "HH:mm" en Madrid */
  horaFin?: string;
  /** Instantes reales (ISO UTC) de inicio y fin — para saber si está en curso */
  inicioISO?: string;
  finISO?: string;
  /** Si es una cita de extensión, el id numérico de la cita original */
  extensionDeId?: number;
  /** Minutos añadidos a esta cita con extensiones (no canceladas) */
  minutosExtendidos?: number;
  precio: number;
  estado: EstadoReserva;
  sedeId: string;
  empleadoId: string;
  /** Duración del servicio en minutos (para calcular franjas al reagendar) */
  duracion: number;
  /** Nombres resueltos por el API (includes de Prisma) */
  sedeName?: string;
  sedeImagenes?: string[];
  empleadoName?: string;
  notas: string;
  /** Nota sobre el cliente que espera a ser atendido. Distinta de `notas`,
      que es del cliente y la machaca el reagendado. */
  observacionEspera?: string | null;
  /** Método de pago elegido al agendar */
  metodoPago?: MetodoPago;
}


export interface Cliente {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  /** Ruta de la foto de perfil (columna `fotoPerfil` del usuario) */
  foto: string | null;
  /** Estado de la cuenta; solo `enabled` puede iniciar sesión */
  estado: "enabled" | "disabled" | "blocked";
  visitas: number;
  ultima: string;
}

export interface Servicio {
  id: number;
  nombre: string;
  /** Nombre de la categoría ya traducido (CategoryTranslation) */
  categoria: string;
  /** Id real de la categoría — hace falta para precargar el <select> al editar. */
  categoryId: number | null;
  descripcion: string;
  duracion: number;
  precio: number;
  activo: boolean;
  /** Rutas relativas ("uploads/bookmy/services/..."), resolver con fotoUrl(). */
  imagenes: string[];
}

/** Servicios de una categoría, para la vista de catálogo en acordeón */
export interface CategoriaCatalogo {
  categoria: string;
  servicios: Servicio[];
}

export interface Factura {
  id: string;
  cliente: string;
  /** Foto de perfil del cliente facturado */
  foto: string | null;
  fecha: string;
  total: number;
  estado: EstadoFactura;
}

/** Estado de moderación de una reseña (enum ResenaState del backend) */
export type EstadoResena = "pendiente" | "aprobada" | "rechazada";

export interface Resena {
  id: number;
  cliente: string;
  /** Correo del autor — destino al responder la reseña */
  email: string;
  /** Foto de perfil del autor de la reseña */
  foto: string | null;
  estrellas: number;
  texto: string;
  fecha: string;
  estado: EstadoResena;
  /** Atajo de `estado === "aprobada"` para los badges */
  aprobada: boolean;
}

export interface Empleado {
  id: number;
  nombre: string;
  rol: string;
  /** Ruta de la foto del profesional (columna `imagen` del backend) */
  foto: string | null;
  /** Nombre de la sede ya resuelto (o "—" si no se pudo resolver) */
  sede: string;
  sedeId: string;
  telefono: string;
  reservas: number;
  activo: boolean;
  /** true si el profesional ya tiene login al panel (rol EMPLOYEE) */
  tieneAcceso: boolean;
  /** Correo de acceso real, cuando `tieneAcceso` es true */
  accesoEmail: string | null;
}

/** Credenciales recién generadas para que un empleado entre al panel */
export interface CredencialesEmpleado {
  email: string;
  password: string;
}

/**
 * Usuario con acceso administrativo creado desde /administradores:
 * dueño de empresa (COMPANY_ADMIN → rol "owner") o administrador de
 * una sede concreta (BRANCH_ADMIN → rol "admin").
 */
export interface Administrador {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: "owner" | "admin";
  negocioId: string | null;
  negocioName: string;
  /** null si es dueño de toda la empresa (sin sede asignada) */
  sedeId: string | null;
  sedeName: string;
  activo: boolean;
  foto: string | null;
}

/* ── Flujo de creación de reservas ───────────────────────── */
/** Sede seleccionable en el primer paso del flujo (con datos de
    contacto, horario y geolocalización para el mapa) */
export interface SedeOpcion {
  id: string;
  nombre: string;
  direccion: string;
  provincia: string;
  telefono: string;
  imagen: string | null;
  imagenes: string[];
  /** Horario semanal { lunes: "10:00-19:00", domingo: "Cerrado", … } */
  horario: Record<string, string> | null;
  latitud: number | null;
  longitud: number | null;
}

/** Cliente final seleccionable en el flujo de reservas */
export interface ClienteOpcion {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  foto: string | null;
  /** Documento u otro identificador si el backend lo expone */
  documento?: string;
}

/** Tarjeta de profesional para el carrusel */
export interface ProfesionalCard {
  id: string;
  nombre: string;
  especialidad: string;
  biografia: string;
  telefono: string;
  foto?: string | null;
  disponible: boolean;
}

/** Servicio seleccionable (precio/duración reales de la BD) */
export interface ServicioOpcion {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  duracion: number; // minutos
  precio: number;
  moneda: string;
}

/** Servicios de un profesional agrupados por categoría */
export interface CategoriaServicios {
  categoria: string;
  servicios: ServicioOpcion[];
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
  /** Sede completa (dirección, teléfono, imagen…) para el comprobante */
  sede: SedeOpcion | null;
  cliente: ClienteOpcion | null;
  profesional: ProfesionalCard | null;
  servicio: ServicioOpcion | null;
  fecha: string | null; // YYYY-MM-DD
  slot: SlotHora | null;
  metodoPago: MetodoPago | null;
  card?: { number: string; expiry: string; cvv: string };
}

/* ── Stock e insumos ─────────────────────────────────────── */
/** Producto del catálogo global de insumos (lo define el superadmin) */
export interface Insumo {
  id: string;
  nombre: string;
  categoria: string;
  /** Unidad de medida: ud, bote, pack, caja… */
  unidad: string;
  precioRef: number;
}

/** Existencias de un insumo en una sede concreta */
export interface StockItem {
  sedeId: string;
  insumoId: string;
  insumo: Insumo;
  stock: number;
  /** Capacidad objetivo, para calcular el nivel de la barra */
  max: number;
}

/** Nivel de existencias derivado de stock/max */
export type NivelStock = "critico" | "medio" | "ok";

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";

/** Línea de una solicitud de inventario */
export interface SolicitudItem {
  insumoId: string;
  cantidad: number;
}

/** Pedido de reposición que una sede envía a la administración */
export interface SolicitudInventario {
  id: string;
  sedeId: string;
  sedeNombre: string;
  /** Usuario que la envió */
  solicitanteId: string;
  solicitanteNombre: string;
  fecha: string; // YYYY-MM-DD
  estado: EstadoSolicitud;
  notas: string;
  items: SolicitudItem[];
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
  fotoPerfil?: string | null;
}

export interface Mensaje {
  dir: "in" | "out";
  ini?: string;
  texto: string;
  hora: string;
  messageType?: "TEXT" | "IMAGE" | "FILE" | "AUDIO";
  fileUrl?: string | null;
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
  /** Submenú desplegable (p. ej. Facturación → Facturas · Gastos) */
  children?: NavItem[];
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

/* ── Notificaciones (GET /notifications) ────────────────────
   Hoy solo llegan de tipo "reserva_nueva" (BRANCH_ADMIN de la sede
   donde se creó una reserva), pero el modelo queda genérico. */
export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  creadaEn: string;
  datos: Record<string, unknown> | null;
}
