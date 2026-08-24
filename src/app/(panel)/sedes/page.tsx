"use client";
/* ============================================================
   Sedes — locales de la marca (View, solo superadmin)
============================================================ */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SedesController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { sedeEditarPath } from "@/constants";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Badge, { Tag } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";
import ImageGallery from "@/components/ui/ImageGallery";
import Icon from "@/components/ui/Icon";
import ServiciosSedeModal from "@/components/sedes/ServiciosSedeModal";

export default function SedesPage() {
  const router = useRouter();
  const { toast } = useUi();
  const { t } = useI18n();
  const { session } = useSession();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  /* Sede cuyo catálogo de servicios se está editando */
  const [serviciosDe, setServiciosDe] = useState<{ id: number; nombre: string } | null>(null);

  /* MODO API: GET /sedes/empresa/:empresaId (multi-tenant) */
  const { data: lista, reload } = useData(
    () => SedesController.search(search, session?.negocioId || ""),
    [search, session?.negocioId], []
  );

  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    await SedesController.add({
      nombre: nombre.trim(),
      direccion: direccion.trim() || "—",
      negocioId: session?.negocioId || "",
    });
    setModalOpen(false); setNombre(""); setDireccion("");
    await reload();
    toast(t("sedes.created"), "success");
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("sedes.panelTitle", { negocio: session?.negocioName || "—" })} sub={t("sedes.panelSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("sedes.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={() => setModalOpen(true)}>{t("sedes.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="building" title={t("sedes.emptyTitle")} message={t("sedes.emptyMsg")} />
        ) : (
          <CardGrid>
            {lista.map((s) => (
              <SimpleCard key={s.id}>
                <h3>{s.nombre}</h3>
                <Muted>{s.direccion}</Muted>
                <TagRow>
                  <Tag>{t("sedes.team", { n: s.equipo })}</Tag>
                  <Badge kind={s.activa ? "activo" : "inactivo"}>{s.activa ? t("sedes.open") : t("sedes.closed")}</Badge>
                </TagRow>
                {/* Estas imágenes son las que se ven al elegir sede en una reserva */}
                <ImageGallery
                  label={t("imagen.imagenSede")}
                  imagenes={s.imagenes}
                  onAdd={(file) => SedesController.subirImagen(s.id, file)}
                  onRemove={(ruta) => SedesController.borrarImagen(s.id, ruta)}
                />
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(sedeEditarPath(s.id))}
                  >
                    <Icon name="edit" /> {t("common.edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setServiciosDe({ id: s.id, nombre: s.nombre })}
                  >
                    <Icon name="tag" /> {t("serviciosSede.abrir")}
                  </Button>
                </div>
              </SimpleCard>
            ))}
          </CardGrid>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalTitle>{t("sedes.modalTitle")}</ModalTitle>
        <Field label={t("common.name")} htmlFor="nsd-nombre">
          <input id="nsd-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("sedes.namePlaceholder")} />
        </Field>
        <Field label={t("sedes.address")} htmlFor="nsd-dir">
          <input id="nsd-dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder={t("sedes.addressPlaceholder")} />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={agregar}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>

      {/* Qué servicios presta cada profesional de la sede */}
      <ServiciosSedeModal
        sedeId={serviciosDe?.id ?? null}
        sedeNombre={serviciosDe?.nombre ?? ""}
        onClose={() => setServiciosDe(null)}
      />
    </>
  );
}
