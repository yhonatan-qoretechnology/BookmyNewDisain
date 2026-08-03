"use client";
/* ============================================================
   CategoriaFormModal — crear categorías de gasto propias
   Contra CategoriaGastoModule (/categorias-gasto): muestra las
   base de la plataforma y las de la empresa (eliminables solo si
   ningún gasto las está usando; el backend también lo valida).
============================================================ */
import { useState } from "react";
import {
  CategoriaGasto,
  CategoriasGastoController,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
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
  onCreated: (categoria: CategoriaGasto) => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  /* Base + propias del API; se recarga tras crear o eliminar */
  const { data: categorias, loading } = useData<CategoriaGasto[]>(
    () => (open ? CategoriasGastoController.list() : Promise.resolve([])),
    [open, version],
    []
  );

  if (!open) return null;

  const base = categorias.filter((c) => c.isBase);
  const propias = categorias.filter((c) => !c.isBase);

  const crear = async () => {
    const limpio = nombre.trim();
    if (!limpio) return setError(t("gastos.categoriaVacia"));
    if (CategoriasGastoController.existe(limpio, categorias)) {
      return setError(t("gastos.categoriaDuplicada"));
    }

    setSaving(true);
    try {
      const { categoria, error: err } = await CategoriasGastoController.create(limpio);
      if (!categoria) {
        setError(err === "VACIA" ? t("gastos.categoriaVacia") : err || t("gastos.categoriaDuplicada"));
        return;
      }
      toast(t("gastos.categoriaCreada", { nombre: categoria.nombre }), "success");
      setNombre("");
      setError("");
      setVersion((v) => v + 1);
      onCreated(categoria);
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (categoria: CategoriaGasto) => {
    if (await GastosController.usaCategoria(categoria.id)) {
      toast(t("gastos.categoriaEnUso"), "error");
      return;
    }
    const { ok, error: err } = await CategoriasGastoController.remove(categoria.id);
    if (!ok) {
      toast(err || t("gastos.categoriaEnUso"), "error");
      return;
    }
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
          <Button variant="ghost" onClick={onClose} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={crear} disabled={saving}>
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
          onKeyDown={(e) => { if (e.key === "Enter" && !saving) void crear(); }}
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
          {loading ? (
            <span className={styles.chipEmpty}>{t("common.loading")}</span>
          ) : propias.length === 0 ? (
            <span className={styles.chipEmpty}>{t("gastos.categoriaSinPropias")}</span>
          ) : (
            propias.map((c) => (
              <span key={c.id} className={styles.chip}>
                {c.nombre}
                <button
                  type="button"
                  className={styles.chipDel}
                  onClick={() => void eliminar(c)}
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
