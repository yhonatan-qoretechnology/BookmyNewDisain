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

  /* Enlace de alta del empleado. Publicos: quien los usa aun no tiene
     contrasena, asi que no puede tener sesion; los protege el token. */
  passwordSetupValidate: "/auth/password-setup/validate",
  passwordSetupComplete: "/auth/password-setup/complete",
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

  /* @Controller('paises') — público (sin sesión): lo necesita el alta
     de un negocio, que ocurre antes de que haya cuenta con la que
     identificarse. Va antes de /empresas porque el país es lo primero
     que se elige de una empresa y lo único que luego no cambia. */
  paises: "/paises",

  /* @Controller('empresas') */
  empresas: "/empresas",
  empresaById: (id: number) => `/empresas/${id}`,
  /** POST público — alta de un negocio desde bookmy.es */
  registroNegocio: "/empresas/registro",
  /** GET plan y prueba · POST activa los 30 días · PATCH cambia el contratado */
  empresaPlan: (id: number) => `/empresas/${id}/plan`,
  empresaPrueba: (id: number) => `/empresas/${id}/prueba`,
  /** PATCH multipart — campo "logo". Devuelve la Empresa actualizada. */
  empresaLogo: (id: number) => `/empresas/${id}/logo`,
  /* Verificación de identidad del negocio (KYC), revisada a mano.
     Ojo: "kyc/pendientes" va antes que /empresas/:id en el backend. */
  kycPendientes: "/empresas/kyc/pendientes",
  empresaKyc: (id: number) => `/empresas/${id}/kyc`,
  empresaKycAprobar: (id: number) => `/empresas/${id}/kyc/aprobar`,
  empresaKycRechazar: (id: number) => `/empresas/${id}/kyc/rechazar`,
  /** PATCH { motivo? } — corta el acceso de la empresa. Solo SUPER_ADMIN. */
  empresaBloquear: (id: number) => `/empresas/${id}/bloquear`,
  /** PATCH sin cuerpo — devuelve el acceso. Solo SUPER_ADMIN. */
  empresaDesbloquear: (id: number) => `/empresas/${id}/desbloquear`,

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
  servicesByCategory: (categoryId: number) => `/services/category/${categoryId}`,
  /* Imágenes de servicio — mismo esquema que /sedes/:id/imagen[es]. */
  serviceImagen: (id: number) => `/services/${id}/imagen`,
  serviceImagenes: (id: number) => `/services/${id}/imagenes`,
  serviceImagenPorIndice: (id: number, index: number) => `/services/${id}/imagenes/${index}`,

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
  /** POST — mismo payload que /appointments; crea las dos partes del servicio partido */
  appointmentsConContinuacion: "/appointments/con-continuacion",
  appointmentsLatest: (sedeId: number) => `/appointments/branches/${sedeId}/latest`,
  appointmentCancel: (id: number) => `/appointments/${id}/cancel`,
  appointmentReschedule: (id: number) => `/appointments/${id}/reschedule`,
  /** PATCH { extraMinutes, motivo? } → EXTENDED | CONFLICT */
  appointmentExtend: (id: number) => `/appointments/${id}/extend`,
  /** PATCH { nuevoProfesionalId, motivo? } → cita actualizada */
  appointmentReassign: (id: number) => `/appointments/${id}/reassign`,
  /** PATCH { observacionEspera } — nota del cliente que espera. Vacio la borra. */
  appointmentObservacionEspera: (id: number) => `/appointments/${id}/observacion-espera`,
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
  /* Adicionales de una factura. El total lo recalcula el backend. */
  paymentItems: (id: number) => `/payments/${id}/items`,
  paymentItemById: (itemId: number) => `/payments/items/${itemId}`,

  /* @Controller('festivos') — publico; informativos, no bloquean el agendado */
  /* @Controller('backup') — solo SUPER_ADMIN */
  backup: "/backup",
  backupResumen: "/backup/resumen",

  festivos: "/festivos",
  /* Qué país/región/municipio se le está aplicando a una sede */
  festivosContexto: "/festivos/contexto",
  /** POST { anio } — baja el calendario oficial del año. Solo SUPER_ADMIN. */
  festivosSincronizar: "/festivos/sincronizar",
  /* Festivos locales: la API externa no los trae, se cargan a mano */
  festivosLocales: "/festivos/locales",
  festivoLocal: "/festivos/local",
  festivoLocalById: (id: number) => `/festivos/local/${id}`,

  /* @Controller('estadisticas') — rankings con filtro desde/hasta (2.12) */
  estEmpresas: "/estadisticas/empresas-con-mas-reservas",
  estServicios: "/estadisticas/servicios-con-mas-reservas",
  estEmpleados: "/estadisticas/empleados",
  estCiudades: "/estadisticas/ciudades",
  estMasVistos: (tipo: string) => `/estadisticas/mas-vistos/${tipo}`,

  /* @Controller('entity-views') — lo registra la app móvil al abrir una ficha */
  entityViews: "/entity-views",

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

  /* @Controller('stock') — catálogo de insumos, existencias por sede y
     pedidos de reposición. Requiere JWT + rol admin Y plan Pro
     (PlanProGuard): mientras Pro esté apagado responde 403 a todo.
     El alcance lo pone el backend a partir del token; `empresaId` solo
     lo necesita el superadmin, que no es de ningún negocio. */
  stockInsumos: "/stock/insumos",
  /** PATCH edita · DELETE archiva (activo: false), no borra */
  stockInsumoById: (id: number) => `/stock/insumos/${id}`,
  stockSede: (sedeId: number) => `/stock/sede/${sedeId}`,
  /** PATCH { stock?, max? } — cantidades ABSOLUTAS, no incrementos */
  stockSedeInsumo: (sedeId: number, insumoId: number) =>
    `/stock/sede/${sedeId}/insumo/${insumoId}`,
  stockSolicitudes: "/stock/solicitudes",
  /** PATCH { estado } — solo SUPER_ADMIN y COMPANY_ADMIN */
  stockSolicitudById: (id: number) => `/stock/solicitudes/${id}`,

  /* @Controller('notifications') — requiere JWT (JwtAuthGuard).
     Hoy solo BRANCH_ADMIN recibe (nueva reserva en su sede), pero el
     endpoint es genérico por usuario autenticado. */
  notifications: "/notifications",
  notificationsUnreadCount: "/notifications/unread-count",
  notificationRead: (id: number) => `/notifications/${id}/read`,
  notificationsReadAll: "/notifications/read-all",
} as const;
