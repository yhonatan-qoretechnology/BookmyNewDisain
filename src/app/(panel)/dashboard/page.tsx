"use client";
/* ============================================================
   Dashboard — resumen general (View)
============================================================ */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/hooks/useData";
import { ROUTES, fmtFechaCorta } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { NegociosController } from "@/controllers/NegociosController";
import { EstadisticasController } from "@/controllers/EstadisticasController";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import ReagendarModal from "@/components/reservas/ReagendarModal";
import type { Reserva } from "@/models";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/Toolbar";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { PersonRow } from "@/components/ui/People";
import styles from "./dashboard.module.css";

/* Selectores de contexto — empresa (solo superadmin) y sede
   (superadmin/dueño). Cambian la sesión: todos los controladores
   ya filtran por session.negocioId/session.sedeId, así que el
   panel entero cambia. */
function ContextSelectors() {
  const { session, updateSession } = useSession();
  const { t } = useI18n();
  const { data: empresas } = useData(() => NegociosController.getAll(), [], []);
  const { data: sedes } = useData(
    () => NegociosController.getSedesForSession(session),
    [session?.negocioId],
    []
  );

  if (!session) return null;
  const showEmpresa = session.role === "superadmin";
  const showSede = (session.role === "superadmin" || session.role === "owner") && sedes.length > 0;
  if (!showEmpresa && !showSede) return null;

  return (
    <div className={styles.empresaBar}>
      {showEmpresa && (
        <div className={styles.selectorGroup}>
          <Icon name="shield" width={18} height={18} />
          {t("empresas.selectorLabel")}
          <select
            className={styles.empresaSelect}
            value={session.negocioId}
            onChange={(e) => {
              const n = empresas.find((x) => x.id === e.target.value);
              if (n) updateSession({ negocioId: n.id, negocioName: n.nombre, sedeId: null, sedeName: null });
            }}
            aria-label={t("empresas.selectorLabel")}
          >
            {empresas.map((n) => (
              <option key={n.id} value={n.id}>{n.nombre}</option>
            ))}
          </select>
        </div>
      )}
      {showSede && (
        <div className={styles.selectorGroup}>
          <Icon name="mapPin" width={18} height={18} />
          {t("empresas.sedeSelectorLabel")}
          <select
            className={styles.empresaSelect}
            value={session.sedeId || ""}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) { updateSession({ sedeId: null, sedeName: null }); return; }
              const s = sedes.find((x) => x.id === id);
              if (s) updateSession({ sedeId: s.id, sedeName: s.nombre });
            }}
            aria-label={t("empresas.sedeSelectorLabel")}
          >
            <option value="">{t("empresas.allSedes")}</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const popup = useReservaPopup();

  const { locale } = useI18n();
  const { data: ultimas, reload: reloadUltimas } = useData(
    () => ReservasController.getUltimas(5, session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale], []
  );
  const { data: todas, reload: reloadTodas } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale], []
  );
  /* KPIs calculados desde el API (payments, users, resenas, citas) */
  const { data: resumen } = useData(
    () => EstadisticasController.getResumen(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale],
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
  const [selectedDate, setSelectedDate] = useState<string | null>(hoyISO);
  const fechaReservas = selectedDate ? todas.filter((r) => r.fecha === selectedDate) : [];

  /* Buscador en tiempo real de "Últimas reservas" (servicio o cliente) */
  const [buscarUltimas, setBuscarUltimas] = useState("");
  const ultimasFiltradas = useMemo(() => {
    const q = buscarUltimas.trim().toLowerCase();
    if (!q) return ultimas;
    return ultimas.filter((r) => `${r.servicio} ${r.cliente}`.toLowerCase().includes(q));
  }, [ultimas, buscarUltimas]);

  /* Reagendado: modal con calendario + horas disponibles */
  const [reagendando, setReagendando] = useState<Reserva | null>(null);
  const onReagendada = () => {
    void reloadUltimas();
    void reloadTodas();
  };

  return (
    <>
      <ContextSelectors />
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
        <div className={styles.latestToolbar}>
          <SearchBox
            value={buscarUltimas}
            onChange={setBuscarUltimas}
            placeholder={t("dashboard.latestSearchPlaceholder")}
          />
        </div>
        {ultimasFiltradas.length === 0 ? (
          <p style={{ padding: "18px 4px", color: "var(--slate-500)", fontSize: 13.5 }}>
            {t("dashboard.latestEmpty")}
          </p>
        ) : (
          <DataTable headers={[t("common.service"), t("common.client"), t("common.date"), t("common.time"), t("common.price"), t("common.state"), t("common.actions")]}>
            {ultimasFiltradas.map((r) => (
              <tr key={r.id} onClick={() => popup.open(r.id)} style={{ cursor: "pointer" }}>
                <td><b>{r.servicio}</b></td>
                <td><PersonRow name={r.cliente} /></td>
                <td>{fmtFechaCorta(r.fecha)}</td>
                <td>{r.hora}</td>
                <PriceCell value={r.precio} />
                <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
                <td>
                  <IconButton
                    aria-label={t("reservas.reagendarAria", { servicio: r.servicio, cliente: r.cliente })}
                    onClick={(e) => { e.stopPropagation(); setReagendando(r); }}
                  >
                    <Icon name="calendar-check" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <div className={styles.bottomGrid}>
        <Panel>
          <div className={styles.calHeaderPill}>
            <Icon name="calendar" /> {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString() : t("common.today")}
          </div>
          <div className={styles.dayList}>
            {fechaReservas.length === 0 && <span>{t("dashboard.noToday")}</span>}
            {fechaReservas.map((r) => (
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
          <CalendarGrid 
            events={calEvents} 
            maxPerCell={2} 
            onEventClick={(id) => popup.open(id)} 
            selectable={true}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </Panel>
      </div>

      <ReagendarModal
        reserva={reagendando}
        onClose={() => setReagendando(null)}
        onReagendada={onReagendada}
      />
    </>
  );
}
