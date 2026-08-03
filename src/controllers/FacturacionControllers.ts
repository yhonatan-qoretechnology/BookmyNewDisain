/* ============================================================
   Facturación — Controllers (Emisor + Facturas + Gastos)
   ------------------------------------------------------------
   · FacturasController  → una factura por cada pago real del API
                           (PaymentModule, GET /payments/filter) con
                           alcance por rol resuelto en el front, ya
                           que el endpoint no valida token/rol.
   · FiltroFacturasController → opciones de empresa/sede para los
                           selectores de Facturación, según el rol.
   · EmisorController    → datos de la empresa (logo, NIT, contacto)
                           y de la sede, para la cabecera de la factura.
   · CategoriasGastoController → categorías base + propias de la empresa
                           (GET/POST/DELETE /categorias-gasto).
   · GastosController    → CRUD contra GastoModule (/gastos). El alcance
                           por sede lo resuelve el backend con el token,
                           así que aquí no se filtra por rol a mano.
============================================================ */
import type { Session } from "@/models";
import { fotoUrl } from "@/constants";
import {
  CategoriasGastoApi, EmpresasApi, GastosApi, PaymentsApi, SedesApi,
} from "@/api/modules";
import type { ApiCategoriaGasto, ApiGasto, ApiPaymentFiltered } from "@/api/types";

/* ============================================================
   Tipos
============================================================ */
export type EstadoFactura = "pagado" | "pendiente" | "cancelado";

/** Datos de la empresa que encabezan la factura */
export interface Emisor {
  nombre: string;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  logo: string | null;
  /** Sede que presta el servicio */
  sedeNombre: string | null;
  sedeDireccion: string | null;
  sedeTelefono: string | null;
}

export interface FacturaItem {
  concepto: string;
  cantidad: number;
  precio: number;
}

export interface Factura {
  id: string;            // ID Factura (ej. F-0001)
  reservaId: string;     // reserva que la originó
  cliente: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  /** Foto de perfil del cliente (heredada de la reserva de origen) */
  clienteFoto?: string | null;
  servicio: string;
  fecha: string;         // ISO yyyy-mm-dd
  hora?: string;
  total: number;
  moneda: string;
  estado: EstadoFactura;
  sedeId?: string;
  sedeNombre?: string;
  profesional?: string;
  metodoPago?: string;
  items: FacturaItem[];
}

/**
 * Categoría de gasto tal como la maneja el panel. Las `isBase` vienen de
 * la plataforma (comunes a todas las empresas y no eliminables); el resto
 * son propias de la empresa de la sesión.
 */
export interface CategoriaGasto {
  id: number;
  nombre: string;
  isBase: boolean;
}

export interface Gasto {
  /** id numérico del backend, en texto (clave de React y params de ruta) */
  id: string;
  gasto: string;             // descripcion del backend
  /** Nombre de la categoría, para pintar y filtrar */
  categoria: string;
  /** id real de la categoría, necesario al crear/actualizar */
  categoriaId: number;
  fecha: string;             // ISO yyyy-mm-dd
  /** URL pública del comprobante (ya absoluta), o null */
  ticket: string | null;
  ticketNombre?: string;     // nombre de archivo original
  total: number;
  sedeId: number;
  sedeNombre?: string;
}

export interface FiltrosFactura {
  /** Búsqueda libre: coincide con ID, cliente o servicio */
  q?: string;
  fecha?: string;
  /** Solo superadmin: acota a las sedes de una empresa (resuelve sus IDs). */
  empresaId?: string;
  /** Superadmin/owner: acota a una sede concreta. */
  sedeId?: string;
}

export interface FiltrosGasto {
  gasto?: string;
  /** Nombre de la categoría ("" = todas). Se aplica en cliente: el
      endpoint solo filtra por sede/empresa. */
  categoria?: string;
  fecha?: string;
  /** Acota a una sede concreta dentro del alcance del usuario. */
  sedeId?: string;
}

/* ============================================================
   Helpers
============================================================ */
const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const match = (value: string, filter?: string) =>
  !filter || norm(value).includes(norm(filter));

/** Estado de la factura a partir del PaymentStatus del backend */
function estadoDesdePago(status?: string): EstadoFactura {
  if (status === "PAID") return "pagado";
  if (status === "FAILED" || status === "CANCELLED") return "cancelado";
  return "pendiente";
}

/** Nombre del servicio de un pago, con traducciones (mismo criterio que ReservasController) */
function nombreServicioPago(p: ApiPaymentFiltered, language: string): string {
  const ref = p.service || p.appointment?.service;
  if (!ref) return "—";
  const trad = ref.translations?.find((t) => t.language === language) || ref.translations?.[0];
  return trad?.name || ref.name || "—";
}

/** Método de pago legible: tarjeta saneada (marca + últimos 4) o efectivo */
function metodoPagoDesdePago(p: ApiPaymentFiltered): string | undefined {
  if (p.method === "CASH") return "Efectivo";
  if (p.method === "CARD") {
    const partes = [p.card?.brand?.toUpperCase(), p.card?.last4 ? `•••• ${p.card.last4}` : null].filter(Boolean);
    return partes.length ? partes.join(" ") : "Tarjeta";
  }
  return undefined;
}

/** Pago (PaymentModule, GET /payments/filter) → Factura de la tabla */
function facturaDesdePago(p: ApiPaymentFiltered, language: string): Factura {
  const servicio = nombreServicioPago(p, language);
  const total = Number(p.totalAmount || 0);
  return {
    id: `PAY-${p.id}`,
    reservaId: p.appointmentId != null ? String(p.appointmentId) : String(p.id),
    cliente: p.user?.UserData?.name || p.user?.email || `#${p.userId}`,
    clienteEmail: p.user?.email,
    clienteTelefono: p.user?.UserData?.phone,
    clienteFoto: p.user?.fotoPerfil || null,
    servicio,
    fecha: (p.createdAt || "").slice(0, 10) || "—",
    hora: p.createdAt ? p.createdAt.slice(11, 16) : undefined,
    total,
    moneda: "EUR",
    estado: estadoDesdePago(p.status),
    sedeId: p.appointment?.sedeId != null ? String(p.appointment.sedeId) : undefined,
    metodoPago: metodoPagoDesdePago(p),
    items: [{ concepto: servicio, cantidad: 1, precio: total }],
  };
}

/**
 * Resuelve qué sedes consultar en /payments/filter según el rol:
 *  · admin (sede)   → siempre su propia sede, sin opción de cambiarla.
 *  · owner (empresa) → la sede elegida, o todas las de su empresa.
 *  · superadmin      → la sede elegida; si no, las de la empresa elegida;
 *                      si tampoco, sin restricción (undefined = todo el sistema).
 */
async function resolverSedesConsulta(session: Session | null, f: FiltrosFactura): Promise<number[] | undefined> {
  if (!session) return [];

  if (session.role === "admin") {
    return session.sedeId ? [Number(session.sedeId)] : [];
  }

  if (session.role === "owner") {
    if (f.sedeId) return [Number(f.sedeId)];
    const sedes = await SedesApi.findByEmpresa(Number(session.negocioId)).catch(() => []);
    return (sedes || []).map((s) => s.id);
  }

  /* superadmin */
  if (f.sedeId) return [Number(f.sedeId)];
  if (f.empresaId) {
    const sedes = await SedesApi.findByEmpresa(Number(f.empresaId)).catch(() => []);
    return (sedes || []).map((s) => s.id);
  }
  return undefined;
}

/* ============================================================
   EmisorController — cabecera de la factura
   GET /empresas/:id  ·  GET /sedes/:id
============================================================ */
const emisorCache = new Map<string, Emisor>();

export const EmisorController = {
  /**
   * Datos de la empresa (y sede) que emite la factura.
   * @param session Sesión activa (aporta empresa y sede).
   * @param sedeId  Sede concreta de la factura; si no llega, la de la sesión.
   */
  async get(session: Session | null, sedeId?: string | null): Promise<Emisor> {
    const empresaId = session?.negocioId || "";
    const sede = sedeId || session?.sedeId || "";
    const key = `${empresaId}:${sede}`;
    const hit = emisorCache.get(key);
    if (hit) return hit;

    /* Respaldo con lo que ya trae la sesión, por si el API no responde */
    const base: Emisor = {
      nombre: session?.negocioName || "BookMy",
      nit: null,
      telefono: null,
      email: null,
      web: null,
      logo: null,
      sedeNombre: session?.sedeName || null,
      sedeDireccion: null,
      sedeTelefono: null,
    };

    const [empresa, sedeApi] = await Promise.all([
      empresaId ? EmpresasApi.findOne(Number(empresaId)).catch(() => null) : Promise.resolve(null),
      sede ? SedesApi.findOne(Number(sede)).catch(() => null) : Promise.resolve(null),
    ]);

    const emisor: Emisor = {
      nombre: empresa?.nombre || base.nombre,
      nit: empresa?.nit ?? null,
      telefono: empresa?.telefono ?? null,
      email: empresa?.email ?? null,
      web: empresa?.webUrl ?? null,
      logo: empresa?.logo ?? null,
      sedeNombre: sedeApi?.nombre || base.sedeNombre,
      sedeDireccion: sedeApi?.direccion ?? null,
      sedeTelefono: sedeApi?.telefono ?? null,
    };

    emisorCache.set(key, emisor);
    return emisor;
  },

  /** Limpia la caché (tras editar la empresa en Configuración) */
  invalidate() {
    emisorCache.clear();
  },
};

/* ============================================================
   FacturasController
   Una factura por cada pago real — GET /payments/filter, con el
   alcance (sede/empresa) resuelto según el rol de la sesión, ya que
   el endpoint no valida token/rol por sí mismo.
============================================================ */
export const FacturasController = {
  /**
   * Facturas de la sesión — una por pago, de la más reciente a la
   * más antigua. El alcance de sedes a consultar depende del rol:
   * superadmin (todo o lo elegido), owner (su empresa) o admin (su sede).
   * @param session  Sesión activa (decide qué userId/sedeId se piden).
   * @param filtros  Incluye los selectores de empresa/sede, si aplican.
   * @param language Idioma para resolver nombres de servicio.
   */
  async list(session: Session | null, filtros: FiltrosFactura = {}, language = "es"): Promise<Factura[]> {
    if (!session) return [];
    const sedeIds = await resolverSedesConsulta(session, filtros);

    let pagos: ApiPaymentFiltered[] = [];
    if (sedeIds === undefined) {
      pagos = await PaymentsApi.filter({}).catch(() => []);
    } else if (sedeIds.length > 0) {
      const lotes = await Promise.all(
        sedeIds.map((sedeId) => PaymentsApi.filter({ sedeId }).catch(() => [] as ApiPaymentFiltered[]))
      );
      pagos = lotes.flat();
    }

    return pagos
      .map((p) => facturaDesdePago(p, language))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  },

  /** Búsqueda libre (ID, Cliente o Servicio) + Fecha, sobre el listado ya acotado por sede/empresa */
  async search(
    session: Session | null,
    f: FiltrosFactura,
    language = "es"
  ): Promise<Factura[]> {
    const all = await this.list(session, f, language);
    return all.filter(
      (x) =>
        (!f.q || match(x.id, f.q) || match(x.cliente, f.q) || match(x.servicio, f.q)) &&
        (!f.fecha || x.fecha === f.fecha)
    );
  },

  /** Totales del listado mostrado (tarjetas de resumen) */
  resumen(lista: Factura[]) {
    const total = lista.reduce((s, f) => s + f.total, 0);
    const cobrado = lista.filter((f) => f.estado === "pagado").reduce((s, f) => s + f.total, 0);
    const pendiente = lista.filter((f) => f.estado === "pendiente").reduce((s, f) => s + f.total, 0);
    return { emitidas: lista.length, total, cobrado, pendiente };
  },
};

/* ============================================================
   FiltroFacturasController
   Opciones de los selectores de empresa/sede del Toolbar, según
   el rol de la sesión (ver resolverSedesConsulta arriba).
============================================================ */
export interface OpcionFiltro {
  id: string;
  nombre: string;
}

export const FiltroFacturasController = {
  /** Empresas para el selector — solo tiene sentido para superadmin. */
  async empresas(session: Session | null): Promise<OpcionFiltro[]> {
    if (session?.role !== "superadmin") return [];
    const list = await EmpresasApi.findAll().catch(() => []);
    return (list || []).map((e) => ({ id: String(e.id), nombre: e.nombre }));
  },

  /**
   * Sedes para el selector, según el rol:
   *  · admin      → [] (su sede ya está fija, no hay nada que elegir).
   *  · owner      → las sedes de su propia empresa.
   *  · superadmin → las sedes de la empresa elegida, o todas si no eligió ninguna.
   */
  async sedes(session: Session | null, empresaId?: string): Promise<OpcionFiltro[]> {
    if (!session || session.role === "admin") return [];

    if (session.role === "owner") {
      const list = await SedesApi.findByEmpresa(Number(session.negocioId)).catch(() => []);
      return (list || []).map((s) => ({ id: String(s.id), nombre: s.nombre }));
    }

    const list = empresaId
      ? await SedesApi.findByEmpresa(Number(empresaId)).catch(() => [])
      : await SedesApi.findAll().catch(() => []);
    return (list || []).map((s) => ({ id: String(s.id), nombre: s.nombre }));
  },
};

/* ============================================================
   CategoriasGastoController
   GET/POST/DELETE /categorias-gasto. El backend devuelve las base
   (isBase, comunes a todos) más las de la empresa del token, así
   que aquí no hay lista local de respaldo.
============================================================ */
export const CategoriasGastoController = {
  /** Base + propias, tal como las ordena el backend (base primero). */
  async list(): Promise<CategoriaGasto[]> {
    const list = await CategoriasGastoApi.findAll().catch(() => [] as ApiCategoriaGasto[]);
    return (list || []).map((c) => ({ id: c.id, nombre: c.nombre, isBase: c.isBase }));
  },

  /** Solo las propias de la empresa (las únicas eliminables). */
  async propias(): Promise<CategoriaGasto[]> {
    return (await this.list()).filter((c) => !c.isBase);
  },

  /** Solo las base de la plataforma. */
  async base(): Promise<CategoriaGasto[]> {
    return (await this.list()).filter((c) => c.isBase);
  },

  /** ¿Ya existe ese nombre? (ignorando mayúsculas y tildes) */
  existe(nombre: string, lista: CategoriaGasto[]): boolean {
    const k = norm(nombre.trim());
    return lista.some((c) => norm(c.nombre) === k);
  },

  /**
   * Crea una categoría propia — POST /categorias-gasto.
   * La empresa sale del token; el backend responde 403 si el usuario
   * no tiene una asociada y 400 si el nombre ya existe.
   * @returns la categoría creada, o un mensaje de error legible.
   */
  async create(nombre: string): Promise<{ categoria?: CategoriaGasto; error?: string }> {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (!limpio) return { error: "VACIA" };
    try {
      const c = await CategoriasGastoApi.create(limpio);
      return { categoria: { id: c.id, nombre: c.nombre, isBase: c.isBase } };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Error" };
    }
  },

  /**
   * Elimina una categoría propia — DELETE /categorias-gasto/:id.
   * El backend rechaza las base y las que tengan gastos asociados.
   */
  async remove(id: number): Promise<{ ok: boolean; error?: string }> {
    try {
      await CategoriasGastoApi.remove(id);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Error" };
    }
  },
};

/* ============================================================
   GastosController
   CRUD contra GastoModule (/gastos). El endpoint /gastos/filter ya
   acota por rol usando el token, así que aquí solo se afinan los
   filtros que el backend no cubre (texto, categoría y fecha).
============================================================ */

/** Gasto del API → modelo del panel. */
function mapGasto(g: ApiGasto): Gasto {
  /* ticketUrl llega absoluta con SFTP activo ("https://bookmy.es/...") o
     relativa si el backend guarda en local ("/uploads/gastos/..."); se
     quita la barra inicial para que fotoUrl() no genere una doble. */
  const ticket = g.ticketUrl ? fotoUrl(g.ticketUrl.replace(/^\//, "")) : null;
  return {
    id: String(g.id),
    gasto: g.descripcion,
    categoria: g.categoria?.nombre ?? "—",
    categoriaId: g.categoriaId,
    fecha: (g.fecha || "").slice(0, 10),
    ticket,
    ticketNombre: g.ticketUrl ? g.ticketUrl.split("/").pop() || undefined : undefined,
    total: g.total,
    sedeId: g.sedeId,
    sedeNombre: g.sede?.nombre,
  };
}

export const GastosController = {
  /**
   * Gastos visibles para el usuario — GET /gastos/filter.
   * @param sedeId Acota a una sede dentro de su alcance (opcional).
   */
  async list(sedeId?: string): Promise<Gasto[]> {
    const list = await GastosApi.filter(
      sedeId ? { sedeId: Number(sedeId) } : {}
    ).catch(() => [] as ApiGasto[]);
    return (list || []).map(mapGasto);
  },

  /** Lista filtrada: sede la resuelve el API, el resto se afina aquí. */
  async search(f: FiltrosGasto): Promise<Gasto[]> {
    const all = await this.list(f.sedeId);
    return all
      .filter(
        (g) =>
          match(g.gasto, f.gasto) &&
          (!f.categoria || norm(g.categoria) === norm(f.categoria)) &&
          (!f.fecha || g.fecha === f.fecha)
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  /**
   * Sedes donde el usuario puede registrar un gasto.
   * Un BRANCH_ADMIN tiene la suya fija; owner y superadmin eligen.
   */
  async sedesDisponibles(session: Session | null): Promise<OpcionFiltro[]> {
    if (!session) return [];
    if (session.sedeId) {
      return [{ id: session.sedeId, nombre: session.sedeName || session.sedeId }];
    }
    const list = session.negocioId
      ? await SedesApi.findByEmpresa(Number(session.negocioId)).catch(() => [])
      : await SedesApi.findAll().catch(() => []);
    return (list || []).map((s) => ({ id: String(s.id), nombre: s.nombre }));
  },

  /**
   * Sube el comprobante — POST /gastos/upload.
   * Va antes de crear el gasto: devuelve la URL que se manda como
   * `ticketUrl`. El backend comprime las imágenes igual que en el chat.
   * @returns la URL pública del archivo subido.
   */
  async subirTicket(file: File): Promise<string> {
    const { fileUrl } = await GastosApi.upload(file);
    return fileUrl;
  },

  /**
   * Registra un gasto — POST /gastos. El userId lo pone el backend
   * desde el token; `sedeId` es obligatorio y debe estar en su alcance.
   */
  async create(input: {
    gasto: string;
    categoriaId: number;
    fecha: string;
    total: number;
    sedeId: number;
    ticketUrl?: string;
  }): Promise<Gasto> {
    const creado = await GastosApi.create({
      descripcion: input.gasto,
      total: input.total,
      fecha: input.fecha,
      categoriaId: input.categoriaId,
      sedeId: input.sedeId,
      ...(input.ticketUrl ? { ticketUrl: input.ticketUrl } : {}),
    });
    return mapGasto(creado);
  },

  /** DELETE /gastos/:id */
  async remove(id: string): Promise<void> {
    await GastosApi.remove(Number(id));
  },

  /** ¿Hay gastos usando esta categoría? (bloquea su eliminación) */
  async usaCategoria(categoriaId: number): Promise<boolean> {
    const all = await this.list();
    return all.some((g) => g.categoriaId === categoriaId);
  },

  /** Totales del listado mostrado (tarjetas de resumen) */
  resumen(lista: Gasto[]) {
    const total = lista.reduce((s, g) => s + g.total, 0);
    const categorias = new Set(lista.map((g) => norm(g.categoria))).size;
    return {
      total,
      registros: lista.length,
      promedio: lista.length ? total / lista.length : 0,
      categorias,
    };
  },
};
