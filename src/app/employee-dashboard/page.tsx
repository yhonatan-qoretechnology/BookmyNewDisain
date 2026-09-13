"use client";
/* ============================================================
   Employee dashboard — agenda de la especialista (View)
============================================================ */
import { useEffect, useMemo, useState } from "react";
import type { Reserva } from "@/models";
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
import { PersonRow } from "@/components/ui/People";
import ExtensionTag from "@/components/reservas/ExtensionTag";
import Button from "@/components/ui/Button";
import ExtenderCitaModal from "@/components/reservas/ExtenderCitaModal";
import styles from "./employee.module.css";

/** Cada cuánto se revisa qué cita está en curso */
const TICK_EN_CURSO_MS = 30_000;

export default function EmployeeDashboardPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  const [search, setSearch] = useState("");
  const [estadoIdx, setEstadoIdx] = useState(0);
  const estado = ESTADOS_RESERVA[estadoIdx];

  /* Citas propias del profesional — GET /appointments?sedeId, filtradas
     por profesionalId (ver ReservasController.getByEmpleado) */
  const { data: mias, reload } = useData(
    () => ReservasController.getByEmpleado(session, locale),
    [session?.id, session?.sedeId, session?.profesionalId, locale], []
  );

  /* Cita en curso — se recalcula con el reloj para que aparezca y
     desaparezca sola sin recargar la agenda */
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), TICK_EN_CURSO_MS);
    return () => clearInterval(id);
  }, []);
  const enCurso = useMemo(() => ReservasController.citaEnCurso(mias, ahora), [mias, ahora]);
  const sePaso = !!enCurso?.finISO && Date.parse(enCurso.finISO) < ahora;
  const [extendiendo, setExtendiendo] = useState<Reserva | null>(null);

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

  return (
    <>
      {enCurso && (
        <section className={`${styles.enCurso} ${sePaso ? styles.enCursoPasada : ""}`} aria-live="polite">
          <span className={`${styles.empIcon} ${sePaso ? styles.amber : styles.teal}`}><Icon name="clock" /></span>
          <div className={styles.enCursoBody}>
            <span className={styles.enCursoLabel}>{t("extender.enCurso")}</span>
            <b>{enCurso.servicio} · {enCurso.cliente}</b>
            <span>
              {sePaso
                ? t("extender.pasada", { fin: enCurso.horaFin || "—" })
                : t("extender.horario", { inicio: enCurso.hora, fin: enCurso.horaFin || "—" })}
            </span>
          </div>
          <Button onClick={() => setExtendiendo(enCurso)}>{t("extender.boton")}</Button>
        </section>
      )}

      <ExtenderCitaModal
        reserva={extendiendo}
        onClose={() => setExtendiendo(null)}
        onCambios={() => void reload()}
      />

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
              <tr key={r.id} onClick={() => popup.open(r, reload)} style={{ cursor: "pointer" }}>
                <td><b>{r.id}</b></td>
                <td>{r.servicio}<ExtensionTag reserva={r} /></td>
                <td><PersonRow name={r.cliente} photo={r.clienteFoto} /></td>
                <td>{fmtFechaCorta(r.fecha)}</td>
                <td>{r.hora}</td>
                <PriceCell value={r.precio} />
                <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
