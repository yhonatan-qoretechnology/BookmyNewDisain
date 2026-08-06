"use client";
/* ============================================================
   Clientes — listado y ficha editable (View)
============================================================ */
import { useState } from "react";
import { ClientesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { fmtFechaCorta } from "@/constants";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { PersonRow } from "@/components/ui/People";
import ClienteModal from "@/components/clientes/ClienteModal";
import styles from "./clientes.module.css";

export default function ClientesPage() {
  const { t } = useI18n();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  /* Ficha abierta; null con el modal cerrado */
  const [editando, setEditando] = useState<number | null>(null);

  /* La sesión delimita las citas con las que se calculan las visitas */
  const { data: lista, reload } = useData(
    () => ClientesController.search(search, session),
    [search, session?.id, session?.sedeId, session?.negocioId],
    []
  );

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
          <DataTable
            headers={[
              t("common.client"),
              t("common.email"),
              t("common.phone"),
              t("clientes.state"),
              t("clientes.visits"),
              t("clientes.lastVisit"),
              "",
            ]}
          >
            {lista.map((c) => (
              <tr key={c.id}>
                <td><PersonRow name={c.nombre} photo={c.foto} bold /></td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td>
                  <Badge kind={c.estado === "enabled" ? "activo" : "inactivo"}>
                    {t(`clientes.states.${c.estado}`)}
                  </Badge>
                </td>
                <td><b>{c.visitas}</b></td>
                <td>{c.ultima === "—" ? "—" : fmtFechaCorta(c.ultima)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <IconButton
                      aria-label={t("clientes.editAria", { nombre: c.nombre })}
                      onClick={() => setEditando(c.id)}
                    >
                      <Icon name="edit" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Editar datos, fijar contraseña y dar de baja la cuenta */}
      <ClienteModal
        clienteId={editando}
        onClose={() => setEditando(null)}
        onGuardado={reload}
      />
    </>
  );
}
