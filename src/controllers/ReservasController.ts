/* ============================================================
   ReservasController — citas (AppointmentModule del backend)
   Consumo exclusivo del API oficial:
     GET   /appointments?sedeId          ({ items, pagination })
     GET   /appointments/branches/:id/latest
     POST  /appointments                 (CreateAppointmentDto)
   Los nombres de servicio se resuelven con GET /services?language=
   porque el include de citas no trae traducciones.
============================================================ */
import type { MetodoPago, Reserva, Session, SlotHora } from "@/models";
import { AppointmentsApi, AuthApi, PaymentsApi, ProfesionalesApi, SedesApi, ServicesApi } from "@/api/modules";
import { APPT_ESTADO_MAP, ESTADO_APPT_MAP, mapAppointment } from "@/api/mappers";
import type {
  ApiAppointment, ApiAppointmentSummary, ApiCitaEnConflicto, ApiHuecoSugerido,
  ApiPayment, ApiPaymentMethod,
} from "@/api/types";
import { madridHHmm, madridWallToUtc, madridYmd, minutesOfHHmm } from "@/lib/timezone";
import { BookingController } from "./BookingController";

/** Opción unificada para los selects del flujo de agendado */
export interface Opcion {
  id: string;
  label: string;
  /** Solo servicios: precio establecido (Price.amount) y duración */
  precio?: number;
  duracion?: number;
}

/* Caché por id para el popup de detalle */
const cache = new Map<string, Reserva>();
const remember = (lista: Reserva[]): Reserva[] => {
  for (const r of lista) cache.set(r.id, r);
  return lista;
};

/* Mapa id→nombre traducido de servicios (por idioma) */
const serviceNamesCache = new Map<string, Map<number, string>>();

/**
 * GET /appointments (lista, individual y /latest) nunca incluye la
 * relación Payment, así que `precio` da siempre 0 si no se completa
 * a mano — GET /payments sí la trae. Se busca por appointmentId y se
 * "rellena" cada cita antes de mapearla (mismo parche que ya usaba
 * el popup de detalle en ReservaPopupContext, ahora también en listas).
 */
async function getPaymentsByAppointment(): Promise<Map<number, ApiPayment>> {
  const payments = await PaymentsApi.findAll().catch(() => []);
  return new Map((payments || []).map((p) => [p.appointmentId, p]));
}

function withPayment(a: ApiAppointment, payments: Map<number, ApiPayment>): ApiAppointment {
  return a.Payment ? a : { ...a, Payment: payments.get(a.id) ?? null };
}

/**
 * Construye (y cachea) el mapa id→nombre de servicios en el idioma dado.
 * @param language Código ISO 639-1 activo en el panel.
 */
async function getServiceNames(language: string): Promise<Map<number, string>> {
  const hit = serviceNamesCache.get(language);
  if (hit) return hit;
  const list = await ServicesApi.findAll(language).catch(() => []);
  const map = new Map<number, string>((list || []).map((s) => [s.id, s.name]));
  serviceNamesCache.set(language, map);
  return map;
}

/** Tamaño de página al pedir citas: el backend acepta cualquier `limit`. */
const CITAS_POR_PETICION = 200;
/** Techo de seguridad: 10 páginas = 2.000 citas por sede. */
const MAX_PAGINAS_CITAS = 10;

/**
 * Todas las citas de una sede, no las 50 primeras.
 *
 * `GET /appointments` pagina y, sin `limit`, el backend devuelve 50
 * (appointment.service.ts → findAll). El panel pedía sin `limit` y tiraba
 * `pagination`, así que a partir de la cita 51 de una sede el listado, el
 * calendario, el KPI de reservas y el top de servicios trabajaban sobre una
 * muestra parcial — y sin avisar de que faltaban datos.
 */
async function fetchCitasDeSede(sedeId: number): Promise<ApiAppointment[]> {
  const primera = await AppointmentsApi.findAll({
    sedeId, page: 1, limit: CITAS_POR_PETICION,
  });
  const items = primera.items || [];
  const totalPaginas = primera.pagination?.totalPages ?? 1;
  if (totalPaginas <= 1) return items;

  /* Las páginas restantes en paralelo: son independientes entre sí. */
  const restantes = Math.min(totalPaginas, MAX_PAGINAS_CITAS);
  const paginas = await Promise.all(
    Array.from({ length: restantes - 1 }, (_, i) =>
      AppointmentsApi.findAll({ sedeId, page: i + 2, limit: CITAS_POR_PETICION })
        .then((p) => p.items || [])
        .catch(() => [])
    )
  );

  return items.concat(paginas.flat());
}

/** Resultado de pedir más tiempo para una cita en curso. */
export type ResultadoExtension =
  /** `extension`: la cita nueva que registra el tiempo extra */
  | { status: "EXTENDED"; extension: Reserva }
  | { status: "CONFLICT"; mensaje: string; nuevaHoraFin: string; citasEnConflicto: ApiCitaEnConflicto[] };

/** Profesional al que se puede pasar una cita. */
export interface ProfesionalReasignable {
  id: number;
  nombre: string;
  imagen: string | null;
}

/** Tras la hora de fin prevista, todavía se puede pedir más tiempo durante este margen. */
const MARGEN_EN_CURSO_MS = 60 * 60000;

/**
 * Los huecos de `huecosSugeridosMismoDia` llegan con la hora de PARED de
 * Madrid disfrazada de UTC: el backend los arma con Date.UTC(...) sobre
 * minutos de Madrid (una cita que acaba a las 21:00 de Madrid sugiere
 * "…T21:00:00.000Z"). Se pasan a instantes reales para que la vista
 * (madridHHmm) y reprogramarAHueco (componentes UTC) acierten.
 * Si el backend empieza a mandar instantes reales, hay que quitar esto.
 */
function conHuecosEnInstantes(c: ApiCitaEnConflicto): ApiCitaEnConflicto {
  const aInstante = (iso: string) =>
    madridWallToUtc(iso.slice(0, 10), minutesOfHHmm(iso.slice(11, 16))).toISOString();
  const { reprogramar } = c.opciones;
  return {
    ...c,
    opciones: {
      ...c.opciones,
      reprogramar: {
        ...reprogramar,
        huecosSugeridosMismoDia: reprogramar.huecosSugeridosMismoDia.map((h) => ({
          horaInicio: aInstante(h.horaInicio),
          horaFin: aInstante(h.horaFin),
        })),
      },
    },
  };
}

export const ReservasController = {
  /**
   * Citas visibles según la sesión (aislamiento multi-tenant):
   * con sedeId explícito (usuario de sede, o superadmin/dueño con una
   * sede elegida en el dashboard) → esa sede; si no, todas las sedes
   * de la empresa.
   * @param session Sesión activa del panel.
   * @param language Idioma para resolver nombres de servicio.
   */
  async getForSession(session: Session | null, language = "es"): Promise<Reserva[]> {
    if (!session) return [];
    const [names, payments] = await Promise.all([getServiceNames(language), getPaymentsByAppointment()]);
    if (session.sedeId) {
      const citas = await fetchCitasDeSede(Number(session.sedeId));
      return remember(citas.map((a) => mapAppointment(withPayment(a, payments), names)));
    }
    const sedesEmp = session.negocioId
      ? await SedesApi.findByEmpresa(Number(session.negocioId))
      : await SedesApi.findAll();
    const porSede = await Promise.all(
      sedesEmp.map((s) => fetchCitasDeSede(s.id).catch(() => []))
    );
    return remember(porSede.flat().map((a) => mapAppointment(withPayment(a, payments), names)));
  },

  /**
   * Últimas citas de la sede de la sesión (o de la primera sede
   * de la empresa) — GET /appointments/branches/:sedeId/latest.
   * @param n Cantidad a traer.
   */
  async getUltimas(n: number, session: Session | null, language = "es"): Promise<Reserva[]> {
    if (!session) return [];
    const [names, payments] = await Promise.all([getServiceNames(language), getPaymentsByAppointment()]);
    const sedeId = session.sedeId
      ? Number(session.sedeId)
      : (await SedesApi.findByEmpresa(Number(session.negocioId)).catch(() => []))[0]?.id;
    if (!sedeId) return [];
    const r = await AppointmentsApi.latestBySede(sedeId, n).catch(() => []);
    const lista = Array.isArray(r) ? r : [];
    return remember(lista.map((a) => mapAppointment(withPayment(a, payments), names)));
  },

  /**
   * Citas del panel de empleado: solo las propias del profesional
   * (session.profesionalId, resuelto en el login desde el JWT). Si por
   * lo que sea no está disponible, se cae a todas las de su sede en vez
   * de dejar la pantalla vacía.
   * @param session Sesión (usa session.sedeId y session.profesionalId).
   */
  async getByEmpleado(session: Session | null, language = "es"): Promise<Reserva[]> {
    if (!session?.sedeId) return [];
    const [names, payments, citas] = await Promise.all([
      getServiceNames(language),
      getPaymentsByAppointment(),
      /* Todas las páginas: con el corte de 50 la cita en curso podía no llegar */
      fetchCitasDeSede(Number(session.sedeId)),
    ]);
    const items = session.profesionalId
      ? citas.filter((a) => String(a.profesionalId) === session.profesionalId)
      : citas;
    return remember(items.map((a) => mapAppointment(withPayment(a, payments), names)));
  },

  /**
   * Busca una reserva ya cargada (para el popup de detalle).
   * @param id Id del panel, p. ej. "R-42".
   */
  getById(id: string): Reserva | undefined {
    return cache.get(id);
  },

  /**
   * Agrupa reservas por fecha (YYYY-MM-DD) para el calendario.
   */
  buildCalendarMap(lista: Reserva[]): Record<string, Reserva[]> {
    const map: Record<string, Reserva[]> = {};
    for (const r of lista) {
      if (!map[r.fecha]) map[r.fecha] = [];
      map[r.fecha].push(r);
    }
    return map;
  },

  /* ── Catálogos del flujo de agendado ───────────────────── */

  /** Clientes finales: GET /auth/users con role CLIENT. */
  async getOpcionesClientes(): Promise<Opcion[]> {
    const users = await AuthApi.findAllUsers().catch(() => []);
    return (users || [])
      .filter((u) => u.role === "CLIENT")
      .map((u) => ({ id: String(u.id), label: u.UserData?.name || u.email }));
  },

  /** Sedes de la empresa de la sesión: GET /sedes/empresa/:id. */
  async getOpcionesSedes(session: Session | null): Promise<Opcion[]> {
    const list = session?.negocioId
      ? await SedesApi.findByEmpresa(Number(session.negocioId))
      : await SedesApi.findAll();
    return list.map((s) => ({ id: String(s.id), label: s.nombre }));
  },

  /** Profesionales de la sede: GET /profesionales/by-sede/:sedeId. */
  async getOpcionesProfesionales(sedeId: string): Promise<Opcion[]> {
    const list = await ProfesionalesApi.findBySede(Number(sedeId)).catch(() => []);
    return list.map((p) => ({ id: String(p.id), label: p.nombre }));
  },

  /**
   * Servicios de la sede con precio establecido (Price.amount):
   * GET /services/by-sede/:id?language= — el precio nunca se digita.
   */
  async getOpcionesServicios(sedeId: string, language: string): Promise<Opcion[]> {
    const list = await ServicesApi.findBySede(Number(sedeId), language).catch(() =>
      ServicesApi.findAll(language)
    );
    return (list || []).map((sv) => ({
      id: String(sv.id),
      label: sv.name,
      precio: sv.prices?.[0]?.amount ?? 0,
      duracion: sv.prices?.[0]?.duration ?? 30,
    }));
  },

  /**
   * Crea la cita con el CreateAppointmentDto exacto del backend.
   * El precio proviene del servicio seleccionado y el método del
   * panel se traduce al enum PaymentMethod (CARD | CASH).
   * @throws ApiError si el backend rechaza el DTO.
   */
  async create(input: {
    clienteId: string;
    sedeId: string;
    empleadoId: string;
    servicio: Opcion;
    fechaHora: string; // del <input datetime-local>
    metodoPago: MetodoPago;
    card?: { number: string; expiry: string; cvv: string };
  }): Promise<Reserva> {
    const inicio = new Date(input.fechaHora);
    const duracion = input.servicio.duracion ?? 30;
    const fin = new Date(inicio.getTime() + duracion * 60000);
    const paymentMethod: ApiPaymentMethod = input.metodoPago === "tarjeta" ? "CARD" : "CASH";
    const created = await AppointmentsApi.create({
      fecha: inicio.toISOString(),
      horaInicio: inicio.toISOString(),
      horaFin: fin.toISOString(),
      duracion,
      sedeId: Number(input.sedeId),
      serviceId: Number(input.servicio.id),
      profesionalId: Number(input.empleadoId),
      userId: Number(input.clienteId),
      paymentMethod,
      paymentAmount: input.servicio.precio, // ← precio del servicio
      ...(paymentMethod === "CARD" && input.card
        ? { cardNumber: input.card.number, expiryDate: input.card.expiry, cvv: input.card.cvv }
        : {}),
    });
    const mapped = mapAppointment(created);
    mapped.servicio = input.servicio.label;
    cache.set(mapped.id, mapped);
    return mapped;
  },

  /* ── Reagendado de una cita existente ──────────────────── */

  /** Días sin franjas libres para el profesional de la reserva (calendario del modal). */
  async getDiasNoDisponiblesReagendar(reserva: Reserva): Promise<Set<string>> {
    return BookingController.getDiasNoDisponibles(
      reserva.empleadoId, reserva.sedeId, reserva.duracion, reserva.apiId
    );
  },

  /** Franjas libres del profesional de la reserva en la fecha elegida. */
  async getSlotsParaReagendar(reserva: Reserva, fecha: string): Promise<SlotHora[]> {
    return BookingController.getSlotsDisponibles(
      reserva.empleadoId, reserva.sedeId, fecha, reserva.duracion, reserva.apiId
    );
  },

  /**
   * Reagenda la cita a una nueva franja — PATCH /appointments/:id/reschedule.
   * Conserva cliente, servicio y profesional; solo cambia fecha/hora.
   * @throws ApiError si el backend rechaza la nueva franja.
   */
  async reagendar(reserva: Reserva, slot: SlotHora): Promise<Reserva> {
    if (reserva.apiId == null) throw new Error("SIN_ID");
    /* RescheduleAppointmentDto NO admite un ISO completo: exige la fecha
       y las horas por separado (@IsDateString + @Matches HH:mm:ss). Ojo,
       no es el mismo contrato que POST /appointments, que sí recibe ISO.

       `slot.inicioISO` es el instante real en UTC (una franja de las
       10:00 de Madrid viaja como 08:00Z) y el backend lo reconstruye
       con Date.UTC(...) para volver a leerlo en Madrid. Por eso aquí
       se mandan los componentes UTC, no la hora que ve el usuario. */
    const inicio = new Date(slot.inicioISO);
    const updated = await AppointmentsApi.reschedule(reserva.apiId, {
      fecha: slot.inicioISO.slice(0, 10),       // YYYY-MM-DD (UTC)
      horaInicio: slot.inicioISO.slice(11, 19), // HH:mm:ss (UTC)
      horaFin: slot.finISO.slice(11, 19),       // HH:mm:ss (UTC)
    });
    const mapped: Reserva = {
      ...reserva,
      /* Para mostrar sí se usa el día de Madrid */
      fecha: madridYmd(inicio),
      hora: slot.hora,
      estado: APPT_ESTADO_MAP[updated.estado] ?? reserva.estado,
    };
    cache.set(mapped.id, mapped);
    BookingController.invalidateAll();
    return mapped;
  },

  /** Nota sobre el cliente que espera — PATCH /appointments/:id/observacion-espera. */
  async guardarObservacionEspera(reserva: Reserva, texto: string): Promise<Reserva> {
    if (reserva.apiId == null) throw new Error("SIN_ID");
    const limpio = texto.trim();
    const actualizada = await AppointmentsApi.observacionEspera(reserva.apiId, limpio || null);
    const mapped: Reserva = {
      ...reserva,
      observacionEspera: actualizada.observacionEspera ?? (limpio || null),
    };
    cache.set(mapped.id, mapped);
    return mapped;
  },

  /**
   * Cambia el estado de una cita — PATCH /appointments/:id { estado }.
   *
   * Para "cancelado" se usa PATCH /appointments/:id/cancel, que además de
   * marcar la cita libera la franja para que se pueda volver a reservar; el
   * PATCH genérico solo cambiaría el campo y el hueco seguiría ocupado.
   *
   * @throws Error("SIN_ID") si la reserva no viene del API.
   */
  async cambiarEstado(reserva: Reserva, estado: Reserva["estado"]): Promise<Reserva> {
    if (reserva.apiId == null) throw new Error("SIN_ID");

    const actualizada = estado === "cancelado"
      ? await AppointmentsApi.cancel(reserva.apiId)
      : await AppointmentsApi.cambiarEstado(reserva.apiId, ESTADO_APPT_MAP[estado]);

    const mapped: Reserva = {
      ...reserva,
      estado: APPT_ESTADO_MAP[actualizada.estado] ?? estado,
    };
    cache.set(mapped.id, mapped);
    /* Cancelar devuelve la franja al calendario: hay que rehacer la
       disponibilidad o el hueco seguiría apareciendo ocupado. */
    if (estado === "cancelado") BookingController.invalidateAll();
    return mapped;
  },

  /* ── Extender una cita en curso y resolver conflictos ───── */

  /**
   * La cita que el profesional está atendiendo ahora: ya empezó y no
   * terminó hace más de MARGEN_EN_CURSO_MS (quien se pasa de hora es
   * justo quien necesita el botón). Si hay varias, la última en empezar.
   */
  citaEnCurso(lista: Reserva[], ahora = Date.now()): Reserva | null {
    const candidatas = lista.filter((r) => {
      if (r.estado !== "pendiente" && r.estado !== "confirmada") return false;
      if (!r.inicioISO || !r.finISO) return false;
      return Date.parse(r.inicioISO) <= ahora && ahora <= Date.parse(r.finISO) + MARGEN_EN_CURSO_MS;
    });
    candidatas.sort((a, b) => Date.parse(b.inicioISO!) - Date.parse(a.inicioISO!));
    return candidatas[0] ?? null;
  },

  /**
   * Pide más minutos — PATCH /appointments/:id/extend.
   * EXTENDED: el backend ya estiró la cita; se devuelve con la nueva hora de fin.
   * CONFLICT: no se cambió nada; se devuelven las citas afectadas y sus opciones.
   * @throws ApiError 403 si la sesión no gestiona esa cita, 400 si ya terminó.
   */
  async extender(reserva: Reserva, extraMinutes: number, motivo?: string): Promise<ResultadoExtension> {
    if (reserva.apiId == null) throw new Error("SIN_ID");
    const res = await AppointmentsApi.extend(reserva.apiId, {
      extraMinutes,
      ...(motivo?.trim() ? { motivo: motivo.trim() } : {}),
    });

    if (res.status === "CONFLICT") {
      return {
        status: "CONFLICT",
        mensaje: res.mensaje,
        nuevaHoraFin: res.solicitud.nuevaHoraFin,
        citasEnConflicto: res.citasEnConflicto.map(conHuecosEnInstantes),
      };
    }

    /* El backend registra el tiempo extra como OTRA cita enlazada a la
       original. Llega sin includes, así que cliente y servicio se copian. */
    const extension: Reserva = {
      ...mapAppointment(res.extension),
      servicio: reserva.servicio,
      cliente: reserva.cliente,
      clienteFoto: reserva.clienteFoto,
      telefono: reserva.telefono,
      email: reserva.email,
      sedeName: reserva.sedeName,
      empleadoName: reserva.empleadoName,
    };
    cache.set(extension.id, extension);
    BookingController.invalidateAll();
    return { status: "EXTENDED", extension };
  },

  /**
   * Candidatos para cambiar el profesional de una cita — GET /profesionales/by-sede/:id.
   * Solo activos de la misma sede que prestan ese servicio, sin el actual.
   * No se sabe aquí si están libres a esa hora: lo valida reassign con un 400.
   */
  async getProfesionalesParaReasignar(reserva: Reserva, language = "es"): Promise<ProfesionalReasignable[]> {
    /* El backend responde 404 cuando la sede no tiene profesionales */
    const lista = await ProfesionalesApi.bySedeConServicios(Number(reserva.sedeId), language).catch(() => []);
    return lista
      .filter((p) => String(p.id) !== reserva.empleadoId)
      .filter((p) => (p.state ?? "enabled") === "enabled")
      .filter((p) => reserva.servicioId == null || (p.servicios || []).some((s) => s.id === reserva.servicioId))
      .map((p) => ({ id: p.id, nombre: p.nombre, imagen: p.imagen }));
  },

  /**
   * Mueve una cita a otro especialista — PATCH /appointments/:id/reassign.
   * @throws ApiError 400 con el motivo si ese especialista no puede atenderla.
   */
  async reasignarCita(appointmentId: number, nuevoProfesionalId: number, motivo?: string): Promise<void> {
    await AppointmentsApi.reassign(appointmentId, {
      nuevoProfesionalId,
      ...(motivo?.trim() ? { motivo: motivo.trim() } : {}),
    });
    BookingController.invalidateAll();
  },

  /**
   * Reprograma una cita a uno de los huecos que sugirió el backend —
   * PATCH /appointments/:id/reschedule. Mismo formato que reagendar():
   * fecha y horas con los componentes UTC del instante.
   */
  async reprogramarAHueco(appointmentId: number, hueco: ApiHuecoSugerido): Promise<void> {
    await AppointmentsApi.reschedule(appointmentId, {
      fecha: hueco.horaInicio.slice(0, 10),
      horaInicio: hueco.horaInicio.slice(11, 19),
      horaFin: hueco.horaFin.slice(11, 19),
    });
    BookingController.invalidateAll();
  },

  /** Cancela una cita y libera su franja — PATCH /appointments/:id/cancel. */
  async cancelarCita(appointmentId: number): Promise<void> {
    await AppointmentsApi.cancel(appointmentId);
    BookingController.invalidateAll();
  },

  /**
   * Reserva mínima a partir del resumen de una cita en conflicto, para
   * abrir ReagendarModal (necesita profesional, sede, duración e id).
   */
  reservaDeConflicto(a: ApiAppointmentSummary): Reserva {
    const inicio = a.horaInicio ? new Date(a.horaInicio) : null;
    return {
      id: `R-${a.appointmentId}`,
      apiId: a.appointmentId,
      servicio: a.serviceName || "—",
      servicioId: a.serviceId,
      cliente: a.userNombre || a.userEmail || "—",
      clienteId: a.userId ?? undefined,
      telefono: a.userTelefono || "—",
      email: a.userEmail || "—",
      fecha: inicio ? madridYmd(inicio) : "",
      hora: inicio ? madridHHmm(inicio) : "—",
      horaFin: a.horaFin ? madridHHmm(new Date(a.horaFin)) : undefined,
      inicioISO: a.horaInicio ?? undefined,
      finISO: a.horaFin ?? undefined,
      precio: 0,
      estado: APPT_ESTADO_MAP[a.estado] ?? "pendiente",
      sedeId: String(a.sedeId),
      empleadoId: String(a.profesionalId),
      duracion: a.duracion ?? 30,
      sedeName: a.sedeNombre ?? undefined,
      empleadoName: a.profesionalNombre ?? undefined,
      notas: a.notas || "",
    };
  },
};
