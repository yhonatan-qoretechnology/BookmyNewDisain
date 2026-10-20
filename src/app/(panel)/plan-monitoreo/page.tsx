"use client";
/* ============================================================
   Monitoreo de Bookmy CRM Pro — vencimientos manuales + aviso
   ------------------------------------------------------------
   EXCLUSIVO DE SUPERADMIN: Bookmy CRM Pro no tiene cobro recurrente
   real todavía (ver PlanService.PRO_SE_OFRECE). Acá se carga a mano
   cuándo vence el pago de cada negocio; el backend ya manda el email
   de aviso solo (EmpresaPlanPagoCron) cuando se pasa la fecha.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { EmpresasApi } from "@/api/modules";
import type { ApiEmpresa, ApiEmpresaPlanPago, ApiEmpresaPlanPagosResumen, ApiEstadoPagoPlan } from "@/api/types";
import { ApiError } from "@/api/http";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { FilterGroup, FilterSelect, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import type { PaginationProps } from "@/components/ui/Pagination";

const LIMIT = 20;

/** Un mismo color de Badge para cada estado — no hay un kind propio para
    "vencido", así que se reutiliza el vocabulario de citas (cancelado
    se lee igual de mal que vencido). */
function badgeDeEstado(estado: ApiEstadoPagoPlan): "activo" | "pendiente" | "cancelado" {
  if (estado === "PAGADO") return "activo";
  if (estado === "VENCIDO") return "cancelado";
  return "pendiente";
}

function fmtFecha(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PlanMonitoreoPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast, confirm } = useUi();

  useEffect(() => {
    if (session && session.role !== "superadmin") router.replace(ROUTES.dashboard);
  }, [session, router]);

  const [estado, setEstado] = useState<ApiEstadoPagoPlan | "">("");
  const [page, setPage] = useState(1);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [empresaId, setEmpresaId] = useState("");
  const [monto, setMonto] = useState("");
  const [vence, setVence] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => { setPage(1); }, [estado]);

  const { data: pagina, loading, error, reload } = useData(
    () => EmpresasApi.planPagos.listarTodas({ estado: estado || undefined, page, limit: LIMIT }),
    [estado, page],
    { items: [] as ApiEmpresaPlanPago[], pagination: { page: 1, limit: LIMIT, total: 0, totalPages: 1 } }
  );

  const { data: resumen, reload: reloadResumen } = useData(
    () => EmpresasApi.planPagos.resumen(),
    [],
    { pendientes: 0, vencidas: 0, pagadasEsteMes: 0 } as ApiEmpresaPlanPagosResumen
  );

  const { data: empresas } = useData(() => EmpresasApi.findAll(), [], [] as ApiEmpresa[]);

  const paginacion: PaginationProps = useMemo(() => {
    const p = pagina.pagination;
    return {
      pagina: p.page,
      totalPaginas: p.totalPages,
      total: p.total,
      desde: p.total === 0 ? 0 : (p.page - 1) * p.limit + 1,
      hasta: Math.min(p.page * p.limit, p.total),
      irA: (n: number) => setPage(Math.min(Math.max(n, 1), p.totalPages)),
    };
  }, [pagina]);

  if (session && session.role !== "superadmin") return null;

  const abrirNuevo = () => {
    setEmpresaId(""); setMonto(""); setVence("");
    setNuevoOpen(true);
  };

  const crearPago = async () => {
    if (!empresaId || !monto || Number(monto) <= 0 || !vence) return;
    setCreando(true);
    try {
      await EmpresasApi.planPagos.crear(Number(empresaId), { monto: Number(monto), vence });
      toast(t("planMonitoreo.creado"), "success");
      setNuevoOpen(false);
      await reload();
      await reloadResumen();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : t("planMonitoreo.crearError"), "error");
    } finally {
      setCreando(false);
    }
  };

  const marcarPagado = (pago: ApiEmpresaPlanPago) => {
    confirm({
      title: t("planMonitoreo.marcarPagado"),
      message: t("planMonitoreo.marcarPagadoConfirmar"),
      confirmLabel: t("planMonitoreo.marcarPagado"),
      onConfirm: async () => {
        try {
          await EmpresasApi.planPagos.marcarPagado(pago.id);
          toast(t("planMonitoreo.marcarPagadoOk"), "success");
          void reload();
          void reloadResumen();
        } catch (e) {
          toast(e instanceof ApiError ? e.message : t("planMonitoreo.marcarPagadoError"), "error");
        }
      },
    });
  };

  return (
    <>
      <StatGrid>
        <StatCard color="amber" icon={<Icon name="clock" />} label={t("planMonitoreo.statPendientes")} count={resumen.pendientes} />
        <StatCard color="red" icon={<Icon name="x" />} label={t("planMonitoreo.statVencidas")} count={resumen.vencidas} />
        <StatCard color="green" icon={<Icon name="circle-check" />} label={t("planMonitoreo.statPagadasMes")} count={resumen.pagadasEsteMes} />
      </StatGrid>

      <Panel>
        <PanelHead title={t("planMonitoreo.panelTitle")} sub={t("planMonitoreo.panelSub", { n: pagina.pagination.total })} />

        <Toolbar>
          <FilterGroup>
            <FilterSelect
              icon="clock"
              label={t("planMonitoreo.filterEstado")}
              value={estado}
              onChange={(v) => setEstado(v as ApiEstadoPagoPlan | "")}
              options={[
                { value: "", label: t("planMonitoreo.todos") },
                { value: "PENDIENTE", label: t("planMonitoreo.estado.PENDIENTE") },
                { value: "VENCIDO", label: t("planMonitoreo.estado.VENCIDO") },
                { value: "PAGADO", label: t("planMonitoreo.estado.PAGADO") },
              ]}
            />
          </FilterGroup>
          <ToolbarActions>
            <Button onClick={abrirNuevo}>{t("planMonitoreo.nuevoPago")}</Button>
          </ToolbarActions>
        </Toolbar>

        {pagina.items.length === 0 ? (
          <EmptyState
            icon="clock"
            title={loading ? t("planMonitoreo.panelTitle") : t("planMonitoreo.emptyTitle")}
            message={loading ? undefined : (error || t("planMonitoreo.emptyMsg"))}
          />
        ) : (
          <DataTable
            paginacion={paginacion}
            resetKey={`${estado}|${page}`}
            headers={[
              t("planMonitoreo.colEmpresa"),
              t("planMonitoreo.colMonto"),
              t("planMonitoreo.colVence"),
              t("planMonitoreo.colEstado"),
              t("planMonitoreo.colPagadoEn"),
              t("common.actions"),
            ]}
          >
            {pagina.items.map((p) => (
              <tr key={p.id}>
                <td>{p.empresa?.nombre || `#${p.empresaId}`}</td>
                <td>{p.monto.toFixed(2)}</td>
                <td>{fmtFecha(p.vence, locale)}</td>
                <td><Badge kind={badgeDeEstado(p.estado)}>{t(`planMonitoreo.estado.${p.estado}`)}</Badge></td>
                <td>{p.pagadoEn ? fmtFecha(p.pagadoEn, locale) : "—"}</td>
                <td>
                  {p.estado !== "PAGADO" && (
                    <Button variant="ghost" size="sm" onClick={() => marcarPagado(p)}>
                      {t("planMonitoreo.marcarPagado")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={nuevoOpen} onClose={() => setNuevoOpen(false)}>
        <ModalTitle>{t("planMonitoreo.nuevoTitulo")}</ModalTitle>
        <Field label={t("common.business")} htmlFor="pm-empresa">
          <select id="pm-empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
            <option value="">{t("planMonitoreo.empresaPlaceholder")}</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Field>
        <Field label={t("planMonitoreo.monto")} htmlFor="pm-monto">
          <input id="pm-monto" type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
        </Field>
        <Field label={t("planMonitoreo.vence")} htmlFor="pm-vence">
          <input id="pm-vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setNuevoOpen(false)} disabled={creando}>{t("common.cancel")}</Button>
          <Button onClick={() => void crearPago()} disabled={creando || !empresaId || !monto || !vence}>
            {creando ? t("planMonitoreo.creando") : t("planMonitoreo.crear")}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
