/* ============================================================
   BookingController — flujo de creación de reservas
   ------------------------------------------------------------
   Casos de uso (Clean Architecture: esta capa orquesta el API y
   expone modelos del dominio; la UI no conoce el HTTP):

     Sede         · getSedes                 GET /sedes/empresa/:id
     Cliente      · searchClientes           GET /auth/users (role CLIENT)
     Profesional  · getProfesionales         GET /profesionales/by-sede/:id
     Servicio     · getServiciosPorCategoria GET /profesionales/:id/detalle?lang=
     Fecha/Hora   · getDiasNoDisponibles / getSlotsDisponibles
                    GET /appointments/professionals/:id/reservations
                    (fallback: GET /appointments/calendar?sedeId)
     Confirmación · crear                    POST /appointments (revalida)

   Caché en memoria con invalidación tras crear: evita solicitudes
   duplicadas durante el flujo. ISP/DIP: la UI consume interfaces
   pequeñas (SedesProvider, AgendaProvider…), no este objeto completo.
============================================================ */
import type {
  BookingDraft, CategoriaServicios, ClienteOpcion, ProfesionalCard,
  SedeOpcion, ServicioOpcion, SlotHora,
} from "@/models";
import { DIAS_AGENDABLES, HORARIO_DEFECTO } from "@/constants";
import { AppointmentsApi, AuthApi, ProfesionalesApi, SedesApi } from "@/api/modules";
import { http } from "@/api/http";
import { EP } from "@/api/endpoints";
import type {
  ApiAppointment, ApiPaymentMethod, ApiSede, ApiServicioProfesional, ApiUser,
} from "@/api/types";

/* ── Interfaces por caso de uso (ISP) ────────────────────── */
export interface SedesProvider {
  getSedes(empresaId: string): Promise<SedeOpcion[]>;
}
export interface ClientesProvider {
  searchClientes(query: string): Promise<ClienteOpcion[]>;
}
export interface ProfesionalesProvider {
  getProfesionales(sedeId: string): Promise<ProfesionalCard[]>;
}
export interface ServiciosProvider {
  getServiciosPorCategoria(profesionalId: string, lang: string): Promise<CategoriaServicios[]>;
}
export interface AgendaProvider {
  getDiasNoDisponibles(profesionalId: string, sedeId: string, duracionMin: number, excludeAppointmentId?: number): Promise<Set<string>>;
  getSlotsDisponibles(profesionalId: string, sedeId: string, fecha: string, duracionMin: number, excludeAppointmentId?: number): Promise<SlotHora[]>;
}
export interface ReservaCreator {
  crear(draft: BookingDraft): Promise<{ id: number }>;
}

/* ── Caché simple con TTL (evita duplicados en el flujo) ─── */
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Invalida las entradas cuyo key comience por alguno de los prefijos */
function invalidate(prefixes: string[]) {
  for (const k of Array.from(cache.keys())) {
    if (prefixes.some((p) => k.startsWith(p))) cache.delete(k);
  }
}

/* ── Mapeadores API → dominio ────────────────────────────── */
function mapSede(s: ApiSede): SedeOpcion {
  const imagenes = s.imagenes ?? [];
  return {
    id: String(s.id),
    nombre: s.nombre,
    direccion: s.direccion || "",
    provincia: s.provincia || "",
    telefono: s.telefono || "",
    imagen: imagenes[0] ?? null,
    imagenes,
    horario: s.horario ?? null,
    latitud: typeof s.latitud === "number" ? s.latitud : null,
    longitud: typeof s.longitud === "number" ? s.longitud : null,
  };
}

function mapCliente(u: ApiUser): ClienteOpcion {
  return {
    id: String(u.id),
    nombre: u.UserData?.name || u.email,
    email: u.email,
    telefono: u.UserData?.phone || "",
    foto: u.fotoPerfil ?? null,
    documento: undefined, // el API no expone documento; hook de extensión
  };
}

const SIN_CATEGORIA = "Otros servicios";

function mapServicio(sv: ApiServicioProfesional): ServicioOpcion {
  return {
    id: String(sv.id),
    nombre: sv.nombre,
    descripcion: sv.descripcion || undefined,
    categoria: sv.categoria || SIN_CATEGORIA,
    duracion: sv.precios?.[0]?.duration ?? 30,
    precio: sv.precios?.[0]?.amount ?? 0,
    moneda: sv.precios?.[0]?.currency ?? "EUR",
  };
}

/** Agrupa por `categoria` conservando el orden de aparición */
function agruparPorCategoria(servicios: ServicioOpcion[]): CategoriaServicios[] {
  const grupos = new Map<string, ServicioOpcion[]>();
  for (const s of servicios) {
    const lista = grupos.get(s.categoria);
    if (lista) lista.push(s);
    else grupos.set(s.categoria, [s]);
  }
  return Array.from(grupos, ([categoria, lista]) => ({ categoria, servicios: lista }));
}

/* ── Utilidades de tiempo ────────────────────────────────── */
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

interface Ocupacion { startMin: number; endMin: number }

/** Intervalos ocupados por fecha del profesional (citas no canceladas) */
function buildOcupacion(citas: ApiAppointment[]): Map<string, Ocupacion[]> {
  const map = new Map<string, Ocupacion[]>();
  for (const a of citas) {
    if (a.estado === "CANCELLED" || a.estado === "NO_SHOW") continue;
    const ini = new Date(a.horaInicio);
    const fin = new Date(a.horaFin || new Date(ini.getTime() + (a.duracion || 30) * 60000).toISOString());
    const key = (a.fecha || a.horaInicio || "").slice(0, 10);
    if (!key) continue;
    const arr = map.get(key) || [];
    arr.push({
      startMin: ini.getUTCHours() * 60 + ini.getUTCMinutes(),
      endMin: fin.getUTCHours() * 60 + fin.getUTCMinutes(),
    });
    map.set(key, arr);
  }
  return map;
}

/** Genera las franjas libres de un día según horario y ocupación */
function buildSlots(fecha: string, duracionMin: number, ocupadas: Ocupacion[]): SlotHora[] {
  const apertura = minutesOf(HORARIO_DEFECTO.apertura);
  const cierre = minutesOf(HORARIO_DEFECTO.cierre);
  const hoy = ymd(new Date());
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const slots: SlotHora[] = [];
  for (let t = apertura; t + duracionMin <= cierre; t += duracionMin) {
    if (fecha === hoy && t <= ahoraMin) continue; // no agendar en el pasado
    const solapa = ocupadas.some((o) => t < o.endMin && t + duracionMin > o.startMin);
    if (solapa) continue;
    const hora = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    const horaFin = `${pad(Math.floor((t + duracionMin) / 60))}:${pad((t + duracionMin) % 60)}`;
    slots.push({
      hora,
      inicioISO: `${fecha}T${hora}:00.000Z`,
      finISO: `${fecha}T${horaFin}:00.000Z`,
    });
  }
  return slots;
}

/** Agenda del profesional con tolerancia de shape y fallback */
async function fetchAgenda(profesionalId: string, sedeId: string): Promise<ApiAppointment[]> {
  return cached(`agenda:${profesionalId}:${sedeId}`, async () => {
    try {
      const r = await http.get<ApiAppointment[] | { items: ApiAppointment[] }>(
        EP.profesionalReservations(Number(profesionalId))
      );
      return Array.isArray(r) ? r : r?.items || [];
    } catch {
      /* Fallback: calendario de la sede filtrado por profesional */
      const todos = await AppointmentsApi.calendar(Number(sedeId)).catch(() => []);
      return (todos || []).filter((a) => String(a.profesionalId) === profesionalId);
    }
  });
}

/* ── Controlador (implementa todas las interfaces) ───────── */
export const BookingController:
  SedesProvider & ClientesProvider & ProfesionalesProvider & ServiciosProvider &
  AgendaProvider & ReservaCreator & { invalidateAll(): void } = {

  /** Sedes de la empresa con datos completos para tarjetas y mapa. */
  async getSedes(empresaId: string): Promise<SedeOpcion[]> {
    const list = await cached(`sedes:${empresaId}`, () =>
      SedesApi.findByEmpresa(Number(empresaId)).catch(() => [] as ApiSede[])
    );
    return (list || []).map(mapSede);
  },

  /**
   * Clientes finales filtrados por nombre, documento, teléfono o
   * correo. El backend no expone búsqueda, así que la lista
   * (cacheada) se filtra en cliente.
   */
  async searchClientes(query: string): Promise<ClienteOpcion[]> {
    const users = await cached("clientes", () => AuthApi.findAllUsers().catch(() => [] as ApiUser[]));
    const clientes = (users || []).filter((u) => u.role === "CLIENT").map(mapCliente);
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.email, c.telefono, c.documento || ""].some((v) => v.toLowerCase().includes(q))
    );
  },

  /** Profesionales de la sede para el carrusel. */
  async getProfesionales(sedeId: string): Promise<ProfesionalCard[]> {
    const list = await cached(`prof:${sedeId}`, () =>
      ProfesionalesApi.findBySede(Number(sedeId)).catch(() => [])
    );
    return (list || []).map((p) => ({
      id: String(p.id),
      nombre: p.nombre,
      especialidad: p.biografia || "",
      biografia: p.biografia || "",
      telefono: p.phone || "",
      foto: p.imagen || null,
      disponible: (p.state || "enabled") !== "disabled",
    }));
  },

  /**
   * Servicios del profesional agrupados por categoría.
   * Fuente única: GET /profesionales/:id/detalle?lang= — devuelve el
   * profesional, su sede y la lista `servicios` con `categoria`.
   */
  async getServiciosPorCategoria(profesionalId: string, lang: string): Promise<CategoriaServicios[]> {
    const detalle = await cached(`detalle:${profesionalId}:${lang}`, () =>
      ProfesionalesApi.detalle(Number(profesionalId), lang)
    );
    const servicios = (detalle?.servicios ?? []).map(mapServicio);
    return agruparPorCategoria(servicios);
  },

  /**
   * Días SIN disponibilidad dentro de la ventana agendable (día
   * completo ocupado). El calendario los bloquea junto con los
   * días pasados.
   */
  async getDiasNoDisponibles(profesionalId: string, sedeId: string, duracionMin: number, excludeAppointmentId?: number): Promise<Set<string>> {
    const citas = await fetchAgenda(profesionalId, sedeId);
    const ocupacion = buildOcupacion(
      excludeAppointmentId ? citas.filter((c) => c.id !== excludeAppointmentId) : citas
    );
    const bloqueados = new Set<string>();
    const hoy = new Date();
    for (let i = 0; i <= DIAS_AGENDABLES; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      const key = ymd(d);
      if (buildSlots(key, duracionMin, ocupacion.get(key) || []).length === 0) bloqueados.add(key);
    }
    return bloqueados;
  },

  /** Franjas reales libres del profesional en una fecha. */
  async getSlotsDisponibles(profesionalId: string, sedeId: string, fecha: string, duracionMin: number, excludeAppointmentId?: number): Promise<SlotHora[]> {
    const citas = await fetchAgenda(profesionalId, sedeId);
    const ocupacion = buildOcupacion(
      excludeAppointmentId ? citas.filter((c) => c.id !== excludeAppointmentId) : citas
    );
    return buildSlots(fecha, duracionMin, ocupacion.get(fecha) || []);
  },

  /**
   * Confirmación: revalida la disponibilidad contra el backend
   * (sin caché) y registra la cita con el CreateAppointmentDto.
   * Al finalizar invalida las consultas afectadas.
   * @throws Error si la franja fue tomada o falta información.
   */
  async crear(draft: BookingDraft): Promise<{ id: number }> {
    const { cliente, profesional, servicio, fecha, slot, metodoPago, sedeId } = draft;
    if (!cliente || !profesional || !servicio || !fecha || !slot || !metodoPago || !sedeId) {
      throw new Error("INCOMPLETE");
    }

    /* Revalidación en vivo de la franja elegida */
    invalidate([`agenda:${profesional.id}:`]);
    const libres = await this.getSlotsDisponibles(profesional.id, sedeId, fecha, servicio.duracion);
    if (!libres.some((s) => s.hora === slot.hora)) throw new Error("SLOT_TAKEN");

    const paymentMethod: ApiPaymentMethod = metodoPago === "tarjeta" ? "CARD" : "CASH";
    const created = await AppointmentsApi.create({
      fecha: slot.inicioISO,
      horaInicio: slot.inicioISO,
      horaFin: slot.finISO,
      duracion: servicio.duracion,
      sedeId: Number(sedeId),
      serviceId: Number(servicio.id),
      profesionalId: Number(profesional.id),
      userId: Number(cliente.id),
      paymentMethod,
      paymentAmount: servicio.precio,
      ...(paymentMethod === "CARD" && draft.card
        ? { cardNumber: draft.card.number, expiryDate: draft.card.expiry, cvv: draft.card.cvv }
        : {}),
    });

    /* La agenda del profesional y su detalle cambiaron: invalidar */
    invalidate([`agenda:${profesional.id}:`, `detalle:${profesional.id}:`]);
    return { id: created.id };
  },

  /** Limpieza total de caché tras finalizar el flujo. */
  invalidateAll(): void {
    cache.clear();
  },
};
