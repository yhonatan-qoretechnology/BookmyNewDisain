"use client";
/* ============================================================
   Facturación — listado de facturas (View)
   Cada pago real (GET /payments/filter) queda registrado como una
   factura. El alcance de sedes consultadas depende del rol:
   superadmin (todo o lo elegido), owner (su empresa) o admin (su sede).
   Columnas: ID Factura · Cliente · Servicio · Fecha · Estado · Total
   Acciones: Ver (popup) · Descargar PDF
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { fmtFechaLarga, fmtMoneda } from "@/constants";
import {
  EmisorController,
  Factura,
  FacturasController,
  FiltroFacturasController,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, FilterDate, FilterGroup, FilterSelect } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";
import FacturaViewModal from "@/components/facturacion/FacturaViewModal";
import { descargarFacturaPdf } from "@/components/facturacion/facturaPdf";
import styles from "@/components/facturacion/facturacion.module.css";

export default function FacturacionPage() {
  const { t } = useI18n();
  const { locale } = useI18n();
  const { session } = useSession();
  const { toast } = useUi();

  /* --- búsqueda libre (ID/Cliente/Servicio en una sola caja) + fecha --- */
  const [fQuery, setFQuery] = useState("");
  const [fFecha, setFFecha] = useState("");
  /* --- alcance por rol: empresa (solo superadmin) y sede (superadmin/owner) --- */
  const [fEmpresaId, setFEmpresaId] = useState("");
  const [fSedeId, setFSedeId] = useState("");
  const [ver, setVer] = useState<Factura | null>(null);
  const [bajando, setBajando] = useState<string | null>(null);

  /* Opciones de los selectores de empresa/sede, según el rol de la sesión */
  const { data: empresasOpt } = useData(
    () => FiltroFacturasController.empresas(session),
    [session?.id, session?.role], []
  );
  const { data: sedesOpt } = useData(
    () => FiltroFacturasController.sedes(session, fEmpresaId),
    [session?.id, session?.role, session?.negocioId, fEmpresaId], []
  );

  /* Al cambiar de empresa (superadmin), la sede elegida deja de ser válida */
  useEffect(() => {
    setFSedeId("");
  }, [fEmpresaId]);

  /* Una factura por cada pago real (PaymentModule), acotado por rol */
  const { data: lista, loading } = useData(
    () =>
      FacturasController.search(
        session,
        { q: fQuery, fecha: fFecha, empresaId: fEmpresaId, sedeId: fSedeId },
        locale
      ),
    [session?.id, session?.negocioId, session?.sedeId, locale, fQuery, fFecha, fEmpresaId, fSedeId],
    []
  );

  /* ¿Hay algo que mostrar en la fila de ámbito (empresa/sede)? */
  const hayFiltroEmpresa = session?.role === "superadmin" && empresasOpt.length > 0;
  const hayFiltroSede = (session?.role === "superadmin" || session?.role === "owner") && sedesOpt.length > 0;

  /* Datos de la empresa para la cabecera de la factura y del PDF */
  const { data: emisor } = useData(
    () => EmisorController.get(session),
    [session?.negocioId, session?.sedeId],
    null
  );

  const resumen = useMemo(() => FacturasController.resumen(lista), [lista]);

  const textosPdf = () => ({
    factura: t("facturacion.panelTitle"),
    emitida: t("facturacion.emitida"),
    receptor: t("facturacion.receptor"),
    concepto: t("facturacion.concepto"),
    cantidad: t("facturacion.cantidad"),
    precio: t("facturacion.precio"),
    subtotal: t("facturacion.subtotal"),
    total: t("gastos.total"),
    estado: t("common.state"),
    reserva: t("facturacion.reserva"),
    sede: t("facturacion.sede"),
    nit: t("facturacion.nit"),
    servicio: t("common.service"),
    fecha: t("common.date"),
    cliente: t("common.client"),
    metodoPago: t("common.price"),
    profesional: t("common.specialist"),
    pie: t("facturacion.panelTitle"),
  });

  const descargar = async (f: Factura) => {
    if (!emisor) return;
    setBajando(f.id);
    try {
      await descargarFacturaPdf(f, emisor, textosPdf());
      toast(t("facturacion.pdfListo"), "success");
    } catch {
      toast(t("facturacion.pdfError"), "error");
    } finally {
      setBajando(null);
    }
  };

  const badgeKind = (f: Factura) =>
    f.estado === "pagado" ? "pagado" : f.estado === "cancelado" ? "cancelado" : "pendiente";

  return (
    <>
      <StatGrid>
        <StatCard
          color="teal" icon={<Icon name="invoice" />}
          label={t("facturacion.statEmitidas")} value={resumen.emitidas}
          footer={t("facturacion.delPeriodo")}
        />
        <StatCard
          color="blue" icon={<Icon name="dollar" />}
          label={t("facturacion.statFacturado")} value={fmtMoneda(resumen.total, "EUR")}
          footer={t("facturacion.delPeriodo")}
        />
        <StatCard
          color="green" icon={<Icon name="circle-check" />}
          label={t("facturacion.statCobrado")} value={fmtMoneda(resumen.cobrado, "EUR")}
          footer={t("facturacion.delPeriodo")}
        />
        <StatCard
          color="amber" icon={<Icon name="clock" />}
          label={t("facturacion.statPendiente")} value={fmtMoneda(resumen.pendiente, "EUR")}
          footer={t("facturacion.delPeriodo")}
        />
      </StatGrid>

      <Panel>
        <PanelHead
          title={t("facturacion.panelTitle")}
          sub={t("facturacion.panelSub")}
        />

        {/* Fila 1 · Ámbito: a qué empresa/sede pertenecen los pagos (solo si el rol elige) */}
        {(hayFiltroEmpresa || hayFiltroSede) && (
          <Toolbar>
            <FilterGroup>
              {hayFiltroEmpresa && (
                <FilterSelect
                  value={fEmpresaId}
                  onChange={setFEmpresaId}
                  icon="building"
                  label={t("facturacion.filterEmpresa")}
                  options={[
                    { value: "", label: t("facturacion.filterEmpresa") },
                    ...empresasOpt.map((e) => ({ value: e.id, label: e.nombre })),
                  ]}
                />
              )}
              {hayFiltroSede && (
                <FilterSelect
                  value={fSedeId}
                  onChange={setFSedeId}
                  icon="mapPin"
                  label={t("facturacion.filterSede")}
                  options={[
                    { value: "", label: t("facturacion.filterSede") },
                    ...sedesOpt.map((s) => ({ value: s.id, label: s.nombre })),
                  ]}
                />
              )}
            </FilterGroup>
          </Toolbar>
        )}

        {/* Fila 2 · Búsqueda: texto libre (ID, cliente o servicio) + fecha */}
        <Toolbar>
          <SearchBox value={fQuery} onChange={setFQuery} placeholder={t("facturacion.filterQuery")} />
          <FilterDate value={fFecha} onChange={setFFecha} label={t("common.date")} />
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState
            icon="invoice"
            title={loading ? t("facturacion.panelTitle") : t("facturacion.emptyTitle")}
            message={loading ? undefined : t("facturacion.emptyMsg")}
          />
        ) : (
          <DataTable
            headers={[
              t("facturacion.idFactura"),
              t("common.client"),
              t("facturacion.servicio"),
              t("common.date"),
              t("common.state"),
              t("gastos.total"),
              t("common.actions"),
            ]}
          >
            {lista.map((f) => (
              <tr key={f.id}>
                <td><b>{f.id}</b></td>
                <td><PersonRow name={f.cliente} photo={f.clienteFoto} /></td>
                <td>{f.servicio}</td>
                <td>{fmtFechaLarga(f.fecha)}</td>
                <td><Badge kind={badgeKind(f)}>{t(`factura.${f.estado}`)}</Badge></td>
                <td><b>{fmtMoneda(f.total, f.moneda)}</b></td>
                <td>
                  <div className={styles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => setVer(f)}>
                      {t("common.view")}
                    </Button>
                    <IconButton
                      onClick={() => descargar(f)}
                      disabled={!emisor || bajando === f.id}
                      title={t("facturacion.descargarPdf")}
                      aria-label={`${t("facturacion.descargarPdf")} ${f.id}`}
                    >
                      <Icon name="download" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Popup: ver factura, imprimir y descargar PDF */}
      <FacturaViewModal factura={ver} emisor={emisor} onClose={() => setVer(null)} />
    </>
  );
}
