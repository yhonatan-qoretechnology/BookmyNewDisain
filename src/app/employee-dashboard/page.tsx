"use client";
/* ============================================================
   Employee dashboard — agenda de la especialista (View)
============================================================ */
import { useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import { ESTADOS_RESERVA, fmtFechaCorta } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead, SelectPill } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { PersonRow } from "@/components/ui/People";
import styles from "./employee.module.css";

export default function EmployeeDashboardPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  const [search, setSearch] = useState("");
  const [estadoIdx, setEstadoIdx] = useState(0);
  const estado = ESTADOS_RESERVA[estadoIdx];

  /* Citas de la sede del empleado — GET /appointments?sedeId */
  const { data: mias } = useData(
    () => ReservasController.getByEmpleado(session, locale),
    [session?.id, session?.sedeId, locale], []
  );

  const lista = useMemo(() => {
    const q = search.toLowerCase();
    return mias.filter((r) => {
      const matchQ = (r.servicio + r.cliente + r.id).toLowerCase().includes(q);
      const matchE = estado === "todos" || r.estado === estado;
      return matchQ && matchE;
    });
  }, [mias, search, estado]);

  // Hoy real (YYYY-MM-DD)
  const hoyISO = new Date().toISOString().slice(0, 10);
  const hoyCount = mias.filter((r) => r.fecha === hoyISO).length;
  const pendientes = mias.filter((r) => r.estado === "pendiente").length;
  const atendidas = mias.filter((r) => r.estado === "atendida").length;

  const calMap = ReservasController.buildCalendarMap(mias);
  const events = Object.fromEntries(
    Object.entries(calMap).map(([fecha, rs]) => [
      fecha,
      rs.map((r) => ({ id: r.id, label: `${r.hora} ${r.cliente.split(" ")[0]}` })),
    ])
  );

  return (
    <>
      <div className={styles.empStats}>
        <div className={styles.empCard}>
          <span className={`${styles.empIcon} ${styles.teal}`}><Icon name="calendar-check" /></span>
          <span className={styles.empBody}><span>{t("employee.bookingsToday")}</span><b>{hoyCount}</b></span>
        </div>
        <div className={styles.empCard}>
          <span className={`${styles.empIcon} ${styles.amber}`}><Icon name="clock" /></span>
          <span className={styles.empBody}><span>{t("employee.pending")}</span><b>{pendientes}</b></span>
        </div>
        <div className={styles.empCard}>
          <span className={`${styles.empIcon} ${styles.blue}`}><Icon name="check" /></span>
          <span className={styles.empBody}><span>{t("employee.attended")}</span><b>{atendidas}</b></span>
        </div>
      </div>

      <Panel>
        <PanelHead
          title={t("employee.myBookings")}
          sub={`${session?.especialidad || t("roles.employee")} · ${session?.sedeName || ""}`}
        />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("employee.searchPlaceholder")} />
          <ToolbarActions>
            <SelectPill onClick={() => setEstadoIdx((i) => (i + 1) % ESTADOS_RESERVA.length)}>
              {t("reservas.stateFilter", { estado: estado === "todos" ? t("common.all") : t(`estados.${estado}`) })}
            </SelectPill>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="calendar" title={t("employee.emptyTitle")} message={t("employee.emptyMsg")} />
        ) : (
          <DataTable headers={[t("common.id"), t("common.service"), t("common.client"), t("common.date"), t("common.time"), t("common.price"), t("common.state")]}>
            {lista.map((r) => (
              <tr key={r.id} onClick={() => popup.open(r.id)} style={{ cursor: "pointer" }}>
                <td><b>{r.id}</b></td>
                <td>{r.servicio}</td>
                <td><PersonRow name={r.cliente} /></td>
                <td>{fmtFechaCorta(r.fecha)}</td>
                <td>{r.hora}</td>
                <PriceCell value={r.precio} />
                <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel style={{ marginTop: 20 }}>
        <PanelHead title={t("employee.myCalendar")} sub={t("employee.myCalendarSub")} />
        <CalendarGrid events={events} maxPerCell={3} onEventClick={(id) => popup.open(id)} />
      </Panel>
    </>
  );
}
