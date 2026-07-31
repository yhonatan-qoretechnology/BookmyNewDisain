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
   · CategoriasGastoController → categorías base + propias del usuario.
   · GastosController    → CRUD de gastos con respaldo local.
============================================================ */
import type { Session } from "@/models";
import { EmpresasApi, PaymentsApi, SedesApi } from "@/api/modules";
import type { ApiPaymentFiltered } from "@/api/types";

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

/** Las categorías son libres: hay unas base y el usuario crea las suyas */
export type CategoriaGasto = string;

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "Insumos",
  "Alimentación",
  "Provisiones",
  "Materiales",
  "Recibos",
  "Alquiler",
];

export interface Gasto {
  id: string;
  gasto: string;             // nombre / descripción corta
  categoria: CategoriaGasto;
  fecha: string;             // ISO yyyy-mm-dd
  ticket: string | null;     // dataURL o URL de la imagen del tickete
  ticketNombre?: string;     // nombre de archivo original
  total: number;
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
  categoria?: CategoriaGasto | "";
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
   Base (CATEGORIAS_GASTO) + propias del usuario. El respaldo es
   localStorage para que funcione aunque no exista el endpoint.
============================================================ */
const LS_CATS = "app.gastos.categorias";

function catsRead(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_CATS) ?? "[]");
    return Array.isArray(raw) ? raw.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}
function catsWrite(items: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_CATS, JSON.stringify(items));
}

export const CategoriasGastoController = {
  /** Solo las creadas por el usuario */
  propias(): string[] {
    return catsRead();
  },

  /** Base + propias, sin duplicados y ordenadas alfabéticamente */
  list(): CategoriaGasto[] {
    const propias = catsRead();
    const vistas = new Set(CATEGORIAS_GASTO.map(norm));
    const extra = propias.filter((c) => {
      const k = norm(c);
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    });
    return [...CATEGORIAS_GASTO, ...extra.sort((a, b) => a.localeCompare(b))];
  },

  /** ¿Ya existe (ignorando mayúsculas y tildes)? */
  existe(nombre: string): boolean {
    const k = norm(nombre.trim());
    return this.list().some((c) => norm(c) === k);
  },

  /** ¿Es una de las base? (no se pueden eliminar) */
  esBase(nombre: string): boolean {
    const k = norm(nombre);
    return CATEGORIAS_GASTO.some((c) => norm(c) === k);
  },

  /**
   * Crea una categoría propia.
   * @returns la categoría normalizada, o null si estaba repetida.
   */
  create(nombre: string): CategoriaGasto | null {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (!limpio || this.existe(limpio)) return null;
    catsWrite([...catsRead(), limpio]);
    return limpio;
  },

  /** Elimina una categoría propia (las base se ignoran) */
  remove(nombre: string): void {
    if (this.esBase(nombre)) return;
    catsWrite(catsRead().filter((c) => norm(c) !== norm(nombre)));
  },
};

/* ============================================================
   GastosController
   CRUD contra /gastos con respaldo en localStorage para que el
   módulo funcione aunque el endpoint no exista todavía.
============================================================ */
const LS_KEY = "app.gastos";

function lsRead(): Gasto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    return Array.isArray(raw) ? (raw as Gasto[]) : [];
  } catch {
    return [];
  }
}
function lsWrite(items: Gasto[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export const GastosController = {
  async list(): Promise<Gasto[]> {
    return lsRead();
  },

  async search(f: FiltrosGasto): Promise<Gasto[]> {
    const all = await this.list();
    return all
      .filter(
        (g) =>
          match(g.gasto, f.gasto) &&
          (!f.categoria || norm(g.categoria) === norm(f.categoria)) &&
          (!f.fecha || g.fecha === f.fecha)
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async create(input: Omit<Gasto, "id">): Promise<Gasto> {
    const nuevo: Gasto = { ...input, id: `G-${Date.now()}` };
    lsWrite([nuevo, ...lsRead()]);
    return nuevo;
  },

  async remove(id: string): Promise<void> {
    lsWrite(lsRead().filter((g) => g.id !== id));
  },

  /** ¿Hay gastos usando esta categoría? (bloquea su eliminación) */
  async usaCategoria(categoria: string): Promise<boolean> {
    const all = await this.list();
    return all.some((g) => norm(g.categoria) === norm(categoria));
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
