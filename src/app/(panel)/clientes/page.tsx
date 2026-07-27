"use client";
/* ============================================================
   Clientes — listado, edición y reservas activas (View)
============================================================ */
import { useState } from "react";
import type { Cliente } from "@/models";
import { ClientesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { useReservaPopup } from "@/components/reservas/ReservaPopupContext";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox } from "@/components/ui/Toolbar";
import DataTable, { PriceCell } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { Field, ModalActions, ModalTitle } from "@/components/ui/Modal";
import { PersonRow } from "@/components/ui/People";
import { fmtFechaCorta } from "@/constants";
import styles from "./clientes.module.css";

export default function ClientesPage() {
  const { session } = useSession();
  const { toast } = useUi();
  const { t, locale } = useI18n();
  const popup = useReservaPopup();

  const [search, setSearch] = useState("");
  const { data: lista, reload } = useData(() => ClientesController.search(search), [search], []);

  /* ── Edición de datos básicos (nombre, teléfono) ─────────── */
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirEdicion = (c: Cliente) => {
    setEditando(c);
    setNombre(c.nombre);
    setTelefono(c.telefono === "—" ? "" : c.telefono);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    setGuardando(true);
    try {
      await ClientesController.update(editando.id, { nombre, telefono });
      setEditando(null);
      await reload();
      toast(t("clientes.updated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  /* ── Reservas activas del cliente ────────────────────────── */
  const [verReservasDe, setVerReservasDe] = useState<Cliente | null>(null);
  const { data: reservasActivas, loading: cargandoReservas } = useData(
    () => (verReservasDe ? ClientesController.getReservasActivas(verReservasDe.id, session, locale) : Promise.resolve([])),
    [verReservasDe?.id, session?.negocioId, session?.sedeId, locale],
    []
  );

  return (
    <>
      <Panel>
        <PanelHead title={t("clientes.panelTitle")} sub={t("common.results", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("clientes.searchPlaceholder")} />
          {/* Los clientes finales se registran desde la app de
              clientes (POST /auth/register); aquí solo consulta y edita. */}
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="user" title={t("clientes.emptyTitle")} message={t("clientes.emptyMsg")} />
        ) : (
          <DataTable headers={[t("common.client"), t("common.email"), t("common.phone"), t("clientes.visits"), t("clientes.lastVisit"), t("common.state"), t("common.actions")]}>
            {lista.map((c) => (
              <tr key={c.id}>
                <td><PersonRow name={c.nombre} bold /></td>
                <td>{c.correo}</td>
                <td>{c.telefono}</td>
                <td><b>{c.visitas}</b></td>
                <td>{c.ultima}</td>
                <td><Badge kind={c.activo ? "activo" : "inactivo"}>{c.activo ? t("clientes.active") : t("clientes.inactive")}</Badge></td>
                <td>
                  <div className={styles.rowActions}>
                    <IconButton aria-label={t("clientes.editAria", { nombre: c.nombre })} onClick={() => abrirEdicion(c)}>
                      <Icon name="edit" />
                    </IconButton>
                    <Button size="sm" variant="ghost" onClick={() => setVerReservasDe(c)}>
                      {t("clientes.reservasBtn")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      {/* Editar cliente */}
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <ModalTitle>{t("clientes.editTitle")}</ModalTitle>
        <Field label={t("common.fullName")} htmlFor="cl-nombre">
          <input id="cl-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("clientes.namePlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="cl-tel">
          <input id="cl-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <Field label={t("common.email")} htmlFor="cl-email">
          <input id="cl-email" value={editando?.correo || ""} readOnly disabled aria-readonly="true" />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarEdicion()} disabled={guardando}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Reservas activas del cliente */}
      <Modal open={!!verReservasDe} onClose={() => setVerReservasDe(null)} maxWidth={640}>
        <ModalTitle>{t("clientes.reservasTitle", { nombre: verReservasDe?.nombre || "" })}</ModalTitle>
        <div className={styles.reservasScroll}>
          {cargandoReservas ? (
            <p style={{ padding: "18px 4px", color: "var(--slate-500)", fontSize: 13.5 }}>{t("booking.loading")}</p>
          ) : reservasActivas.length === 0 ? (
            <EmptyState icon="calendar" title={t("clientes.reservasEmptyTitle")} message={t("clientes.reservasEmptyMsg")} />
          ) : (
            <DataTable headers={[t("common.service"), t("common.date"), t("common.time"), t("common.price"), t("common.state")]}>
              {reservasActivas.map((r) => (
                <tr
                  key={r.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => { setVerReservasDe(null); popup.open(r.id); }}
                >
                  <td><b>{r.servicio}</b></td>
                  <td>{fmtFechaCorta(r.fecha)}</td>
                  <td>{r.hora}</td>
                  <PriceCell value={r.precio} />
                  <td><Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge></td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Modal>
    </>
  );
}
