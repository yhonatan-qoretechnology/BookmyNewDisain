/* ============================================================
   API · Rutas espejo de los controladores NestJS
   auth.controller.ts, empresa.controller.ts, sede.controller.ts,
   profesional.controller.ts, service.controller.ts,
   appointment.controller.ts, resena.controller.ts,
   payment.controller.ts, admin-management.controller.ts…
============================================================ */
export const EP = {
  /* @Controller('auth') */
  login: "/auth/login",
  register: "/auth/register",
  users: "/auth/users",
  userById: (id: number) => `/auth/users/${id}`,
  userPassword: (id: number) => `/auth/users/${id}/password`,

  /* @Controller('admin') — gestión de administradores */
  admins: "/admin/admins",
  adminById: (userId: number) => `/admin/admins/${userId}`,
  createCompanyAdmin: (empresaId: number) => `/admin/companies/${empresaId}/admins`,
  createBranchAdmin: (sedeId: number) => `/admin/branches/${sedeId}/admins`,

  /* @Controller('empresas') */
  empresas: "/empresas",
  empresaById: (id: number) => `/empresas/${id}`,

  /* @Controller('sedes') */
  sedes: "/sedes",
  sedeById: (id: number) => `/sedes/${id}`,
  sedesByEmpresa: (empresaId: number) => `/sedes/empresa/${empresaId}`,
  sedeServicios: (id: number) => `/sedes/${id}/servicios`,

  /* @Controller('profesionales') */
  profesionales: "/profesionales",
  profesionalById: (id: number) => `/profesionales/${id}`,
  profesionalesBySede: (sedeId: number) => `/profesionales/by-sede/${sedeId}`,
  /** GET /profesionales/:id/detalle?lang= — profesional + sede + servicios */
  profesionalDetalle: (id: number) => `/profesionales/${id}/detalle`,

  /* @Controller('services') */
  services: "/services",
  serviceById: (id: number) => `/services/${id}`,
  servicesBySede: (sedeId: number) => `/services/by-sede/${sedeId}`,

  /* @Controller('categories') */
  categories: "/categories",

  /* @Controller('ChatMessage') — chat REST (además del gateway WS) */
  chatUsers: "/ChatMessage/users",
  chatContacts: (userId: number) => `/ChatMessage/contacts/${userId}`,
  chatCreateContact: "/ChatMessage/contacts",
  chatMessages: (userA: number, userB: number) => `/ChatMessage/messages/${userA}/${userB}`,
  chatSend: "/ChatMessage/messages",
  chatRead: "/ChatMessage/messages/read",
  /** POST multipart/form-data (campo "file") — imagen o PDF, máx. 10MB */
  chatUpload: "/ChatMessage/upload",
  /** POST multipart/form-data (campo "file") — nota de voz, máx. 10MB */
  chatUploadAudio: "/ChatMessage/upload-audio",

  /* @Controller('appointments') */
  appointments: "/appointments",
  appointmentById: (id: number) => `/appointments/${id}`,
  appointmentsFilter: "/appointments/filter",
  appointmentsCalendar: "/appointments/calendar",
  appointmentsLatest: (sedeId: number) => `/appointments/branches/${sedeId}/latest`,
  appointmentCancel: (id: number) => `/appointments/${id}/cancel`,
  appointmentReschedule: (id: number) => `/appointments/${id}/reschedule`,
  profesionalReservations: (profesionalId: number) =>
    `/appointments/professionals/${profesionalId}/reservations`,

  /* @Controller('resenas') */
  resenas: "/resenas",
  resenaById: (id: number) => `/resenas/${id}`,
  resenasBySede: (sedeId: number) => `/resenas/sede/${sedeId}`,
  resenaAprobar: (id: number) => `/resenas/${id}/aprobar`,

  /* @Controller('payments') */
  payments: "/payments",
  paymentConfirm: (id: number) => `/payments/${id}/confirm`,
  paymentCancel: (id: number) => `/payments/${id}/cancel`,

  /* @Controller('horario-sede') */
  horarioSede: "/horario-sede",
} as const;
