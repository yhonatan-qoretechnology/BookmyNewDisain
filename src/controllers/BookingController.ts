/* ============================================================
   BookingController — flujo de creación de reservas
   ------------------------------------------------------------
   Casos de uso (Clean Architecture: esta capa orquesta el API y
   expone modelos del dominio; la UI no conoce el HTTP):

     Sede         · getSedes                 GET /sedes/empresa/:id
     Cliente      · searchClientes           GET /clients?empresaId= (acotado)
                  · buscarClientePorContacto POST /clients/search
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
import { DIAS_AGENDABLES } from "@/constants";
import {
  AppointmentsApi, DisponibilidadApi, ProfesionalesApi, SedesApi,
} from "@/api/modules";
import { ApiError, http, qs } from "@/api/http";
import { EP } from "@/api/endpoints";
import type {
  ApiAppointment, ApiClient, ApiClientsPage, ApiDisponibilidadProfesional,
  ApiPaymentMethod, ApiRequiereContinuacion, ApiSede, ApiServicioProfesional,
  CreateAppointmentDto,
} from "@/api/types";
import {
  construirSlots, ocupacionDeCita, resolverCierres, resolverHorario,
  type Ocupacion,
} from "@/lib/disponibilidad";
import { zonaDiaSemana, zonaHoy, zonaYmd } from "@/lib/timezone";

/* ── Interfaces por caso de uso (ISP) ────────────────────── */
export interface SedesProvider {
  getSedes(empresaId: string): Promise<SedeOpcion[]>;
}
export interface ClientesProvider {
  /** @param empresaId negocio para el que se reserva (acota al SUPER_ADMIN). */
  searchClientes(query: string, empresaId?: string): Promise<ClienteOpcion[]>;
  buscarClientePorContacto(termino: string): Promise<ClienteOpcion | null>;
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
  /** Confirma el servicio partido en dos días (POST /appointments/con-continuacion). */
  crearConContinuacion(draft: BookingDraft): Promise<{ partes: ApiAppointment[] }>;
}

/* ── Caché simple con TTL (evita duplicados en el flujo) ─── */
const TTL_MS = 60_000;
/* ── Servicio que no entra antes del cierre y se parte en dos días ──
   El backend responde 400 con code "REQUIERE_CONTINUACION" y los datos
   de las dos partes; el panel lo convierte en este error para poder
   preguntarle al cliente antes de confirmar. */
export type DatosContinuacion = ApiRequiereContinuacion["continuacion"];

export class ErrorRequiereContinuacion extends Error {
  continuacion: DatosContinuacion;
  constructor(continuacion: DatosContinuacion) {
    super("REQUIERE_CONTINUACION");
    this.name = "ErrorRequiereContinuacion";
    this.continuacion = continuacion;
  }
}

/** Lee el cuerpo del 400 y devuelve los datos de la continuación, si los trae. */
function leerContinuacion(e: unknown): DatosContinuacion | null {
  if (!(e instanceof ApiError)) return null;
  const body = e.body as Partial<ApiRequiereContinuacion> | null;
  return body?.code === "REQUIERE_CONTINUACION" && body.continuacion
    ? body.continuacion
    : null;
}

/** CreateAppointmentDto exacto a partir del borrador del asistente. */
function payloadDeReserva(draft: BookingDraft): CreateAppointmentDto {
  const { cliente, profesional, servicio, slot, sedeId, metodoPago } = draft;
  if (!cliente || !profesional || !servicio || !slot || !sedeId || !metodoPago) {
    throw new Error("INCOMPLETE");
  }
  const paymentMethod: ApiPaymentMethod = metodoPago === "tarjeta" ? "CARD" : "CASH";
  return {
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
  };
}

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

function mapCliente(c: ApiClient): ClienteOpcion {
  return {
    id: String(c.id),
    nombre: c.userData?.name || c.email,
    email: c.email,
    telefono: c.userData?.phone || "",
    foto: c.fotoPerfil ?? null,
    documento: undefined, // el API no expone documento; hook de extensión
  };
}

/* ── Clientes del negocio (GET /clients) ─────────────────── */
/* El backend limita la página a 200 (ClientListDto: @Max(200)). Se piden
   varias de una vez para poder seguir filtrando en el navegador —escribir
   en el buscador no lanza una petición por tecla— sin dejar fuera a los
   clientes antiguos de un negocio grande; el tope de páginas evita que una
   cartera enorme se traiga sola. A quien quede fuera se llega con la
   búsqueda exacta por correo o teléfono. */
const CLIENTES_POR_PAGINA = 200;
const MAX_PAGINAS_CLIENTES = 5;

async function fetchClientes(empresaId?: string): Promise<ApiClient[]> {
  return cached(`clientes:${empresaId || "sesion"}`, async () => {
    const todos: ApiClient[] = [];
    for (let page = 1; page <= MAX_PAGINAS_CLIENTES; page++) {
      const pagina = await http
        .get<ApiClientsPage>(EP.clients + qs({ empresaId, page, limit: CLIENTES_POR_PAGINA }))
        .catch(() => null);
      if (!pagina?.clients?.length) break;
      todos.push(...pagina.clients);
      if (!pagina.pagination?.hasNext) break;
    }
    return todos;
  });
}

/**
 * ¿Se puede ir a buscar este término fuera de la cartera del negocio?
 * Solo si es un correo o un teléfono COMPLETOS: POST /clients/search es
 * exacta a propósito, para que nadie recorra los clientes de los demás
 * negocios a base de búsquedas parciales.
 * @returns el cuerpo que espera el backend, o `null` si no sirve.
 */
export function contactoDeBusqueda(termino: string): { email?: string; telefono?: string } | null {
  const t = termino.trim();
  if (!t) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return { email: t };
  /* El teléfono se envía tal cual: el backend lo compara con lo guardado
     en `user_data`, sin normalizar, así que tiene que escribirse igual. */
  const digitos = t.match(/\d/g)?.length ?? 0;
  if (digitos >= 7 && /^\+?[\d\s().-]+$/.test(t)) return { telefono: t };
  return null;
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

/**
 * Intervalos ocupados del profesional, agrupados por fecha de Madrid.
 * Las citas canceladas y las marcadas como no presentadas liberan hueco.
 */
function buildOcupacion(citas: ApiAppointment[]): Map<string, Ocupacion[]> {
  const map = new Map<string, Ocupacion[]>();
  for (const a of citas) {
    if (a.estado === "CANCELLED" || a.estado === "NO_SHOW") continue;
    if (!a.horaInicio) continue;
    const ini = new Date(a.horaInicio);
    if (Number.isNaN(ini.getTime())) continue;
    const finIso =
      a.horaFin || new Date(ini.getTime() + (a.duracion || 30) * 60000).toISOString();
    /* La clave es el día en Madrid, no el de UTC: una cita de las 00:30
       de Madrid pertenece al día anterior en UTC. */
    const key = zonaYmd(ini);
    const arr = map.get(key) || [];
    arr.push(ocupacionDeCita(a.horaInicio, finIso));
    map.set(key, arr);
  }
  return map;
}

/** Datos de la sede y del profesional que condicionan las franjas. */
interface ContextoAgenda {
  sede: Pick<ApiSede, "horario" | "diasCerrado">;
  horarios: Awaited<ReturnType<typeof DisponibilidadApi.horarioSede>>;
  cierres: ReturnType<typeof resolverCierres>;
  /** Disponibilidad del profesional indexada por fecha de Madrid */
  disponibilidadPorDia: Map<string, ApiDisponibilidadProfesional>;
}

/**
 * Reúne horario, cierres y disponibilidad reales. Se cachea porque el
 * asistente consulta el mismo contexto en cada paso del calendario.
 */
async function fetchContexto(sedeId: string, profesionalId: string): Promise<ContextoAgenda> {
  return cached(`ctx:${sedeId}:${profesionalId}`, async () => {
    const desde = zonaHoy();
    const hastaDate = new Date();
    hastaDate.setDate(hastaDate.getDate() + DIAS_AGENDABLES + 1);
    const hasta = zonaYmd(hastaDate);

    const [sedes, horarios, cierresRaw, dispo] = await Promise.all([
      SedesApi.findOne(Number(sedeId)).catch(() => null),
      DisponibilidadApi.horarioSede(Number(sedeId)).catch(() => []),
      DisponibilidadApi.diasCerrados(Number(sedeId), desde, hasta).catch(() => []),
      DisponibilidadApi.profesional(Number(profesionalId), desde, hasta).catch(() => []),
    ]);

    const sede = sedes ?? { horario: null, diasCerrado: [] };
    const disponibilidadPorDia = new Map<string, ApiDisponibilidadProfesional>();
    for (const d of dispo || []) {
      const f = new Date(d.fecha);
      if (!Number.isNaN(f.getTime())) disponibilidadPorDia.set(zonaYmd(f), d);
    }

    return {
      sede,
      horarios: horarios || [],
      cierres: resolverCierres(sede, cierresRaw || []),
      disponibilidadPorDia,
    };
  });
}

/** Franjas libres de un día usando el horario real de la sede. */
function buildSlots(
  ctx: ContextoAgenda,
  fecha: string,
  duracionMin: number,
  ocupadas: Ocupacion[],
): SlotHora[] {
  const diaSemana = zonaDiaSemana(new Date(`${fecha}T12:00:00Z`));
  const horarios = resolverHorario(ctx.sede, ctx.horarios, diaSemana);

  return construirSlots({
    fecha,
    duracionMin,
    horarios,
    cierres: ctx.cierres,
    disponibilidad: ctx.disponibilidadPorDia.get(fecha) ?? null,
    ocupadas,
  });
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
   * Clientes del negocio para el paso de cliente — GET /clients.
   *
   * Antes salía de GET /auth/users filtrando role CLIENT en el navegador,
   * así que el paso traía la lista entera de usuarios de la plataforma.
   * /clients llega ya acotado por la sesión; `empresaId` es para el
   * SUPER_ADMIN, que sí ve a todos y aquí tiene que ver solo los del
   * negocio para el que está reservando.
   *
   * El filtro por nombre, correo o teléfono se aplica sobre la lista
   * cacheada, no en el servidor, para no pedir una página por tecla.
   */
  async searchClientes(query: string, empresaId?: string): Promise<ClienteOpcion[]> {
    const clientes = (await fetchClientes(empresaId)).map(mapCliente);
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) =>
      [c.nombre, c.email, c.telefono, c.documento || ""].some((v) => v.toLowerCase().includes(q))
    );
  },

  /**
   * Trae a un cliente que todavía no ha reservado en el negocio —
   * POST /clients/search con el correo o el teléfono COMPLETOS.
   * @returns el cliente, o `null` si no hay ninguno con esos datos o si
   *   el término no es un correo ni un teléfono.
   */
  async buscarClientePorContacto(termino: string): Promise<ClienteOpcion | null> {
    const contacto = contactoDeBusqueda(termino);
    if (!contacto) return null;
    try {
      return mapCliente(await http.post<ApiClient>(EP.clientsSearch, contacto));
    } catch (e) {
      /* 404 es una respuesta de la búsqueda («no existe»), no un fallo. */
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
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
    const [citas, ctx] = await Promise.all([
      fetchAgenda(profesionalId, sedeId),
      fetchContexto(sedeId, profesionalId),
    ]);
    const ocupacion = buildOcupacion(
      excludeAppointmentId ? citas.filter((c) => c.id !== excludeAppointmentId) : citas
    );
    const bloqueados = new Set<string>();
    /* Se recorre la ventana agendable en días de Madrid, que es el
       calendario que ve el usuario. */
    const base = new Date();
    for (let i = 0; i <= DIAS_AGENDABLES; i++) {
      const d = new Date(base.getTime());
      d.setDate(d.getDate() + i);
      const key = zonaYmd(d);
      if (buildSlots(ctx, key, duracionMin, ocupacion.get(key) || []).length === 0) {
        bloqueados.add(key);
      }
    }
    return bloqueados;
  },

  /** Franjas reales libres del profesional en una fecha. */
  async getSlotsDisponibles(profesionalId: string, sedeId: string, fecha: string, duracionMin: number, excludeAppointmentId?: number): Promise<SlotHora[]> {
    const [citas, ctx] = await Promise.all([
      fetchAgenda(profesionalId, sedeId),
      fetchContexto(sedeId, profesionalId),
    ]);
    const ocupacion = buildOcupacion(
      excludeAppointmentId ? citas.filter((c) => c.id !== excludeAppointmentId) : citas
    );
    return buildSlots(ctx, fecha, duracionMin, ocupacion.get(fecha) || []);
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

    try {
      const created = await AppointmentsApi.create(payloadDeReserva(draft));
      /* La agenda del profesional y su detalle cambiaron: invalidar */
      invalidate([`agenda:${profesional.id}:`, `detalle:${profesional.id}:`]);
      return { id: created.id };
    } catch (e) {
      /* El servicio no entra completo antes del cierre pero admite partirse
         en dos días: no es un fallo, hay que preguntárselo al cliente. */
      const continuacion = leerContinuacion(e);
      if (continuacion) throw new ErrorRequiereContinuacion(continuacion);
      throw e;
    }
  },

  /**
   * Confirma el servicio partido en dos días — POST /appointments/con-continuacion.
   * Va el MISMO payload que el intento original, sin tocar nada.
   * @returns las dos partes enlazadas, o una sola cita si para entonces ya
   *   se liberó un hueco y no hizo falta partir.
   */
  async crearConContinuacion(draft: BookingDraft): Promise<{ partes: ApiAppointment[] }> {
    const { profesional } = draft;
    if (!profesional) throw new Error("INCOMPLETE");
    const res = await AppointmentsApi.createConContinuacion(payloadDeReserva(draft));
    invalidate([`agenda:${profesional.id}:`, `detalle:${profesional.id}:`]);
    const partes = "parte1" in res ? [res.parte1, res.parte2] : [res];
    return { partes };
  },

  /** Limpieza total de caché tras finalizar el flujo. */
  invalidateAll(): void {
    cache.clear();
  },
};
