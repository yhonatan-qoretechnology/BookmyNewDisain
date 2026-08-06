/* ============================================================
   Controladores de dominio — consumo exclusivo del API oficial.
   Cada bloque es el espejo de un módulo NestJS del backend.
============================================================ */
import type {
  CategoriaCatalogo, CredencialesEmpleado, Cliente, Empleado, Factura, Reserva,
  Resena, SedeDetalle, Servicio, Session,
} from "@/models";
import {
  AsignacionesApi, AuthApi, CategoriesApi, ClientsApi, ImagenesApi, PaymentsApi, ProfesionalesApi,
  ResenasApi, SedesApi, ServicesApi, ServicesWriteApi,
} from "@/api/modules";
import type {
  ApiClient, ApiProfesional, ApiService, ApiServicioAsignable, ClientUpdatePayload,
} from "@/api/types";
import { ReservasController } from "./ReservasController";

/* ── Clientes (ClientManagementModule: GET /clients) ─────── */
/** Nº de visitas y última visita, calculadas desde las citas. */
interface EstadisticasCliente {
  visitas: number;
  ultima: string;
}

/**
 * Agrupa las citas por cliente.
 * Se cuenta como visita toda cita ya pasada que no esté cancelada ni
 * marcada como no presentada; la última visita es la más reciente de
 * ellas. El alcance lo fija la sesión (una sede, las de la empresa o
 * todas), así que un admin de sede solo ve lo suyo.
 */
function agruparVisitas(reservas: Reserva[]): Map<number, EstadisticasCliente> {
  const hoy = new Date().toISOString().slice(0, 10);
  const porCliente = new Map<number, EstadisticasCliente>();

  for (const r of reservas) {
    if (r.clienteId == null) continue;
    if (r.estado === "cancelado" || r.estado === "noShow") continue;
    if (r.fecha > hoy) continue; // aún no ha ocurrido

    const previo = porCliente.get(r.clienteId);
    if (!previo) {
      porCliente.set(r.clienteId, { visitas: 1, ultima: r.fecha });
    } else {
      previo.visitas += 1;
      if (r.fecha > previo.ultima) previo.ultima = r.fecha;
    }
  }

  return porCliente;
}

export const ClientesController = {
  /**
   * Clientes finales — GET /clients (ClientManagementModule).
   *
   * Sustituye a /auth/users: el backend ya filtra por role CLIENT,
   * pagina y aplica el guard de rol, y la respuesta pesa ~6 veces
   * menos. El endpoint filtra por `name` y `email` de forma
   * independiente (combinados serían AND), así que para conservar la
   * búsqueda «nombre O correo» se lanzan las dos y se fusionan.
   *
   * @param term Texto libre: se busca en nombre y en correo.
   * @param session Sesión activa; delimita las citas para las visitas.
   */
  async search(term: string, session?: Session | null): Promise<Cliente[]> {
    const q = term.trim();

    const paginas = q
      ? await Promise.all([
          ClientsApi.list({ name: q, limit: 100 }).catch(() => null),
          ClientsApi.list({ email: q, limit: 100 }).catch(() => null),
        ])
      : [await ClientsApi.list({ limit: 100 }).catch(() => null)];

    /* Fusión por id para no repetir a quien coincide por ambos campos */
    const unicos = new Map<number, ApiClient>();
    for (const p of paginas) {
      for (const c of p?.clients ?? []) unicos.set(c.id, c);
    }

    /* Visitas reales en lugar de los ceros que se mostraban antes */
    const reservas = session
      ? await ReservasController.getForSession(session).catch(() => [] as Reserva[])
      : [];
    const stats = agruparVisitas(reservas);

    return [...unicos.values()].map((c) => {
      const s = stats.get(c.id);
      return {
        id: c.id,
        nombre: c.userData?.name || c.email,
        correo: c.email,
        telefono: c.userData?.phone || "—",
        foto: c.fotoPerfil || null,
        estado: c.state,
        visitas: s?.visitas ?? 0,
        ultima: s?.ultima ?? "—",
      };
    });
  },

  /**
   * Ficha completa — GET /clients/:id. Trae además el `historial`
   * (citas, pagos, reseñas), que es lo que decide si al dar de baja
   * la cuenta se borrará o solo se anonimizará.
   */
  getDetalle: (id: number) => ClientsApi.findOne(id),

  /**
   * PATCH /clients/:id. Solo se envían los campos con valor para no
   * pisar con cadenas vacías lo que el cliente ya tenía guardado.
   */
  async update(id: number, datos: ClientUpdatePayload): Promise<ApiClient> {
    const limpio: ClientUpdatePayload = {};
    for (const [clave, valor] of Object.entries(datos)) {
      if (valor === undefined) continue;
      if (typeof valor === "string" && !valor.trim()) continue;
      (limpio as Record<string, unknown>)[clave] =
        typeof valor === "string" ? valor.trim() : valor;
    }
    return ClientsApi.update(id, limpio);
  },

  /** PATCH /clients/:id/password — el admin no necesita la anterior. */
  cambiarPassword: (id: number, password: string) =>
    ClientsApi.changePassword(id, password),

  /**
   * DELETE /clients/:id. Devuelve `mode` para poder contar al usuario
   * qué ocurrió: `deleted` (se borró) o `anonymized` (tenía historial
   * de facturación y solo se anonimizaron sus datos).
   */
  remove: (id: number) => ClientsApi.remove(id),
};

/* ── Servicios (ServiceModule + CategoryModule) ──────────── */

/** Categoría de respaldo cuando el servicio no tiene ninguna asignada */
export const SIN_CATEGORIA = "Sin categoría";

/**
 * Resuelve el nombre de la categoría de un servicio tolerando las
 * distintas formas en que el backend puede serializar la relación:
 * `category.name`, `category.translations[]` o solo `categoryId`.
 */
function nombreCategoria(
  sv: ApiService,
  porId: Map<number, string>,
  language: string
): string {
  const cat = sv.category;
  if (cat?.name) return cat.name;
  const trads = cat?.translations ?? [];
  const propia = trads.find((tr) => tr.language === language) ?? trads[0];
  if (propia?.name) return propia.name;
  const id = cat?.id ?? sv.categoryId;
  return (id != null ? porId.get(id) : undefined) || SIN_CATEGORIA;
}

export const ServiciosController = {
  /**
   * Lista servicios con traducción y precio — GET /services?language=.
   * @param term Búsqueda por nombre/descripción.
   * @param language Idioma activo del panel.
   */
  async search(term: string, language = "es"): Promise<Servicio[]> {
    const q = term.toLowerCase();
    /* GET /services ya resuelve el nombre de la categoría. Antes se
       pedían también todas las categorías para completarlo, lo que
       suponía una segunda petición en cada pulsación del buscador;
       nombreCategoria conserva ese camino como respaldo. */
    const list = await ServicesApi.findAll(language).catch(() => []);
    const porId = new Map<number, string>();
    return (list || [])
      .map((sv) => ({
        id: sv.id,
        nombre: sv.name,
        categoria: nombreCategoria(sv, porId, language),
        descripcion: sv.description || "",
        duracion: sv.prices?.[0]?.duration ?? 30,
        precio: sv.prices?.[0]?.amount ?? 0,
        activo: true,
      }))
      .filter((s) => (s.nombre + s.categoria + s.descripcion).toLowerCase().includes(q));
  },

  /** Agrupa el catálogo por categoría conservando el orden de aparición. */
  agruparPorCategoria(servicios: Servicio[]): CategoriaCatalogo[] {
    const grupos = new Map<string, Servicio[]>();
    for (const s of servicios) {
      const lista = grupos.get(s.categoria);
      if (lista) lista.push(s);
      else grupos.set(s.categoria, [s]);
    }
    return Array.from(grupos, ([categoria, lista]) => ({ categoria, servicios: lista }));
  },

  /**
   * Categorías para el alta — GET /categories?language=.
   * @returns Opciones { id, nombre } con la traducción resuelta.
   */
  async getCategorias(language = "es"): Promise<Array<{ id: number; nombre: string }>> {
    const list = await CategoriesApi.findAll(language).catch(() => []);
    return (list || []).map((c) => ({
      id: c.id,
      nombre: c.translations?.[0]?.name || `#${c.id}`,
    }));
  },

  /**
   * Crea un servicio — POST /services con el CreateServiceDto exacto
   * (categoryId + translations[] + prices[]).
   */
  async create(input: {
    nombre: string;
    descripcion?: string;
    categoryId: number;
    duracion: number;
    precio: number;
    language: string;
  }): Promise<void> {
    await ServicesWriteApi.create({
      categoryId: input.categoryId,
      translations: [
        { language: input.language, name: input.nombre, description: input.descripcion },
      ],
      prices: [{ amount: input.precio, duration: input.duracion, currency: "EUR" }],
    });
  },

  /** Elimina un servicio y sus dependencias — DELETE /services/:id. */
  async remove(id: number): Promise<void> {
    await ServicesWriteApi.remove(id);
  },
};

/* ── Facturación (PaymentModule) ─────────────────────────── */
export const FacturasController = {
  /**
   * Pagos como facturación — GET /payments.
   * PaymentStatus: PAID→pagado · PENDING/RESERVED→pendiente ·
   * FAILED/CANCELLED→cancelado.
   */
  async search(term: string): Promise<Factura[]> {
    const q = term.toLowerCase();
    const list = await PaymentsApi.findAll().catch(() => []);
    return (list || [])
      .map((p) => ({
        id: `PAY-${p.id}`,
        cliente: p.user?.UserData?.name || p.user?.email || `#${p.appointmentId}`,
        foto: p.user?.fotoPerfil || null,
        fecha: (p.createdAt || "").slice(0, 10) || "—",
        total: p.totalAmount,
        estado: (p.status === "PAID"
          ? "pagado"
          : p.status === "FAILED" || p.status === "CANCELLED"
            ? "cancelado"
            : "pendiente") as Factura["estado"],
      }))
      .filter((f) => (f.cliente + f.id).toLowerCase().includes(q));
  },
};

/* ── Reseñas (ResenaModule) ──────────────────────────────── */
const RESENA_ESTADO: Record<string, Resena["estado"]> = {
  PENDIENTE: "pendiente",
  APROBADA: "aprobada",
  RECHAZADA: "rechazada",
};

export const ResenasController = {
  /** Lista reseñas — GET /resenas (incluye usuario.UserData). */
  async search(term: string): Promise<Resena[]> {
    const q = term.toLowerCase();
    const list = await ResenasApi.findAll().catch(() => []);
    return (list || [])
      .map((r) => {
        const estado = RESENA_ESTADO[r.estado] ?? (r.aprobado ? "aprobada" : "pendiente");
        return {
          id: r.id,
          cliente: r.usuario?.UserData?.name || r.usuario?.email || `#${r.usuarioId}`,
          email: r.usuario?.email || "",
          foto: r.usuario?.fotoPerfil || null,
          estrellas: Math.round(r.calificacion),
          texto: r.comentario || "",
          fecha: (r.createdAt || "").slice(0, 10),
          estado,
          aprobada: estado === "aprobada",
        };
      })
      .filter((r) => (r.cliente + r.texto).toLowerCase().includes(q));
  },

  /**
   * Publica o rechaza una reseña — PATCH /resenas/:id/aprobar.
   * El backend deja `estado` en APROBADA o RECHAZADA según el valor.
   * @param aprobado true la publica, false la rechaza.
   */
  async aprobar(id: number, aprobado = true): Promise<void> {
    await ResenasApi.aprobar(id, aprobado);
  },
};

/* ── Personal (ProfesionalModule + AuthModule) ───────────── */

/** Contraseña temporal legible (sin caracteres ambiguos) */
function generarPassword(largo = 10): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => abc[n % abc.length]).join("");
}

export const PersonalController = {
  /**
   * Lista profesionales — GET /profesionales, con el nombre de la
   * sede resuelto a partir de las sedes visibles para la sesión.
   * @param term Búsqueda por nombre o rol.
   * @param sedes Sedes { id, nombre } ya cargadas por la vista.
   */
  async search(
    term: string,
    sedes: Array<{ id: string; nombre: string }> = []
  ): Promise<Empleado[]> {
    const q = term.toLowerCase();
    const list = await ProfesionalesApi.findAll().catch(() => []);
    const nombreSede = new Map(sedes.map((s) => [s.id, s.nombre]));
    return (list || [])
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        rol: p.biografia || "Profesional",
        /* Misma fuente que el carrusel de profesionales del agendado */
        foto: p.imagen || null,
        sede: nombreSede.get(String(p.sedeId)) || "—",
        sedeId: String(p.sedeId),
        telefono: p.phone || "",
        reservas: 0,
        activo: p.state !== "disabled",
        userId: p.user_id ?? null,
      }))
      .filter((p) => (p.nombre + p.rol).toLowerCase().includes(q));
  },

  /** Edita un profesional — PATCH /profesionales/:id. */
  async update(
    id: number,
    input: { nombre: string; rol: string; telefono: string; sedeId: string }
  ): Promise<void> {
    await ProfesionalesApi.update(id, {
      nombre: input.nombre.trim(),
      phone: input.telefono.trim(),
      biografia: input.rol.trim(),
      sedeId: Number(input.sedeId),
    });
  },

  /**
   * Crea el usuario de acceso del empleado y lo vincula al profesional
   * para que pueda entrar al panel y ver su calendario:
   *   1. POST /auth/register  → usuario con rol EMPLOYEE
   *   2. PATCH /profesionales/:id { user_id } → vínculo
   * La contraseña se genera aquí y se devuelve UNA sola vez para
   * entregarla al empleado (el backend la almacena cifrada).
   * @throws ApiError si el correo ya existe o el DTO no coincide.
   */
  async crearAcceso(
    empleado: Empleado,
    email: string
  ): Promise<CredencialesEmpleado> {
    const password = generarPassword();
    const creado = await AuthApi.register({
      email: email.trim().toLowerCase(),
      password,
      name: empleado.nombre,
      phone: empleado.telefono || undefined,
      role: "EMPLOYEE",
    });
    const userId = creado?.user?.id ?? creado?.id;
    if (userId != null) {
      /* Vínculo profesional ⇄ usuario (columna user_id) */
      await ProfesionalesApi.update(empleado.id, { user_id: Number(userId) }).catch(() => undefined);
    }
    return { email: email.trim().toLowerCase(), password };
  },

  /**
   * Restablece la contraseña de un empleado que ya tiene usuario —
   * PATCH /auth/users/:id { password }.
   */
  async regenerarPassword(userId: number, email: string): Promise<CredencialesEmpleado> {
    const password = generarPassword();
    await AuthApi.updateUser(userId, { password });
    return { email, password };
  },

  /** Elimina un profesional — DELETE /profesionales/:id. */
  async remove(id: number): Promise<void> {
    await ProfesionalesApi.remove(id);
  },
};

/* ── Sedes (SedeModule, multi-tenant) ────────────────────── */
export const SedesController = {
  /**
   * Sedes de la empresa — GET /sedes/empresa/:empresaId.
   * @param term Búsqueda por nombre/dirección.
   * @param negocioId Empresa (tenant) de la sesión.
   */
  async search(term: string, negocioId: string): Promise<SedeDetalle[]> {
    const q = term.toLowerCase();
    /* El listado de sedes no siempre incluye la relación `profesionales`,
       así que el equipo se cuenta con una única consulta a
       GET /profesionales agrupada por sedeId. */
    const [list, profesionales] = await Promise.all([
      negocioId
        ? SedesApi.findByEmpresa(Number(negocioId)).catch(() => [])
        : SedesApi.findAll().catch(() => []),
      ProfesionalesApi.findAll().catch(() => [] as ApiProfesional[]),
    ]);
    const equipoPorSede = new Map<number, number>();
    for (const p of profesionales || []) {
      equipoPorSede.set(p.sedeId, (equipoPorSede.get(p.sedeId) || 0) + 1);
    }
    return (list || [])
      .map((s) => ({
        id: s.id,
        negocioId: String(s.empresaId),
        nombre: s.nombre,
        direccion: s.direccion,
        equipo: equipoPorSede.get(s.id) ?? s.profesionales?.length ?? 0,
        activa: true,
        imagenes: s.imagenes ?? [],
      }))
      .filter((s) => (s.nombre + s.direccion).toLowerCase().includes(q));
  },

  /** Crea una sede — POST /sedes { nombre, direccion, empresaId }. */
  async add(input: { nombre: string; direccion: string; negocioId: string }): Promise<void> {
    await SedesApi.create({
      nombre: input.nombre,
      direccion: input.direccion,
      empresaId: Number(input.negocioId),
    });
  },

  /**
   * Añade una imagen a la sede — POST /sedes/:id/imagen (campo "imagen").
   * El backend la agrega al array `imagenes` y devuelve la sede entera.
   * @returns el listado de imágenes ya actualizado.
   */
  async subirImagen(sedeId: number, file: File): Promise<string[]> {
    const actualizada = await ImagenesApi.sede(sedeId, file);
    return actualizada?.imagenes ?? [];
  },

  /** Quita una imagen — DELETE /sedes/:id/imagenes { imagenes: [ruta] }. */
  async borrarImagen(sedeId: number, ruta: string): Promise<string[]> {
    const actualizada = await ImagenesApi.borrarSedeImagenes(sedeId, [ruta]);
    return actualizada?.imagenes ?? [];
  },
};

/* ── Servicios por sede y profesional ─────────────────────── */

export interface ServicioAsignable {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  moneda: string;
  duracion: number;
  asignado: boolean;
  asignacionId: number | null;
}

/**
 * Gestiona qué servicios presta cada profesional en cada sede.
 *
 * Escribe en service_sede_profesional, que es la tabla que valida el
 * backend al crear una cita. La relación Sede<->Service (la que usa el
 * control de permisos) la sincroniza el propio backend, asi que desde
 * aqui no hay que tocarla.
 */
export const AsignacionesController = {
  /** Catálogo completo de la sede con el estado de asignación. */
  async listar(
    sedeId: number,
    profesionalId: number,
    language = "es",
  ): Promise<ServicioAsignable[]> {
    const list = await AsignacionesApi.porProfesional(sedeId, profesionalId, language)
      .catch(() => [] as ApiServicioAsignable[]);
    return (list || []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      categoria: s.categoria || "—",
      precio: s.precios?.[0]?.amount ?? 0,
      moneda: s.precios?.[0]?.currency ?? "EUR",
      duracion: s.precios?.[0]?.duration ?? 0,
      asignado: s.asignado,
      asignacionId: s.asignacionId,
    }));
  },

  /**
   * Activa o desactiva un servicio para ese profesional.
   * @returns el nuevo `asignacionId`, o null si se desasignó.
   */
  async alternar(
    servicio: ServicioAsignable,
    sedeId: number,
    profesionalId: number,
  ): Promise<number | null> {
    if (servicio.asignado && servicio.asignacionId != null) {
      await AsignacionesApi.quitar(servicio.asignacionId);
      return null;
    }
    const creada = await AsignacionesApi.asignar({
      sedeId,
      serviceId: servicio.id,
      profesionalId,
    });
    return creada?.id ?? null;
  },
};
