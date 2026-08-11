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

  /* Recuperación de contraseña por OTP — públicos (sin token).
     El código es de 6 dígitos, se manda por correo y caduca a los
     5 minutos (otp.service.ts → sendPasswordResetOtp). */
  passwordOtpRequest: "/auth/users/password/otp/request",
  passwordOtpValidate: "/auth/users/password/otp/validate",
  /** PATCH, no POST */
  passwordOtpChange: "/auth/users/password/otp/change",
  /** PATCH multipart — campo "fotoPerfil". Devuelve el Users actualizado. */
  userFoto: (id: number) => `/auth/users/${id}/foto`,

  /* @Controller('clients') — clientes finales (role CLIENT).
     Requiere JWT + rol admin. Preferir esto a /auth/users: viene
     paginado, ya filtrado por rol y sin el resto de usuarios. */
  clients: "/clients",
  clientById: (id: number) => `/clients/${id}`,
  /** PATCH { password } — un admin fija la contraseña sin saber la anterior */
  clientPassword: (id: number) => `/clients/${id}/password`,
  /** POST { email } — búsqueda exacta por correo */
  clientsSearch: "/clients/search",

  /* @Controller('admin') — gestión de administradores */
  admins: "/admin/admins",
  adminById: (userId: number) => `/admin/admins/${userId}`,
  createCompanyAdmin: (empresaId: number) => `/admin/companies/${empresaId}/admins`,
  createBranchAdmin: (sedeId: number) => `/admin/branches/${sedeId}/admins`,

  /* @Controller('empresas') */
  empresas: "/empresas",
  empresaById: (id: number) => `/empresas/${id}`,
  /** PATCH multipart — campo "logo". Devuelve la Empresa actualizada. */
  empresaLogo: (id: number) => `/empresas/${id}/logo`,

  /* @Controller('sedes') */
  sedes: "/sedes",
  sedeById: (id: number) => `/sedes/${id}`,
  sedesByEmpresa: (empresaId: number) => `/sedes/empresa/${empresaId}`,
  sedeServicios: (id: number) => `/sedes/${id}/servicios`,
  /** POST multipart — campo "imagen": añade UNA imagen a sede.imagenes */
  sedeImagen: (id: number) => `/sedes/${id}/imagen`,
  /** POST multipart (campo "imagenes", varias) y DELETE con JSON { imagenes: [] } */
  sedeImagenes: (id: number) => `/sedes/${id}/imagenes`,
  /** PUT multipart — reemplaza la imagen de una posición concreta */
  sedeImagenPorIndice: (id: number, index: number) => `/sedes/${id}/imagenes/${index}`,
  /** POST multipart (campo "imagenes") — tabla Galeria, distinta de sede.imagenes */
  sedeGaleria: (id: number) => `/sedes/${id}/galeria`,

  /* @Controller('profesionales') */
  profesionales: "/profesionales",
  profesionalById: (id: number) => `/profesionales/${id}`,
  profesionalesBySede: (sedeId: number) => `/profesionales/by-sede/${sedeId}`,
  /** GET /profesionales/:id/detalle?lang= — profesional + sede + servicios */
  profesionalDetalle: (id: number) => `/profesionales/${id}/detalle`,
  /** PATCH multipart — campo "imagen". Devuelve el Profesional actualizado. */
  profesionalImagen: (id: number) => `/profesionales/${id}/imagen`,
  /** PATCH { email, password } — da acceso al panel a un profesional
      viejo que aún no tiene login (acceso.tieneAcceso === false). */
  profesionalVincularAcceso: (id: number) => `/profesionales/${id}/vincular-acceso`,
  /** PATCH { email?, password? } — cambia el correo y/o la contraseña
      de un profesional que ya tiene login (acceso.tieneAcceso === true). */
  profesionalAcceso: (id: number) => `/profesionales/${id}/acceso`,

  /* @Controller('services') */
  services: "/services",
  serviceById: (id: number) => `/services/${id}`,
  servicesBySede: (sedeId: number) => `/services/by-sede/${sedeId}`,

  /* @Controller('service-sede-profesional') — qué servicio presta cada
     profesional en cada sede. Es la terna que valida crear una cita. */
  serviceSedeProfesional: "/service-sede-profesional",
  serviceSedeProfesionalById: (id: number) => `/service-sede-profesional/${id}`,
  /** Todos los servicios de la sede, marcando cuáles presta ese profesional */
  serviciosAsignables: (sedeId: number, profesionalId: number) =>
    `/service-sede-profesional/by-sede/${sedeId}/by-profesional/${profesionalId}`,

  /* @Controller('categories') */
  categories: "/categories",
  /** PATCH multipart — campo "image". Devuelve la Category actualizada. */
  categoryImage: (id: number) => `/categories/${id}/image`,

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
  /** GET /payments/filter?userId=&sedeId= — ambos opcionales e independientes.
      ⚠️ No valida token/rol: el front decide qué mandar según la sesión. */
  paymentsFilter: "/payments/filter",
  paymentConfirm: (id: number) => `/payments/${id}/confirm`,
  paymentCancel: (id: number) => `/payments/${id}/cancel`,

  /* Disponibilidad — las tres fuentes que valida el backend al agendar.
     Abiertas (sin guard) en lectura. Si devuelven [], appointment.service
     cae al JSON `sede.horario` / `sede.diasCerrado`. */
  /** GET /horario-sede?sedeId=&activo= */
  horarioSede: "/horario-sede",
  /** GET /dia-cerrado-sede?sedeId=&desde=&hasta= */
  diaCerradoSede: "/dia-cerrado-sede",
  /** GET /disponibilidad-profesional?profesionalId=&desde=&hasta=&disponible= */
  disponibilidadProfesional: "/disponibilidad-profesional",

  /* @Controller('gastos') — requiere JWT + rol admin.
     El alcance por sede/empresa lo resuelve el backend a partir del token
     (gasto.service.ts → resolveSedeScope), así que los filtros que se
     manden fuera de ese alcance se ignoran o responden 403. */
  gastosFilter: "/gastos/filter",
  gastos: "/gastos",
  gastoById: (id: number) => `/gastos/${id}`,
  /** POST multipart/form-data (campo "file") — imagen o PDF, máx. 10MB */
  gastosUpload: "/gastos/upload",

  /* @Controller('categorias-gasto') — requiere JWT + rol admin */
  categoriasGasto: "/categorias-gasto",
  categoriaGastoById: (id: number) => `/categorias-gasto/${id}`,
} as const;
