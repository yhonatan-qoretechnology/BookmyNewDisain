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
import { AppointmentsApi, AuthApi, ProfesionalesApi, SedesApi, ServicesApi } from "@/api/modules";
import { APPT_ESTADO_MAP, mapAppointment } from "@/api/mappers";
import type { ApiPaymentMethod } from "@/api/types";
import { madridYmd } from "@/lib/timezone";
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
    const names = await getServiceNames(language);
    if (session.sedeId) {
      const page = await AppointmentsApi.findAll({ sedeId: Number(session.sedeId) });
      return remember((page.items || []).map((a) => mapAppointment(a, names)));
    }
    const sedesEmp = session.negocioId
      ? await SedesApi.findByEmpresa(Number(session.negocioId))
      : await SedesApi.findAll();
    const porSede = await Promise.all(
      sedesEmp.map((s) =>
        AppointmentsApi.findAll({ sedeId: s.id }).then((p) => p.items || []).catch(() => [])
      )
    );
    return remember(porSede.flat().map((a) => mapAppointment(a, names)));
  },

  /**
   * Últimas citas de la sede de la sesión (o de la primera sede
   * de la empresa) — GET /appointments/branches/:sedeId/latest.
   * @param n Cantidad a traer.
   */
  async getUltimas(n: number, session: Session | null, language = "es"): Promise<Reserva[]> {
    if (!session) return [];
    const names = await getServiceNames(language);
    const sedeId = session.sedeId
      ? Number(session.sedeId)
      : (await SedesApi.findByEmpresa(Number(session.negocioId)).catch(() => []))[0]?.id;
    if (!sedeId) return [];
    const r = await AppointmentsApi.latestBySede(sedeId, n).catch(() => []);
    const lista = Array.isArray(r) ? r : [];
    return remember(lista.map((a) => mapAppointment(a, names)));
  },

  /**
   * Citas del panel de empleado: las de su sede.
   * @param session Sesión (usa session.sedeId).
   */
  async getByEmpleado(session: Session | null, language = "es"): Promise<Reserva[]> {
    if (!session?.sedeId) return [];
    const names = await getServiceNames(language);
    const page = await AppointmentsApi.findAll({ sedeId: Number(session.sedeId) });
    return remember((page.items || []).map((a) => mapAppointment(a, names)));
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
};
