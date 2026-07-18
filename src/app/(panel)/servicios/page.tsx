"use client";
/* ============================================================
   Servicios — catálogo con alta y activar/desactivar (View)
============================================================ */
import { useState } from "react";
import { ServiciosController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Button from "@/components/ui/Button";
import Badge, { Tag } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import { CardGrid, SimpleCard, Muted, TagRow } from "@/components/ui/Cards";

export default function ServiciosPage() {
  const { toast, confirm } = useUi();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  /* Categorías reales — GET /categories?language= */
  const { data: categorias } = useData(() => ServiciosController.getCategorias(locale), [locale], []);

  /* En modo API: GET /services?language=<locale> (traducciones) */
  const { data: lista, reload } = useData(() => ServiciosController.search(search, locale), [search, locale], []);

  /** Alta — POST /services (CreateServiceDto con traducción y precio). */
  const agregar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    if (!categoriaId) { toast(t("servicios.categoryRequired"), "error"); return; }
    try {
      await ServiciosController.create({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        categoryId: Number(categoriaId),
        duracion: Number(duracion) || 30,
        precio: Number(precio) || 0,
        language: locale,
      });
      setModalOpen(false); setNombre(""); setDescripcion(""); setCategoriaId(""); setDuracion(""); setPrecio("");
      await reload();
      toast(t("servicios.created"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    }
  };

  /** Baja — DELETE /services/:id (borra traducciones y precios). */
  const eliminar = (id: number, nombreSv: string) => {
    confirm({
      title: t("servicios.deleteTitle"),
      message: t("servicios.deleteMsg", { nombre: nombreSv }),
      confirmLabel: t("common.delete"),
      onConfirm: () => {
        void ServiciosController.remove(id).then(reload);
        toast(t("servicios.deleted"), "success");
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("servicios.panelTitle")} sub={t("servicios.countSub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("servicios.searchPlaceholder")} />
          <ToolbarActions>
            <Button onClick={() => setModalOpen(true)}>{t("servicios.new")}</Button>
          </ToolbarActions>
        </Toolbar>

        {lista.length === 0 ? (
          <EmptyState icon="list" title={t("servicios.emptyTitle")} message={t("servicios.emptyMsg")} />
        ) : (
          <CardGrid>
            {lista.map((s) => (
              <SimpleCard key={s.id}>
                <h3>{s.nombre}</h3>
                <TagRow>
                  <Tag>{s.categoria}</Tag>
                  <Tag>{t("servicios.minutes", { n: s.duracion })}</Tag>
                </TagRow>
                <Muted>{t("servicios.listPrice")} <b>{s.precio.toFixed(2)}€</b></Muted>
                <Button variant="danger" size="sm" onClick={() => eliminar(s.id, s.nombre)}>
                  {t("common.delete")}
                </Button>
              </SimpleCard>
            ))}
          </CardGrid>
        )}
      </Panel>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <ModalTitle>{t("servicios.modalTitle")}</ModalTitle>
        <Field label={t("common.name")} htmlFor="ns-nombre">
          <input id="ns-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={t("servicios.namePlaceholder")} />
        </Field>
        <Field label={t("common.category")} htmlFor="ns-cat">
          <select id="ns-cat" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">{t("reservas.selectPlaceholder")}</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
        <Field label={t("servicios.description")} htmlFor="ns-desc">
          <input id="ns-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={t("servicios.descriptionPlaceholder")} />
        </Field>
        <Field label={t("servicios.duration")} htmlFor="ns-dur">
          <input id="ns-dur" type="number" min="5" step="5" value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="45" />
        </Field>
        <Field label={t("common.priceEur")} htmlFor="ns-precio">
          <input id="ns-precio" type="number" min="0" step="0.5" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="27.00" />
        </Field>
        <ModalActions>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => void agregar()}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
