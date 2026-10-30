"use client";
/* ============================================================
   Telemetría — panel, web pública y distribución de la app
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN. Pageviews del panel/web los manda
   PageviewTracker (montado en el layout raíz); las aperturas de la
   app móvil las mandaría esa otra app (fuera de este repo) a
   POST /telemetria/app-session — acá solo se lee lo agregado.

   Diseño en tarjetas por métrica: una por página y una por
   plataforma. El backend no da series por día, así que no hay
   gráficas de evolución — solo reparto dentro del período.
============================================================ */
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { TelemetriaApi } from "@/api/modules";
import type { ApiDistribucionPlataforma, ApiRankingPagina, ApiTelemetriaResumen } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useRegion } from "@/context/RegionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import styles from "./telemetria.module.css";

const DIAS = 30;

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
      sesiones: [...paises.values()].reduce((a, n) => a + n, 0),
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
    <svg viewBox="0 0 56 56" className={styles.anillo} aria-hidden>
      <circle cx="28" cy="28" r={R} className={styles.anilloBase} />
      <circle
        cx="28" cy="28" r={R}
        className={styles.anilloValor}
        stroke={color}
        strokeDasharray={`${largo} ${C - largo}`}
        /* Empieza arriba (las 12) en vez de a las 3 */
        strokeDashoffset={C * 0.25}
      />
    </svg>
  );
}

export default function TelemetriaPage() {
  const router = useRouter();
  const { session } = useSession();
  const { pais } = useRegion();
  const { t } = useI18n();

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const { data: resumen } = useData(
    () => TelemetriaApi.resumen(DIAS),
    [],
    { dias: DIAS, pageviews: 0, appSessions: 0, visitantesDistintos: 0, paisesDistintos: 0 } as ApiTelemetriaResumen
  );
  const { data: paginas } = useData(() => TelemetriaApi.paginasMasVistas(DIAS, 12), [], [] as ApiRankingPagina[]);
  const { data: plataformas } = useData(() => TelemetriaApi.distribucionPlataformas(DIAS), [], [] as ApiDistribucionPlataforma[]);

  const fmt = (n: number) => n.toLocaleString(pais.locale);
  const pct = (parte: number, total: number) =>
    total > 0 ? `${((parte / total) * 100).toFixed(1).replace(".", ",")}%` : "0%";

  const maxVisitas = Math.max(1, ...paginas.map((p) => p.visitas));
  const grupos = useMemo(() => porPlataforma(plataformas), [plataformas]);
  const totalSesiones = grupos.reduce((a, g) => a + g.sesiones, 0);

  if (session && session.role !== "superadmin") return null;

  return (
    <>
      <StatGrid>
        <StatCard color="blue" icon={<Icon name="list" />} label={t("telemetria.statPageviews")} count={resumen.pageviews} footer={t("telemetria.delPeriodo", { dias: DIAS })} />
        <StatCard color="teal" icon={<Icon name="smile" />} label={t("telemetria.statVisitantes")} count={resumen.visitantesDistintos} footer={t("telemetria.delPeriodo", { dias: DIAS })} />
        <StatCard color="purple" icon={<Icon name="box" />} label={t("telemetria.statAppSessions")} count={resumen.appSessions} footer={t("telemetria.delPeriodo", { dias: DIAS })} />
        <StatCard color="amber" icon={<Icon name="mapPin" />} label={t("telemetria.statPaises")} count={resumen.paisesDistintos} footer={t("telemetria.delPeriodo", { dias: DIAS })} />
      </StatGrid>

      <Panel>
        <PanelHead title={t("telemetria.paginasMasVistas")} sub={t("telemetria.paginasSub", { dias: DIAS })} />
        {paginas.length === 0 ? (
          <EmptyState icon="barChart" title={t("telemetria.sinDatos")} />
        ) : (
          <div className={styles.grid}>
            {paginas.map((p, i) => (
              <article key={p.ruta} className={styles.card} style={{ "--i": i } as React.CSSProperties}>
                <div className={styles.cardTop}>
                  <span className={styles.puesto}>#{i + 1}</span>
                  <span className={styles.pct}>{pct(p.visitas, resumen.pageviews)}</span>
                </div>
                <span className={styles.ruta} title={p.ruta}>
                  {p.ruta === "/" ? t("telemetria.rutaInicio") : p.ruta}
                </span>
                <span className={styles.valor}>
                  {fmt(p.visitas)} <small>{t("telemetria.colVisitas").toLowerCase()}</small>
                </span>
                {/* Relativa a la más visitada: así la #1 llena la barra
                    y el resto se compara a ojo con ella. */}
                <div className={styles.barra} role="presentation">
                  <span style={{ width: `${(p.visitas / maxVisitas) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel className={styles.seccion}>
        <PanelHead title={t("telemetria.distribucionPlataformas")} sub={t("telemetria.plataformasSub", { dias: DIAS })} />
        <p className={styles.aviso}>{t("telemetria.avisoDescargas")}</p>
        {grupos.length === 0 ? (
          <EmptyState icon="smile" title={t("telemetria.sinDatos")} />
        ) : (
          <div className={styles.grid}>
            {grupos.map((g, i) => {
              const color = COLOR_PLATAFORMA[g.clave] ?? "var(--amber)";
              const cuota = totalSesiones > 0 ? g.sesiones / totalSesiones : 0;
              return (
                <article key={g.clave} className={styles.card} style={{ "--i": i } as React.CSSProperties}>
                  <div className={styles.plataformaTop}>
                    <div className={styles.anilloWrap}>
                      <Anillo fraccion={cuota} color={color} />
                      <span className={styles.anilloPct}>{Math.round(cuota * 100)}%</span>
                    </div>
                    <div className={styles.plataformaTexto}>
                      <span className={styles.plataformaNombre}>
                        {NOMBRE_PLATAFORMA[g.clave] ?? t("telemetria.otraPlataforma")}
                      </span>
                      <span className={styles.valor}>
                        {fmt(g.sesiones)} <small>{t("telemetria.colSesiones").toLowerCase()}</small>
                      </span>
                    </div>
                  </div>
                  <ul className={styles.paises} aria-label={t("telemetria.colPais")}>
                    {g.paises.slice(0, 4).map((p) => (
                      <li key={p.pais}>
                        <span className={styles.paisNombre}>
                          {bandera(p.pais) && <span aria-hidden>{bandera(p.pais)}</span>}
                          {p.pais}
                        </span>
                        <span className={styles.paisValor}>{fmt(p.sesiones)}</span>
                        <div className={styles.barraFina} role="presentation">
                          <span style={{ width: `${(p.sesiones / g.sesiones) * 100}%`, background: color }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {g.paises.length > 4 && (
                    <span className={styles.mas}>{t("telemetria.masPaises", { n: g.paises.length - 4 })}</span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
