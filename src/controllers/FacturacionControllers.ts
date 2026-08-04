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
   · CategoriasGastoController → GET/POST/DELETE /categorias-gasto
                           (base del sistema + propias de la empresa).
   · GastosController    → GET /gastos/filter, POST/PATCH/DELETE /gastos,
                           POST /gastos/upload (comprobante).
============================================================ */
import type { Session } from "@/models";
import { CategoriasGastoApi, EmpresasApi, GastosApi, PaymentsApi, SedesApi } from "@/api/modules";
import type { ApiGasto, ApiPaymentFiltered } from "@/api/types";

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

/** Categoría de gasto — base del sistema (esBase) o propia de la empresa */
export interface CategoriaGasto {
  id: string;
  nombre: string;
  esBase: boolean;
}

export interface Gasto {
  id: string;
  gasto: string;             // descripcion en el API
  categoriaId: string;
  categoria: string;         // nombre de la categoría, resuelto para mostrar en la tabla
  fecha: string;             // ISO yyyy-mm-dd
  ticket: string | null;     // ticketUrl del comprobante subido
  ticketNombre?: string;     // derivado de la URL
  total: number;
  sedeId: string;
}

/** Alcance compartido por Facturas y Gastos: qué sede(s) consultar según el rol */
interface AlcanceFiltro {
  empresaId?: string;
  sedeId?: string;
}

export interface FiltrosFactura extends AlcanceFiltro {
  /** Búsqueda libre: coincide con ID, cliente o servicio */
  q?: string;
  fecha?: string;
}

export interface FiltrosGasto extends AlcanceFiltro {
  gasto?: string;
  categoriaId?: string;
  fecha?: string;
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
 * Resuelve qué sedes consultar (en /payments/filter o /gastos/filter) según el rol:
 *  · admin (sede)   → siempre su propia sede, sin opción de cambiarla.
 *  · owner (empresa) → la sede elegida, o todas las de su empresa.
 *  · superadmin      → la sede elegida; si no, las de la empresa elegida;
 *                      si tampoco, sin restricción (undefined = todo el sistema).
 */
async function resolverSedesConsulta(session: Session | null, f: AlcanceFiltro): Promise<number[] | undefined> {
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
   GET/POST/DELETE /categorias-gasto — base del sistema (empresaId
   null) + propias de la empresa de la sesión, resueltas en el
   backend a partir del AdminProfile del usuario autenticado.
============================================================ */
export const CategoriasGastoController = {
  /** Base + propias de la empresa de la sesión, base primero y luego alfabético */
  async list(): Promise<CategoriaGasto[]> {
    const rows = await CategoriasGastoApi.findAll().catch(() => []);
    return (rows || [])
      .map((c) => ({ id: String(c.id), nombre: c.nombre, esBase: c.isBase }))
      .sort((a, b) => (a.esBase !== b.esBase ? (a.esBase ? -1 : 1) : a.nombre.localeCompare(b.nombre)));
  },

  /** Solo las propias (no base) — para el listado de "tus categorías" */
  async propias(): Promise<CategoriaGasto[]> {
    return (await this.list()).filter((c) => !c.esBase);
  },

  /**
   * Crea una categoría propia de la empresa de la sesión.
   * Lanza si el backend la rechaza (nombre vacío, duplicada, etc.) —
   * el llamador debe mostrar `err.message`.
   */
  async create(nombre: string): Promise<CategoriaGasto> {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    const creada = await CategoriasGastoApi.create(limpio);
    return { id: String(creada.id), nombre: creada.nombre, esBase: creada.isBase };
  },

  /** Elimina una categoría propia (el backend rechaza las base con 403) */
  async remove(id: string): Promise<void> {
    await CategoriasGastoApi.remove(Number(id));
  },
};

/* ============================================================
   GastosController
   GET /gastos/filter, POST/PATCH/DELETE /gastos, POST /gastos/upload.
   Mismo criterio de alcance por rol que FacturasController.
============================================================ */

/** Nombre de archivo a partir de una URL (última porción del path) */
function nombreArchivoDeUrl(url: string): string {
  try {
    const limpio = url.split("?")[0].split("#")[0];
    return decodeURIComponent(limpio.substring(limpio.lastIndexOf("/") + 1)) || "comprobante";
  } catch {
    return "comprobante";
  }
}

/** ¿El comprobante es un PDF? (para no renderizarlo como <img>) */
export function esTicketPdf(url: string | null | undefined): boolean {
  return !!url && /\.pdf(\?.*)?$/i.test(url);
}

/** Fila de /gastos/filter → Gasto de la tabla */
function gastoDesdeApi(g: ApiGasto): Gasto {
  return {
    id: String(g.id),
    gasto: g.descripcion,
    categoriaId: String(g.categoriaId),
    categoria: g.categoria?.nombre || "—",
    fecha: (g.fecha || "").slice(0, 10),
    ticket: g.ticketUrl || null,
    ticketNombre: g.ticketUrl ? nombreArchivoDeUrl(g.ticketUrl) : undefined,
    total: Number(g.total || 0),
    sedeId: String(g.sedeId),
  };
}

export const GastosController = {
  /**
   * Gastos de la sesión, de más reciente a más antiguo. El alcance de
   * sedes a consultar depende del rol (ver resolverSedesConsulta).
   */
  async list(session: Session | null, filtros: FiltrosGasto = {}): Promise<Gasto[]> {
    if (!session) return [];
    const sedeIds = await resolverSedesConsulta(session, filtros);

    let rows: ApiGasto[] = [];
    if (sedeIds === undefined) {
      rows = await GastosApi.filter({}).catch(() => []);
    } else if (sedeIds.length > 0) {
      const lotes = await Promise.all(
        sedeIds.map((sedeId) => GastosApi.filter({ sedeId }).catch(() => [] as ApiGasto[]))
      );
      rows = lotes.flat();
    }

    return rows.map(gastoDesdeApi).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  /** Filtrado por columnas (Gasto, Categoría, Fecha) sobre el listado ya acotado por sede/empresa */
  async search(session: Session | null, f: FiltrosGasto): Promise<Gasto[]> {
    const all = await this.list(session, f);
    return all.filter(
      (g) =>
        match(g.gasto, f.gasto) &&
        (!f.categoriaId || g.categoriaId === f.categoriaId) &&
        (!f.fecha || g.fecha === f.fecha)
    );
  },

  /**
   * Crea un gasto — si hay comprobante lo sube primero (POST /gastos/upload)
   * y luego crea el gasto (POST /gastos) con la URL resultante.
   * @param sedeId Sede a la que se factura el gasto (fija para admin de sede,
   *   elegida en el formulario para owner/superadmin).
   */
  async create(input: {
    gasto: string;
    categoriaId: string;
    fecha: string;
    total: number;
    sedeId: string;
    ticket?: File | null;
  }): Promise<Gasto> {
    let ticketUrl: string | undefined;
    if (input.ticket) {
      const subida = await GastosApi.upload(input.ticket);
      ticketUrl = subida.fileUrl;
    }
    const creado = await GastosApi.create({
      descripcion: input.gasto,
      total: input.total,
      fecha: input.fecha,
      categoriaId: Number(input.categoriaId),
      sedeId: Number(input.sedeId),
      ticketUrl,
    });
    return gastoDesdeApi(creado);
  },

  async remove(id: string): Promise<void> {
    await GastosApi.remove(Number(id));
  },

  /** ¿Hay gastos usando esta categoría? (bloquea su eliminación en el front) */
  async usaCategoria(session: Session | null, categoriaId: string): Promise<boolean> {
    const all = await this.list(session, {});
    return all.some((g) => g.categoriaId === categoriaId);
  },

  /** Totales del listado mostrado (tarjetas de resumen) */
  resumen(lista: Gasto[]) {
    const total = lista.reduce((s, g) => s + g.total, 0);
    const categorias = new Set(lista.map((g) => g.categoriaId)).size;
    return {
      total,
      registros: lista.length,
      promedio: lista.length ? total / lista.length : 0,
      categorias,
    };
  },
};
