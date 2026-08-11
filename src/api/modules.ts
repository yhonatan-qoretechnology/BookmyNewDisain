/* ============================================================
   API · Módulos — espejo de los servicios del backend
   Cada bloque replica un módulo NestJS (auth, empresa, sede,
   profesional, service, appointment, resena, payment).
============================================================ */
import { http, qs } from "./http";
import { EP } from "./endpoints";
import type {
  ApiAdminCreateResponse, ApiAppointment, ApiCategory, ApiCategoriaGasto, ApiChatContact, ApiChatMessage, ApiChatUploadResponse, ApiChatUploadAudioResponse,
  ApiClient, ApiClientDeleteResult, ApiClientsPage, ApiDiaCerradoSede,
  ApiDisponibilidadProfesional, ApiEmpresa,
  ApiGasto, ApiGastoUploadResponse, ApiHorarioSede, ApiProfesionalDetalle,
  ApiPayment, ApiPaymentFiltered, ApiProfesional, ApiProfesionalAcceso,
  ApiProfesionalCreateResponse, ApiResena, ApiSede, ApiService,
  ApiServicioAsignable, ApiUser,
  ClientListParams, ClientUpdatePayload, CreateAppointmentDto, CreateGastoDto, CreateServiceDto,
  CreateServiceSedeProfesionalDto, LoginResponse, Paginated,
  RegisterUserDto, SendMessageDto, UpdateGastoDto,
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

  /**
   * POST /auth/register — alta de usuario. Se usa para dar acceso al
   * panel a un empleado (role EMPLOYEE) desde la sección Personal.
   * ⚠️ El backend responde `{ user }` o el propio usuario según versión:
   * se contemplan ambas formas al leer el id.
   */
  register: (dto: RegisterUserDto) =>
    http.post<{ user?: ApiUser; id?: number } & Partial<ApiUser>>(EP.register, dto),

  updateUser: (id: number, data: Record<string, unknown>) =>
    http.patch(EP.userById(id), data),

  /** PATCH /auth/users/:id/password { currentPassword, newPassword } */
  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    http.patch(EP.userPassword(id), { currentPassword, newPassword }),
};

/* ── AdminManagementModule — altas de COMPANY_ADMIN / BRANCH_ADMIN ──
   Distinto de AuthApi.register: crea usuarios CON AdminProfile
   (empresaId/sedeId) para que puedan entrar al panel como dueños de
   empresa o administradores de sede. Ambos POST exigen multipart
   aunque no se suba foto (CreateAdminUserDto del backend). */
export const AdminApi = {
  /** GET /admin/admins — todos los administradores de la plataforma. */
  findAll: () => http.get<ApiUser[]>(EP.admins),
  /** GET /admin/admins/:userId */
  findOne: (userId: number) => http.get<ApiUser>(EP.adminById(userId)),
  /** POST /admin/companies/:empresaId/admins (multipart) — dueño de empresa. */
  createCompanyAdmin: (empresaId: number, form: FormData) =>
    http.postForm<ApiAdminCreateResponse>(EP.createCompanyAdmin(empresaId), form),
  /** POST /admin/branches/:sedeId/admins (multipart) — admin de sede. */
  createBranchAdmin: (sedeId: number, form: FormData) =>
    http.postForm<ApiAdminCreateResponse>(EP.createBranchAdmin(sedeId), form),
  /** DELETE /admin/admins/:userId */
  remove: (userId: number) => http.delete(EP.adminById(userId)),
};

/* ── Recuperación de contraseña por OTP ─────────────────────
   Flujo de tres pasos contra AuthModule. Son endpoints públicos:
   quien ha olvidado la contraseña no tiene token. */
export const PasswordRecoveryApi = {
  /**
   * Paso 1 — POST /auth/users/password/otp/request { email }.
   * Genera un código de 6 dígitos, lo guarda con 5 minutos de vigencia
   * y lo envía por correo.
   * @throws ApiError 404 si el correo no está registrado.
   */
  solicitar: (email: string) =>
    http.post<{ message: string }>(EP.passwordOtpRequest, { email }),

  /**
   * Paso 2 — POST /auth/users/password/otp/validate { email, code }.
   * Comprueba el código sin consumirlo, para poder avisar antes de
   * pedir la contraseña nueva.
   * @throws ApiError 400 si es inválido o ha caducado.
   */
  validar: (email: string, code: string) =>
    http.post<{ message: string }>(EP.passwordOtpValidate, { email, code }),

  /**
   * Paso 3 — PATCH /auth/users/password/otp/change.
   * Cambia la contraseña y marca el OTP como usado.
   * @param newPassword Mínimo 6 caracteres y distinta de la actual.
   */
  cambiar: (email: string, code: string, newPassword: string) =>
    http.patch<{ message: string }>(EP.passwordOtpChange, {
      email,
      code,
      newPassword,
    }),
};

/* ── ServiceSedeProfesionalModule ────────────────────────────
   Fuente de verdad de "quién presta qué y dónde". Ojo: no confundir
   con POST /sedes/:id/servicios, que solo toca la relación de
   pertenencia y NO hace que un servicio se pueda reservar. */
export const AsignacionesApi = {
  /**
   * Servicios de la sede con marca de si los presta ese profesional.
   * @returns cada servicio con `asignado` y su `asignacionId`.
   */
  porProfesional: (sedeId: number, profesionalId: number, language = "es") =>
    http.get<ApiServicioAsignable[]>(
      EP.serviciosAsignables(sedeId, profesionalId) + qs({ language })
    ),

  /** POST — asigna un servicio a un profesional en una sede. */
  asignar: (dto: CreateServiceSedeProfesionalDto) =>
    http.post<{ id: number }>(EP.serviceSedeProfesional, dto),

  /** DELETE — quita la asignación por su id (el `asignacionId`). */
  quitar: (asignacionId: number) =>
    http.delete(EP.serviceSedeProfesionalById(asignacionId)),
};

/* ── ClientManagementModule ─────────────────────────────── */
export const ClientsApi = {
  /**
   * GET /clients — clientes finales, paginados y ya filtrados por
   * role CLIENT en el servidor.
   * @param params `name` y `email` filtran por separado; combinados
   *   se aplican con AND, no con OR.
   */
  list: (params: ClientListParams = {}) =>
    http.get<ApiClientsPage>(EP.clients + qs({ ...params })),

  findOne: (id: number) => http.get<ApiClient>(EP.clientById(id)),

  /** POST /clients/search { email } — coincidencia exacta; 404 si no existe. */
  search: (email: string) => http.post<ApiClient>(EP.clientsSearch, { email }),

  /** PATCH /clients/:id — UpdateClientDto (nombre, teléfono, correo, país…). */
  update: (id: number, data: ClientUpdatePayload) =>
    http.patch<ApiClient>(EP.clientById(id), data),

  /**
   * PATCH /clients/:id/password — un administrador fija la contraseña
   * nueva; no se pide la anterior porque no la conoce.
   */
  changePassword: (id: number, password: string) =>
    http.patch<{ message: string }>(EP.clientPassword(id), { password }),

  /**
   * DELETE /clients/:id — baja de la cuenta. El backend responde con
   * `mode`: `deleted` si borró la ficha y `anonymized` si el cliente
   * tenía historial y solo se anonimizaron sus datos.
   */
  remove: (id: number) => http.delete<ApiClientDeleteResult>(EP.clientById(id)),
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
  /** POST /profesionales — `password` es obligatorio (login de
      profesionales, rol EMPLOYEE): el backend genera el correo de
      acceso solo (nombre@empresa.com) y lo devuelve en `acceso.email`. */
  create: (data: { nombre: string; phone: string; sedeId: number; biografia?: string; password: string }) =>
    http.post<ApiProfesionalCreateResponse>(EP.profesionales, data),
  /** PATCH /profesionales/:id — edición y vínculo con su usuario (user_id) */
  update: (id: number, data: Partial<ApiProfesional>) =>
    http.patch<ApiProfesional>(EP.profesionalById(id), data),
  remove: (id: number) => http.delete(EP.profesionalById(id)),
  /** PATCH /profesionales/:id/vincular-acceso — da acceso al panel a un
      profesional viejo que aún no tenía login (acceso.tieneAcceso === false). */
  vincularAcceso: (id: number, data: { email: string; password: string }) =>
    http.patch<ApiProfesionalAcceso>(EP.profesionalVincularAcceso(id), data),
  /** PATCH /profesionales/:id/acceso — cambia correo y/o contraseña de
      uno que ya tiene login (acceso.tieneAcceso === true). Ambos campos
      son opcionales: se manda solo lo que cambió. */
  cambiarAcceso: (id: number, data: { email?: string; password?: string }) =>
    http.patch<ApiProfesionalAcceso>(EP.profesionalAcceso(id), data),
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
  /**
   * PATCH /appointments/:id/reschedule — nueva franja horaria.
   * ⚠️ El formato NO es el de POST /appointments: aquí la fecha y las horas
   * viajan por separado (RescheduleAppointmentDto valida `horaInicio` y
   * `horaFin` con @Matches(/^HH:mm:ss$/), así que un ISO completo da 400).
   * La duración resultante debe coincidir con la de la cita original.
   * @param dto fecha "YYYY-MM-DD" · horaInicio/horaFin "HH:mm:ss".
   */
  reschedule: (
    id: number,
    dto: { fecha: string; horaInicio: string; horaFin?: string; motivo?: string },
  ) => http.patch<ApiAppointment>(EP.appointmentReschedule(id), dto),
  /** GET /appointments/:id — obtiene una cita con todos los detalles */
  findOne: (id: number) => http.get<ApiAppointment>(EP.appointmentById(id)),
  remove: (id: number) => http.delete(EP.appointmentById(id)),
};

/* ── ResenaModule ───────────────────────────────────────── */
export const ResenasApi = {
  findAll: () => http.get<ApiResena[]>(EP.resenas),
  bySede: (sedeId: number) => http.get<ApiResena[]>(EP.resenasBySede(sedeId)),
  /**
   * PATCH /resenas/:id/aprobar — publica o rechaza una reseña.
   * ⚠️ El cuerpo { aprobado } es OBLIGATORIO: sin él, el backend
   * respondía 500 al leer body.aprobado sobre undefined.
   * @param aprobado true publica la reseña, false la rechaza.
   */
  aprobar: (id: number, aprobado = true) =>
    http.patch<ApiResena>(EP.resenaAprobar(id), { aprobado }),
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
  /**
   * POST /ChatMessage/upload — sube un adjunto (imagen o PDF, máx. 10MB).
   * El servidor comprime las imágenes automáticamente.
   */
  upload: (file: File | Blob) => {
    const form = new FormData();
    form.append("file", file);
    return http.postForm<ApiChatUploadResponse>(EP.chatUpload, form);
  },
  /**
   * POST /ChatMessage/upload-audio — sube una nota de voz (máx. 10MB).
   * Endpoint distinto al de imágenes/PDF: solo acepta tipos de audio.
   */
  uploadAudio: (file: File | Blob) => {
    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : "nota-de-voz.webm");
    return http.postForm<ApiChatUploadAudioResponse>(EP.chatUploadAudio, form);
  },
};

/* ── PaymentModule ──────────────────────────────────────── */
export const PaymentsApi = {
  findAll: () => http.get<ApiPayment[]>(EP.payments),
  /**
   * GET /payments/filter?userId=&sedeId= — ambos opcionales e independientes.
   * ⚠️ El backend no valida token/rol en este endpoint: quien llama es
   * responsable de decidir qué userId/sedeId mandar según la sesión.
   */
  filter: (params: { userId?: number; sedeId?: number } = {}) =>
    http.get<ApiPaymentFiltered[]>(EP.paymentsFilter + qs({ userId: params.userId, sedeId: params.sedeId })),
  confirm: (id: number) => http.patch<ApiPayment>(EP.paymentConfirm(id)),
  cancel: (id: number, data?: { reason?: string }) => http.patch<ApiPayment>(EP.paymentCancel(id), data),
};

/* ── Subida de imágenes ─────────────────────────────────────
   Cada endpoint espera un nombre de campo DISTINTO (fotoPerfil,
   imagen, logo, image, imagenes) y casi todos son PATCH. Todos
   devuelven la entidad actualizada con la nueva ruta, que llega
   relativa ("uploads/…") y se resuelve con fotoUrl().

   Ojo: el backend no limita tamaño ni tipo en estos endpoints
   (a diferencia del chat y de los gastos), así que la validación
   del lado del cliente es la única que hay. */
/** Tope de FilesInterceptor('imagenes', 10) en sede.controller.ts */
export const MAX_ARCHIVOS_SEDE = 10;

const formData = (campo: string, file: File): FormData => {
  const form = new FormData();
  form.append(campo, file, file.name);
  return form;
};

export const ImagenesApi = {
  /** PATCH /auth/users/:id/foto — campo "fotoPerfil". */
  usuario: (userId: number, file: File) =>
    http.patchForm<ApiUser>(EP.userFoto(userId), formData("fotoPerfil", file)),

  /** PATCH /profesionales/:id/imagen — campo "imagen". */
  profesional: (id: number, file: File) =>
    http.patchForm<ApiProfesional>(EP.profesionalImagen(id), formData("imagen", file)),

  /** PATCH /empresas/:id/logo — campo "logo". */
  empresaLogo: (id: number, file: File) =>
    http.patchForm<ApiEmpresa>(EP.empresaLogo(id), formData("logo", file)),

  /** PATCH /categories/:id/image — campo "image". */
  categoria: (id: number, file: File) =>
    http.patchForm<ApiCategory>(EP.categoryImage(id), formData("image", file)),

  /** POST /sedes/:id/imagen — añade UNA imagen a sede.imagenes. */
  sede: (id: number, file: File) =>
    http.postForm<ApiSede>(EP.sedeImagen(id), formData("imagen", file)),

  /** POST /sedes/:id/imagenes — varias de una vez. Tope del backend: 10. */
  sedeVarias: (id: number, files: File[]) => {
    const form = new FormData();
    files.slice(0, MAX_ARCHIVOS_SEDE).forEach((f) => form.append("imagenes", f, f.name));
    return http.postForm<ApiSede>(EP.sedeImagenes(id), form);
  },

  /** POST /sedes/:id/galeria — tabla Galeria, distinta de sede.imagenes. */
  sedeGaleria: (id: number, files: File[]) => {
    const form = new FormData();
    files.slice(0, MAX_ARCHIVOS_SEDE).forEach((f) => form.append("imagenes", f, f.name));
    return http.postForm<unknown>(EP.sedeGaleria(id), form);
  },

  /** DELETE /sedes/:id/imagenes — el cuerpo lleva las rutas a quitar. */
  borrarSedeImagenes: (id: number, imagenes: string[]) =>
    http.delete<ApiSede>(EP.sedeImagenes(id), { imagenes }),

  /** PUT /sedes/:id/imagenes/:index — reemplaza la imagen de esa posición. */
  reemplazarSedeImagen: (id: number, index: number, file: File) =>
    http.putForm<ApiSede>(EP.sedeImagenPorIndice(id, index), formData("imagen", file)),
};

/* ── Disponibilidad ─────────────────────────────────────── */
export const DisponibilidadApi = {
  /**
   * GET /horario-sede?sedeId= — horario semanal de la sede.
   * Tiene prioridad sobre el JSON `sede.horario`; hoy la tabla está
   * vacía en producción, así que lo normal es recibir [].
   */
  horarioSede: (sedeId: number) =>
    http.get<ApiHorarioSede[]>(EP.horarioSede + qs({ sedeId })),

  /** GET /dia-cerrado-sede?sedeId=&desde=&hasta= — cierres puntuales. */
  diasCerrados: (sedeId: number, desde?: string, hasta?: string) =>
    http.get<ApiDiaCerradoSede[]>(EP.diaCerradoSede + qs({ sedeId, desde, hasta })),

  /** GET /disponibilidad-profesional?profesionalId=&desde=&hasta= */
  profesional: (profesionalId: number, desde?: string, hasta?: string) =>
    http.get<ApiDisponibilidadProfesional[]>(
      EP.disponibilidadProfesional + qs({ profesionalId, desde, hasta })
    ),
};

/* ── GastoModule ────────────────────────────────────────── */
export const GastosApi = {
  /**
   * GET /gastos/filter?sedeId=&empresaId= — gastos del alcance del usuario.
   * A diferencia de /payments/filter, aquí el backend SÍ valida el token y
   * acota por rol: BRANCH_ADMIN ve solo su sede, COMPANY_ADMIN las de su
   * empresa y SUPER_ADMIN todas. Los parámetros solo afinan dentro de eso.
   * @param params Filtros opcionales dentro del alcance permitido.
   */
  filter: (params: { sedeId?: number; empresaId?: number } = {}) =>
    http.get<ApiGasto[]>(EP.gastosFilter + qs(params)),

  /** POST /gastos — CreateGastoDto exacto (el userId sale del token). */
  create: (dto: CreateGastoDto) => http.post<ApiGasto>(EP.gastos, dto),

  /** PATCH /gastos/:id — parcial; la sede no se puede cambiar. */
  update: (id: number, dto: UpdateGastoDto) => http.patch<ApiGasto>(EP.gastoById(id), dto),

  remove: (id: number) => http.delete(EP.gastoById(id)),

  /**
   * POST /gastos/upload — sube el comprobante y devuelve su URL pública.
   * Se llama ANTES de crear el gasto: el `fileUrl` resultante viaja como
   * `ticketUrl` en el CreateGastoDto. Imágenes (se comprimen) o PDF, 10MB.
   */
  upload: (file: File | Blob) => {
    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : "ticket");
    return http.postForm<ApiGastoUploadResponse>(EP.gastosUpload, form);
  },
};

/* ── CategoriaGastoModule ───────────────────────────────── */
export const CategoriasGastoApi = {
  /** GET /categorias-gasto — base (isBase) + las propias de la empresa. */
  findAll: () => http.get<ApiCategoriaGasto[]>(EP.categoriasGasto),

  /** POST /categorias-gasto — crea una propia; la empresa sale del token.
      Responde 403 si el usuario no tiene empresa asociada. */
  create: (nombre: string) => http.post<ApiCategoriaGasto>(EP.categoriasGasto, { nombre }),

  /** DELETE /categorias-gasto/:id — solo propias y sin gastos asociados. */
  remove: (id: number) => http.delete(EP.categoriaGastoById(id)),
};
