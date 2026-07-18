"use client";
/* ============================================================
   Dashboard — resumen general (View)
============================================================ */
import { useRouter } from "next/navigation";
import { useData } from "@/hooks/useData";
import { ROUTES, fmtFechaCorta } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { NegociosController } from "@/controllers/NegociosController";
import { EstadisticasController } from "@/controllers/EstadisticasController";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { PersonRow } from "@/components/ui/People";
import styles from "./dashboard.module.css";

/* Selector de empresa — SOLO visible para superadmin.
   Cambia el contexto de la sesión: todos los controladores ya
   filtran por session.negocioId, así que el panel entero cambia. */
function EmpresaSelector() {
  const { session, updateSession } = useSession();
  const { t } = useI18n();
  const { data: empresas } = useData(() => NegociosController.getAll(), [], []);
  if (session?.role !== "superadmin") return null;
  return (
    <div className={styles.empresaBar}>
      <Icon name="shield" width={18} height={18} />
      {t("empresas.selectorLabel")}
      <select
        className={styles.empresaSelect}
        value={session.negocioId}
        onChange={(e) => {
          const n = empresas.find((x) => x.id === e.target.value);
          if (n) updateSession({ negocioId: n.id, negocioName: n.nombre });
        }}
        aria-label={t("empresas.selectorLabel")}
      >
        {empresas.map((n) => (
          <option key={n.id} value={n.id}>{n.nombre}</option>
        ))}
      </select>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const popup = useReservaPopup();

  const { locale } = useI18n();
  const { data: ultimas } = useData(
    () => ReservasController.getUltimas(5, session, locale),
    [session?.id, session?.negocioId, locale], []
  );
  const { data: todas } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, locale], []
  );
  /* KPIs calculados desde el API (payments, users, resenas, citas) */
  const { data: resumen } = useData(
    () => EstadisticasController.getResumen(session, locale),
    [session?.id, session?.negocioId, locale],
    { ingresosMes: 0, clientes: 0, citas: 0, valoracion: null as number | null }
  );
  const calMap = ReservasController.buildCalendarMap(todas);
  const calEvents = Object.fromEntries(
    Object.entries(calMap).map(([fecha, list]) => [
      fecha,
      list.map((r) => ({ id: r.id, label: `${r.hora} ${r.cliente.split(" ")[0]}` })),
    ])
  );

  const hoyISO = new Date().toISOString().slice(0, 10);
  const hoy = todas.filter((r) => r.fecha === hoyISO);

  return (
    <>
      <EmpresaSelector />
      <StatGrid>
        <StatCard color="teal"  icon={<Icon name="user" />}  label={t("dashboard.totalClients")}  value={String(resumen.clientes)} footer={t("dashboard.fromApi")} />
        <StatCard color="green" icon={<Icon name="chart" />} label={t("estadisticas.monthRevenue")} value={`${resumen.ingresosMes.toFixed(2)}€`} footer={t("estadisticas.thisMonth")} />
        <StatCard color="coral" icon={<Icon name="clock" />} label={t("dashboard.totalBookings")} value={String(resumen.citas)} footer={t("dashboard.fromApi")} />
        <StatCard color="amber" icon={<Icon name="chat" />}  label={t("estadisticas.rating")} value={resumen.valoracion != null ? `${resumen.valoracion.toFixed(1)} ★` : "—"} footer={t("estadisticas.fromReviews")} />
      </StatGrid>

      <Panel style={{ marginTop: 20 }}>
        <PanelHead
          title={t("dashboard.latestTitle")}
          sub={t("dashboard.latestSub", { negocio: session?.negocioName || "—" })}
          right={
            <Button size="sm" onClick={() => router.push(`${ROUTES.reservas}?nueva=1`)}>
              {t("dashboard.addBooking")}
            </Button>
          }
        />
        <DataTable headers={[t("common.service"), t("common.client"), t("common.date"), t("common.time"), t("common.price"), t("common.state")]}>
          {ultimas.map((r) => (
            <tr key={r.id} onClick={() => popup.open(r.id)} style={{ cursor: "pointer" }}>
              <td><b>{r.servicio}</b></td>
              <td><PersonRow name={r.cliente} /></td>
              <td>{fmtFechaCorta(r.fecha)}</td>
              <td>{r.hora}</td>
              <PriceCell value={r.precio} />
              <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <div className={styles.bottomGrid}>
        <Panel>
          <div className={styles.calHeaderPill}>
            <Icon name="calendar" /> {t("common.today")} · {new Date().toLocaleDateString()}
          </div>
          <div className={styles.dayList}>
            {hoy.length === 0 && <span>{t("dashboard.noToday")}</span>}
            {hoy.map((r) => (
              <div key={r.id} className={styles.dayItem} onClick={() => popup.open(r.id)}>
                <span className={styles.dayHour}>{r.hora}</span>
                <span className={styles.dayBody}>
                  <b>{r.servicio}</b>
                  <span>{r.cliente}</span>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("dashboard.calTitle")} sub={t("dashboard.calSub")} />
          <CalendarGrid events={calEvents} maxPerCell={2} onEventClick={(id) => popup.open(id)} />
        </Panel>
      </div>
    </>
  );
}
