"use client";
/* ============================================================
   SedeProfesionalesModal — profesionales de UNA sede
   ------------------------------------------------------------
   Se abre desde "Ver profesionales" en el drill-down de Empresas
   → Sedes. Permite editar los datos del profesional y, desde ahí,
   abrir ServiciosSedeModal ya con ese profesional preseleccionado
   para ver/activar los servicios que presta.
============================================================ */
import { useState } from "react";
import type { Empleado } from "@/models";
import { PersonalController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { PersonRow } from "@/components/ui/People";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import EmptyState from "@/components/ui/EmptyState";
import ServiciosSedeModal from "@/components/sedes/ServiciosSedeModal";

export default function SedeProfesionalesModal({
  sedeId,
  sedeNombre,
  onClose,
}: {
  sedeId: number | null;
  sedeNombre: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const abierto = sedeId != null;

  const { data: lista, reload } = useData(
    () => (sedeId != null ? PersonalController.searchPorSede(sedeId, sedeNombre) : Promise.resolve([])),
    [sedeId, sedeNombre],
    [] as Empleado[]
  );

  /* ── Edición ─────────────────────────────────────────────── */
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [eNombre, setENombre] = useState("");
  const [eRol, setERol] = useState("");
  const [eTelefono, setETelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirEdicion = (p: Empleado) => {
    setEditando(p);
    setENombre(p.nombre);
    setERol(p.rol);
    setETelefono(p.telefono);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    if (!eNombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    setGuardando(true);
    try {
      await PersonalController.update(editando.id, {
        nombre: eNombre, rol: eRol, telefono: eTelefono, sedeId: editando.sedeId,
      });
      setEditando(null);
      await reload();
      toast(t("personal.updated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  /* ── Servicios del profesional (reutiliza ServiciosSedeModal) ── */
  const [servicioDe, setServicioDe] = useState<number | null>(null);

  if (!abierto) return null;

  return (
    <>
      <Modal open onClose={onClose} maxWidth={720} contentScroll>
        <ModalTitle>{t("sedeProfesionales.title", { sede: sedeNombre })}</ModalTitle>
        <p style={{ margin: "4px 0 16px", color: "var(--slate-500)", fontSize: 13.5 }}>
          {t("sedeProfesionales.sub")}
        </p>

        {lista.length === 0 ? (
          <EmptyState icon="team" title={t("sedeProfesionales.emptyTitle")} message={t("sedeProfesionales.emptyMsg")} />
        ) : (
          <CardGrid>
            {lista.map((p) => (
              <SimpleCard key={p.id}>
                <PersonRow name={p.nombre} photo={p.foto} bold />
                <Muted>{p.rol}</Muted>
                {p.telefono && <Muted>{p.telefono}</Muted>}
                <TagRow>
                  <Badge kind={p.activo ? "activo" : "inactivo"}>
                    {p.activo ? t("personal.activeF") : t("personal.inactiveF")}
                  </Badge>
                </TagRow>
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <Button size="sm" variant="ghost" onClick={() => abrirEdicion(p)}>
                    <Icon name="edit" /> {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setServicioDe(p.id)}>
                    <Icon name="tag" /> {t("sedeProfesionales.services")}
                  </Button>
                </div>
              </SimpleCard>
            ))}
          </CardGrid>
        )}

        <ModalActions>
          <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
        </ModalActions>
      </Modal>

      {/* Edición de profesional */}
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <ModalTitle>{t("personal.editTitle")}</ModalTitle>
        <Field label={t("common.fullName")} htmlFor="sp-nombre">
          <input id="sp-nombre" value={eNombre} onChange={(e) => setENombre(e.target.value)} />
        </Field>
        <Field label={t("personal.role")} htmlFor="sp-rol">
          <input id="sp-rol" value={eRol} onChange={(e) => setERol(e.target.value)} placeholder={t("personal.rolePlaceholder")} />
        </Field>
        <Field label={t("common.phone")} htmlFor="sp-tel">
          <input id="sp-tel" value={eTelefono} onChange={(e) => setETelefono(e.target.value)} placeholder="+34 600 000 000" />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setEditando(null)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardarEdicion()} disabled={guardando}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Servicios que presta el profesional en esta sede */}
      <ServiciosSedeModal
        sedeId={servicioDe != null ? sedeId : null}
        sedeNombre={sedeNombre}
        profesionalIdInicial={servicioDe}
        onClose={() => setServicioDe(null)}
      />
    </>
  );
}
