"use client";
/* ============================================================
   Wise — EXCLUSIVO DE SUPERADMIN
   ------------------------------------------------------------
   1. Transferencias por confirmar: clientes que eligieron pagar
      por transferencia a la cuenta Wise de Bookmy. Wise no avisa
      por API de lo que llega, así que se coteja a mano con la
      referencia BOOKMY-<id> y se pulsa «Confirmar»: el pago queda
      PAID y se liquida al negocio.
   2. Liquidaciones: lo que Bookmy envía a cada negocio. Con un
      token personal en España Wise no deja pagar la transferencia
      por API: queda PENDIENTE hasta pagarla en la web de Wise.
============================================================ */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { PaymentsApi, WiseApi } from "@/api/modules";
import type {
  ApiEstadoLiquidacionWise,
  ApiLiquidacionWise,
  ApiTransferenciaWisePendiente,
} from "@/api/types";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/** Web de Wise donde se pagan las liquidaciones pendientes (sandbox en pruebas). */
const WISE_WEB = process.env.NEXT_PUBLIC_WISE_WEB_URL || "https://wise.com";

function badgeDeEstado(estado: ApiEstadoLiquidacionWise): "activo" | "pendiente" | "cancelado" {
  if (estado === "COMPLETADA") return "activo";
  if (estado === "FALLIDA") return "cancelado";
  return "pendiente";
}

function fmtFecha(iso: string, locale: string, conHora = false) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", {
      dateStyle: "medium",
      ...(conHora && { timeStyle: "short" }),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function LiquidacionesPage() {
  const router = useRouter();
  const { session } = useSession();
  const { toast, confirm } = useUi();
  const { t, locale } = useI18n();
  const [confirmando, setConfirmando] = useState<number | null>(null);

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const esSuper = session?.role === "superadmin";
  const { data: liquidaciones, reload: recargarLiquidaciones } = useData(
    () => (esSuper ? WiseApi.listar() : Promise.resolve([])),
    [esSuper],
    [] as ApiLiquidacionWise[],
  );
  const { data: pendientes, reload: recargarPendientes } = useData(
    () => (esSuper ? PaymentsApi.wisePendientes() : Promise.resolve([])),
    [esSuper],
    [] as ApiTransferenciaWisePendiente[],
  );

  if (session && !esSuper) return null;

  const confirmar = (p: ApiTransferenciaWisePendiente) => {
    const referencia = p.bankResponse?.referencia ?? `BOOKMY-${p.id}`;
    confirm({
      title: t("liquidaciones.confirmTitle"),
      message: t("liquidaciones.confirmMsg", {
        monto: p.totalAmount.toFixed(2),
        referencia,
      }),
      confirmLabel: t("liquidaciones.confirmar"),
      onConfirm: async () => {
        setConfirmando(p.id);
        try {
          await PaymentsApi.confirmarWise(p.id);
          await Promise.all([recargarPendientes(), recargarLiquidaciones()]);
          toast(t("liquidaciones.confirmadoOk", { referencia }), "success");
        } catch (e) {
          toast(e instanceof Error ? e.message : t("liquidaciones.confirmarError"), "error");
        } finally {
          setConfirmando(null);
        }
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("liquidaciones.pendientesTitle")} sub={t("liquidaciones.pendientesSub")} />
        {pendientes.length === 0 ? (
          <EmptyState
            icon="wallet"
            title={t("liquidaciones.pendientesEmptyTitle")}
            message={t("liquidaciones.pendientesEmptyMsg")}
          />
        ) : (
          <DataTable
            headers={[
              t("liquidaciones.colReferencia"),
              t("liquidaciones.colCliente"),
              t("liquidaciones.colEmpresa"),
              t("liquidaciones.colMonto"),
              t("liquidaciones.colFecha"),
              "",
            ]}
          >
            {pendientes.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.bankResponse?.referencia ?? `BOOKMY-${p.id}`}</strong>
                </td>
                <td>{p.user?.email}</td>
                <td>
                  {p.appointment?.sede?.empresa?.nombre ?? "—"}
                  {p.appointment?.sede?.nombre ? ` · ${p.appointment.sede.nombre}` : ""}
                </td>
                <td>{p.totalAmount.toFixed(2)} {p.bankResponse?.moneda ?? "EUR"}</td>
                <td>{fmtFecha(p.createdAt, locale, true)}</td>
                <td>
                  <Button size="sm" disabled={confirmando === p.id} onClick={() => confirmar(p)}>
                    {confirmando === p.id ? t("liquidaciones.confirmando") : t("liquidaciones.confirmar")}
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel>
        <PanelHead title={t("liquidaciones.panelTitle")} sub={t("liquidaciones.panelSub")} />
        <p style={{ color: "var(--slate-500)", fontSize: 12.5, marginBottom: 14 }}>
          {t("liquidaciones.aviso")}{" "}
          <a href={WISE_WEB} target="_blank" rel="noreferrer">{t("liquidaciones.abrirWise")}</a>
        </p>

        {liquidaciones.length === 0 ? (
          <EmptyState icon="wallet" title={t("liquidaciones.emptyTitle")} message={t("liquidaciones.emptyMsg")} />
        ) : (
          <DataTable
            headers={[
              t("liquidaciones.colEmpresa"),
              t("liquidaciones.colMonto"),
              t("liquidaciones.colEstado"),
              t("liquidaciones.colPago"),
              t("liquidaciones.colTransferencia"),
              t("liquidaciones.colFecha"),
            ]}
          >
            {liquidaciones.map((l) => (
              <tr key={l.id}>
                <td>{l.empresa?.nombre || `#${l.empresaId}`}</td>
                <td>{l.monto.toFixed(2)} {l.moneda}</td>
                <td><Badge kind={badgeDeEstado(l.estado)}>{t(`liquidaciones.estado.${l.estado}`)}</Badge></td>
                <td>{l.paymentId ? `BOOKMY-${l.paymentId}` : "—"}</td>
                <td>{l.wiseTransferId ?? "—"}</td>
                <td>{fmtFecha(l.createdAt, locale)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
