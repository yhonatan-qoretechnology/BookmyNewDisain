/* ============================================================
   Controladores de dominio — consumo exclusivo del API oficial.
   Cada bloque es el espejo de un módulo NestJS del backend.
============================================================ */
import type { Cliente, Empleado, Factura, Resena, SedeDetalle, Servicio } from "@/models";
import {
  AuthApi, CategoriesApi, PaymentsApi, ProfesionalesApi, ResenasApi,
  SedesApi, ServicesApi, ServicesWriteApi,
} from "@/api/modules";

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
        visitas: 0,
        ultima: "—",
      }))
      .filter((c) => (c.nombre + c.correo).toLowerCase().includes(q));
  },
};

/* ── Servicios (ServiceModule + CategoryModule) ──────────── */
export const ServiciosController = {
  /**
   * Lista servicios con traducción y precio — GET /services?language=.
   * @param term Búsqueda por nombre/descripción.
   * @param language Idioma activo del panel.
   */
  async search(term: string, language = "es"): Promise<Servicio[]> {
    const q = term.toLowerCase();
    const list = await ServicesApi.findAll(language).catch(() => []);
    return (list || [])
      .map((sv) => ({
        id: sv.id,
        nombre: sv.name,
        categoria: sv.description || "—",
        duracion: sv.prices?.[0]?.duration ?? 30,
        precio: sv.prices?.[0]?.amount ?? 0,
        activo: true,
      }))
      .filter((s) => (s.nombre + s.categoria).toLowerCase().includes(q));
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
export const ResenasController = {
  /** Lista reseñas — GET /resenas (incluye usuario.UserData). */
  async search(term: string): Promise<Resena[]> {
    const q = term.toLowerCase();
    const list = await ResenasApi.findAll().catch(() => []);
    return (list || [])
      .map((r) => ({
        id: r.id,
        cliente: r.usuario?.UserData?.name || r.usuario?.email || `#${r.usuarioId}`,
        estrellas: Math.round(r.calificacion),
        texto: r.comentario || "",
        fecha: (r.createdAt || "").slice(0, 10),
        respondida: r.estado === "APROBADA",
      }))
      .filter((r) => (r.cliente + r.texto).toLowerCase().includes(q));
  },

  /** Aprueba una reseña — PATCH /resenas/:id/aprobar. */
  async responder(id: number): Promise<void> {
    await ResenasApi.aprobar(id);
  },
};

/* ── Personal (ProfesionalModule) ────────────────────────── */
export const PersonalController = {
  /** Lista profesionales — GET /profesionales. */
  async search(term: string): Promise<Empleado[]> {
    const q = term.toLowerCase();
    const list = await ProfesionalesApi.findAll().catch(() => []);
    return (list || [])
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        rol: p.biografia || "Profesional",
        sede: `#${p.sedeId}`,
        reservas: 0,
        activo: p.state !== "disabled",
      }))
      .filter((p) => (p.nombre + p.rol).toLowerCase().includes(q));
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
    const list = negocioId
      ? await SedesApi.findByEmpresa(Number(negocioId)).catch(() => [])
      : await SedesApi.findAll().catch(() => []);
    return (list || [])
      .map((s) => ({
        id: s.id,
        negocioId: String(s.empresaId),
        nombre: s.nombre,
        direccion: s.direccion,
        equipo: s.profesionales?.length ?? 0,
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
