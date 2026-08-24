"use client";
/* ============================================================
   CategoriaFormModal — crear categorías de gasto propias
   Muestra las predeterminadas y las del usuario (eliminables
   si ningún gasto las está usando).
============================================================ */
import { useState } from "react";
import {
  CategoriaGasto,
  CategoriasGastoController,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import styles from "./facturacion.module.css";

function Contenido({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  /** Devuelve la categoría creada para seleccionarla al vuelo */
  onCreated: (categoria: CategoriaGasto) => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  /* Base + propias del API; `reload()` la refresca tras crear o borrar.
     El contenido solo se monta cuando el modal está abierto, así que la
     consulta ya no necesita el flag `open` que tenía antes. */
  const { data: categorias, reload } = useData(
    () => CategoriasGastoController.list(),
    [], []
  );
  const base = categorias.filter((c) => c.esBase);
  const propias = categorias.filter((c) => !c.esBase);


  const crear = async () => {
    const limpio = nombre.trim();
    if (!limpio) return setError(t("gastos.categoriaVacia"));

    setCreando(true);
    try {
      const creada = await CategoriasGastoController.create(limpio);
      toast(t("gastos.categoriaCreada", { nombre: creada.nombre }), "success");
      setNombre("");
      setError("");
      await reload();
      onCreated(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("gastos.categoriaDuplicada"));
    } finally {
      setCreando(false);
    }
  };

  const eliminar = async (categoria: CategoriaGasto) => {
    if (await GastosController.usaCategoria(session, categoria.id)) {
      toast(t("gastos.categoriaEnUso"), "error");
      return;
    }
    try {
      await CategoriasGastoController.remove(categoria.id);
      await reload();
      toast(t("gastos.categoriaEliminada"), "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("gastos.categoriaEnUso"), "error");
    }
  };

  return (
    <Modal
      title={t("gastos.nuevaCategoria")}
      subtitle={t("gastos.nuevaCategoriaSub")}
      onClose={onClose}
      size="sm"
      closeLabel={t("common.close")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={crear} disabled={creando}>
            <Icon name="plus" /> {t("gastos.categoriaCrear")}
          </Button>
        </>
      }
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="cat-nombre">
          {t("gastos.categoriaNombre")}
        </label>
        <input
          id="cat-nombre"
          className={styles.input}
          value={nombre}
          autoFocus
          maxLength={40}
          placeholder={t("gastos.categoriaPlaceholder")}
          onChange={(e) => { setNombre(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") crear(); }}
        />
      </div>

      {error && (
        <p className={styles.error}>
          <Icon name="circle-x" /> {error}
        </p>
      )}

      <div className={styles.catSection}>
        <p className={styles.catSectionTitle}>{t("gastos.categoriaPropias")}</p>
        <div className={styles.chipRow}>
          {propias.length === 0 ? (
            <span className={styles.chipEmpty}>{t("gastos.categoriaSinPropias")}</span>
          ) : (
            propias.map((c) => (
              <span key={c.id} className={styles.chip}>
                {c.nombre}
                <button
                  type="button"
                  className={styles.chipDel}
                  onClick={() => eliminar(c)}
                  aria-label={`${t("gastos.categoriaEliminar")}: ${c.nombre}`}
                  title={t("gastos.categoriaEliminar")}
                >
                  <Icon name="x" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      <div className={styles.catSection}>
        <p className={styles.catSectionTitle}>{t("gastos.categoriaBase")}</p>
        <div className={styles.chipRow}>
          {base.map((c) => (
            <span key={c.id} className={`${styles.chip} ${styles.chipBase}`}>{c.nombre}</span>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* El AnimatePresence va aquí: mantiene el modal en el árbol el tiempo
   justo para animar su salida. */
export default function CategoriaFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (categoria: CategoriaGasto) => void;
}) {
  return (
    <AnimatePresence>
      {open && <Contenido onClose={onClose} onCreated={onCreated} />}
    </AnimatePresence>
  );
}
