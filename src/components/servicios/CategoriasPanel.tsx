"use client";
/* ============================================================
   CategoriasPanel — catálogo global de categorías (superadmin)
   Tabla con nombre y descripción en español e inglés, imagen,
   alta, edición y borrado. «Traducir» rellena el otro idioma con
   una traducción automática que se puede corregir antes de guardar.
============================================================ */
import { useMemo, useState } from "react";
import { fotoUrl } from "@/constants";
import { CategoriasController, type CategoriaGlobal, type CategoriaInput } from "@/controllers/CategoriasController";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Toolbar, { SearchBox, ToolbarActions } from "@/components/ui/Toolbar";
import DataTable from "@/components/ui/DataTable";
import Button, { IconButton } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import Modal, { ModalTitle, ModalText, ModalActions, Field } from "@/components/ui/Modal";
import styles from "./CategoriasPanel.module.css";

const VACIA: CategoriaInput = { nombreEs: "", descripcionEs: "", nombreEn: "", descripcionEn: "" };
const MAX_IMAGEN = 5 * 1024 * 1024;

export default function CategoriasPanel({ onCambios }: { onCambios?: () => void }) {
  const { t } = useI18n();
  const { toast, confirm } = useUi();
  const [search, setSearch] = useState("");

  const { data: categorias, loading, error, reload } = useData(
    () => CategoriasController.listar(), [], [] as CategoriaGlobal[]
  );

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categorias;
    return categorias.filter((c) =>
      [c.nombreEs, c.nombreEn, c.descripcionEs, c.descripcionEn].join(" ").toLowerCase().includes(q)
    );
  }, [categorias, search]);

  /* ── Alta / edición ─────────────────────────────────────── */
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<CategoriaGlobal | null>(null);
  const [form, setForm] = useState<CategoriaInput>(VACIA);
  const [imagen, setImagen] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [traduciendo, setTraduciendo] = useState<"es" | "en" | null>(null);

  const set = (k: keyof CategoriaInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const abrirNueva = () => { setEditando(null); setForm(VACIA); setImagen(null); setAbierto(true); };
  const abrirEdicion = (c: CategoriaGlobal) => {
    setEditando(c);
    setForm({ nombreEs: c.nombreEs, descripcionEs: c.descripcionEs, nombreEn: c.nombreEn, descripcionEn: c.descripcionEn });
    setImagen(null);
    setAbierto(true);
  };

  const elegirImagen = (f: File | null) => {
    if (f && !f.type.startsWith("image/")) { toast(t("categorias.imagenTipo"), "error"); return; }
    if (f && f.size > MAX_IMAGEN) { toast(t("categorias.imagenGrande"), "error"); return; }
    setImagen(f);
  };

  /** Rellena el idioma `a` traduciendo desde el otro. */
  const traducir = async (a: "es" | "en") => {
    const de = a === "en" ? "es" : "en";
    const nombre = de === "es" ? form.nombreEs : form.nombreEn;
    const desc = de === "es" ? form.descripcionEs : form.descripcionEn;
    if (!nombre.trim()) { toast(t("categorias.traducirVacio"), "error"); return; }
    setTraduciendo(a);
    const [n, d] = await Promise.all([
      CategoriasController.traducir(nombre, de, a),
      CategoriasController.traducir(desc, de, a),
    ]);
    setTraduciendo(null);
    if (n == null) { toast(t("categorias.traducirError"), "error"); return; }
    setForm((f) => a === "en"
      ? { ...f, nombreEn: n, descripcionEn: d ?? f.descripcionEn }
      : { ...f, nombreEs: n, descripcionEs: d ?? f.descripcionEs });
  };

  const guardar = async () => {
    if (!form.nombreEs.trim()) { toast(t("categorias.nombreEsObligatorio"), "error"); return; }
    setGuardando(true);
    try {
      if (editando) await CategoriasController.actualizar(editando.id, form, imagen);
      else await CategoriasController.crear(form, imagen);
      toast(t(editando ? "categorias.actualizada" : "categorias.creada"), "success");
      setAbierto(false);
      await reload();
      onCambios?.();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (c: CategoriaGlobal) => {
    confirm({
      title: t("categorias.eliminarTitulo"),
      message: t("categorias.eliminarMsg", { nombre: c.nombreEs || c.nombreEn }),
      confirmLabel: t("common.delete"),
      onConfirm: async () => {
        try {
          await CategoriasController.eliminar(c.id);
          toast(t("categorias.eliminada"), "success");
          await reload();
          onCambios?.();
        } catch (e) {
          toast(e instanceof Error ? e.message : t("categorias.eliminarError"), "error");
        }
      },
    });
  };

  return (
    <>
      <Panel>
        <PanelHead title={t("categorias.titulo")} sub={t("categorias.sub", { n: lista.length })} />
        <Toolbar>
          <SearchBox value={search} onChange={setSearch} placeholder={t("categorias.buscar")} />
          <ToolbarActions>
            <Button onClick={abrirNueva}>{t("categorias.nueva")}</Button>
          </ToolbarActions>
        </Toolbar>

        {error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : !loading && lista.length === 0 ? (
          <EmptyState icon="list" title={t("categorias.vacioTitulo")} message={t("categorias.vacioMsg")} />
        ) : (
          <DataTable headers={[
            "", t("categorias.colEs"), t("categorias.colEn"), t("categorias.colDescripcion"), t("common.actions"),
          ]}>
            {lista.map((c) => (
              <tr key={c.id}>
                <td className={styles.celdaImagen}>
                  {c.imagen ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={fotoUrl(c.imagen) || c.imagen} alt="" className={styles.miniatura} />
                  ) : (
                    <span className={styles.sinImagen}><Icon name="image" /></span>
                  )}
                </td>
                <td><b>{c.nombreEs || "—"}</b></td>
                <td>{c.nombreEn || <span className={styles.falta}>{t("categorias.sinTraducir")}</span>}</td>
                <td className={styles.descripcion}>{c.descripcionEs || "—"}</td>
                <td>
                  <div className={styles.acciones}>
                    <IconButton aria-label={t("categorias.editarAria", { nombre: c.nombreEs })} onClick={() => abrirEdicion(c)}>
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton danger aria-label={t("categorias.eliminarAria", { nombre: c.nombreEs })} onClick={() => eliminar(c)}>
                      <Icon name="trash" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Modal open={abierto} onClose={() => { if (!guardando) setAbierto(false); }} maxWidth={640}>
        <ModalTitle>{t(editando ? "categorias.editarTitulo" : "categorias.nuevaTitulo")}</ModalTitle>
        <ModalText>{t("categorias.ayuda")}</ModalText>

        <div className={styles.idiomas}>
          <fieldset className={styles.idioma}>
            <legend>
              {t("categorias.espanol")}
              <button type="button" className={styles.traducir} onClick={() => void traducir("es")} disabled={!!traduciendo}>
                {traduciendo === "es" ? t("categorias.traduciendo") : t("categorias.traducirDesdeEn")}
              </button>
            </legend>
            <Field label={t("categorias.nombre")} htmlFor="cat-nombre-es">
              <input id="cat-nombre-es" value={form.nombreEs} onChange={set("nombreEs")} />
            </Field>
            <Field label={t("categorias.descripcion")} htmlFor="cat-desc-es">
              <textarea id="cat-desc-es" rows={3} value={form.descripcionEs} onChange={set("descripcionEs")} />
            </Field>
          </fieldset>

          <fieldset className={styles.idioma}>
            <legend>
              {t("categorias.ingles")}
              <button type="button" className={styles.traducir} onClick={() => void traducir("en")} disabled={!!traduciendo}>
                {traduciendo === "en" ? t("categorias.traduciendo") : t("categorias.traducirDesdeEs")}
              </button>
            </legend>
            <Field label={t("categorias.nombre")} htmlFor="cat-nombre-en">
              <input id="cat-nombre-en" value={form.nombreEn} onChange={set("nombreEn")} />
            </Field>
            <Field label={t("categorias.descripcion")} htmlFor="cat-desc-en">
              <textarea id="cat-desc-en" rows={3} value={form.descripcionEn} onChange={set("descripcionEn")} />
            </Field>
          </fieldset>
        </div>

        <Field label={t("categorias.imagen")} htmlFor="cat-imagen">
          <input id="cat-imagen" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={(e) => elegirImagen(e.target.files?.[0] ?? null)} />
        </Field>
        {imagen && <p className={styles.nota}>{imagen.name}</p>}

        <ModalActions>
          <Button variant="ghost" onClick={() => setAbierto(false)} disabled={guardando}>{t("common.cancel")}</Button>
          <Button onClick={() => void guardar()} disabled={guardando}>
            {guardando ? t("common.saving") : t("common.save")}
          </Button>
        </ModalActions>
      </Modal>
    </>
  );
}
