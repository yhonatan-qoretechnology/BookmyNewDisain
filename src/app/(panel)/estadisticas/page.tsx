"use client";
/* ============================================================
   Estadísticas — cuadro de mando (View)
   ------------------------------------------------------------
   Seis KPIs y nueve paneles con la misma lectura en todos: cifra
   grande, comparación con el periodo anterior y el detalle debajo.

   De dónde sale cada número, y qué pasa cuando la cuenta aún no
   tiene datos, está en datos.ts. Cada panel que se pinte con cifras
   de ejemplo lo dice en su cabecera con la etiqueta "datos de
   ejemplo": la vista se puede enseñar entera sin que nadie confunda
   el relleno con datos reales.
============================================================ */
import { useMemo, useState } from "react";
import { EstadisticasApi } from "@/api/modules";
import type { ApiRankingVistas } from "@/api/types";
import { fmtMoneda } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Panel, { PanelHead, SelectPill } from "@/components/ui/Panel";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { FilterDate } from "@/components/ui/Toolbar";
import {
  BarrasAgrupadas,
  BarrasApiladas,
  BarrasHorizontales,
  Donut,
  Embudo,
  LineasComparadas,
  MapaCalor,
  RankingLista,
  Sparkline,
  type Segmento,
} from "./Graficos";
import { DIAS, FRANJAS, cargarPanel, rangoPorDefecto, type PanelDatos } from "./datos";
import { exportarCsv, exportarPdf } from "./exportar";
import styles from "./estadisticas.module.css";

/** Tipos de GET /estadisticas/mas-vistos/:tipo que la app móvil registra hoy.
    El backend admite también SEDE, SERVICIO y CATEGORIA, pero ningún cliente
    los envía todavía: se añaden aquí cuando la app los registre. */
const TIPOS_VISTOS = ["EMPRESA", "PROFESIONAL"] as const;

/** Paleta de las barras de ranking, en el orden en que se pintan. */
const COLORES_RANK = [
  "var(--grad-teal)", "var(--grad-blue)", "var(--grad-purple)", "var(--grad-coral)", "var(--grad-amber)",
];

/** Colores del donut de estados: el mismo código de color que los chips. */
const COLOR_ESTADO: Record<string, string> = {
  confirmada: "var(--teal-500)",
  atendida: "var(--blue)",
  cancelado: "var(--red)",
  noShow: "#ab47bc",
  pendiente: "var(--slate-300)",
};

const ICONO_EMBUDO: Record<string, string> = {
  visitas: "chart",
  busquedas: "search",
  servicio: "scissors",
  reserva: "calendar",
  pago: "wallet",
};

/** Clase del chip de estado en la tabla de últimas reservas. */
const CHIP_ESTADO: Record<string, string> = {
  confirmada: styles.chipConfirmada,
  atendida: styles.chipAtendida,
  cancelado: styles.chipCancelado,
  noShow: styles.chipNoShow,
  pendiente: styles.chipPendiente,
};

export default function EstadisticasPage() {
  const { t, locale } = useI18n();
  const { session } = useSession();

  /* ── Rango de fechas (2.12) ───────────────────────────────
     Al backend viaja siempre como desde/hasta: los atajos solo
     rellenan esas dos fechas, así el rango personalizado no necesita
     ningún caso aparte. */
  const inicial = useMemo(() => rangoPorDefecto(), []);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [abrirRango, setAbrirRango] = useState(false);
  const [atajo, setAtajo] = useState<"hoy" | "mes" | "anio" | null>("mes");

  const aplicarAtajo = (cual: "hoy" | "mes" | "anio") => {
    const fin = new Date();
    const ini = new Date();
    if (cual === "mes") ini.setDate(ini.getDate() - 29);
    else if (cual === "anio") ini.setFullYear(ini.getFullYear() - 1);
    setDesde(ini.toISOString().slice(0, 10));
    setHasta(fin.toISOString().slice(0, 10));
    setAtajo(cual);
    setAbrirRango(false);
  };

  const cambiarFecha = (cual: "desde" | "hasta", valor: string) => {
    if (cual === "desde") setDesde(valor);
    else setHasta(valor);
    /* Una fecha a mano deja de ser un atajo: se apaga el resaltado. */
    setAtajo(null);
  };

  const clave = `${desde}|${hasta}`;
  const { data: d, loading } = useData(
    () => cargarPanel(session, locale, { desde, hasta }),
    [session?.id, locale, clave],
    null as PanelDatos | null,
  );

  /* Lo más visto (requisitos 2.2-2.7): lo alimenta la app móvil. */
  const { data: vistos } = useData(
    () =>
      Promise.all(
        TIPOS_VISTOS.map((tipo) =>
          EstadisticasApi.masVistos(tipo, { desde, hasta, limit: 5 }).catch(() => [] as ApiRankingVistas[]),
        ),
      ),
    [clave],
    TIPOS_VISTOS.map(() => [] as ApiRankingVistas[]),
  );
  const [tipoVisto, setTipoVisto] = useState(0);
  const [serieTab, setSerieTab] = useState<"reservas" | "ingresos">("reservas");

  const nf = useMemo(() => new Intl.NumberFormat("es-ES"), []);
  const num = (n: number) => nf.format(Math.round(n));
  const dinero = (n: number) => fmtMoneda(n, "EUR");
  const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;
  const signo = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")}%`;
  const fechaCorta = (ymd: string) => {
    const [y, m, dd] = ymd.split("-");
    return `${dd}/${m}/${y.slice(2)}`;
  };

  const periodo = `${fechaCorta(desde)} – ${fechaCorta(hasta)}`;
  const diasEje = DIAS.map((k) => t(`estadisticas.dias.${k}`));

  /* Etiqueta de "datos de ejemplo" en la cabecera de los paneles que
     se están pintando con relleno. */
  const marca = (esDemo: boolean) =>
    esDemo ? <span className={styles.demoChip}>{t("estadisticas.datosEjemplo")}</span> : undefined;

  const tablas = () => {
    if (!d) return [];
    return [
      {
        titulo: t("estadisticas.estadoReservas"),
        cabeceras: [t("common.state"), t("estadisticas.reservas")],
        filas: d.estados.map((e) => [t(`estados.${e.clave}`), num(e.valor)]),
      },
      {
        titulo: t("estadisticas.topEmpresas"),
        cabeceras: [t("common.name"), t("estadisticas.reservas")],
        filas: d.empresas.map((e) => [e.nombre, num(e.valor)]),
      },
      {
        titulo: t("estadisticas.topServicios"),
        cabeceras: [t("common.service"), t("estadisticas.reservas")],
        filas: d.servicios.map((e) => [e.nombre, num(e.valor)]),
      },
      {
        titulo: t("estadisticas.topProfesionales"),
        cabeceras: [t("estadisticas.colProfesional"), t("estadisticas.reservas"), t("estadisticas.ingresos")],
        filas: d.profesionales.map((p) => [p.nombre, num(p.reservas), dinero(p.ingresos)]),
      },
      {
        titulo: t("estadisticas.distribucion"),
        cabeceras: [t("common.branch"), t("estadisticas.reservas")],
        filas: d.sedes.map((s) => [s.nombre, num(s.valor)]),
      },
      ...TIPOS_VISTOS.map((tipo, i) => ({
        titulo: `${t("estadisticas.masVistosTitle")} · ${t(`estadisticas.vistos.${tipo}`)}`,
        cabeceras: [t("common.name"), t("estadisticas.vistas")],
        filas: (vistos[i] ?? []).map((v) => [v.nombre ?? `#${v.entityId}`, num(v.vistas)]),
      })),
    ];
  };

  if (!d) {
    return <p className={styles.vacio}>{loading ? t("booking.loading") : t("estadisticas.sinDatos")}</p>;
  }

  const demo = d.demo;
  const totalEstados = d.estados.reduce((a, e) => a + e.valor, 0);
  const segmentosEstado: Segmento[] = d.estados.map((e) => ({
    nombre: t(`estadisticas.plural.${e.clave}`),
    valor: e.valor,
    color: COLOR_ESTADO[e.clave] ?? "var(--slate-300)",
  }));
  const seriesDia = [
    { clave: "confirmadas", nombre: t("estadisticas.plural.confirmada"), color: "var(--teal-500)" },
    { clave: "completadas", nombre: t("estadisticas.plural.atendida"), color: "var(--blue)" },
    { clave: "canceladas", nombre: t("estadisticas.plural.cancelado"), color: "var(--red)" },
    { clave: "noShow", nombre: t("estadisticas.plural.noShow"), color: "#ab47bc" },
  ];
  const ingresosProfesionales = d.profesionales.reduce((a, x) => a + x.ingresos, 0) || 1;

  const kpis = [
    { k: "reservas", clase: styles.kpiTeal, icono: "calendar", label: t("estadisticas.kpiReservas"),
      valor: num(d.kpis.reservas), delta: d.deltas.reservas, spark: d.sparks.reservas, color: "var(--teal-500)", buenoSiSube: true },
    { k: "ingresos", clase: styles.kpiPurple, icono: "dollar", label: t("estadisticas.kpiIngresos"),
      valor: dinero(d.kpis.ingresos), delta: d.deltas.ingresos, spark: d.sparks.ingresos, color: "#ab47bc", buenoSiSube: true },
    { k: "clientes", clase: styles.kpiBlue, icono: "user", label: t("estadisticas.kpiClientes"),
      valor: num(d.kpis.clientesNuevos), delta: d.deltas.clientesNuevos, spark: d.sparks.clientes, color: "var(--blue)", buenoSiSube: true },
    { k: "ticket", clase: styles.kpiAmber, icono: "receipt", label: t("estadisticas.kpiTicket"),
      valor: dinero(d.kpis.ticketMedio), delta: d.deltas.ticketMedio, spark: d.sparks.ticket, color: "var(--amber)", buenoSiSube: true },
    { k: "cancelacion", clase: styles.kpiRed, icono: "close", label: t("estadisticas.kpiCancelacion"),
      valor: pct(d.kpis.cancelacion), delta: d.deltas.cancelacion, spark: d.sparks.cancelacion, color: "var(--red)", buenoSiSube: false },
    { k: "valoracion", clase: styles.kpiPurple, icono: "star", label: t("estadisticas.kpiValoracion"),
      valor: d.kpis.valoracion != null ? `${d.kpis.valoracion.toFixed(1).replace(".", ",")} ★` : "—",
      delta: d.deltas.valoracion, spark: d.sparks.valoracion, color: "#ab47bc", buenoSiSube: true,
      esDemo: demo.valoracion },
  ];

  return (
    <>
      {/* ── Filtros y exportación ── */}
      <div className={`${styles.barraSuperior} ${styles.noPrint}`}>
        <div className={styles.rangoCaja}>
          <button type="button" className={styles.rangoPill} onClick={() => setAbrirRango((v) => !v)}>
            <Icon name="calendar" />
            {periodo}
            <Icon name="chevron" />
          </button>
          {abrirRango && (
            <div className={styles.rangoPop}>
              <FilterDate value={desde} onChange={(v) => cambiarFecha("desde", v)} label={t("estadisticas.desde")} />
              <FilterDate value={hasta} onChange={(v) => cambiarFecha("hasta", v)} label={t("estadisticas.hasta")} />
            </div>
          )}
        </div>

        <div className={styles.accionesDerecha}>
          <div className={styles.segGrupo}>
            <button type="button" className={`${styles.segBtn} ${atajo === "mes" ? styles.segActivo : ""}`} onClick={() => aplicarAtajo("mes")}>
              {t("estadisticas.ultimoMes")}
            </button>
            <button type="button" className={`${styles.segBtn} ${atajo === "anio" ? styles.segActivo : ""}`} onClick={() => aplicarAtajo("anio")}>
              {t("estadisticas.ultimoAnio")}
            </button>
            <button type="button" className={`${styles.segBtn} ${atajo === "hoy" ? styles.segActivo : ""}`} onClick={() => aplicarAtajo("hoy")}>
              {t("estadisticas.hoy")}
            </button>
          </div>
          <span className={styles.sep} />
          <span className={styles.expLabel}><Icon name="download" /> {t("estadisticas.exportar")}</span>
          <Button size="sm" variant="ghost" onClick={() => exportarCsv(tablas(), periodo)}>CSV</Button>
          <Button size="sm" variant="ghost" onClick={() => void exportarPdf(tablas(), periodo, t("estadisticas.informe"))}>PDF</Button>
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            <Icon name="printer" /> {t("estadisticas.imprimir")}
          </Button>
        </div>
      </div>

      <p className={styles.periodo}>{t("estadisticas.periodo", { periodo })}</p>

      {/* ── KPIs ── */}
      <section className={styles.kpiGrid}>
        {kpis.map((k) => {
          const sube = k.delta > 0;
          const bueno = k.buenoSiSube ? sube : !sube;
          return (
            <article key={k.k} className={styles.kpi}>
              <div className={styles.kpiTop}>
                <span className={`${styles.kpiIcon} ${k.clase}`}><Icon name={k.icono} /></span>
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
              <span className={styles.kpiValor}>{k.valor}</span>
              <div className={styles.kpiPie}>
                {k.delta !== 0 ? (
                  <span className={bueno ? styles.deltaPos : styles.deltaNeg}>
                    {sube ? "▲" : "▼"} {signo(k.delta)}
                  </span>
                ) : (k.esDemo || demo.kpis) ? (
                  <span className={styles.kpiDemo}>{t("estadisticas.datosEjemplo")}</span>
                ) : <span />}
                <Sparkline valores={k.spark} color={k.color} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Serie principal y estado de las reservas ── */}
      <div className={`${styles.fila} ${styles.fila2}`}>
        <Panel className={styles.panel}>
          <PanelHead
            title={t("estadisticas.reservasIngresos")}
            sub={t("estadisticas.ultimos12")}
            right={
              <div className={styles.cabeceraExtra}>
                {marca(demo.serie)}
                <div className={`${styles.tabsGrupo} ${styles.noPrint}`}>
                  <button type="button" className={`${styles.tabBtn} ${serieTab === "reservas" ? styles.tabActivo : ""}`} onClick={() => setSerieTab("reservas")}>
                    {t("estadisticas.reservas")}
                  </button>
                  <button type="button" className={`${styles.tabBtn} ${serieTab === "ingresos" ? styles.tabActivo : ""}`} onClick={() => setSerieTab("ingresos")}>
                    {t("estadisticas.ingresos")}
                  </button>
                </div>
              </div>
            }
          />
          <div className={styles.leyendaLinea}>
            <span className={styles.legItem}><span className={styles.legLinea} />{t("estadisticas.periodoActual")}</span>
            <span className={styles.legItem}><span className={styles.legDash} />{t("estadisticas.periodoAnterior")}</span>
          </div>
          <LineasComparadas
            actual={d.serie.map((p) => (serieTab === "reservas" ? p.reservas : p.ingresos))}
            previo={d.serie.map((p) => (serieTab === "reservas" ? p.reservasPrev : p.ingresosPrev))}
            etiquetas={d.serie.map((p) => p.mes)}
            formatoEje={(n) => (serieTab === "reservas" ? num(n) : `${num(n / 1000)}k`)}
          />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.estadoReservas")} sub={t("estadisticas.ultimos12")} right={marca(demo.estados)} />
          <Donut segmentos={segmentosEstado} total={totalEstados} etiqueta={t("estadisticas.totalReservas")} formatoValor={num} />
        </Panel>
      </div>

      {/* ── Ingresos, días de la semana y franjas horarias ── */}
      <div className={`${styles.fila} ${styles.fila3}`}>
        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.ingresosMes")} sub={t("estadisticas.ultimos12")} right={marca(demo.serie)} />
          <div className={styles.leyendaLinea}>
            <span className={styles.legItem}><span className={styles.legLinea} />{t("estadisticas.periodoActual")}</span>
            <span className={styles.legItem}>
              <span className={styles.legLinea} style={{ background: "var(--slate-300)" }} />
              {t("estadisticas.periodoAnterior")}
            </span>
          </div>
          <BarrasAgrupadas
            datos={d.serie.map((p) => ({ actual: p.ingresos, previo: p.ingresosPrev }))}
            etiquetas={d.serie.map((p) => p.mes)}
            formatoValor={dinero}
          />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.reservasDia")} sub={t("estadisticas.ultimos12")} right={marca(demo.porDia)} />
          <div className={styles.leyendaLinea}>
            {seriesDia.map((s) => (
              <span key={s.clave} className={styles.legItem}>
                <span className={styles.legLinea} style={{ background: s.color }} />{s.nombre}
              </span>
            ))}
          </div>
          <BarrasApiladas
            datos={d.porDia.map((x) => ({
              confirmadas: x.confirmadas, completadas: x.completadas, canceladas: x.canceladas, noShow: x.noShow,
            }))}
            series={seriesDia}
            etiquetas={diasEje}
          />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.horasDemanda")} sub={t("estadisticas.ultimos12")} right={marca(demo.horas)} />
          <MapaCalor
            filas={FRANJAS.map((f, i) => `${f} - ${FRANJAS[i + 1] ?? "22:00"}`)}
            columnas={diasEje}
            valores={d.horas}
            textoMas={t("estadisticas.mayorDemanda")}
            textoMenos={t("estadisticas.menorDemanda")}
          />
        </Panel>
      </div>

      {/* ── Rankings ── */}
      <div className={`${styles.fila} ${styles.fila3}`}>
        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.topEmpresas")} sub={t("estadisticas.topPorReservas")} right={marca(demo.empresas)} />
          <RankingLista filas={d.empresas} colores={COLORES_RANK} formatoValor={num} />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.topServicios")} sub={t("estadisticas.topPorReservas")} right={marca(demo.servicios)} />
          <RankingLista filas={d.servicios} colores={COLORES_RANK} formatoValor={num} />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.topProfesionales")} sub={t("estadisticas.topPorIngresos")} right={marca(demo.profesionales)} />
          <div className={styles.tablaWrap}>
            <table className={`${styles.tabla} ${styles.tablaCompacta}`}>
              <thead>
                <tr>
                  <th>{t("estadisticas.colProfesional")}</th>
                  <th className={styles.num}>{t("estadisticas.reservas")}</th>
                  <th className={styles.num}>{t("estadisticas.ingresos")}</th>
                  <th className={styles.num}>%</th>
                </tr>
              </thead>
              <tbody>
                {d.profesionales.map((p) => (
                  <tr key={p.nombre}>
                    <td><span className={styles.celdaNombre}>{p.nombre}</span></td>
                    <td className={styles.num}>{num(p.reservas)}</td>
                    <td className={styles.num}>{dinero(p.ingresos)}</td>
                    <td className={`${styles.num} ${styles.subeDelta}`}>{pct((p.ingresos / ingresosProfesionales) * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Embudo, clientes, sedes y últimas reservas ── */}
      <div className={`${styles.fila} ${styles.fila4}`}>
        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.rendimiento")} sub={t("estadisticas.rendimientoSub")} right={marca(demo.embudo)} />
          <Embudo
            pasos={d.embudo.map((p) => ({
              nombre: t(`estadisticas.embudo.${p.clave}`),
              valor: p.valor,
              icono: <Icon name={ICONO_EMBUDO[p.clave] ?? "chart"} />,
            }))}
          />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.crecimiento")} sub={t("estadisticas.crecimientoSub")} right={marca(demo.clientes)} />
          <Donut
            segmentos={[
              { nombre: t("estadisticas.nuevos"), valor: d.clientes.nuevos, color: "var(--teal-500)" },
              { nombre: t("estadisticas.recurrentes"), valor: d.clientes.recurrentes, color: "var(--blue)" },
            ]}
            total={d.clientes.nuevos + d.clientes.recurrentes}
            etiqueta={t("estadisticas.kpiClientes")}
            formatoValor={num}
          />
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.distribucion")} sub={t("estadisticas.distribucionSub")} right={marca(demo.sedes)} />
          <BarrasHorizontales filas={d.sedes} colores={COLORES_RANK} />
        </Panel>
      </div>

      <div className={`${styles.fila} ${styles.fila1}`}>
        <Panel className={styles.panel}>
          <PanelHead title={t("estadisticas.ultimasReservas")} sub={t("estadisticas.ultimasSub")} right={marca(demo.ultimas)} />
          <div className={styles.tablaWrap}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>{t("estadisticas.colEmpresa")}</th>
                  <th>{t("common.service")}</th>
                  <th>{t("common.client")}</th>
                  <th>{t("common.date")}</th>
                  <th className={styles.num}>{t("estadisticas.colImporte")}</th>
                  <th>{t("common.state")}</th>
                </tr>
              </thead>
              <tbody>
                {d.ultimas.map((r, i) => (
                  <tr key={`${r.cliente}-${i}`}>
                    <td>{r.empresa}</td>
                    <td>{r.servicio}</td>
                    <td>{r.cliente}</td>
                    <td>{fechaCorta(r.fecha)}, {r.hora}</td>
                    <td className={styles.num}>{dinero(r.importe)}</td>
                    <td><span className={`${styles.chip} ${CHIP_ESTADO[r.estado] ?? ""}`}>{t(`estados.${r.estado}`)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* ── Lo más visto: lo alimenta la app móvil ── */}
      <Panel className={styles.panel}>
        <PanelHead
          title={t("estadisticas.masVistosTitle")}
          sub={t("estadisticas.masVistosSub")}
          right={
            <SelectPill onClick={() => setTipoVisto((i) => (i + 1) % TIPOS_VISTOS.length)}>
              {t(`estadisticas.vistos.${TIPOS_VISTOS[tipoVisto]}`)}
            </SelectPill>
          }
        />
        {(vistos[tipoVisto] ?? []).length === 0 ? (
          <p className={styles.vacio}>{t("estadisticas.sinVistas")}</p>
        ) : (
          <RankingLista
            filas={(vistos[tipoVisto] ?? []).map((v) => ({ nombre: v.nombre ?? `#${v.entityId}`, valor: v.vistas }))}
            colores={COLORES_RANK}
            formatoValor={num}
          />
        )}
      </Panel>
    </>
  );
}
