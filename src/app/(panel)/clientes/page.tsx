"use client";
/* ============================================================
   Clientes — listado, alta y baja (View)
============================================================ */
import { useState } from "react";
import { ClientesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";

export default function ClientesPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const { data: lista } = useData(() => ClientesController.search(search), [search], []);

  return (
    <>
      <Panel>
        <PanelHead title={t("clientes.panelTitle")} sub={t("common.results", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("clientes.searchPlaceholder")} />
          {/* Los clientes finales se registran desde la app de
              clientes (POST /auth/register); aquí solo consulta. */}
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="user" title={t("clientes.emptyTitle")} message={t("clientes.emptyMsg")} />
        ) : (
          <DataTable headers={[t("common.client"), t("common.email"), t("common.phone"), t("clientes.visits"), t("clientes.lastVisit")]}>
            {lista.map((c) => (
              <tr key={c.id}>
                <td><PersonRow name={c.nombre} photo={c.foto} bold /></td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td><b>{c.visitas}</b></td>
                <td>{c.ultima}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

    </>
  );
}
