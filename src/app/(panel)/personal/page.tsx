"use client";
/* ============================================================
   Personal — equipo con alta y baja (View)
============================================================ */
import { useState } from "react";
import { PersonalController } from "@/controllers/CrudControllers";
import { NegociosController } from "@/controllers/NegociosController";
import { ProfesionalesApi } from "@/api/modules";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { PersonRow } from "@/components/ui/People";

export default function PersonalPage() {
  const { toast, confirm } = useUi();
  const { t } = useI18n();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [sede, setSede] = useState("");
  const [telefono, setTelefono] = useState("");

  /* MODO API: GET /profesionales */
  const { data: lista, reload } = useData(() => PersonalController.search(search), [search], []);
  const { data: sedesOpc } = useData(() => NegociosController.getSedesForSession(session), [session?.negocioId], []);

  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    try {
      /* POST /profesionales — el DTO exige phone único y sedeId */
      if (!telefono.trim() || !sede) { toast(t("personal.fillApi"), "error"); return; }
      await ProfesionalesApi.create({
        nombre: nombre.trim(),
        phone: telefono.trim(),
        sedeId: Number(sede),
        biografia: rol.trim() || undefined,
      });
      setModalOpen(false); setNombre(""); setRol(""); setSede(""); setTelefono("");
      await reload();
      toast(t("personal.added"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const eliminar = (id: number, nombre: string) => {
    confirm({
      title: t("personal.deleteTitle"),
      message: t("personal.deleteMsg", { nombre }),
      confirmLabel: t("common.delete"),
      onConfirm: () => {
        void PersonalController.remove(id).then(reload);
        toast(t("personal.deleted"), "success");
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("personal.panelTitle", { negocio: session?.negocioName || "—" })} sub={t("personal.countSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("personal.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={() => setModalOpen(true)}>{t("personal.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="team" title={t("personal.emptyTitle")} message={t("personal.emptyMsg")} />
        ) : (
          <DataTable headers={[t("common.name"), t("personal.role"), t("common.branch"), t("personal.monthBookings"), t("common.state"), ""]}>
            {lista.map((p) => (
              <tr key={p.id}>
                <td><PersonRow name={p.nombre} bold /></td>
                <td>{p.rol}</td>
                <td>{p.sede}</td>
                <td><b>{p.reservas}</b></td>
                <td><Badge kind={p.activo ? "activo" : "inactivo"}>{p.activo ? t("personal.activeF") : t("personal.inactiveF")}</Badge></td>
                <td>
                  <IconButton danger aria-label={t("personal.deleteAria", { nombre: p.nombre })} onClick={() => eliminar(p.id, p.nombre)}>
                    <Icon name="trash" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalTitle>{t("personal.modalTitle")}</ModalTitle>
        <Field label={t("common.fullName")} htmlFor="np-nombre">
          <input id="np-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("clientes.namePlaceholder")} />
        </Field>
        <Field label={t("personal.role")} htmlFor="np-rol">
          <input id="np-rol" value={rol} onChange={(e) => setRol(e.target.value)} placeholder={t("personal.rolePlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="np-tel">
          <input id="np-tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <Field label={t("common.branch")} htmlFor="np-sede">
          <select id="np-sede" value={sede} onChange={(e) => setSede(e.target.value)}>
            <option value="">{t("reservas.selectPlaceholder")}</option>
            {sedesOpc.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => void agregar()}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
