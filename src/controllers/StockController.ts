/* ============================================================
   StockController — catálogo de insumos, existencias por sede y
   solicitudes de reposición (StockModule del backend).
   GET/POST/PATCH/DELETE /stock/insumos · GET/PATCH /stock/sede/:id ·
   GET/POST/PATCH /stock/solicitudes
   ------------------------------------------------------------
   El catálogo es de cada EMPRESA y las existencias de cada SEDE, y
   todo arranca vacío: un negocio recién creado no ve nada hasta que
   da de alta su primer insumo.

   Aquí se cruzan dos idiomas: el backend trabaja con ids numéricos y
   estados en MAYÚSCULAS, y el panel con ids de texto y estados en
   minúsculas. La traducción vive en este fichero —es el trabajo del
   controlador— para que la vista siga leyendo los mismos modelos.
============================================================ */
import type {
  EstadoSolicitud, Insumo, NivelStock, Session, SolicitudInventario,
  SolicitudItem, StockItem,
} from "@/models";
import { StockApi } from "@/api/modules";
import { ApiError } from "@/api/http";
import type {
  ApiEstadoSolicitud, ApiInsumo, ApiSolicitudInventario, ApiStockSede,
} from "@/api/types";
import { NegociosController } from "./NegociosController";

/**
 * Último recurso si el backend no manda objetivo.
 *
 * Ya no debería hacer falta: cada insumo lleva su `maxPorDefecto` y el
 * backend lo usa cuando la sede no tiene uno propio. Se deja por si
 * responde una versión anterior del API, porque con el objetivo a cero
 * `nivelDe` marcaría como crítico incluso un almacén lleno y "Reponer"
 * saldría siempre apagado.
 */
const MAX_OBJETIVO = 10;

/** Umbrales del indicador de nivel (ratio stock/max) */
export function nivelDe(stock: number, max: number): NivelStock {
  const ratio = max > 0 ? stock / max : 0;
  if (ratio <= 0.25) return "critico";
  if (ratio <= 0.6) return "medio";
  return "ok";
}

/* ── Traducción API ⇄ panel ────────────────────────────────── */

const mapInsumo = (i: ApiInsumo): Insumo => ({
  id: String(i.id),
  nombre: i.nombre,
  categoria: i.categoria || "General",
  unidad: i.unidad || "ud",
  precioRef: Number(i.precioRef) || 0,
});

const objetivo = (max: number | undefined) => (max && max > 0 ? max : MAX_OBJETIVO);

const mapStock = (s: ApiStockSede): StockItem => ({
  sedeId: String(s.sedeId),
  insumoId: String(s.insumoId),
  insumo: mapInsumo(s.insumo),
  stock: Number(s.stock) || 0,
  max: objetivo(Number(s.max)),
});

const ESTADOS: Record<ApiEstadoSolicitud, EstadoSolicitud> = {
  PENDIENTE: "pendiente",
  APROBADA: "aprobada",
  RECHAZADA: "rechazada",
};

const mapSolicitud = (s: ApiSolicitudInventario): SolicitudInventario => ({
  id: String(s.id),
  sedeId: String(s.sedeId),
  /* POST y PATCH devuelven la solicitud sin la sede ni el solicitante:
     solo vienen en el listado, que es donde se pintan. */
  sedeNombre: s.sede?.nombre || "—",
  solicitanteId: s.solicitante?.id ? String(s.solicitante.id) : "",
  solicitanteNombre: s.solicitante?.UserData?.name || s.solicitante?.email || "—",
  fecha: (s.createdAt || "").slice(0, 10),
  estado: ESTADOS[s.estado] ?? "pendiente",
  notas: s.notas || "",
  items: (s.items || []).map((it) => ({
    insumoId: String(it.insumoId),
    cantidad: Number(it.cantidad) || 0,
    insumoNombre: it.insumo?.nombre,
  })),
});

/* ── Alcance y plan ────────────────────────────────────────── */

/**
 * Empresa con la que trabaja esta sesión. El backend se la exige al
 * superadmin (no es de ningún negocio) y se la ignora al resto, que
 * siempre operan sobre la del token.
 * @returns undefined si el superadmin aún no ha elegido negocio (negocioId "0").
 */
function empresaDe(session: Session | null): number | undefined {
  const id = Number(session?.negocioId);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

/**
 * Stock e insumos forma parte de Bookmy CRM Pro y hoy Pro está
 * apagado, así que el backend responde 403 a todas sus rutas. Las
 * lecturas lo tratan como "sin datos" en vez de como un fallo: del
 * aviso al negocio ya se encarga PlanProLock en el layout del panel,
 * y una pantalla en blanco es mejor que una pantalla roja.
 */
async function sinPro<T>(peticion: Promise<T>, vacio: T): Promise<T> {
  try {
    return await peticion;
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) return vacio;
    throw e;
  }
}

/** Búsqueda libre por nombre o categoría — el backend no filtra. */
const coincide = (i: Insumo, term: string) =>
  `${i.nombre} ${i.categoria}`.toLowerCase().includes(term.trim().toLowerCase());

export const StockController = {
  /* ── Catálogo ──────────────────────────────────────────── */

  /**
   * Catálogo de insumos del negocio — GET /stock/insumos.
   * @param term Búsqueda por nombre o categoría (se filtra en el panel).
   */
  async getCatalogo(session: Session | null, term = ""): Promise<Insumo[]> {
    const empresaId = empresaDe(session);
    if (!empresaId) return [];
    const rows = await sinPro(StockApi.listarInsumos({ empresaId }), []);
    return rows.map(mapInsumo).filter((i) => coincide(i, term));
  },

  /**
   * Alta de un producto en el catálogo — POST /stock/insumos.
   * @throws ApiError 400 si el negocio ya tiene un insumo con ese nombre.
   */
  async addInsumo(session: Session | null, input: Omit<Insumo, "id">): Promise<Insumo> {
    const creado = await StockApi.crearInsumo({
      nombre: input.nombre,
      categoria: input.categoria,
      unidad: input.unidad,
      precioRef: input.precioRef,
      empresaId: empresaDe(session),
    });
    return mapInsumo(creado);
  },

  /**
   * Retira un insumo del catálogo — DELETE /stock/insumos/:id.
   * El backend lo archiva en vez de borrarlo: las solicitudes antiguas
   * lo citan, así que deja de ofrecerse pero el historial se conserva.
   */
  async removeInsumo(session: Session | null, id: string): Promise<void> {
    await StockApi.archivarInsumo(Number(id), empresaDe(session));
  },

  /* ── Existencias ───────────────────────────────────────── */

  /**
   * Existencias de una sede — GET /stock/sede/:sedeId. Devuelve una fila
   * por cada insumo del catálogo: el que nunca se ha comprado sale a
   * cero, para que la sede pueda reponerlo sin darlo de alta antes.
   *
   * Sin filtro de búsqueda a propósito: la lista entera la necesita el
   * modal de solicitud, que enseña cuánto queda de cada insumo. Buscar
   * recorta la tabla en la vista, no la petición.
   * @param sedeId Sede real del negocio.
   */
  async getStockSede(session: Session | null, sedeId: string): Promise<StockItem[]> {
    const empresaId = empresaDe(session);
    if (!empresaId || !Number(sedeId)) return [];
    const rows = await sinPro(StockApi.stockDeSede(Number(sedeId), empresaId), []);
    return rows.map(mapStock);
  },

  /**
   * Suma (o resta) unidades a una sede, sin bajar de 0 y sin pasarse del
   * objetivo que tenga fijado la sede. El backend guarda cantidades
   * absolutas, así que hay que leer lo que hay antes de escribir.
   * @param delta Unidades a sumar; negativo para descontar.
   */
  async ajustarStock(
    session: Session | null,
    sedeId: string,
    insumoId: string,
    delta: number
  ): Promise<void> {
    const empresaId = empresaDe(session);
    const filas = await StockApi.stockDeSede(Number(sedeId), empresaId);
    const fila = filas.find((f) => f.insumoId === Number(insumoId));
    const actual = Number(fila?.stock) || 0;
    /* El techo se mide contra el objetivo REAL de la sede, nunca contra
       MAX_OBJETIVO: ese es de presentación, y usarlo aquí guardaría en la
       base un número que nadie ha fijado (un «+5» sobre 28 escribiría 30
       en vez de 33). Sin objetivo fijado no hay techo que imponer. */
    const techo = Number(fila?.max) || 0;
    const sumado = Math.max(0, actual + delta);
    const stock = techo > 0 ? Math.min(techo, sumado) : sumado;
    /* Sin cambio no se llama al API: el botón ya sale apagado al llegar
       al objetivo, pero una carrera de clics no tiene por qué escribir. */
    if (stock === actual) return;
    await StockApi.ajustarStock(Number(sedeId), Number(insumoId), { stock, empresaId });
  },

  /* ── Solicitudes de reposición ─────────────────────────── */

  /** Solicitudes del negocio — GET /stock/solicitudes. */
  async getSolicitudes(session: Session | null): Promise<SolicitudInventario[]> {
    const empresaId = empresaDe(session);
    if (!empresaId) return [];
    const rows = await sinPro(StockApi.listarSolicitudes({ empresaId }), []);
    return rows.map(mapSolicitud);
  },

  /** Solicitudes de una sede concreta — GET /stock/solicitudes?sedeId=. */
  async getSolicitudesPorSede(
    session: Session | null,
    sedeId: string
  ): Promise<SolicitudInventario[]> {
    const empresaId = empresaDe(session);
    if (!empresaId || !Number(sedeId)) return [];
    const rows = await sinPro(
      StockApi.listarSolicitudes({ empresaId, sedeId: Number(sedeId) }),
      []
    );
    return rows.map(mapSolicitud);
  },

  /**
   * Registra una solicitud para la sede de la sesión — POST /stock/solicitudes.
   * @throws Error("SIN_ITEMS") si no se pidió ninguna unidad.
   * @throws ApiError si el backend rechaza el pedido.
   */
  async crearSolicitud(
    session: Session | null,
    items: SolicitudItem[],
    notas: string
  ): Promise<SolicitudInventario> {
    const utiles = items.filter((i) => i.cantidad > 0);
    if (!utiles.length || !Number(session?.sedeId)) throw new Error("SIN_ITEMS");
    const creada = await StockApi.crearSolicitud({
      sedeId: Number(session!.sedeId),
      notas: notas.trim() || undefined,
      items: utiles.map((i) => ({ insumoId: Number(i.insumoId), cantidad: i.cantidad })),
      empresaId: empresaDe(session),
    });
    return mapSolicitud(creada);
  },

  /**
   * Aprueba una solicitud — PATCH /stock/solicitudes/:id. El backend suma
   * las unidades pedidas al stock de la sede: una solicitud aprobada es
   * una entrada de mercancía.
   * @throws ApiError 400 si ya estaba resuelta.
   */
  async aprobarSolicitud(session: Session | null, id: string): Promise<void> {
    await StockApi.resolverSolicitud(Number(id), "APROBADA", empresaDe(session));
  },

  /** Rechaza una solicitud sin tocar las existencias. */
  async rechazarSolicitud(session: Session | null, id: string): Promise<void> {
    await StockApi.resolverSolicitud(Number(id), "RECHAZADA", empresaDe(session));
  },

  /* ── Sedes reales sobre las que opera el módulo ────────── */

  /** Sedes de la empresa de la sesión (GET /sedes/empresa/:id). */
  async getSedes(session: Session | null): Promise<Array<{ id: string; nombre: string }>> {
    const list = await NegociosController.getSedesForSession(session).catch(() => []);
    return list.map((s) => ({ id: s.id, nombre: s.nombre }));
  },
};
