"use client";
import { Suspense, useMemo, useState } from "react";
/* ============================================================
   Calendario — vista mensual de todas las reservas (View)
   Con «Especialista» se ve la agenda de uno solo: el calendario
   filtrado y la lista de sus próximas reservas («?empleado=<id>»
   entra ya filtrado, p. ej. desde Personal).
============================================================ */
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES, fmtFechaCorta } from "@/constants";
import { zonaHoy } from "@/lib/timezone";
import Badge from "@/components/ui/Badge";
import styles from "./calendario.module.css";
import { ReservasController } from "@/controllers/ReservasController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { FestivosApi } from "@/api/modules";
import FestivosLocales from "@/components/festivos/FestivosLocales";
import ContextoFestivos from "@/components/festivos/ContextoFestivos";
import { mapaFestivos } from "@/components/festivos/mapaFestivos";

function CalendarioContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const popup = useReservaPopup();

  /* Festivos del año en curso, acotados a la sede de la sesión: el backend
     resuelve su comunidad y su municipio. Son informativos — pintan la
     celda en rojo pero NO impiden agendar. */
  const { data: diasFestivos, reload: reloadFestivos } = useData(
    () => FestivosApi.findAll({
      anio: new Date().getFullYear(),
      /* Con sede fija, los suyos; el dueño trabaja sobre toda la empresa, así
         que se piden los de todas sus sedes — si no, solo llegaban los
         nacionales y el calendario no marcaba ningún festivo autonómico. */
      ...(session?.sedeId
        ? { sedeId: Number(session.sedeId) }
        : { empresaId: Number(session?.negocioId) || undefined }),
    }).catch(() => []),
    [session?.sedeId, session?.negocioId],
    [],
  );

  /* Sincronización del calendario oficial (solo superadmin): se corre una
     vez al año, cuando sale el calendario del siguiente. */
  const [anioSync, setAnioSync] = useState(() => new Date().getFullYear() + 1);
  const [sincronizando, setSincronizando] = useState(false);
  /** Gestor de los festivos de cada pueblo, que la API oficial no trae */
  const [locales, setLocales] = useState(false);

  const sincronizarFestivos = async () => {
    setSincronizando(true);
    try {
      const r = await FestivosApi.sincronizar(anioSync);
      toast(
        t("calendario.festivosResultado", {
          autonomicos: r.regionalesCount,
          nacionales: r.nacionalesCount,
          locales: r.localesCount,
          municipios: r.municipiosCount,
          anio: r.anio,
        }),
        "success",
      );
      /* Las del municipio solo las publica la fuente oficial del año en
         curso: si se pide otro, se dice en vez de dejar un 0 sin explicar. */
      if (r.localesOmitidas) toast(r.localesOmitidas, "default");
      if (r.regionesFallidas?.length) {
        toast(t("calendario.festivosFallidas", { comunidades: r.regionesFallidas.join(", ") }), "error");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setSincronizando(false);
    }
  };

  const { data: lista, reload } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, locale], []
  );
  /* Agenda por especialista */
  const [empleadoId, setEmpleadoId] = useState(() => params.get("empleado") || "");
  const empleados = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of lista) if (r.empleadoId && r.empleadoName) m.set(String(r.empleadoId), r.empleadoName);
    return Array.from(m, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [lista]);
  const visibles = useMemo(
    () => (empleadoId ? lista.filter((r) => String(r.empleadoId) === empleadoId) : lista),
    [lista, empleadoId]
  );
  const proximas = useMemo(() => {
    if (!empleadoId) return [];
    const hoy = zonaHoy();
    return visibles
      .filter((r) => r.fecha >= hoy && r.estado !== "cancelado" && r.estado !== "atendida" && r.estado !== "noShow")
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  }, [visibles, empleadoId]);
  const nombreEmpleado = empleados.find((e) => e.id === empleadoId)?.nombre || "";

  const map = ReservasController.buildCalendarMap(visibles);
  const events = Object.fromEntries(
    Object.entries(map).map(([fecha, rs]) => [
      fecha,
      rs.map((r) => ({ id: r.id, label: `${r.hora} ${r.servicio}`, data: r })),
    ])
  );

  const festivos = useMemo(() => mapaFestivos(diasFestivos), [diasFestivos]);


  return (
    <Panel>
      <PanelHead
        title={t("calendario.panelTitle")}
        sub={
          session?.role === "admin"
            ? t("calendario.subBranch", { sede: session.sedeName || "" })
            : t("calendario.subAll", { negocio: session?.negocioName || "—" })
        }
        right={
          <Button size="sm" onClick={() => router.push(`${ROUTES.reservas}?nueva=1`)}>
            {t("dashboard.addBooking")}
          </Button>
        }
      />
      {session?.role === "superadmin" && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            {t("calendario.festivosAnio")}
            <input
              type="number"
              min={2020}
              max={2099}
              value={anioSync}
              onChange={(e) => setAnioSync(e.target.valueAsNumber || new Date().getFullYear())}
              style={{ width: 110, padding: "7px 9px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "inherit" }}
            />
          </label>
          <Button size="sm" disabled={sincronizando} onClick={() => void sincronizarFestivos()}>
            {sincronizando ? t("calendario.festivosSincronizando") : t("calendario.festivosSincronizar")}
          </Button>
          {/* Los del municipio no vienen en la sincronización: se cargan a mano */}
          <Button size="sm" variant="ghost" onClick={() => setLocales(true)}>
            {t("festivos.localesBoton")}
          </Button>
        </div>
      )}

      <FestivosLocales
        abierto={locales}
        anio={new Date().getFullYear()}
        onClose={() => setLocales(false)}
        onCambios={() => void reloadFestivos()}
      />

      {/* Agenda de un especialista */}
      <div className={styles.filtroEmpleado}>
        <label>
          <span>{t("calendario.especialista")}</span>
          <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
            <option value="">{t("calendario.todosEspecialistas")}</option>
            {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        {empleadoId && (
          <span className={styles.resumen}>
            {t("calendario.proximasN", { n: proximas.length, nombre: nombreEmpleado })}
          </span>
        )}
      </div>

      {/* De qué municipio son los festivos que se están pintando */}
      <ContextoFestivos
        sedeId={session?.sedeId ? Number(session.sedeId) : undefined}
        empresaId={!session?.sedeId ? Number(session?.negocioId) || undefined : undefined}
        festivos={diasFestivos || []}
      />

      <CalendarGrid
        events={events}
        festivos={festivos}
        onEventClick={(id, data) => data ? popup.open(data, reload) : popup.open(id, reload)}
        onViewChange={(v) => toast(t("common.comingSoon", { view: v }), "default")}
      />

      {empleadoId && (
        <section className={styles.proximas} aria-label={t("calendario.proximasTitulo", { nombre: nombreEmpleado })}>
          <h4>{t("calendario.proximasTitulo", { nombre: nombreEmpleado })}</h4>
          {proximas.length === 0 ? (
            <p className={styles.vacio}>{t("calendario.proximasVacio")}</p>
          ) : (
            proximas.map((r) => (
              <button key={r.id} type="button" className={styles.cita} onClick={() => popup.open(r, reload)}>
                <b>{fmtFechaCorta(r.fecha)}</b>
                <span>{r.hora}{r.horaFin ? ` – ${r.horaFin}` : ""}</span>
                <span className={styles.citaQue}>{r.servicio} · {r.cliente}</span>
                <Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge>
              </button>
            ))
          )}
        </section>
      )}

      {/* Atribución exigida por los términos de uso de la fuente de festivos */}
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--slate-500)" }}>
        {t("calendario.festivosCreditos")}{" "}
        <a href="https://calendariosnacionales.com" target="_blank" rel="noopener noreferrer">
          {t("calendario.festivosFuente")}
        </a>
      </p>
    </Panel>
  );
}

export default function CalendarioPage() {
  return (
    <Suspense fallback={null}>
      <CalendarioContent />
    </Suspense>
  );
}
