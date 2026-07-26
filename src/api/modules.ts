/* ============================================================
   API · Módulos — espejo de los servicios del backend
   Cada bloque replica un módulo NestJS (auth, empresa, sede,
   profesional, service, appointment, resena, payment).
============================================================ */
import { http, qs } from "./http";
import { EP } from "./endpoints";
import type {
  ApiAppointment, ApiCategory, ApiChatContact, ApiChatMessage, ApiEmpresa,
  ApiProfesionalDetalle,
  ApiPayment, ApiProfesional, ApiResena, ApiSede, ApiService, ApiUser,
  CreateAppointmentDto, CreateServiceDto, LoginResponse, Paginated,
  SendMessageDto,
} from "./types";

/* ── AuthModule ─────────────────────────────────────────── */
export const AuthApi = {
  /** POST /auth/login → { user, token } | { error } (además el
      backend deja el cookie httpOnly `access_token`) */
  login: (email: string, password: string) =>
    http.post<LoginResponse>(EP.login, { email, password }),

  /** GET /auth/users (requiere JWT). Devuelve la lista de usuarios;
      los clientes finales tienen role === "CLIENT". */
  findAllUsers: () => http.get<ApiUser[]>(EP.users),

  updateUser: (id: number, data: Record<string, unknown>) =>
    http.patch(EP.userById(id), data),

  /** PATCH /auth/users/:id/password { currentPassword, newPassword } */
  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    http.patch(EP.userPassword(id), { currentPassword, newPassword }),
};

/* ── EmpresaModule ──────────────────────────────────────── */
export const EmpresasApi = {
  findAll: () => http.get<ApiEmpresa[]>(EP.empresas),
  findOne: (id: number) => http.get<ApiEmpresa>(EP.empresaById(id)),
  create: (data: { nombre: string; descripcion?: string; telefono?: string; email?: string }) =>
    http.post<ApiEmpresa>(EP.empresas, data),
  update: (id: number, data: Partial<ApiEmpresa>) => http.patch<ApiEmpresa>(EP.empresaById(id), data),
  remove: (id: number) => http.delete(EP.empresaById(id)),
};

/* ── SedeModule ─────────────────────────────────────────── */
export const SedesApi = {
  findAll: () => http.get<ApiSede[]>(EP.sedes),
  /** GET /sedes/empresa/:empresaId — sedes de una empresa (tenant) */
  findByEmpresa: (empresaId: number) => http.get<ApiSede[]>(EP.sedesByEmpresa(empresaId)),
  findOne: (id: number) => http.get<ApiSede>(EP.sedeById(id)),
  create: (data: { nombre: string; direccion: string; telefono?: string; empresaId: number }) =>
    http.post<ApiSede>(EP.sedes, data),
  update: (id: number, data: Partial<ApiSede>) => http.patch<ApiSede>(EP.sedeById(id), data),
  remove: (id: number) => http.delete(EP.sedeById(id)),
};

/* ── ProfesionalModule ──────────────────────────────────── */
export const ProfesionalesApi = {
  findAll: () => http.get<ApiProfesional[]>(EP.profesionales),
  /** GET /profesionales/by-sede/:sedeId — para el flujo de agendado */
  findBySede: (sedeId: number) => http.get<ApiProfesional[]>(EP.profesionalesBySede(sedeId)),
  /** GET /profesionales/:id/detalle?lang= — profesional + sede + servicios
      (fuente única del paso de selección de servicio en reservas) */
  detalle: (id: number, lang: string) =>
    http.get<ApiProfesionalDetalle>(EP.profesionalDetalle(id) + qs({ lang })),
  create: (data: { nombre: string; phone: string; sedeId: number; biografia?: string }) =>
    http.post<ApiProfesional>(EP.profesionales, data),
  remove: (id: number) => http.delete(EP.profesionalById(id)),
};

/* ── ServiceModule ──────────────────────────────────────── */
export const ServicesApi = {
  /** GET /services?language=es — el backend resuelve la traducción
      y devuelve { id, name, description, prices, sedes } */
  findAll: (language: string) => http.get<ApiService[]>(EP.services + qs({ language })),
  /** GET /services/by-sede/:sedeId?language= — servicios ofrecidos
      en una sede (tabla service_sede_profesional) */
  findBySede: (sedeId: number, language: string) =>
    http.get<ApiService[]>(EP.servicesBySede(sedeId) + qs({ language })),
};

/* ── AppointmentModule (citas) ──────────────────────────── */
export const AppointmentsApi = {
  /**
   * GET /appointments?sedeId&page&limit — el backend devuelve
   * `{ items, pagination }` (appointment.service.ts:findAll).
   * @param params Filtros de sede y paginación.
   * @returns Página de citas con sede, servicio, profesional y usuario.
   */
  findAll: (params?: { sedeId?: number; page?: number; limit?: number }) =>
    http.get<Paginated<ApiAppointment>>(EP.appointments + qs(params)),
  /** GET /appointments/branches/:sedeId/latest?limit */
  latestBySede: (sedeId: number, limit = 5) =>
    http.get<ApiAppointment[]>(EP.appointmentsLatest(sedeId) + qs({ limit })),
  /** GET /appointments/calendar?sedeId&fechaInicio&fechaFin */
  calendar: (sedeId: number, fechaInicio?: string, fechaFin?: string) =>
    http.get<ApiAppointment[]>(EP.appointmentsCalendar + qs({ sedeId, fechaInicio, fechaFin })),
  /** POST /appointments — CreateAppointmentDto exacto del backend */
  create: (dto: CreateAppointmentDto) => http.post<ApiAppointment>(EP.appointments, dto),
  cancel: (id: number) => http.patch<ApiAppointment>(EP.appointmentCancel(id)),
  /** PATCH /appointments/:id/reschedule — nueva franja horaria */
  reschedule: (id: number, dto: { fecha: string; horaInicio: string; horaFin: string }) =>
    http.patch<ApiAppointment>(EP.appointmentReschedule(id), dto),
  /** GET /appointments/:id — obtiene una cita con todos los detalles */
  findOne: (id: number) => http.get<ApiAppointment>(EP.appointmentById(id)),
  remove: (id: number) => http.delete(EP.appointmentById(id)),
};

/* ── ResenaModule ───────────────────────────────────────── */
export const ResenasApi = {
  findAll: () => http.get<ApiResena[]>(EP.resenas),
  bySede: (sedeId: number) => http.get<ApiResena[]>(EP.resenasBySede(sedeId)),
  aprobar: (id: number) => http.patch<ApiResena>(EP.resenaAprobar(id)),
};

/* ── ServiceModule (escritura) ──────────────────────────── */
export const ServicesWriteApi = {
  /**
   * POST /services — crea el servicio con traducciones y precios
   * tal como exige CreateServiceDto (whitelist del ValidationPipe).
   * @param dto categoryId + translations[] + prices[].
   */
  create: (dto: CreateServiceDto) => http.post<ApiService>(EP.services, dto),
  /** DELETE /services/:id — elimina servicio, traducciones y precios. */
  remove: (id: number) => http.delete(EP.serviceById(id)),
};

/* ── CategoryModule ─────────────────────────────────────── */
export const CategoriesApi = {
  /**
   * GET /categories?language= — categorías con su traducción resuelta.
   * @param language Código ISO 639-1 ("es" | "en").
   */
  findAll: (language: string) => http.get<ApiCategory[]>(EP.categories + qs({ language })),
};

/* ── ChatMessageModule (REST) ───────────────────────────── */
export const ChatApi = {
  /**
   * GET /ChatMessage/contacts/:userId — contactos del usuario.
   * @param userId Id del usuario dueño de la lista.
   */
  contacts: (userId: number) => http.get<ApiChatContact[]>(EP.chatContacts(userId)),
  /**
   * GET /ChatMessage/messages/:a/:b — conversación entre dos usuarios.
   */
  conversation: (userA: number, userB: number) =>
    http.get<ApiChatMessage[]>(EP.chatMessages(userA, userB)),
  /**
   * POST /ChatMessage/messages — envía un mensaje (SendMessageDto).
   */
  send: (dto: SendMessageDto) => http.post<ApiChatMessage>(EP.chatSend, dto),
  /** POST /ChatMessage/messages/read — marca la conversación como leída. */
  markRead: (data: { userId: number; contactId: number }) => http.post(EP.chatRead, data),
};

/* ── PaymentModule ──────────────────────────────────────── */
export const PaymentsApi = {
  findAll: () => http.get<ApiPayment[]>(EP.payments),
  confirm: (id: number) => http.patch<ApiPayment>(EP.paymentConfirm(id)),
  cancel: (id: number, data?: { reason?: string }) => http.patch<ApiPayment>(EP.paymentCancel(id), data),
};
