"use client";
/* ============================================================
   Dashboard — resumen general (View)
   ------------------------------------------------------------
   El orden de la pantalla y el de la animación son el mismo, y
   salen del timeline maestro de MOTION_SPEC.md §4 (referencia 05):

     0,12 s  fila de hoy (cifras y acciones)
     0,27 s  primera tarjeta KPI, y una cada 65 ms hasta 0,46 s
     0,53 s  bloques de abajo, uno cada 80 ms
     ~1,1 s  todo asentado y nítido

   El banner hero que abría la pantalla se quitó: ocupaba 294 px
   para un saludo y dos cifras, que ahora van en una línea.

   Ese ritmo NO está repartido por el archivo: lo marca la cascada
   del contenedor (delayChildren 0,12 + 65 ms por hijo) y cada
   sección solo dice cuánto espera a los suyos. Si hay que
   afinarlo, se toca aquí y en src/lib/motion.ts, no pieza a pieza.
============================================================ */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useData } from "@/hooks/useData";
import { ROUTES, fmtFechaCorta } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { NegociosController } from "@/controllers/NegociosController";
import { EstadisticasController } from "@/controllers/EstadisticasController";
import { FestivosApi } from "@/api/modules";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useRegion } from "@/context/RegionContext";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import ReagendarModal from "@/components/reservas/ReagendarModal";
import type { Reserva } from "@/models";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import { SearchBox } from "@/components/ui/Toolbar";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import CalendarGrid from "@/components/ui/CalendarGrid";
import ContextoFestivos from "@/components/festivos/ContextoFestivos";
import { mapaFestivos } from "@/components/festivos/mapaFestivos";
import { PersonRow } from "@/components/ui/People";
import { StaggerContainer, StaggerItem } from "@/components/animations";
import PersonalizarPanelModal from "@/components/dashboard/PersonalizarPanelModal";
import KpiCard from "@/components/dashboard/KpiCard";
import { entrada, grupo } from "@/components/dashboard/motionDashboard";
import { pathSparkline, seriesDelDashboard } from "@/components/dashboard/serieKpi";
import { blurIn, stagger } from "@/lib/motion";
import styles from "./dashboard.module.css";

/* Selectores de contexto — empresa (solo superadmin) y sede
   (superadmin/dueño). Cambian la sesión: todos los controladores
   ya filtran por session.negocioId/session.sedeId, así que el
   panel entero cambia. */
function ContextSelectors() {
  const { session, updateSession } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();
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
    /* Entra por su cuenta (initial/animate propios) y no como un hijo
       más de la cascada: solo la ven dos roles, y si consumiera un
       turno el resto del dashboard llegaría tarde para unos y pronto
       para otros. El timeline del §4 tiene que ser el mismo siempre. */
    <motion.div
      className={styles.empresaBar}
      variants={entrada(reduce, blurIn)}
      initial="hidden"
      animate="show"
    >
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
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const { fmtMoneda } = useRegion();
  const popup = useReservaPopup();
  const reduce = useReducedMotion();

  const { locale } = useI18n();
  const { data: ultimas, reload: reloadUltimas } = useData(
    () => ReservasController.getUltimas(5, session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale], []
  );
  const { data: todas, reload: reloadTodas } = useData(
    () => ReservasController.getForSession(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale], []
  );
  /* Tras gestionar una cita desde el popup se refrescan ambos listados */
  const recargarCitas = () => { void reloadUltimas(); void reloadTodas(); };
  /* KPIs calculados desde el API (payments, users, resenas, citas) */
  const { data: resumen } = useData(
    () => EstadisticasController.getResumen(session, locale),
    [session?.id, session?.negocioId, session?.sedeId, locale],
    { ingresosMes: 0, clientes: 0, citas: 0, valoracion: null as number | null }
  );
  /* Festivos de la sede (o de todas las de la empresa, si el dueño no
     trabaja sobre una): el dashboard es lo primero que se mira por la
     mañana y aquí tampoco se marcaban. */
  const { data: diasFestivos } = useData(
    () => FestivosApi.findAll({
      anio: new Date().getFullYear(),
      ...(session?.sedeId
        ? { sedeId: Number(session.sedeId) }
        : { empresaId: Number(session?.negocioId) || undefined }),
    }).catch(() => []),
    [session?.sedeId, session?.negocioId],
    [],
  );

  const festivos = useMemo(() => mapaFestivos(diasFestivos), [diasFestivos]);

  const calMap = ReservasController.buildCalendarMap(todas);
  const calEvents = Object.fromEntries(
    Object.entries(calMap).map(([fecha, list]) => [
      fecha,
      list.map((r) => ({ id: r.id, label: `${r.hora} ${r.cliente.split(" ")[0]}`, data: r })),
    ])
  );

  const hoyISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string | null>(hoyISO);
  const fechaReservas = selectedDate ? todas.filter((r) => r.fecha === selectedDate) : [];

  /* Buscador en tiempo real de "Últimas reservas" (servicio, cliente,
     especialista o ID) */
  const [buscarUltimas, setBuscarUltimas] = useState("");
  const ultimasFiltradas = useMemo(() => {
    const q = buscarUltimas.trim().toLowerCase();
    if (!q) return ultimas;
    return ultimas.filter((r) => `${r.servicio} ${r.cliente} ${r.empleadoName || ""} ${r.id}`.toLowerCase().includes(q));
  }, [ultimas, buscarUltimas]);

  /* Reagendado: modal con calendario + horas disponibles */
  const [reagendando, setReagendando] = useState<Reserva | null>(null);
  /* «Personaliza tu panel»: solo el dueño cambia los colores de su negocio */
  const [personalizando, setPersonalizando] = useState(false);
  const puedePersonalizar = session?.role === "owner";
  const onReagendada = () => {
    void reloadUltimas();
    void reloadTodas();
  };

  /* ── Lo que hay hoy sobre la mesa ───────────────────────────
     Dos cifras que salen de las reservas ya cargadas; nada de
     relleno. Si hoy no hay nada, dirán cero, que también es un dato. */
  const reservasHoy = todas.filter((r) => r.fecha === hoyISO).length;
  const sinConfirmar = todas.filter((r) => r.fecha >= hoyISO && r.estado === "pendiente").length;

  /* ── Tendencia de las tarjetas KPI ──────────────────────────
     Sparkline y flecha salen de las reservas que ya están en
     memoria (14 días, última semana contra la anterior). La
     valoración media no trae fecha, así que esa tarjeta se queda
     sin línea en vez de dibujar una inventada. */
  const series = useMemo(() => seriesDelDashboard(todas, hoyISO), [todas, hoyISO]);
  const pieKpi = (variacion: number | null, respaldo: string) =>
    variacion != null ? t("dashboard.vsLastWeek") : respaldo;

  return (
    <>
      {/* Raíz de la cascada: espera 0,12 s y suelta un hijo cada 65 ms
          (§4). Los hijos solo tienen que decir qué son. */}
      <motion.div variants={grupo(reduce, stagger.cards, 0.12)} initial="hidden" animate="show">
        <ContextSelectors />

        {/* Lo que queda del banner que ocupaba media pantalla: las dos
            cifras de hoy y las dos acciones que solo vivían allí -crear
            una reserva y, para el dueño, los colores de su panel-. En
            una línea en vez de en 294 px. */}
        <motion.div className={styles.resumenBar} variants={entrada(reduce, blurIn)}>
          <div className={styles.resumenDatos}>
            <span>{t("dashboard.hero.reservasHoy")} <b>{reservasHoy}</b></span>
            <span className={styles.resumenSep} aria-hidden>·</span>
            <span>{t("dashboard.hero.sinConfirmar")} <b>{sinConfirmar}</b></span>
          </div>
          <div className={styles.resumenAcciones}>
            {puedePersonalizar && (
              <Button size="sm" variant="ghost" onClick={() => setPersonalizando(true)}>
                <Icon name="settings" /> {t("tema.boton")}
              </Button>
            )}
            <Button size="sm" onClick={() => router.push(`${ROUTES.reservas}?nueva=1`)}>
              {t("dashboard.hero.cta")}
            </Button>
          </div>
        </motion.div>

        {/* Primera tarjeta a los 265 ms (185 de la cascada + 80), y una
            cada 65 ms: 265 · 330 · 395 · 460, como en la referencia 05. */}
        <motion.section className={styles.kpiGrid} variants={grupo(reduce, stagger.cards, 0.08)}>
          <KpiCard
            index={0}
            tono="marca"
            icono={<Icon name="user" />}
            label={t("dashboard.totalClients")}
            valor={resumen.clientes}
            spark={pathSparkline(series.clientes.valores)}
            variacion={series.clientes.variacion}
            pie={pieKpi(series.clientes.variacion, t("dashboard.fromApi"))}
          />
          <KpiCard
            index={1}
            tono="verde"
            icono={<Icon name="chart" />}
            label={t("estadisticas.monthRevenue")}
            valor={resumen.ingresosMes}
            formato={fmtMoneda}
            spark={pathSparkline(series.ingresos.valores)}
            variacion={series.ingresos.variacion}
            pie={pieKpi(series.ingresos.variacion, t("estadisticas.thisMonth"))}
          />
          <KpiCard
            index={2}
            tono="coral"
            icono={<Icon name="clock" />}
            label={t("dashboard.totalBookings")}
            valor={resumen.citas}
            spark={pathSparkline(series.citas.valores)}
            variacion={series.citas.variacion}
            pie={pieKpi(series.citas.variacion, t("dashboard.fromApi"))}
          />
          <KpiCard
            index={3}
            tono="ambar"
            icono={<Icon name="star" />}
            label={t("estadisticas.rating")}
            texto={resumen.valoracion != null ? `${resumen.valoracion.toFixed(1)} ★` : "—"}
            pie={t("estadisticas.fromReviews")}
          />
        </motion.section>

        {/* Bloques de abajo: arrancan a los 530 ms y entran uno cada
            80 ms (§4, "fila de gráficas inferior"). */}
        {/* data-entrada-propia: los tres paneles de esta fila ya los anima
            el motion.div que los envuelve, así que la entrada CSS de
            Panel.module.css se apaga aquí dentro. Sin esto, cada panel
            haría las dos a la vez (ver el comentario de esa hoja). */}
        <motion.section
          className={styles.bloques}
          variants={grupo(reduce, 0.08, 0.28)}
          data-entrada-propia
        >
          <motion.div variants={entrada(reduce, blurIn)}>
            <Panel>
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
                <DataTable headers={[t("common.service"), t("common.client"), t("common.date"), t("common.time"), t("dashboard.duracion"), t("common.price"), t("common.state"), t("common.actions")]}>
                  {ultimasFiltradas.map((r) => (
                    <tr key={r.id} onClick={() => popup.open(r, recargarCitas)} style={{ cursor: "pointer" }}>
                      <td><b>{r.servicio}</b></td>
                      <td><PersonRow name={r.cliente} photo={r.clienteFoto} /></td>
                      <td>{fmtFechaCorta(r.fecha)}</td>
                      <td>{r.hora}</td>
                      <td>{r.duracion ? `${r.duracion} min` : "—"}</td>
                      <PriceCell value={r.precio} />
                      <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
                      <td>
                        {/* Solo se reagenda lo que aún no ha pasado ni se canceló */}
                        {(r.estado === "pendiente" || r.estado === "confirmada") && (
                          <IconButton
                            aria-label={t("reservas.reagendarAria", { servicio: r.servicio, cliente: r.cliente })}
                            onClick={(e) => { e.stopPropagation(); setReagendando(r); }}
                          >
                            <Icon name="calendar-check" />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </DataTable>
              )}
            </Panel>
          </motion.div>

          <div className={styles.bottomGrid}>
            <motion.div variants={entrada(reduce, blurIn)}>
              <Panel>
                <div className={`pill ${styles.calHeaderPill}`}>
                  <Icon name="calendar" /> {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString() : t("common.today")}
                </div>
                {/* La lista se rehace al cambiar de día: entra escalonada otra vez */}
                <StaggerContainer key={selectedDate || "hoy"} className={styles.dayList}>
                  {fechaReservas.length === 0 && <span>{t("dashboard.noToday")}</span>}
                  {fechaReservas.map((r) => (
                    <StaggerItem key={r.id} className={styles.dayItem} onClick={() => popup.open(r, recargarCitas)}>
                      <span className={styles.dayHour}>{r.hora}</span>
                      <span className={styles.dayBody}>
                        <b>{r.servicio}</b>
                        <span>{r.cliente}</span>
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </Panel>
            </motion.div>

            <motion.div variants={entrada(reduce, blurIn)}>
              <Panel>
                <PanelHead title={t("dashboard.calTitle")} sub={t("dashboard.calSub")} />
                <ContextoFestivos
                  sedeId={session?.sedeId ? Number(session.sedeId) : undefined}
                  empresaId={!session?.sedeId ? Number(session?.negocioId) || undefined : undefined}
                  festivos={diasFestivos || []}
                />
                <CalendarGrid
                  events={calEvents}
                  festivos={festivos}
                  maxPerCell={2}
                  onEventClick={(id, data) => data ? popup.open(data, recargarCitas) : popup.open(id, recargarCitas)}
                  selectable={true}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </Panel>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>

      {/* Los modales viven fuera de la cascada: no deben heredar su
          estado de entrada ni esperar turno para abrirse. */}
      <PersonalizarPanelModal open={personalizando} onClose={() => setPersonalizando(false)} />

      <ReagendarModal
        reserva={reagendando}
        onClose={() => setReagendando(null)}
        onReagendada={onReagendada}
      />
    </>
  );
}
