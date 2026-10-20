"use client";
/* ============================================================
   Telemetría — panel, web pública y distribución de la app
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN. Pageviews del panel/web los manda
   PageviewTracker (montado en el layout raíz); las aperturas de la
   app móvil las mandaría esa otra app (fuera de este repo) a
   POST /telemetria/app-session — acá solo se lee lo agregado.
============================================================ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { TelemetriaApi } from "@/api/modules";
import type { ApiDistribucionPlataforma, ApiRankingPagina, ApiTelemetriaResumen } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";

const DIAS = 30;

export default function TelemetriaPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const { data: resumen } = useData(
    () => TelemetriaApi.resumen(DIAS),
    [],
    { dias: DIAS, pageviews: 0, appSessions: 0, visitantesDistintos: 0, paisesDistintos: 0 } as ApiTelemetriaResumen
  );
  const { data: paginas } = useData(() => TelemetriaApi.paginasMasVistas(DIAS, 10), [], [] as ApiRankingPagina[]);
  const { data: plataformas } = useData(() => TelemetriaApi.distribucionPlataformas(DIAS), [], [] as ApiDistribucionPlataforma[]);

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
        <PanelHead title={t("telemetria.panelTitle")} sub={t("telemetria.panelSub")} />

        <h3 style={{ margin: "4px 0 10px" }}>{t("telemetria.paginasMasVistas")}</h3>
        {paginas.length === 0 ? (
          <EmptyState icon="barChart" title={t("telemetria.sinDatos")} />
        ) : (
          <DataTable headers={[t("telemetria.colRuta"), t("telemetria.colVisitas")]}>
            {paginas.map((p) => (
              <tr key={p.ruta}>
                <td>{p.ruta}</td>
                <td>{p.visitas}</td>
              </tr>
            ))}
          </DataTable>
        )}

        <h3 style={{ margin: "26px 0 6px" }}>{t("telemetria.distribucionPlataformas")}</h3>
        <p style={{ color: "var(--slate-500)", fontSize: 12.5, marginBottom: 12 }}>{t("telemetria.avisoDescargas")}</p>
        {plataformas.length === 0 ? (
          <EmptyState icon="smile" title={t("telemetria.sinDatos")} />
        ) : (
          <DataTable headers={[t("telemetria.colPlataforma"), t("telemetria.colPais"), t("telemetria.colSesiones")]}>
            {plataformas.map((p, i) => (
              <tr key={i}>
                <td>{p.plataforma || "—"}</td>
                <td>{p.pais || "—"}</td>
                <td>{p.sesiones}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
