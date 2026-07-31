/* ============================================================
   Controladores de dominio — consumo exclusivo del API oficial.
   Cada bloque es el espejo de un módulo NestJS del backend.
============================================================ */
import type {
  CategoriaCatalogo, CredencialesEmpleado, Cliente, Empleado, Factura, Resena,
  SedeDetalle, Servicio,
} from "@/models";
import {
  AuthApi, CategoriesApi, PaymentsApi, ProfesionalesApi, ResenasApi,
  SedesApi, ServicesApi, ServicesWriteApi,
} from "@/api/modules";
import type { ApiProfesional, ApiService } from "@/api/types";

/* ── Clientes (AuthModule: Users con role CLIENT) ────────── */
export const ClientesController = {
  /**
   * Lista y filtra clientes finales — GET /auth/users (role CLIENT).
   * @param term Texto de búsqueda por nombre o correo.
   */
  async search(term: string): Promise<Cliente[]> {
    const q = term.toLowerCase();
    const users = await AuthApi.findAllUsers().catch(() => []);
    return (users || [])
      .filter((u) => u.role === "CLIENT")
      .map((u) => ({
        id: u.id,
        nombre: u.UserData?.name || u.email,
        correo: u.email,
        telefono: u.UserData?.phone || "—",
        /* Misma fuente que usa el popup de reservas para la foto */
        foto: u.fotoPerfil || null,
        visitas: 0,
        ultima: "—",
      }))
      .filter((c) => (c.nombre + c.correo).toLowerCase().includes(q));
  },
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
    /* Las categorías se piden aparte para resolver el nombre cuando
       GET /services devuelve la relación sin traducir (solo el id). */
    const [list, categorias] = await Promise.all([
      ServicesApi.findAll(language).catch(() => []),
      this.getCategorias(language).catch(() => [] as Array<{ id: number; nombre: string }>),
    ]);
    const porId = new Map(categorias.map((c) => [c.id, c.nombre]));
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

  /** Aprueba una reseña (la publica) — PATCH /resenas/:id/aprobar. */
  async aprobar(id: number): Promise<void> {
    await ResenasApi.aprobar(id);
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
};
