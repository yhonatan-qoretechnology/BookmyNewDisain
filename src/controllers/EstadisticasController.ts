/* ============================================================
   EstadisticasController — métricas calculadas desde el API
   No existe módulo de analítica en el backend: los agregados se
   computan en el cliente a partir de los endpoints oficiales
   (/payments, /auth/users, /resenas y las citas de la sesión).
============================================================ */
import type { Reserva, ServicioTop, Session, VentaMes } from "@/models";
import { AuthApi, PaymentsApi, ResenasApi } from "@/api/modules";
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

export const EstadisticasController = {
  /**
   * KPIs del dashboard/estadísticas calculados con datos reales:
   * ingresos del mes (payments PAID), nº de clientes (users CLIENT),
   * nº de citas de la sesión y valoración media (resenas).
   * @param session Sesión activa (delimita las citas visibles).
   * @param language Idioma para nombres de servicio.
   */
  async getResumen(session: Session | null, language = "es"): Promise<Resumen> {
    const [payments, users, resenas, citas] = await Promise.all([
      PaymentsApi.findAll().catch(() => []),
      AuthApi.findAllUsers().catch(() => []),
      ResenasApi.findAll().catch(() => []),
      ReservasController.getForSession(session, language).catch(() => [] as Reserva[]),
    ]);
    const now = new Date();
    const mes = now.getUTCMonth();
    const anio = now.getUTCFullYear();
    const ingresosMes = (payments || [])
      .filter((p) => {
        if (p.status !== "PAID" || !p.createdAt) return false;
        const d = new Date(p.createdAt);
        return d.getUTCMonth() === mes && d.getUTCFullYear() === anio;
      })
      .reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const clientes = (users || []).filter((u) => u.role === "CLIENT").length;
    const calif = (resenas || []).map((r) => r.calificacion).filter((n) => typeof n === "number");
    const valoracion = calif.length ? calif.reduce((a, b) => a + b, 0) / calif.length : null;
    return { ingresosMes, clientes, citas: citas.length, valoracion };
  },

  /**
   * Ventas por mes (últimos 6): suma de payments PAID por mes.
   * @returns Serie { mes, valor } lista para el gráfico de barras.
   */
  async getVentasPorMes(): Promise<VentaMes[]> {
    const payments = await PaymentsApi.findAll().catch(() => []);
    const now = new Date();
    const serie: VentaMes[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const total = (payments || [])
        .filter((p) => {
          if (p.status !== "PAID" || !p.createdAt) return false;
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
