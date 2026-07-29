"use client";
/* ============================================================
   CategoriaFormModal — crear categorías de gasto propias
   Muestra las predeterminadas y las del usuario (eliminables
   si ningún gasto las está usando).
============================================================ */
import { useMemo, useState } from "react";
import {
  CategoriasGastoController,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "./Modal";
import styles from "./facturacion.module.css";

export default function CategoriaFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Devuelve la categoría creada para seleccionarla al vuelo */
  onCreated: (categoria: string) => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const base = useMemo(() => CategoriasGastoController.list().filter((c) => CategoriasGastoController.esBase(c)), []);
  const propias = useMemo(() => CategoriasGastoController.propias(), [version]);

  if (!open) return null;

  const crear = () => {
    const limpio = nombre.trim();
    if (!limpio) return setError(t("gastos.categoriaVacia"));
    if (CategoriasGastoController.existe(limpio)) return setError(t("gastos.categoriaDuplicada"));

    const creada = CategoriasGastoController.create(limpio);
    if (!creada) return setError(t("gastos.categoriaDuplicada"));

    toast(t("gastos.categoriaCreada", { nombre: creada }), "success");
    setNombre("");
    setError("");
    setVersion((v) => v + 1);
    onCreated(creada);
  };

  const eliminar = async (categoria: string) => {
    if (await GastosController.usaCategoria(categoria)) {
      toast(t("gastos.categoriaEnUso"), "error");
      return;
    }
    CategoriasGastoController.remove(categoria);
    setVersion((v) => v + 1);
    toast(t("gastos.categoriaEliminada"), "success");
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
          <Button onClick={crear}>
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
              <span key={c} className={styles.chip}>
                {c}
                <button
                  type="button"
                  className={styles.chipDel}
                  onClick={() => eliminar(c)}
                  aria-label={`${t("gastos.categoriaEliminar")}: ${c}`}
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
            <span key={c} className={`${styles.chip} ${styles.chipBase}`}>{c}</span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
