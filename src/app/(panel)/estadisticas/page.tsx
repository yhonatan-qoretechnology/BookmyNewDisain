"use client";
/* ============================================================
   Estadísticas — gráficos de ventas y servicios (View)
============================================================ */
import { EstadisticasController } from "@/controllers/EstadisticasController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Icon from "@/components/ui/Icon";
import styles from "./estadisticas.module.css";

export default function EstadisticasPage() {
  const { t, locale } = useI18n();
  const { session } = useSession();
  /* Series calculadas desde /payments y las citas de la sesión */
  const { data: ventas } = useData(() => EstadisticasController.getVentasPorMes(), [], []);
  const { data: top } = useData(
    () => EstadisticasController.getServiciosTop(session, locale),
    [session?.id, locale], []
  );
  const { data: resumen } = useData(
    () => EstadisticasController.getResumen(session, locale),
    [session?.id, locale],
    { ingresosMes: 0, clientes: 0, citas: 0, valoracion: null as number | null }
  );
  const max = Math.max(1, ...ventas.map((v) => v.valor));
  const maxTop = Math.max(1, ...top.map((x) => x.valor));

  return (
    <>
      <StatGrid>
        <StatCard color="blue"   icon={<Icon name="chart" />} label={t("estadisticas.monthRevenue")} value={`${resumen.ingresosMes.toFixed(2)}€`} footer={t("estadisticas.thisMonth")} />
        <StatCard color="purple" icon={<Icon name="user" />}  label={t("dashboard.totalClients")} value={String(resumen.clientes)} footer={t("dashboard.fromApi")} />
        <StatCard color="teal"   icon={<Icon name="clock" />} label={t("dashboard.totalBookings")} value={String(resumen.citas)} footer={t("dashboard.fromApi")} />
        <StatCard color="amber"  icon={<Icon name="chat" />}  label={t("estadisticas.rating")} value={resumen.valoracion != null ? `${resumen.valoracion.toFixed(1)} ★` : "—"} footer={t("estadisticas.fromReviews")} />
      </StatGrid>

      <div className={styles.chartGrid}>
        <Panel>
          <PanelHead title={t("estadisticas.salesTitle")} sub={t("estadisticas.salesSub")} />
          <div className={styles.bars}>
            {ventas.map((v) => (
              <div key={v.mes} className={styles.barCol}>
                <div
                  className={styles.bar}
                  data-val={`${v.valor}k€`}
                  style={{ height: `${(v.valor / max) * 100}%` }}
                />
                <span className={styles.barLabel}>{v.mes}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("estadisticas.topTitle")} sub={t("estadisticas.topSub")} />
          <div className={styles.legend}>
            {top.map((t) => (
              <div key={t.nombre} className={styles.legendItem}>
                <div className={styles.legendTop}>
                  <span>{t.nombre}</span>
                  <span>{t.valor}</span>
                </div>
                <div className={styles.legendTrack}>
                  <div
                    className={styles.legendFill}
                    style={{ width: `${(t.valor / maxTop) * 100}%`, background: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
