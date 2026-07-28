"use client";
/* ============================================================
   Gastos — módulo de gastos (View)
   Columnas: Gasto · Categoría · Fecha · Tickete · Total · Acciones
   - Tickete: click abre popup con la imagen adjunta
   - Acciones: ver (popup) y descargar (imagen del tickete)
   - Botón "Agregar gasto" abre el formulario con adjunto
============================================================ */
import { useState } from "react";
import {
  CATEGORIAS_GASTO,
  CategoriaGasto,
  Gasto,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import TicketModal, { descargarTicket } from "@/components/facturacion/TicketModal";
import GastoFormModal from "@/components/facturacion/GastoFormModal";

export default function GastosPage() {
  const { t } = useI18n();

  const [fGasto, setFGasto] = useState("");
  const [fCategoria, setFCategoria] = useState<CategoriaGasto | "">("");
  const [fFecha, setFFecha] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [ticketDe, setTicketDe] = useState<Gasto | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: lista } = useData(
    () => GastosController.search({ gasto: fGasto, categoria: fCategoria, fecha: fFecha }),
    [fGasto, fCategoria, fFecha, refresh],
    []
  );

  const totalPeriodo = lista.reduce((s, g) => s + g.total, 0);

  return (
    <Panel>
      <PanelHead title={t("gastos.panelTitle")} sub={t("gastos.panelSub")} />

      <Toolbar>
        <SearchBox value={fGasto} onChange={setFGasto} placeholder={t("gastos.filterGasto")} />
        <select
          value={fCategoria}
          onChange={(e) => setFCategoria(e.target.value as CategoriaGasto | "")}
          aria-label={t("gastos.categoria")}
          style={{ padding: "8px 10px", border: "1px solid var(--border,#d9d9d9)", borderRadius: 8, font: "inherit" }}
        >
          <option value="">{t("gastos.todasCategorias")}</option>
          {CATEGORIAS_GASTO.map((c) => (
            <option key={c} value={c}>{c === "Alimentacion" ? "Alimentación" : c}</option>
          ))}
        </select>
        <input
          type="date"
          value={fFecha}
          onChange={(e) => setFFecha(e.target.value)}
          aria-label={t("common.date")}
          style={{ padding: "8px 10px", border: "1px solid var(--border,#d9d9d9)", borderRadius: 8, font: "inherit" }}
        />
        <button className="btn btn-primary" onClick={() => setFormOpen(true)} style={{ marginLeft: "auto" }}>
          + {t("gastos.agregar")}
        </button>
      </Toolbar>

      {lista.length === 0 ? (
        <EmptyState icon="invoice" title={t("gastos.emptyTitle")} message={t("gastos.emptyMsg")} />
      ) : (
        <>
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
                <td><Badge kind="pendiente">{g.categoria === "Alimentacion" ? "Alimentación" : g.categoria}</Badge></td>
                <td>{g.fecha}</td>
                <td>
                  {g.ticket ? (
                    <button
                      onClick={() => setTicketDe(g)}
                      title={t("gastos.verTickete")}
                      style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={g.ticket}
                        alt={`Tickete de ${g.gasto}`}
                        style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border,#e3e3e3)" }}
                      />
                    </button>
                  ) : (
                    <span style={{ color: "var(--muted,#999)" }}>—</span>
                  )}
                </td>
                <PriceCell value={g.total} />
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => setTicketDe(g)}>
                      {t("common.view")}
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => descargarTicket(g)}
                      disabled={!g.ticket}
                    >
                      {t("common.download")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 6px", fontWeight: 700 }}>
            {t("gastos.totalPeriodo")}:&nbsp;
            {totalPeriodo.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
          </div>
        </>
      )}

      {/* Popup imagen del tickete (ver + descargar) */}
      <TicketModal gasto={ticketDe} onClose={() => setTicketDe(null)} />

      {/* Formulario "Agregar nuevo" con adjunto de imagen */}
      <GastoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => setRefresh((n) => n + 1)}
      />
    </Panel>
  );
}
