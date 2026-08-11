/* ============================================================
   StockController — catálogo de insumos, existencias por sede y
   solicitudes de reposición.
   ------------------------------------------------------------
   ⚠️ SIN BACKEND TODAVÍA
   El backend no expone ningún módulo de stock/insumos (no hay
   rutas en `src/api/endpoints.ts`), así que el catálogo, las
   existencias y las solicitudes viven en memoria durante la
   sesión de navegador y se pierden al recargar.

   Las SEDES sí son reales: se leen de GET /sedes/empresa/:id a
   través de NegociosController, para que el módulo trabaje sobre
   las sedes del negocio y no sobre datos inventados.

   ⚙️ PARA CONECTARLO: todos los métodos ya son asíncronos y
   devuelven modelos del dominio, así que basta sustituir el
   cuerpo de cada uno por la llamada al API correspondiente
   (p. ej. `InsumosApi.findAll()`) sin tocar la vista.
============================================================ */
import type {
  Insumo, NivelStock, Session, SolicitudInventario, SolicitudItem, StockItem,
} from "@/models";
import { NegociosController } from "./NegociosController";

/* ── Catálogo global de insumos (semilla de demostración) ── */
const insumos: Insumo[] = [
  { id: "i1", nombre: "Esmalte semipermanente rojo", categoria: "Uñas", unidad: "ud", precioRef: 4.5 },
  { id: "i2", nombre: "Esmalte semipermanente nude", categoria: "Uñas", unidad: "ud", precioRef: 4.5 },
  { id: "i3", nombre: "Cera depilatoria roll-on", categoria: "Depilación", unidad: "bote", precioRef: 8 },
  { id: "i4", nombre: "Crema facial hidratante", categoria: "Facial", unidad: "ud", precioRef: 12 },
  { id: "i5", nombre: "Aceite de masaje relajante", categoria: "Masajes", unidad: "ud", precioRef: 9.5 },
  { id: "i6", nombre: "Algodón cosmético (pack 100)", categoria: "General", unidad: "pack", precioRef: 3.2 },
  { id: "i7", nombre: "Tiras de cera fría", categoria: "Depilación", unidad: "caja", precioRef: 6.8 },
  { id: "i8", nombre: "Tinte para pestañas negro", categoria: "Facial", unidad: "ud", precioRef: 7.5 },
];

/** Existencias registradas: clave `${sedeId}:${insumoId}` */
const existencias = new Map<string, { stock: number; max: number }>();
const solicitudes: SolicitudInventario[] = [];

/** Capacidad objetivo por defecto de un insumo en una sede */
const MAX_DEFECTO = 30;
const clave = (sedeId: string, insumoId: string) => `${sedeId}:${insumoId}`;

/** Umbrales del indicador de nivel (ratio stock/max) */
export function nivelDe(stock: number, max: number): NivelStock {
  const ratio = max > 0 ? stock / max : 0;
  if (ratio <= 0.25) return "critico";
  if (ratio <= 0.6) return "medio";
  return "ok";
}

export const StockController = {
  /* ── Catálogo ──────────────────────────────────────────── */

  /**
   * Catálogo global filtrado por nombre o categoría.
   * @param term Texto de búsqueda.
   */
  async getCatalogo(term = ""): Promise<Insumo[]> {
    const q = term.trim().toLowerCase();
    return insumos.filter((i) => `${i.nombre} ${i.categoria}`.toLowerCase().includes(q));
  },

  /** Alta de un producto en el catálogo global. */
  async addInsumo(input: Omit<Insumo, "id">): Promise<Insumo> {
    const insumo: Insumo = { ...input, id: `i${Date.now()}` };
    insumos.push(insumo);
    return insumo;
  },

  /** Baja del catálogo: también retira sus existencias en todas las sedes. */
  async removeInsumo(id: string): Promise<void> {
    const idx = insumos.findIndex((i) => i.id === id);
    if (idx > -1) insumos.splice(idx, 1);
    for (const k of Array.from(existencias.keys())) {
      if (k.endsWith(`:${id}`)) existencias.delete(k);
    }
  },

  /* ── Existencias ───────────────────────────────────────── */

  /**
   * Existencias de una sede: devuelve una fila por cada producto del
   * catálogo (las que nunca se han registrado arrancan en 0), para
   * que la sede pueda reponer cualquier insumo sin darlo de alta antes.
   * @param sedeId Sede real del negocio.
   * @param term Búsqueda por nombre o categoría.
   */
  async getStockSede(sedeId: string, term = ""): Promise<StockItem[]> {
    const q = term.trim().toLowerCase();
    return insumos
      .filter((i) => `${i.nombre} ${i.categoria}`.toLowerCase().includes(q))
      .map((insumo) => {
        const reg = existencias.get(clave(sedeId, insumo.id));
        return {
          sedeId,
          insumoId: insumo.id,
          insumo,
          stock: reg?.stock ?? 0,
          max: reg?.max ?? MAX_DEFECTO,
        };
      });
  },

  /**
   * Suma (o resta) unidades a una sede, acotado entre 0 y el máximo.
   * @param delta Unidades a sumar; negativo para descontar.
   */
  async ajustarStock(sedeId: string, insumoId: string, delta: number): Promise<void> {
    const k = clave(sedeId, insumoId);
    const reg = existencias.get(k) ?? { stock: 0, max: MAX_DEFECTO };
    reg.stock = Math.max(0, Math.min(reg.max, reg.stock + delta));
    existencias.set(k, reg);
  },

  /* ── Solicitudes de reposición ─────────────────────────── */

  /** Todas las solicitudes, de la más reciente a la más antigua. */
  async getSolicitudes(): Promise<SolicitudInventario[]> {
    return [...solicitudes].reverse();
  },

  /** Solicitudes enviadas por una sede concreta. */
  async getSolicitudesPorSede(sedeId: string): Promise<SolicitudInventario[]> {
    return [...solicitudes].reverse().filter((s) => s.sedeId === sedeId);
  },

  /** Nº de solicitudes aún sin resolver (badge de la pestaña). */
  async contarPendientes(): Promise<number> {
    return solicitudes.filter((s) => s.estado === "pendiente").length;
  },

  /**
   * Registra una solicitud de la sede de la sesión.
   * @throws Error("SIN_ITEMS") si no se pidió ninguna unidad.
   */
  async crearSolicitud(
    session: Session | null,
    items: SolicitudItem[],
    notas: string
  ): Promise<SolicitudInventario> {
    const utiles = items.filter((i) => i.cantidad > 0);
    if (!utiles.length) throw new Error("SIN_ITEMS");
    const sedeId = session?.sedeId || "";
    const solicitud: SolicitudInventario = {
      id: `SOL-${String(Date.now()).slice(-4)}`,
      sedeId,
      sedeNombre: session?.sedeName || "—",
      solicitanteId: session?.id || "",
      solicitanteNombre: session?.name || "—",
      fecha: new Date().toISOString().slice(0, 10),
      estado: "pendiente",
      notas: notas.trim(),
      items: utiles,
    };
    solicitudes.push(solicitud);
    return solicitud;
  },

  /**
   * Aprueba una solicitud y suma las unidades pedidas al stock de
   * su sede (una solicitud aprobada es una entrada de mercancía).
   */
  async aprobarSolicitud(id: string): Promise<void> {
    const sol = solicitudes.find((s) => s.id === id);
    if (!sol || sol.estado !== "pendiente") return;
    sol.estado = "aprobada";
    for (const item of sol.items) {
      await this.ajustarStock(sol.sedeId, item.insumoId, item.cantidad);
    }
  },

  /** Rechaza una solicitud sin tocar las existencias. */
  async rechazarSolicitud(id: string): Promise<void> {
    const sol = solicitudes.find((s) => s.id === id);
    if (sol?.estado === "pendiente") sol.estado = "rechazada";
  },

  /* ── Sedes reales sobre las que opera el módulo ────────── */

  /** Sedes de la empresa de la sesión (GET /sedes/empresa/:id). */
  async getSedes(session: Session | null): Promise<Array<{ id: string; nombre: string }>> {
    const list = await NegociosController.getSedesForSession(session).catch(() => []);
    return list.map((s) => ({ id: s.id, nombre: s.nombre }));
  },
};
