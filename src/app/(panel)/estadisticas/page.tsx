"use client";
/* ============================================================
   Estadísticas — gráficos de ventas y servicios (View)
============================================================ */
import { useMemo, useState } from "react";
import { EstadisticasApi } from "@/api/modules";
import { EstadisticasController } from "@/controllers/EstadisticasController";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Toolbar, { FilterDate, FilterGroup, ToolbarActions } from "@/components/ui/Toolbar";
import { exportarCsv, exportarPdf } from "./exportar";
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
  /* ── Rango de fechas (2.12) ──────────────────────────────
     Se manda al backend como desde/hasta en vez de un enum de periodo: los
     atajos (mes, año) se traducen aquí a dos fechas, así el "personalizado"
     no necesita ningún caso especial. */
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const filtro = useMemo(
    () => ({ ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) }),
    [desde, hasta],
  );
  const clave = `${desde}|${hasta}`;

  const atajo = (meses: number) => {
    const fin = new Date();
    const ini = new Date();
    ini.setMonth(ini.getMonth() - meses);
    setDesde(ini.toISOString().slice(0, 10));
    setHasta(fin.toISOString().slice(0, 10));
  };

  /* Rankings calculados en el servidor (groupBy), no en el navegador. */
  const { data: empresas } = useData(() => EstadisticasApi.empresas({ ...filtro, limit: 8 }).catch(() => []), [clave], []);
  const { data: empleados } = useData(() => EstadisticasApi.empleados({ ...filtro, limit: 8 }).catch(() => []), [clave], []);
  const { data: ciudades } = useData(() => EstadisticasApi.ciudades({ ...filtro, limit: 8 }).catch(() => []), [clave], []);
  const { data: servicios } = useData(() => EstadisticasApi.servicios({ ...filtro, limit: 8 }).catch(() => []), [clave], []);

  const periodo = desde || hasta
    ? `${desde || "…"} → ${hasta || "…"}`
    : t("estadisticas.periodoTodo");

  /* Las cuatro tablas que se imprimen o exportan, en un solo sitio. */
  const tablas = () => [
    { titulo: t("estadisticas.empresasTitle"), cabeceras: [t("common.name"), t("estadisticas.reservas")],
      filas: empresas.map((e) => [e.nombre, String(e.reservas)]) },
    { titulo: t("estadisticas.topTitle"), cabeceras: [t("common.service"), t("estadisticas.reservas")],
      filas: servicios.map((e) => [e.nombre, String(e.reservas)]) },
    { titulo: t("estadisticas.empleadosTitle"), cabeceras: [t("common.name"), t("estadisticas.reservas"), t("estadisticas.ingresos")],
      filas: empleados.map((e) => [e.nombre, String(e.reservas), `${e.ingresos.toFixed(2)}€`]) },
    { titulo: t("estadisticas.ciudadesTitle"), cabeceras: [t("estadisticas.ciudad"), t("estadisticas.usuarios")],
      filas: ciudades.map((c) => [c.ciudad ?? "—", String(c.usuarios)]) },
  ];

  const max = Math.max(1, ...ventas.map((v) => v.valor));
  const maxTop = Math.max(1, ...top.map((x) => x.valor));

  return (
    <>
      {/* `noPrint` deja fuera los controles al imprimir (2.13) */}
      <div className={styles.noPrint}>
      <Toolbar>
        <FilterGroup>
          <FilterDate value={desde} onChange={setDesde} label={t("estadisticas.desde")} />
          <FilterDate value={hasta} onChange={setHasta} label={t("estadisticas.hasta")} />
        </FilterGroup>
        <ToolbarActions>
          <Button size="sm" variant="ghost" onClick={() => atajo(1)}>{t("estadisticas.ultimoMes")}</Button>
          <Button size="sm" variant="ghost" onClick={() => atajo(12)}>{t("estadisticas.ultimoAnio")}</Button>
          <Button size="sm" variant="ghost" onClick={() => { setDesde(""); setHasta(""); }}>{t("estadisticas.todo")}</Button>
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            <Icon name="download" /> {t("estadisticas.imprimir")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportarCsv(tablas(), periodo)}>CSV</Button>
          <Button size="sm" variant="ghost" onClick={() => void exportarPdf(tablas(), periodo, t("estadisticas.informe"))}>PDF</Button>
        </ToolbarActions>
      </Toolbar>
      </div>

      <p className={styles.periodo}>{t("estadisticas.periodo", { periodo })}</p>

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

      {/* ── Rankings del servidor ── */}
      <div className={styles.chartGrid}>
        <Panel>
          <PanelHead title={t("estadisticas.empresasTitle")} sub={t("estadisticas.empresasSub")} />
          <Ranking filas={empresas.map((e) => ({ nombre: e.nombre, valor: e.reservas }))} />
        </Panel>
        <Panel>
          <PanelHead title={t("estadisticas.empleadosTitle")} sub={t("estadisticas.empleadosSub")} />
          <Ranking filas={empleados.map((e) => ({ nombre: e.nombre, valor: e.reservas, extra: `${e.ingresos.toFixed(2)}€` }))} />
        </Panel>
        <Panel>
          <PanelHead title={t("estadisticas.ciudadesTitle")} sub={t("estadisticas.ciudadesSub")} />
          <Ranking filas={ciudades.map((c) => ({ nombre: c.ciudad ?? "—", valor: c.usuarios }))} />
        </Panel>
        <Panel>
          <PanelHead title={t("estadisticas.serviciosTitle")} sub={t("estadisticas.serviciosSub")} />
          <Ranking filas={servicios.map((e) => ({ nombre: e.nombre, valor: e.reservas }))} />
        </Panel>
      </div>
    </>
  );
}

/** Lista simple ordenada con barra proporcional. */
function Ranking({ filas }: { filas: { nombre: string; valor: number; extra?: string }[] }) {
  const tope = Math.max(1, ...filas.map((f) => f.valor));
  if (filas.length === 0) return <p className={styles.vacio}>—</p>;
  return (
    <div className={styles.legend}>
      {filas.map((f, i) => (
        <div key={`${f.nombre}-${i}`} className={styles.legendItem}>
          <div className={styles.legendTop}>
            <span>{f.nombre}</span>
            <span>{f.extra ? `${f.valor} · ${f.extra}` : f.valor}</span>
          </div>
          <div className={styles.legendTrack}>
            <div className={styles.legendFill} style={{ width: `${(f.valor / tope) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
