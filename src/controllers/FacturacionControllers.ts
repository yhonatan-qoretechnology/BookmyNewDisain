/* ============================================================
   Facturación — Controllers (Facturas + Gastos)
   Sigue el patrón de CrudControllers: métodos async que
   devuelven arrays y aceptan filtros del View.
   Puedes fusionar estos exports dentro de CrudControllers.ts
============================================================ */

export type EstadoFactura = "pagado" | "pendiente" | "cancelado";

export interface Factura {
  id: string;            // ID Factura (ej. F-0001)
  reservaId: string;     // reserva que la originó
  cliente: string;
  servicio: string;
  fecha: string;         // ISO yyyy-mm-dd
  total: number;
  estado: EstadoFactura;
  items?: { concepto: string; cantidad: number; precio: number }[];
}

export type CategoriaGasto =
  | "Insumos"
  | "Alimentacion"
  | "Provisiones"
  | "Materiales"
  | "Recibos"
  | "Alquiler";

export const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "Insumos",
  "Alimentacion",
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

const API = "/api";

/* ---------- helpers ---------- */
async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const match = (value: string, filter?: string) =>
  !filter || norm(value).includes(norm(filter));

/* ============================================================
   FacturasController
   Cada reserva genera una factura: GET /reservas se mapea a
   facturas si el backend aún no expone /facturas.
============================================================ */
export const FacturasController = {
  async list(): Promise<Factura[]> {
    const res = await fetch(`${API}/facturas`).catch(() => null);
    if (res) {
      const data = await safeJson<Factura[]>(res, []);
      if (data.length) return data;
    }
    /* Fallback: construir facturas desde las reservas */
    const r = await fetch(`${API}/reservas`).catch(() => null);
    if (!r) return [];
    const reservas = await safeJson<any[]>(r, []);
    return reservas.map((rv, i) => ({
      id: rv.facturaId ?? `F-${String(i + 1).padStart(4, "0")}`,
      reservaId: String(rv.id),
      cliente: rv.cliente?.nombre ?? rv.cliente ?? "—",
      servicio: rv.servicio?.nombre ?? rv.servicio ?? "—",
      fecha: (rv.fecha ?? "").slice(0, 10),
      total: Number(rv.total ?? rv.precio ?? 0),
      estado: (rv.estadoPago ?? "pendiente") as EstadoFactura,
      items: rv.items,
    }));
  },

  /** Filtrado por columnas (ID, Cliente, Servicio, Fecha) */
  async search(f: FiltrosFactura): Promise<Factura[]> {
    const all = await this.list();
    return all.filter(
      (x) =>
        match(x.id, f.id) &&
        match(x.cliente, f.cliente) &&
        match(x.servicio, f.servicio) &&
        (!f.fecha || x.fecha === f.fecha)
    );
  },

  async get(id: string): Promise<Factura | null> {
    const all = await this.list();
    return all.find((x) => x.id === id) ?? null;
  },
};

/* ============================================================
   GastosController
   CRUD contra /api/gastos con fallback a localStorage para
   que el módulo funcione aunque el endpoint no exista aún.
============================================================ */
const LS_KEY = "app.gastos";

function lsRead(): Gasto[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Gasto[];
  } catch {
    return [];
  }
}
function lsWrite(items: Gasto[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export const GastosController = {
  async list(): Promise<Gasto[]> {
    const res = await fetch(`${API}/gastos`).catch(() => null);
    if (res && res.ok) return safeJson<Gasto[]>(res, lsRead());
    return lsRead();
  },

  async search(f: FiltrosGasto): Promise<Gasto[]> {
    const all = await this.list();
    return all
      .filter(
        (g) =>
          match(g.gasto, f.gasto) &&
          (!f.categoria || g.categoria === f.categoria) &&
          (!f.fecha || g.fecha === f.fecha)
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async create(input: Omit<Gasto, "id">): Promise<Gasto> {
    const nuevo: Gasto = { ...input, id: `G-${Date.now()}` };
    const res = await fetch(`${API}/gastos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevo),
    }).catch(() => null);
    if (res && res.ok) return safeJson<Gasto>(res, nuevo);
    lsWrite([nuevo, ...lsRead()]);
    return nuevo;
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${API}/gastos/${id}`, { method: "DELETE" }).catch(() => null);
    if (res && res.ok) return;
    lsWrite(lsRead().filter((g) => g.id !== id));
  },
};
