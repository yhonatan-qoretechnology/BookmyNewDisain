"use client";
/* ============================================================
   Servicios — catálogo agrupado por categoría (View)
   Cada categoría es una sección desplegable (acordeón) con las
   tarjetas de sus servicios. Al buscar, las categorías con
   coincidencias se abren solas.
============================================================ */
import { useMemo, useState } from "react";
import { ServiciosController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./servicios.module.css";

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

  /* Catálogo agrupado por categoría */
  const grupos = useMemo(() => ServiciosController.agruparPorCategoria(lista), [lista]);

  /* Categorías plegadas por el usuario. Por defecto todas abiertas,
     y al buscar se reabren para no ocultar coincidencias. */
  const [cerradas, setCerradas] = useState<Set<string>>(new Set());
  const toggle = (categoria: string) =>
    setCerradas((prev) => {
      const next = new Set(prev);
      if (next.has(categoria)) next.delete(categoria);
      else next.add(categoria);
      return next;
    });
  const colapsarTodo = () => setCerradas(new Set(grupos.map((g) => g.categoria)));
  const expandirTodo = () => setCerradas(new Set());

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
          <>
            {grupos.length > 1 && (
              <div className={styles.catToolbar}>
                <Button size="sm" variant="ghost" onClick={expandirTodo}>{t("servicios.expandAll")}</Button>
                <Button size="sm" variant="ghost" onClick={colapsarTodo}>{t("servicios.collapseAll")}</Button>
              </div>
            )}

            <div className={styles.accordion}>
              {grupos.map((g) => {
                const abierta = !cerradas.has(g.categoria);
                const panelId = `cat-${g.categoria.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <section key={g.categoria} className={`${styles.catItem} ${abierta ? styles.open : ""}`}>
                    <button
                      type="button"
                      className={styles.catHead}
                      onClick={() => toggle(g.categoria)}
                      aria-expanded={abierta}
                      aria-controls={panelId}
                    >
                      <span className={styles.catNombre}>{g.categoria}</span>
                      <span className={styles.catCount}>
                        {t("servicios.countSub", { n: g.servicios.length })}
                      </span>
                      <span className={styles.catChevron} aria-hidden>
                        <Icon name="chevron" width={17} height={17} strokeWidth={2.2} />
                      </span>
                    </button>

                    {abierta && (
                      <div id={panelId} className={styles.catBody}>
                        <div className={styles.servGrid}>
                          {g.servicios.map((s) => (
                            <article key={s.id} className={styles.servCard}>
                              <h3 className={styles.servNombre}>{s.nombre}</h3>
                              {s.descripcion && <p className={styles.servDesc}>{s.descripcion}</p>}
                              <div className={styles.servMeta}>
                                <span className={styles.servDur}>
                                  <Icon name="clock" width={13} height={13} />
                                  {t("servicios.minutes", { n: s.duracion })}
                                </span>
                                <span className={styles.servPrecio}>{s.precio.toFixed(2)}€</span>
                              </div>
                              <div className={styles.servFoot}>
                                <Button variant="danger" size="sm" block onClick={() => eliminar(s.id, s.nombre)}>
                                  {t("common.delete")}
                                </Button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
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
