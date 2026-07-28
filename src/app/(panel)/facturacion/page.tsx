"use client";
/* ============================================================
   Facturación — listado de facturas (View)
   Columnas: ID Factura · Cliente · Servicio · Fecha
   Acciones: Ver (popup para imprimir) · PDF
   Filtros por columna en la barra superior.
============================================================ */
import { useState } from "react";
import Link from "next/link";
import { Factura, FacturasController } from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";
import FacturaViewModal, { imprimirFactura } from "@/components/facturacion/FacturaViewModal";

export default function FacturacionPage() {
  const { t } = useI18n();

  /* --- filtros por columna --- */
  const [fId, setFId] = useState("");
  const [fCliente, setFCliente] = useState("");
  const [fServicio, setFServicio] = useState("");
  const [fFecha, setFFecha] = useState("");
  const [ver, setVer] = useState<Factura | null>(null);

  /* GET /facturas: cada reserva queda como una factura */
  const { data: lista } = useData(
    () => FacturasController.search({ id: fId, cliente: fCliente, servicio: fServicio, fecha: fFecha }),
    [fId, fCliente, fServicio, fFecha],
    []
  );

  return (
    <Panel>
      <PanelHead title={t("facturacion.panelTitle")} sub={t("facturacion.panelSub")} />

      <Toolbar>
        <SearchBox value={fId} onChange={setFId} placeholder={t("facturacion.filterId")} />
        <SearchBox value={fCliente} onChange={setFCliente} placeholder={t("facturacion.filterCliente")} />
        <SearchBox value={fServicio} onChange={setFServicio} placeholder={t("facturacion.filterServicio")} />
        <input
          type="date"
          value={fFecha}
          onChange={(e) => setFFecha(e.target.value)}
          aria-label={t("common.date")}
          style={{ padding: "8px 10px", border: "1px solid var(--border,#d9d9d9)", borderRadius: 8, font: "inherit" }}
        />
        <Link href="/facturacion/gastos" className="btn">
          {t("facturacion.gastosLink")}
        </Link>
      </Toolbar>

      {lista.length === 0 ? (
        <EmptyState icon="invoice" title={t("facturacion.emptyTitle")} message={t("facturacion.emptyMsg")} />
      ) : (
        <DataTable
          headers={[
            t("facturacion.idFactura"),
            t("common.client"),
            t("facturacion.servicio"),
            t("common.date"),
            t("common.actions"),
          ]}
        >
          {lista.map((f) => (
            <tr key={f.id}>
              <td><b>{f.id}</b></td>
              <td><PersonRow name={f.cliente} /></td>
              <td>{f.servicio}</td>
              <td>{f.fecha}</td>
              <td>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => setVer(f)}>
                    {t("common.view")}
                  </button>
                  <button className="btn btn-sm" onClick={() => imprimirFactura(f)} title={t("common.download")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* Popup: ver factura, imprimir y descargar PDF */}
      <FacturaViewModal factura={ver} onClose={() => setVer(null)} />
    </Panel>
  );
}
