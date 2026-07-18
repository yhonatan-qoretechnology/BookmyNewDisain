"use client";
/* ============================================================
   Facturación — listado de facturas (View)
============================================================ */
import { useState } from "react";
import { FacturasController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";

const BADGE_KIND = { pagado: "pagado", pendiente: "pendiente", cancelado: "cancelado" } as const;

export default function FacturacionPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  /* GET /payments: los pagos se crean junto con las citas */
  const { data: lista } = useData(() => FacturasController.search(search), [search], []);

  return (
    <Panel>
      <PanelHead title={t("facturacion.panelTitle")} sub={t("facturacion.panelSub")} />
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder={t("facturacion.searchPlaceholder")} />
      </Toolbar>

      {lista.length === 0 ? (
        <EmptyState icon="invoice" title={t("facturacion.emptyTitle")} message={t("facturacion.emptyMsg")} />
      ) : (
        <DataTable headers={[t("facturacion.number"), t("common.client"), t("common.date"), t("facturacion.total"), t("common.state")]}>
          {lista.map((f) => (
            <tr key={f.id}>
              <td><b>{f.id}</b></td>
              <td><PersonRow name={f.cliente} /></td>
              <td>{f.fecha}</td>
              <PriceCell value={f.total} />
              <td><Badge kind={BADGE_KIND[f.estado]}>{t(`factura.${f.estado}`)}</Badge></td>
            </tr>
          ))}
        </DataTable>
      )}
    </Panel>
  );
}
