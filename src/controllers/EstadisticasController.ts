/* ============================================================
   EstadisticasController — métricas calculadas desde el API
   No existe módulo de analítica en el backend: los agregados se
   computan en el cliente a partir de los endpoints oficiales
   (/payments, /auth/users, /resenas y las citas de la sesión).
============================================================ */
import type { ApiResena, ApiSede } from "@/api/types";
import type { Reserva, ServicioTop, Session, VentaMes } from "@/models";
import { PaymentsApi, ResenasApi, SedesApi } from "@/api/modules";
import { MESES_CORTOS } from "@/constants";
import { ReservasController } from "./ReservasController";

/** Paleta para la leyenda de servicios más vendidos */
const TOP_COLORS = ["var(--grad-teal)", "var(--grad-blue)", "var(--grad-amber)", "var(--grad-purple)", "var(--grad-coral)"];

export interface Resumen {
  ingresosMes: number;
  clientes: number;
  citas: number;
  valoracion: number | null;
}

/**
 * Sedes que abarca la sesión. null = todas (superadmin sin empresa elegida).
 * Misma regla que usa el panel de estadísticas.
 */
function sedesDeSesion(session: Session | null, sedes: ApiSede[]): Set<number> | null {
  if (session?.sedeId) return new Set([Number(session.sedeId)]);
  const empresaId = Number(session?.negocioId);
  if (!empresaId) return null;
  return new Set(sedes.filter((s) => s.empresaId === empresaId).map((s) => s.id));
}

/** Cliente de una cita: el id de usuario si lo hay; si no, email o nombre. */
function claveCliente(c: Reserva): string {
  return c.clienteId != null ? String(c.clienteId) : c.email || c.cliente;
}

export const EstadisticasController = {
  /**
   * KPIs del dashboard, todos acotados al negocio de la sesión.
   *
   * Antes se calculaban sobre la plataforma entera: `clientes` contaba
   * TODOS los usuarios CLIENT, `ingresosMes` sumaba los cobros de
   * cualquier negocio y `valoracion` promediaba todas las reseñas. Un
   * negocio veía en su portada el dinero y los clientes de otro. Ahora
   * se parte de las citas visibles (que ya vienen acotadas por rol) y se
   * cruzan los pagos por `appointmentId`, igual que en /estadisticas.
   *
   * @param session Sesión activa (delimita sedes y citas visibles).
   * @param language Idioma para nombres de servicio.
   */
  async getResumen(session: Session | null, language = "es"): Promise<Resumen> {
    const [citas, payments, resenas, sedes] = await Promise.all([
      ReservasController.getForSession(session, language).catch(() => [] as Reserva[]),
      PaymentsApi.findAll().catch(() => []),
      ResenasApi.findAll().catch(() => [] as ApiResena[]),
      SedesApi.findAll().catch(() => [] as ApiSede[]),
    ]);

    const now = new Date();
    const mes = now.getUTCMonth();
    const anio = now.getUTCFullYear();

    /* Solo los cobros de las citas que esta sesión puede ver. */
    const idsVisibles = new Set(
      citas.map((c) => c.apiId).filter((id): id is number => id != null)
    );
    const ingresosMes = (payments || [])
      .filter((p) => {
        if (p.status !== "PAID" || !p.createdAt) return false;
        if (!idsVisibles.has(p.appointmentId)) return false;
        const d = new Date(p.createdAt);
        return d.getUTCMonth() === mes && d.getUTCFullYear() === anio;
      })
      .reduce((acc, p) => acc + (p.totalAmount || 0), 0);

    /* Un cliente del negocio es quien ha reservado en él: la misma
       definición con la que el backend acota ahora GET /clients. */
    const clientes = new Set(citas.map(claveCliente)).size;

    const visibles = sedesDeSesion(session, sedes);
    const calif = (resenas || [])
      .filter((r) => r.aprobado && (!visibles || (r.sedeId != null && visibles.has(r.sedeId))))
      .map((r) => r.calificacion)
      .filter((n) => typeof n === "number");
    const valoracion = calif.length ? calif.reduce((a, b) => a + b, 0) / calif.length : null;

    return { ingresosMes, clientes, citas: citas.length, valoracion };
  },

  /**
   * Ventas por mes (últimos 6): suma de payments PAID por mes, solo de las
   * reservas que la sesión puede ver — si no, mezclaría negocios.
   * @returns Serie { mes, valor } lista para el gráfico de barras.
   */
  async getVentasPorMes(session: Session | null = null, language = "es"): Promise<VentaMes[]> {
    const [payments, citas] = await Promise.all([
      PaymentsApi.findAll().catch(() => []),
      ReservasController.getForSession(session, language).catch(() => [] as Reserva[]),
    ]);
    const idsVisibles = new Set(
      citas.map((c) => c.apiId).filter((id): id is number => id != null)
    );
    const now = new Date();
    const serie: VentaMes[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const total = (payments || [])
        .filter((p) => {
          if (p.status !== "PAID" || !p.createdAt) return false;
          if (!idsVisibles.has(p.appointmentId)) return false;
          const pd = new Date(p.createdAt);
          return pd.getUTCMonth() === d.getUTCMonth() && pd.getUTCFullYear() === d.getUTCFullYear();
        })
        .reduce((acc, p) => acc + (p.totalAmount || 0), 0);
      serie.push({ mes: MESES_CORTOS[d.getUTCMonth()], valor: Math.round(total) });
    }
    return serie;
  },

  /**
   * Servicios más reservados: agrupa las citas visibles por nombre
   * de servicio y devuelve el top 5 con colores de la paleta.
   */
  async getServiciosTop(session: Session | null, language = "es"): Promise<ServicioTop[]> {
    const citas = await ReservasController.getForSession(session, language).catch(() => [] as Reserva[]);
    const counts = new Map<string, number>();
    for (const c of citas) counts.set(c.servicio, (counts.get(c.servicio) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, valor], i) => ({ nombre, valor, color: TOP_COLORS[i % TOP_COLORS.length] }));
  },
};
