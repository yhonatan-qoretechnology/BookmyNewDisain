"use client";
/* ============================================================
   Gastos — módulo de gastos (View)
   Columnas: Gasto · Categoría · Fecha · Tickete · Total · Acciones
   - Tickete: clic abre el popup con la imagen adjunta
   - Botón "Agregar gasto" abre el formulario ancho con adjunto
   - "Nueva categoría" crea categorías propias sin salir de la vista
============================================================ */
import { useMemo, useState } from "react";
import { fmtFechaLarga, fmtMoneda } from "@/constants";
import {
  CategoriasGastoController,
  Gasto,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, FilterSelect, FilterDate, FilterGroup, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import StatCard, { StatGrid } from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import TicketModal, { descargarTicket } from "@/components/facturacion/TicketModal";
import GastoFormModal from "@/components/facturacion/GastoFormModal";
import CategoriaFormModal from "@/components/facturacion/CategoriaFormModal";
import styles from "@/components/facturacion/facturacion.module.css";

export default function GastosPage() {
  const { t } = useI18n();
  const { toast, confirm } = useUi();

  const [fGasto, setFGasto] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fFecha, setFFecha] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [catVersion, setCatVersion] = useState(0);

  const [ticketDe, setTicketDe] = useState<Gasto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const { data: lista, reload } = useData(
    () => GastosController.search({ gasto: fGasto, categoria: fCategoria, fecha: fFecha }),
    [fGasto, fCategoria, fFecha, refresh],
    []
  );

  /* Base + propias del usuario */
  const categorias = useMemo(() => CategoriasGastoController.list(), [catVersion]);
  const resumen = useMemo(() => GastosController.resumen(lista), [lista]);

  const opcionesCategoria = [
    { value: "", label: t("gastos.todasCategorias") },
    ...categorias.map((c) => ({ value: c, label: c })),
  ];

  const eliminar = (g: Gasto) => {
    confirm({
      title: t("gastos.eliminarTitulo"),
      message: t("gastos.eliminarMsg", { nombre: g.gasto }),
      confirmLabel: t("common.delete"),
      onConfirm: async () => {
        await GastosController.remove(g.id);
        await reload();
        toast(t("gastos.eliminado"), "success");
      },
    });
  };

  return (
    <>
      <StatGrid>
        <StatCard
          color="coral" icon={<Icon name="wallet" />}
          label={t("gastos.statTotal")} value={fmtMoneda(resumen.total, "EUR")}
          footer={t("gastos.delPeriodo")}
        />
        <StatCard
          color="navy" icon={<Icon name="receipt" />}
          label={t("gastos.statRegistros")} value={resumen.registros}
          footer={t("gastos.delPeriodo")}
        />
        <StatCard
          color="blue" icon={<Icon name="barChart" />}
          label={t("gastos.statPromedio")} value={fmtMoneda(resumen.promedio, "EUR")}
          footer={t("gastos.delPeriodo")}
        />
        <StatCard
          color="purple" icon={<Icon name="tag" />}
          label={t("gastos.statCategorias")} value={resumen.categorias}
          footer={t("gastos.delPeriodo")}
        />
      </StatGrid>

      <Panel>
        <PanelHead title={t("gastos.panelTitle")} sub={t("gastos.panelSub")} />

        <Toolbar>
          <FilterGroup>
            <SearchBox value={fGasto} onChange={setFGasto} placeholder={t("gastos.filterGasto")} compact />
            <FilterSelect
              value={fCategoria}
              onChange={setFCategoria}
              options={opcionesCategoria}
              label={t("gastos.categoria")}
              icon="tag"
            />
            <FilterDate value={fFecha} onChange={setFFecha} label={t("common.date")} />
          </FilterGroup>

          <ToolbarActions>
            <Button variant="ghost" onClick={() => setCatOpen(true)}>
              <Icon name="tag" /> {t("gastos.nuevaCategoria")}
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Icon name="plus" /> {t("gastos.agregar")}
            </Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="receipt" title={t("gastos.emptyTitle")} message={t("gastos.emptyMsg")} />
        ) : (
          <DataTable
            headers={[
              t("gastos.gasto"),
              t("gastos.categoria"),
              t("common.date"),
              t("gastos.tickete"),
              t("gastos.total"),
              t("common.actions"),
            ]}
          >
            {lista.map((g) => (
              <tr key={g.id}>
                <td><b>{g.gasto}</b></td>
                <td><Badge kind="activo">{g.categoria}</Badge></td>
                <td>{fmtFechaLarga(g.fecha)}</td>
                <td>
                  {g.ticket ? (
                    <button
                      type="button"
                      className={styles.ticketThumb}
                      onClick={() => setTicketDe(g)}
                      title={t("gastos.verTickete")}
                      aria-label={`${t("gastos.verTickete")}: ${g.gasto}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.ticket} alt={`${t("gastos.tickete")} — ${g.gasto}`} />
                    </button>
                  ) : (
                    <span className={styles.sinTicket} title={t("gastos.sinTickete")}>
                      <Icon name="image" />
                    </span>
                  )}
                </td>
                <td><b>{fmtMoneda(g.total, "EUR")}</b></td>
                <td>
                  <div className={styles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => setTicketDe(g)}>
                      {t("common.view")}
                    </Button>
                    <IconButton
                      onClick={() => descargarTicket(g)}
                      disabled={!g.ticket}
                      title={t("common.download")}
                      aria-label={`${t("common.download")}: ${g.gasto}`}
                    >
                      <Icon name="download" />
                    </IconButton>
                    <IconButton
                      danger
                      onClick={() => eliminar(g)}
                      title={t("gastos.eliminar")}
                      aria-label={`${t("gastos.eliminar")}: ${g.gasto}`}
                    >
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Popup imagen del tickete (ver + descargar) */}
      <TicketModal gasto={ticketDe} onClose={() => setTicketDe(null)} />

      {/* Formulario ancho con adjunto de imagen */}
      <GastoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => setRefresh((n) => n + 1)}
      />

      {/* Alta de categorías propias desde la propia vista */}
      <CategoriaFormModal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onCreated={() => { setCatVersion((v) => v + 1); setCatOpen(false); }}
      />
    </>
  );
}
