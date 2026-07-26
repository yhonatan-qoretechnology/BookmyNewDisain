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

export interface ApiProfesional {
  id: number;
  nombre: string;
  biografia?: string | null;
  imagen?: string | null;
  phone?: string;
  state?: string;
  sedeId: number;
  user_id?: number | null;
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
  category?: unknown;
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
  user?: { id: number; email: string; UserData?: { name?: string } | null };
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
  usuario?: { id: number; email: string; UserData?: { name?: string } | null };
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
  message_type: "TEXT" | "IMAGE" | "FILE";
  message?: string | null;
  file_url?: string | null;
  is_read: boolean;
  created_at: string;
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

/** DTO de POST /ChatMessage/messages (send-message.dto.ts) */
export interface SendMessageDto {
  senderId: number;
  receiverId: number;
  senderEmail: string;
  receiverEmail: string;
  messageType: "TEXT" | "IMAGE" | "FILE";
  message?: string;
  fileUrl?: string;
}
