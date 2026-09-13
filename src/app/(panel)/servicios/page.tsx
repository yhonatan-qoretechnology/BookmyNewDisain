"use client";
/* ============================================================
   Servicios — catálogo agrupado por categoría (View)
   Cada categoría es una sección desplegable (acordeón) con las
   tarjetas de sus servicios. Al buscar, las categorías con
   coincidencias se abren solas.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import type { Servicio } from "@/models";
import { ServiciosController } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import { fotoUrl } from "@/constants";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalActions, Field } from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";
import ImageGallery from "@/components/ui/ImageGallery";
import galleryStyles from "@/components/ui/ImageGallery.module.css";
import styles from "./servicios.module.css";

/**
 * Imágenes elegidas ANTES de que el servicio exista todavía (alta).
 * No sube nada: guarda los File en memoria y los manda recién al crear
 * (ServiciosController.create los envía como multipart). Usa las mismas
 * clases que ImageGallery para verse igual que la galería de edición.
 */
function ImagenesNuevas({
  archivos,
  onChange,
}: {
  archivos: File[];
  onChange: (files: File[]) => void;
}) {
  const { t } = useI18n();
  /* Un blob URL por archivo, memoizado: si no se recalcula así, cada
     tecleo en el resto del modal (que re-renderiza este hijo con el
     mismo array) generaría URLs nuevas sin liberar las anteriores. */
  const urls = useMemo(() => archivos.map((f) => URL.createObjectURL(f)), [archivos]);
  useEffect(() => () => { urls.forEach((u) => URL.revokeObjectURL(u)); }, [urls]);

  return (
    <div className={galleryStyles.wrap}>
      <span className={galleryStyles.label}>{t("servicios.imagesLabel")}</span>
      <div className={galleryStyles.grid}>
        {archivos.map((file, i) => (
          <figure key={`${file.name}-${i}`} className={galleryStyles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[i]} alt="" />
            <button
              type="button"
              className={galleryStyles.quitar}
              onClick={() => onChange(archivos.filter((_, idx) => idx !== i))}
              title={t("common.delete")}
              aria-label={`${t("common.delete")}: ${file.name}`}
            >
              <Icon name="x" />
            </button>
          </figure>
        ))}
        <ImageUpload
          key={archivos.length}
          variant="card"
          value={null}
          hint={t("imagen.hint")}
          onUpload={(file) => { onChange([...archivos, file]); return Promise.resolve(null); }}
        />
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  const { toast, confirm } = useUi();
  const { t, locale } = useI18n();
  const { session } = useSession();
  /* Crear/editar/eliminar servicios: solo admin de empresa (owner) y
     superadmin — el resto (admin de sede, employee) solo puede ver el
     catálogo. El backend ya lo exige igual vía guard; esto es para no
     mostrar acciones que van a terminar en 403. */
  const puedeGestionar = session?.role === "owner" || session?.role === "superadmin";
  /* Eliminar es exclusivo del superadmin (el backend lo exige en DELETE). */
  const puedeEliminar = session?.role === "superadmin";
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  /** Servicio que se está editando; null = el modal está en modo alta. */
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [duracion, setDuracion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);

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

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    setNombre(""); setDescripcion(""); setCategoriaId(""); setDuracion(""); setPrecio("");
    setImagenesNuevas([]);
  };

  const abrirNuevo = () => { cerrarModal(); setModalOpen(true); };

  /** Precarga el modal con los datos del servicio elegido. */
  const abrirEditar = (s: Servicio) => {
    setEditando(s);
    setNombre(s.nombre);
    setDescripcion(s.descripcion);
    setCategoriaId(s.categoryId != null ? String(s.categoryId) : "");
    setDuracion(String(s.duracion));
    setPrecio(String(s.precio));
    setImagenesNuevas([]);
    setModalOpen(true);
  };

  /** Alta o edición — POST /services o PUT /services/:id según corresponda. */
  const guardar = async () => {
    if (!nombre.trim()) { toast(t("common.requiredName"), "error"); return; }
    if (!categoriaId) { toast(t("servicios.categoryRequired"), "error"); return; }
    setGuardando(true);
    try {
      if (editando) {
        await ServiciosController.update(editando.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          categoryId: Number(categoriaId),
          duracion: Number(duracion) || 30,
          precio: Number(precio) || 0,
          language: locale,
        });
        toast(t("servicios.updated"), "success");
      } else {
        await ServiciosController.create({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          categoryId: Number(categoriaId),
          duracion: Number(duracion) || 30,
          precio: Number(precio) || 0,
          language: locale,
          imagenes: imagenesNuevas,
        });
        toast(t("servicios.created"), "success");
      }
      cerrarModal();
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setGuardando(false);
    }
  };

  /** Baja — DELETE /services/:id (borra traducciones, precios e imágenes). */
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
            {puedeGestionar && (
              <Button onClick={abrirNuevo}>{t("servicios.new")}</Button>
            )}
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
                              {s.imagenes.length > 0 && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  className={styles.servFoto}
                                  src={fotoUrl(s.imagenes[0]) ?? ""}
                                  alt=""
                                  loading="lazy"
                                />
                              )}
                              <h3 className={styles.servNombre}>{s.nombre}</h3>
                              {s.descripcion && <p className={styles.servDesc}>{s.descripcion}</p>}
                              <div className={styles.servMeta}>
                                <span className={styles.servDur}>
                                  <Icon name="clock" width={13} height={13} />
                                  {t("servicios.minutes", { n: s.duracion })}
                                </span>
                                <span className={styles.servPrecio}>{s.precio.toFixed(2)}€</span>
                              </div>
                              {puedeGestionar && (
                                <div className={styles.servFoot}>
                                  <Button variant="ghost" size="sm" block onClick={() => abrirEditar(s)}>
                                    {t("common.edit")}
                                  </Button>
                                  {puedeEliminar && (
                                    <Button variant="danger" size="sm" block onClick={() => eliminar(s.id, s.nombre)}>
                                      {t("common.delete")}
                                    </Button>
                                  )}
                                </div>
                              )}
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

      <Modal open={modalOpen} onClose={cerrarModal}>
        <ModalTitle>{editando ? t("servicios.editModalTitle") : t("servicios.modalTitle")}</ModalTitle>
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

        {/* Alta: las imágenes se juntan en memoria y viajan con el POST.
            Edición: el servicio ya existe, así que cada alta/baja de imagen
            pega directo al backend (ImageGallery ya resuelve eso solo). */}
        {editando ? (
          <ImageGallery
            label={t("imagen.imagenServicio")}
            imagenes={editando.imagenes}
            onAdd={(file) => ServiciosController.subirImagen(editando.id, file)}
            onRemove={(ruta) => ServiciosController.borrarImagen(editando.id, ruta)}
          />
        ) : (
          <ImagenesNuevas archivos={imagenesNuevas} onChange={setImagenesNuevas} />
        )}

        <ModalActions>
          <Button variant="ghost" onClick={cerrarModal}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardar()} disabled={guardando}>{t("common.save")}</Button>
        </ModalActions>
      </Modal>
    </>
  );
}
