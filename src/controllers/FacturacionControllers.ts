/* ============================================================
   Facturación — Controllers (Emisor + Facturas + Gastos)
   ------------------------------------------------------------
   · FacturasController  → una factura por cada reserva del API
                           (AppointmentModule) con aislamiento
                           multi-tenant vía la sesión.
   · EmisorController    → datos de la empresa (logo, NIT, contacto)
                           y de la sede, para la cabecera de la factura.
   · CategoriasGastoController → categorías base + propias del usuario.
   · GastosController    → CRUD de gastos con respaldo local.
============================================================ */
import type { Reserva, Session } from "@/models";
import { EmpresasApi, SedesApi } from "@/api/modules";
import { ReservasController } from "./ReservasController";

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
  id?: string;
  cliente?: string;
  servicio?: string;
  fecha?: string;
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

/** Estado de pago del panel a partir del estado de la reserva */
function estadoDesdeReserva(r: Reserva): EstadoFactura {
  if (r.estado === "cancelado" || r.estado === "noShow") return "cancelado";
  if (r.estado === "atendida") return "pagado";
  return "pendiente";
}

/** Reserva → Factura (una factura por cada reserva) */
function facturaDesdeReserva(r: Reserva, indice: number): Factura {
  const numero = r.apiId ?? indice + 1;
  return {
    id: `F-${String(numero).padStart(4, "0")}`,
    reservaId: r.id,
    cliente: r.cliente,
    clienteEmail: r.email,
    clienteTelefono: r.telefono,
    servicio: r.servicio,
    fecha: r.fecha,
    hora: r.hora,
    total: Number(r.precio || 0),
    moneda: "EUR",
    estado: estadoDesdeReserva(r),
    sedeId: r.sedeId,
    sedeNombre: r.sedeName,
    profesional: r.empleadoName,
    metodoPago: r.metodoPago,
    items: [{ concepto: r.servicio, cantidad: 1, precio: Number(r.precio || 0) }],
  };
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
   Al entrar al módulo se leen TODAS las reservas visibles para la
   sesión y cada una queda registrada como una factura.
============================================================ */
export const FacturasController = {
  /**
   * Facturas de la sesión — una por reserva, de la más reciente
   * a la más antigua.
   * @param session  Sesión activa (aislamiento multi-tenant).
   * @param language Idioma para resolver nombres de servicio.
   */
  async list(session: Session | null, language = "es"): Promise<Factura[]> {
    const reservas = await ReservasController.getForSession(session, language).catch(() => []);
    return reservas
      .map(facturaDesdeReserva)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  },

  /** Filtrado por columnas (ID, Cliente, Servicio, Fecha) */
  async search(
    session: Session | null,
    f: FiltrosFactura,
    language = "es"
  ): Promise<Factura[]> {
    const all = await this.list(session, language);
    return all.filter(
      (x) =>
        match(x.id, f.id) &&
        match(x.cliente, f.cliente) &&
        match(x.servicio, f.servicio) &&
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
