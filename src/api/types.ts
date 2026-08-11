/* ============================================================
   API · Tipos espejo de prisma/schema.prisma del backend
   (solo los campos que consume este panel)
============================================================ */

/* Enums de la BD (schema.prisma) */
export type ApiRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "BRANCH_ADMIN" | "EMPLOYEE" | "CLIENT";
export type ApiAppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type ApiPaymentMethod = "CARD" | "CASH";
export type ApiPaymentStatus = "PENDING" | "RESERVED" | "PAID" | "FAILED" | "CANCELLED";
export type ApiResenaState = "PENDIENTE" | "APROBADA" | "RECHAZADA";

export interface ApiUserData {
  id: number;
  name: string;
  phone: string;
  /** ⚙️ PARÁMETRO DE IDIOMA — columna user_data.idioma de la BD */
  idioma: string;
  gender?: string;
  birthdate?: string | null;
  country?: { id: number; name: string; isoCode: string };
}

export interface ApiAdminProfile {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  photoUrl?: string | null;
  empresaId: number | null;
  sedeId: number | null;
}

export interface ApiUser {
  id: number;
  email: string;
  role: ApiRole;
  state?: "enabled" | "disabled" | "blocked";
  fotoPerfil?: string | null;
  UserData?: ApiUserData | null;
  AdminProfile?: ApiAdminProfile | null;
}

/** POST /auth/login → { user, token } o { error } */
export interface LoginResponse {
  user?: ApiUser;
  token?: string;
  error?: string;
}

/**
 * Respuesta de POST /admin/companies/:empresaId/admins y
 * POST /admin/branches/:sedeId/admins (AdminManagementController).
 */
export interface ApiAdminCreateResponse {
  message?: string;
  user: ApiUser;
}

/**
 * DTO de POST /auth/register. Se usa para dar acceso al panel a un
 * empleado (`role: "EMPLOYEE"`), además del alta de clientes finales.
 * ⚠️ PUNTO DE AJUSTE: si el CreateUserDto del backend nombra los campos
 * de otra forma (p. ej. `nombre`/`telefono`), cámbialos aquí.
 */
export interface RegisterUserDto {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role?: ApiRole;
  idioma?: string;
}

export interface ApiEmpresa {
  id: number;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  nit?: string | null;
  logo?: string | null;
  descripcion?: string | null;
  descripcionLarga?: string | null;
  webUrl?: string | null;
}

export interface ApiSede {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string | null;
  provincia?: string | null;
  imagenes?: string[];
  empresaId: number;
  profesionales?: ApiProfesional[];
  /* Geolocalización y horario (mapa de sedes del flujo de reservas) */
  latitud?: number | null;
  longitud?: number | null;
  /** Horario semanal { lunes: "10:00-19:00", domingo: "Cerrado", … } */
  horario?: Record<string, string> | null;
  diasCerrado?: string[];
}

/** Bloque `acceso` que trae GET /profesionales y GET /profesionales/:id
    desde el cambio de login de profesionales (rol EMPLOYEE). */
export interface ApiProfesionalAcceso {
  tieneAcceso: boolean;
  email: string | null;
}

export interface ApiProfesional {
  id: number;
  nombre: string;
  biografia?: string | null;
  imagen?: string | null;
  phone?: string;
  state?: string;
  sedeId: number;
  user_id?: number | null;
  acceso?: ApiProfesionalAcceso | null;
}

/** Respuesta de POST /profesionales: además del profesional creado,
    trae el correo de acceso que generó el backend (patrón
    nombre@empresa.com) — la contraseña no vuelve, solo se envió. */
export interface ApiProfesionalCreateResponse extends Omit<ApiProfesional, "acceso"> {
  acceso: { email: string; mensaje: string };
}

export interface ApiPrice {
  id: number;
  amount: number;
  duration: number;
  currency: string;
}

/** Servicio dentro de GET /profesionales/:id/detalle (ya traducido) */
export interface ApiServicioProfesional {
  id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  precios: ApiPrice[];
}

/** GET /profesionales/:id/detalle?lang= → profesional + sede + servicios */
export interface ApiProfesionalDetalle {
  id: number;
  nombre: string;
  biografia?: string | null;
  imagen?: string | null;
  telefono?: string | null;
  state?: string;
  sedeId: number;
  sede?: ApiSede;
  servicios?: ApiServicioProfesional[];
}

/** GET /services devuelve el shape mapeado por service.service.ts */
export interface ApiService {
  id: number;
  name: string;
  description?: string;
  prices: ApiPrice[];
  sedes?: Array<{ id: number; nombre: string }>;
  /** La categoría llega ya resuelta (`name`) o con sus traducciones,
      según cómo el backend serialice la relación. Se leen ambas formas. */
  category?: {
    id?: number;
    name?: string;
    translations?: Array<{ name: string; language?: string }>;
  } | null;
  categoryId?: number;
}

export interface ApiAppointment {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracion: number;
  estado: ApiAppointmentStatus;
  notas?: string | null;
  sedeId: number;
  serviceId: number;
  profesionalId: number;
  userId: number;
  sede?: Partial<ApiSede>;
  service?: { id: number; translations?: Array<{ name: string }> } & Partial<ApiService>;
  profesional?: { id: number; nombre: string };
  user?: Partial<ApiUser>;
  Payment?: ApiPayment | null;
}

export interface ApiPayment {
  id: number;
  appointmentId: number;
  method: ApiPaymentMethod;
  status: ApiPaymentStatus;
  totalAmount: number;
  createdAt?: string;
  user?: { id: number; email: string; fotoPerfil?: string | null; UserData?: { name?: string } | null };
}

/** Referencia a un servicio dentro de un pago (con o sin traducciones) */
export interface ApiPaymentServiceRef {
  id?: number;
  name?: string;
  translations?: Array<{ name: string; language?: string }>;
}

/**
 * Fila de GET /payments/filter?userId=&sedeId= — más completa que
 * ApiPayment: incluye la tarjeta saneada, el servicio de la cita y el
 * rol del usuario. El backend no valida token/rol en este endpoint.
 */
export interface ApiPaymentFiltered {
  id: number;
  userId: number;
  totalAmount: number;
  paidAmount?: number;
  status?: ApiPaymentStatus;
  method?: ApiPaymentMethod;
  createdAt?: string;
  appointmentId?: number;
  appointment?: {
    id?: number;
    sedeId?: number;
    service?: ApiPaymentServiceRef | null;
  } | null;
  service?: ApiPaymentServiceRef | null;
  card?: { brand?: string; last4?: string } | null;
  user?: {
    id: number;
    email: string;
    role?: ApiRole;
    fotoPerfil?: string | null;
    UserData?: { name?: string; phone?: string } | null;
  } | null;
}

export interface ApiResena {
  id: number;
  calificacion: number;
  comentario?: string | null;
  aprobado: boolean;
  estado: ApiResenaState;
  sedeId?: number | null;
  usuarioId: number;
  createdAt: string;
  usuario?: { id: number; email: string; fotoPerfil?: string | null; UserData?: { name?: string } | null };
}

/** DTO exacto de POST /appointments (create-appointment.dto.ts) */
export interface CreateAppointmentDto {
  fecha: string;        // ISO
  horaInicio: string;   // ISO
  horaFin: string;      // ISO
  duracion: number;     // minutos
  estado?: ApiAppointmentStatus;
  notas?: string;
  sedeId: number;
  serviceId: number;
  profesionalId: number;
  userId: number;
  paymentMethod: ApiPaymentMethod;
  paymentAmount?: number;
  cardNumber?: string;  // requerido si CARD
  expiryDate?: string;  // MM/YY, requerido si CARD
  cvv?: string;         // requerido si CARD
}

/** GET /appointments — respuesta paginada del backend */
export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

/** GET /categories?language= (CategoryTranslation resuelta) */
export interface ApiCategory {
  id: number;
  image?: string | null;
  translations: Array<{ id: number; name: string; description?: string | null; language: string }>;
}

/** Fila de la tabla chat (GET /ChatMessage/messages/:a/:b) */
export interface ApiChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_email: string;
  receiver_email: string;
  message_type: "TEXT" | "IMAGE" | "FILE" | "AUDIO";
  message?: string | null;
  file_url?: string | null;
  is_read: boolean;
  created_at: string;
}

/** Respuesta de POST /ChatMessage/upload (multipart, campo "file") */
export interface ApiChatUploadResponse {
  fileUrl: string;
  messageType: "IMAGE" | "FILE";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/** Respuesta de POST /ChatMessage/upload-audio (multipart, campo "file") */
export interface ApiChatUploadAudioResponse {
  fileUrl: string;
  messageType: "AUDIO";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /ChatMessage/contacts/:userId */
export interface ApiChatContact {
  id: number;
  owner_user_id: number;
  contact_user_id: number;
  users_chat_contact_contact_user_idTousers: {
    id: number;
    email: string;
    role: ApiRole;
    fotoPerfil?: string | null;
  };
}

/** DTO de POST /services (create-service.dto.ts) */
export interface CreateServiceDto {
  categoryId: number;
  translations: Array<{ language: string; name: string; description?: string }>;
  prices: Array<{ amount: number; duration: number; currency?: string }>;
}

/* ── ServiceSedeProfesional ──────────────────────────────────
   Tabla que decide de verdad si algo se puede reservar: crear una
   cita valida que exista la terna (sede, servicio, profesional).
   El backend mantiene sincronizada la relación Sede<->Service, que
   es la que usa el control de permisos por empresa. */

/** Fila de GET /service-sede-profesional/by-sede/:s/by-profesional/:p */
export interface ApiServicioAsignable {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  precios: Array<{ id: number; amount: number; duration: number; currency: string }>;
  asignado: boolean;
  /** id de la fila de service_sede_profesional; null si no está asignado */
  asignacionId: number | null;
}

/** DTO de POST /service-sede-profesional */
export interface CreateServiceSedeProfesionalDto {
  sedeId: number;
  serviceId: number;
  profesionalId: number;
}

/* ── ClientManagement (@Controller('clients')) ───────────────
   Endpoint dedicado a los clientes finales. A diferencia de
   /auth/users, ya viene filtrado por role CLIENT, paginado y con
   guard de rol, y pesa ~6 veces menos. */

/** Enum ClientState de schema.prisma */
export type ApiClientState = "enabled" | "disabled" | "blocked";

/** Cliente tal como lo devuelve client-management.service.ts */
export interface ApiClient {
  id: number;
  email: string;
  state: ApiClientState;
  createdAt: string;
  /** Avatar; se resuelve con fotoUrl() */
  fotoPerfil?: string | null;
  userData: {
    name: string;
    phone: string;
    idioma: string;
    gender: string;
    birthdate: string | null;
    /** Está en `user_data`; `userLocation.address` es otra cosa */
    direccion?: string | null;
    countryId?: number;
  } | null;
  userLocation: {
    address: string | null;
    latitude: number;
    longitude: number;
  } | null;
  /** Solo lo trae GET /clients/:id — lo que la baja conservará. */
  historial?: ApiClientHistorial;
}

/** Registros que atan al cliente y que la baja no puede borrar. */
export interface ApiClientHistorial {
  citas: number;
  pagos: number;
  resenas: number;
  gastos: number;
}

/**
 * DELETE /clients/:id — el backend elige entre borrar de verdad
 * (`deleted`, cliente sin historial) o anonimizar conservando citas y
 * pagos (`anonymized`). El panel usa `mode` para explicar cuál pasó.
 */
export interface ApiClientDeleteResult {
  message: string;
  mode: "deleted" | "anonymized";
  historial: ApiClientHistorial;
}

/** Campos que admite PATCH /clients/:id (UpdateClientDto). */
export interface ClientUpdatePayload {
  name?: string;
  phone?: string;
  email?: string;
  idioma?: string;
  gender?: string;
  birthdate?: string | null;
  direccion?: string;
  countryId?: number;
  state?: ApiClientState;
}

/** GET /clients → { clients, pagination } */
export interface ApiClientsPage {
  clients: ApiClient[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
}

/** Filtros de GET /clients (ClientListDto). `name` y `email` son
    independientes: enviarlos juntos los combina con AND. */
export interface ClientListParams {
  email?: string;
  name?: string;
  id?: number;
  page?: number;
  limit?: number;
}

/* ── Disponibilidad (HorarioSede · DiaCerradoSede · DisponibilidadProfesional) ──
   Estas tres tablas son la fuente que valida appointment.service.ts al
   crear y al reagendar. Cuando no hay filas, el backend cae al JSON
   `sede.horario` / `sede.diasCerrado`; el panel replica esa precedencia. */

/** GET /horario-sede?sedeId=&activo= — fila de `horario_sede`. */
export interface ApiHorarioSede {
  id: number;
  sedeId: number;
  /** 0 = domingo … 6 = sábado (mismo índice que Date.getDay()) */
  diaSemana: number;
  /** "HH:mm" en hora local de la sede (Europe/Madrid) */
  horaApertura: string;
  horaCierre: string;
  activo: boolean;
  sede?: { id: number; nombre: string };
}

/** GET /dia-cerrado-sede?sedeId=&desde=&hasta= — fila de `dias_cerrados_sede`. */
export interface ApiDiaCerradoSede {
  id: number;
  sedeId: number;
  /** ISO completo; solo interesa la parte de fecha */
  fecha: string;
  motivo?: string | null;
  todoElDia: boolean;
  /** "HH:mm" cuando el cierre es parcial */
  horaInicio?: string | null;
  horaFin?: string | null;
  sede?: { id: number; nombre: string };
}

/** GET /disponibilidad-profesional?profesionalId=&desde=&hasta= */
export interface ApiDisponibilidadProfesional {
  id: number;
  profesionalId: number;
  fecha: string;
  disponible: boolean;
  /** Restringe la franja del profesional ese día concreto */
  horaInicio?: string | null;
  horaFin?: string | null;
  motivo?: string | null;
  profesional?: { id: number; nombre: string; sedeId: number };
}

/* ── GastoModule ────────────────────────────────────────── */

/** Fila de `categorias_gasto`. `isBase` marca las de plataforma:
    las comparten todas las empresas y no se pueden eliminar. */
export interface ApiCategoriaGasto {
  id: number;
  nombre: string;
  /** null en las categorías base (no pertenecen a ninguna empresa) */
  empresaId: number | null;
  isBase: boolean;
  createdAt: string;
}

/** Fila de `gastos` tal como la devuelve gasto.service.ts (gastoInclude). */
export interface ApiGasto {
  id: number;
  descripcion: string;
  total: number;
  /** ISO completo; el panel solo usa la parte de fecha */
  fecha: string;
  ticketUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  categoriaId: number;
  sedeId: number;
  userId: number;
  categoria?: ApiCategoriaGasto;
  sede?: { id: number; nombre: string };
  user?: { id: number; email: string };
}

/** DTO de POST /gastos (create-gasto.dto.ts) */
export interface CreateGastoDto {
  /** máx. 160 caracteres */
  descripcion: string;
  total: number;
  /** IsDateString — "YYYY-MM-DD" es válido */
  fecha: string;
  categoriaId: number;
  sedeId: number;
  ticketUrl?: string;
}

/** DTO de PATCH /gastos/:id — parcial y SIN sedeId (OmitType en el backend:
    un gasto no se puede mover de sede). */
export type UpdateGastoDto = Partial<Omit<CreateGastoDto, "sedeId">>;

/** Respuesta de POST /gastos/upload (gasto.service.ts → storeGastoFile) */
export interface ApiGastoUploadResponse {
  /** URL pública ya resuelta (SFTP o /uploads local) */
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/** DTO de POST /ChatMessage/messages (send-message.dto.ts) */
export interface SendMessageDto {
  senderId: number;
  receiverId: number;
  senderEmail: string;
  receiverEmail: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "AUDIO";
  message?: string;
  fileUrl?: string;
}
