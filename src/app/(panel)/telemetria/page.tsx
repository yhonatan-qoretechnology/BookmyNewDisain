"use client";
/* ============================================================
   Telemetría — panel, web pública y distribución de la app
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN. Pageviews del panel/web los manda
   PageviewTracker (montado en el layout raíz); las aperturas de la
   app móvil las mandaría esa otra app (fuera de este repo) a
   POST /telemetria/app-session — acá solo se lee lo agregado.

   Mismo lenguaje visual que Estadísticas (y los mismos gráficos):
   KPIs con variación y sparkline, la evolución diaria contra el
   periodo anterior (GET /telemetria/serie), el reparto por
   plataforma en donut y por país en barras. Debajo, las tarjetas
   por métrica: una por página y una por plataforma.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { TelemetriaApi } from "@/api/modules";
import type {
  ApiDistribucionPlataforma, ApiRankingPagina, ApiTelemetriaResumen, ApiTelemetriaSerie,
} from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useRegion } from "@/context/RegionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import {
  BarrasHorizontales, Donut, LineasComparadas, Sparkline, type Segmento,
} from "../estadisticas/Graficos";
import styles from "../estadisticas/estadisticas.module.css";
import propios from "./telemetria.module.css";

const RANGOS = [7, 30, 90] as const;
type Rango = (typeof RANGOS)[number];
type Metrica = "pageviews" | "visitantes" | "appSessions";

const COLORES_RANK = [
  "var(--grad-teal)", "var(--grad-blue)", "var(--grad-purple)", "var(--grad-coral)", "var(--grad-amber)",
];

/** Color por plataforma; lo desconocido cae en ámbar. */
const COLOR_PLATAFORMA: Record<string, string> = {
  ios: "var(--blue)",
  android: "var(--green)",
  web: "var(--teal-500)",
};
const NOMBRE_PLATAFORMA: Record<string, string> = { ios: "iOS", android: "Android", web: "Web" };

/** "ES" → 🇪🇸. Si no es un código ISO de dos letras, no hay bandera. */
function bandera(codigo: string): string {
  if (!/^[A-Za-z]{2}$/.test(codigo)) return "";
  return String.fromCodePoint(...[...codigo.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

const suma = (ns: number[]) => ns.reduce((a, n) => a + n, 0);

interface ResumenPlataforma {
  clave: string;
  sesiones: number;
  paises: { pais: string; sesiones: number }[];
}

/** Agrupa las filas plataforma × país en una tarjeta por plataforma. */
function porPlataforma(filas: ApiDistribucionPlataforma[]): ResumenPlataforma[] {
  const mapa = new Map<string, Map<string, number>>();
  for (const f of filas) {
    const clave = (f.plataforma || "").trim().toLowerCase() || "otra";
    const pais = (f.pais || "").trim() || "—";
    const paises = mapa.get(clave) ?? new Map<string, number>();
    paises.set(pais, (paises.get(pais) ?? 0) + f.sesiones);
    mapa.set(clave, paises);
  }
  return [...mapa.entries()]
    .map(([clave, paises]) => ({
      clave,
      sesiones: suma([...paises.values()]),
      paises: [...paises.entries()]
        .map(([pais, sesiones]) => ({ pais, sesiones }))
        .sort((a, b) => b.sesiones - a.sesiones),
    }))
    .sort((a, b) => b.sesiones - a.sesiones);
}

/** Anillo de cuota: qué parte del total representa la tarjeta. */
function Anillo({ fraccion, color }: { fraccion: number; color: string }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  const largo = Math.max(0, Math.min(1, fraccion)) * C;
  return (
    <svg viewBox="0 0 56 56" className={propios.anillo} aria-hidden>
      <circle cx="28" cy="28" r={R} className={propios.anilloBase} />
      <circle
        cx="28" cy="28" r={R}
        className={propios.anilloValor}
        stroke={color}
        strokeDasharray={`${largo} ${C - largo}`}
        /* Empieza arriba (las 12) en vez de a las 3 */
        strokeDashoffset={C * 0.25}
      />
    </svg>
  );
}

/** Variación en % contra el periodo anterior; null si no hay base. */
function variacion(actual: number[], previo: number[]): number | null {
  const a = suma(actual);
  const p = suma(previo);
  if (p === 0) return a > 0 ? 100 : null;
  return ((a - p) / p) * 100;
}

const SERIE_VACIA: ApiTelemetriaSerie = {
  dias: [],
  actual: { pageviews: [], visitantes: [], appSessions: [] },
  previo: { pageviews: [], visitantes: [], appSessions: [] },
  paises: [],
};

export default function TelemetriaPage() {
  const router = useRouter();
  const { session } = useSession();
  const { pais } = useRegion();
  const { t, locale } = useI18n();
  const [dias, setDias] = useState<Rango>(30);
  const [metrica, setMetrica] = useState<Metrica>("pageviews");

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const { data: resumen } = useData(
    () => TelemetriaApi.resumen(dias),
    [dias],
    { dias, pageviews: 0, appSessions: 0, visitantesDistintos: 0, paisesDistintos: 0 } as ApiTelemetriaResumen
  );
  /* Sin el endpoint de serie (backend sin desplegar) las gráficas de
     evolución quedan vacías y el resto de la página sigue funcionando. */
  const { data: serie } = useData(() => TelemetriaApi.serie(dias).catch(() => SERIE_VACIA), [dias], SERIE_VACIA);
  const { data: paginas } = useData(() => TelemetriaApi.paginasMasVistas(dias, 10), [dias], [] as ApiRankingPagina[]);
  const { data: plataformas } = useData(() => TelemetriaApi.distribucionPlataformas(dias), [dias], [] as ApiDistribucionPlataforma[]);

  const nf = useMemo(() => new Intl.NumberFormat(pais.locale), [pais.locale]);
  const num = (n: number) => nf.format(Math.round(n));
  const pct = (n: number) => `${Math.abs(n).toFixed(0)}%`;

  /* Una etiqueta cada pocos días: treinta fechas no caben en el eje */
  const etiquetas = useMemo(() => {
    const cada = Math.max(1, Math.ceil(serie.dias.length / 8));
    const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
    return serie.dias.map((d, i) => (i % cada === 0 ? fmt.format(new Date(`${d}T00:00:00Z`)) : ""));
  }, [serie.dias, locale]);

  /* Plataformas: web son las visitas del panel/web; iOS y Android, las
     aperturas de la app. */
  const segmentos: Segmento[] = useMemo(() => {
    const porClave = new Map<string, number>();
    for (const f of plataformas) {
      const clave = (f.plataforma || "").trim().toLowerCase() || "otra";
      porClave.set(clave, (porClave.get(clave) ?? 0) + f.sesiones);
    }
    if (resumen.pageviews > 0) porClave.set("web", (porClave.get("web") ?? 0) + resumen.pageviews);
    return [...porClave.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([clave, valor]) => ({
        nombre: NOMBRE_PLATAFORMA[clave] ?? t("telemetria.otraPlataforma"),
        valor,
        color: COLOR_PLATAFORMA[clave] ?? "var(--amber)",
      }));
  }, [plataformas, resumen.pageviews, t]);
  const totalPlataformas = suma(segmentos.map((s) => s.valor));

  const grupos = useMemo(() => porPlataforma(plataformas), [plataformas]);
  const totalApp = suma(grupos.map((g) => g.sesiones));
  const maxVisitas = Math.max(1, ...paginas.map((p) => p.visitas));
  const cuota = (parte: number, total: number) =>
    total > 0 ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}%` : "0%";

  /* Países: de la serie (panel, web y app). Si el backend aún no la
     da, al menos los de la app, que salen de la distribución. */
  const filasPais = useMemo(() => {
    if (serie.paises.length) return serie.paises.map((p) => ({ pais: p.pais, valor: p.eventos }));
    const m = new Map<string, number>();
    for (const g of grupos) for (const p of g.paises) m.set(p.pais, (m.get(p.pais) ?? 0) + p.sesiones);
    return [...m.entries()].map(([pais, valor]) => ({ pais, valor })).sort((a, b) => b.valor - a.valor).slice(0, 10);
  }, [serie.paises, grupos]);

  if (session && session.role !== "superadmin") return null;

  const kpis = [
    { k: "pageviews", label: t("telemetria.statPageviews"), valor: resumen.pageviews, icono: "list", clase: styles.kpiBlue, color: "var(--blue)", serie: serie.actual.pageviews, delta: variacion(serie.actual.pageviews, serie.previo.pageviews) },
    { k: "visitantes", label: t("telemetria.statVisitantes"), valor: resumen.visitantesDistintos, icono: "smile", clase: styles.kpiTeal, color: "var(--teal-500)", serie: serie.actual.visitantes, delta: variacion(serie.actual.visitantes, serie.previo.visitantes) },
    { k: "app", label: t("telemetria.statAppSessions"), valor: resumen.appSessions, icono: "box", clase: styles.kpiPurple, color: "#7c4dff", serie: serie.actual.appSessions, delta: variacion(serie.actual.appSessions, serie.previo.appSessions) },
    { k: "paises", label: t("telemetria.statPaises"), valor: resumen.paisesDistintos, icono: "mapPin", clase: styles.kpiAmber, color: "var(--amber)", serie: [] as number[], delta: null },
  ];

  const sinDatos = <EmptyState icon="barChart" title={t("telemetria.sinDatos")} />;

  return (
    <>
      <div className={propios.cabecera}>
        <p className={styles.periodo}>{t("telemetria.delPeriodo", { dias })}</p>
        <div className={styles.tabsGrupo} role="group" aria-label={t("telemetria.rango")}>
          {RANGOS.map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.tabBtn} ${dias === r ? styles.tabActivo : ""}`}
              onClick={() => setDias(r)}
            >
              {t("telemetria.rangoDias", { dias: r })}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <section className={`${styles.kpiGrid} ${propios.kpiGrid}`}>
        {kpis.map((k) => {
          const sube = (k.delta ?? 0) > 0;
          return (
            <article key={k.k} className={styles.kpi}>
              <div className={styles.kpiTop}>
                <span className={`${styles.kpiIcon} ${k.clase}`}><Icon name={k.icono} /></span>
                <span className={styles.kpiLabel}>{k.label}</span>
              </div>
              <span className={styles.kpiValor}>{num(k.valor)}</span>
              <div className={styles.kpiPie}>
                {k.delta != null && Math.abs(k.delta) >= 0.5 ? (
                  <span
                    className={`${styles.delta} ${sube ? styles.deltaPos : styles.deltaNeg}`}
                    title={t("telemetria.vsAnterior")}
                  >
                    {sube ? "▲" : "▼"} {pct(k.delta)}
                  </span>
                ) : <span />}
                <Sparkline valores={k.serie} color={k.color} />
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Evolución diaria y reparto por plataforma ── */}
      <div className={`${styles.fila} ${styles.fila2}`}>
        <Panel className={styles.panel}>
          <PanelHead
            title={t("telemetria.evolucion")}
            sub={t("telemetria.evolucionSub", { dias })}
            right={
              <div className={styles.tabsGrupo}>
                {(["pageviews", "visitantes", "appSessions"] as Metrica[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.tabBtn} ${metrica === m ? styles.tabActivo : ""}`}
                    onClick={() => setMetrica(m)}
                  >
                    {t(`telemetria.metricas.${m}`)}
                  </button>
                ))}
              </div>
            }
          />
          {serie.dias.length === 0 ? sinDatos : (
            <>
              <div className={styles.leyendaLinea}>
                <span className={styles.legItem}><span className={styles.legLinea} />{t("estadisticas.periodoActual")}</span>
                <span className={styles.legItem}><span className={styles.legDash} />{t("estadisticas.periodoAnterior")}</span>
              </div>
              <LineasComparadas
                actual={serie.actual[metrica]}
                previo={serie.previo[metrica]}
                etiquetas={etiquetas}
                formatoEje={num}
              />
            </>
          )}
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("telemetria.plataformas")} sub={t("telemetria.plataformasSub", { dias })} />
          {totalPlataformas === 0 ? sinDatos : (
            <Donut segmentos={segmentos} total={totalPlataformas} etiqueta={t("telemetria.totalSesiones")} formatoValor={num} />
          )}
          <p className={propios.aviso}>{t("telemetria.avisoDescargas")}</p>
        </Panel>
      </div>

      {/* ── Tarjetas por métrica: una por página ── */}
      <Panel className={`${styles.panel} ${propios.bloque}`}>
        <PanelHead title={t("telemetria.paginasMasVistas")} sub={t("telemetria.paginasSub", { dias })} />
        {paginas.length === 0 ? sinDatos : (
          <div className={propios.grid}>
            {paginas.map((p, i) => (
              <article key={p.ruta} className={propios.card} style={{ "--i": i } as React.CSSProperties}>
                <div className={propios.cardTop}>
                  <span className={propios.puesto}>#{i + 1}</span>
                  <span className={propios.pct}>{cuota(p.visitas, resumen.pageviews)}</span>
                </div>
                <span className={propios.ruta} title={p.ruta}>
                  {p.ruta === "/" ? t("telemetria.rutaInicio") : p.ruta}
                </span>
                <span className={propios.valor}>
                  {num(p.visitas)} <small>{t("telemetria.colVisitas").toLowerCase()}</small>
                </span>
                {/* Relativa a la más visitada: la #1 llena la barra */}
                <div className={propios.barra} role="presentation">
                  <span style={{ width: `${(p.visitas / maxVisitas) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {/* ── Tarjetas por plataforma y barras por país ── */}
      <div className={`${styles.fila} ${styles.fila2}`}>
        <Panel className={styles.panel}>
          <PanelHead title={t("telemetria.distribucionPlataformas")} sub={t("telemetria.plataformasSub", { dias })} />
          {grupos.length === 0 ? sinDatos : (
            <div className={propios.grid}>
              {grupos.map((g, i) => {
                const color = COLOR_PLATAFORMA[g.clave] ?? "var(--amber)";
                const parte = totalApp > 0 ? g.sesiones / totalApp : 0;
                return (
                  <article key={g.clave} className={propios.card} style={{ "--i": i } as React.CSSProperties}>
                    <div className={propios.plataformaTop}>
                      <div className={propios.anilloWrap}>
                        <Anillo fraccion={parte} color={color} />
                        <span className={propios.anilloPct}>{Math.round(parte * 100)}%</span>
                      </div>
                      <div className={propios.plataformaTexto}>
                        <span className={propios.plataformaNombre}>
                          {NOMBRE_PLATAFORMA[g.clave] ?? t("telemetria.otraPlataforma")}
                        </span>
                        <span className={propios.valor}>
                          {num(g.sesiones)} <small>{t("telemetria.colSesiones").toLowerCase()}</small>
                        </span>
                      </div>
                    </div>
                    <ul className={propios.paises} aria-label={t("telemetria.colPais")}>
                      {g.paises.slice(0, 4).map((p) => (
                        <li key={p.pais}>
                          <span className={propios.paisNombre}>
                            {bandera(p.pais) && <span aria-hidden>{bandera(p.pais)}</span>}
                            {p.pais}
                          </span>
                          <span className={propios.paisValor}>{num(p.sesiones)}</span>
                          <div className={propios.barraFina} role="presentation">
                            <span style={{ width: `${(p.sesiones / g.sesiones) * 100}%`, background: color }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    {g.paises.length > 4 && (
                      <span className={propios.mas}>{t("telemetria.masPaises", { n: g.paises.length - 4 })}</span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel className={styles.panel}>
          <PanelHead title={t("telemetria.porPais")} sub={t("telemetria.porPaisSub", { dias })} />
          {filasPais.length === 0 ? sinDatos : (
            <BarrasHorizontales
              filas={filasPais.map((p) => ({ nombre: `${bandera(p.pais)} ${p.pais}`.trim(), valor: p.valor }))}
              colores={COLORES_RANK}
            />
          )}
        </Panel>
      </div>
    </>
  );
}
