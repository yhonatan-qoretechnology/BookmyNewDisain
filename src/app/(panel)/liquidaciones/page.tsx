"use client";
/* ============================================================
   Liquidaciones Wise — scaffold de solo lectura
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN. Bookmy le liquida/paga fondos a los
   negocios vía Wise — no hay credenciales reales todavía
   (WISE_API_KEY/URL/PROFILE_ID), así que los registros quedan en
   PENDIENTE sin intentar la transferencia real (WiseService.isEnabled()).
   Nada que "hacer" todavía: solo ver lo que se fue registrando.
============================================================ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { WiseApi } from "@/api/modules";
import type { ApiEstadoLiquidacionWise, ApiLiquidacionWise } from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

function badgeDeEstado(estado: ApiEstadoLiquidacionWise): "activo" | "pendiente" | "cancelado" {
  if (estado === "COMPLETADA") return "activo";
  if (estado === "FALLIDA") return "cancelado";
  return "pendiente";
}

function fmtFecha(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function LiquidacionesPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const { data: liquidaciones } = useData(() => WiseApi.listar(), [], [] as ApiLiquidacionWise[]);

  if (session && session.role !== "superadmin") return null;

  return (
    <Panel>
      <PanelHead title={t("liquidaciones.panelTitle")} sub={t("liquidaciones.panelSub")} />
      <p style={{ color: "var(--slate-500)", fontSize: 12.5, marginBottom: 14 }}>{t("liquidaciones.aviso")}</p>

      {liquidaciones.length === 0 ? (
        <EmptyState icon="wallet" title={t("liquidaciones.emptyTitle")} message={t("liquidaciones.emptyMsg")} />
      ) : (
        <DataTable headers={[t("liquidaciones.colEmpresa"), t("liquidaciones.colMonto"), t("liquidaciones.colEstado"), t("liquidaciones.colFecha")]}>
          {liquidaciones.map((l) => (
            <tr key={l.id}>
              <td>{l.empresa?.nombre || `#${l.empresaId}`}</td>
              <td>{l.monto.toFixed(2)} {l.moneda}</td>
              <td><Badge kind={badgeDeEstado(l.estado)}>{t(`liquidaciones.estado.${l.estado}`)}</Badge></td>
              <td>{fmtFecha(l.createdAt, locale)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}
