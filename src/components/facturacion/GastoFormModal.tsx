"use client";
/* ============================================================
   GastoFormModal — "Agregar gasto"
   Popup ancho (780px) en dos columnas: todos los campos y el
   adjunto quedan a la vista sin necesidad de hacer scroll.
   Incluye el acceso directo para crear una categoría nueva.
============================================================ */
import { useMemo, useRef, useState } from "react";
import {
  CategoriasGastoController,
  Gasto,
  GastosController,
} from "@/controllers/FacturacionControllers";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "./Modal";
import CategoriaFormModal from "./CategoriaFormModal";
import styles from "./facturacion.module.css";

const hoy = () => new Date().toISOString().slice(0, 10);
const MAX_BYTES = 4 * 1024 * 1024;

export default function GastoFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (g: Gasto) => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);

  const [gasto, setGasto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [total, setTotal] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [ticketNombre, setTicketNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catVersion, setCatVersion] = useState(0);

  /* Base + propias; se recalcula al crear una categoría nueva */
  const categorias = useMemo(() => CategoriasGastoController.list(), [catVersion]);
  const categoriaActual = categoria || categorias[0] || "";

  if (!open) return null;

  const reset = () => {
    setGasto(""); setCategoria(""); setFecha(hoy());
    setTotal(""); setTicket(null); setTicketNombre("");
    setError(""); setDragging(false);
  };

  const cerrar = () => { reset(); onClose(); };

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("gastos.errTipo"));
    if (file.size > MAX_BYTES) return setError(t("gastos.errPeso"));
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setTicket(reader.result as string);
      setTicketNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  const guardar = async () => {
    const monto = Number(total);
    if (!gasto.trim()) return setError(t("gastos.errNombre"));
    if (!fecha) return setError(t("gastos.errFecha"));
    if (!monto || monto <= 0) return setError(t("gastos.errTotal"));

    setSaving(true);
    try {
      const nuevo = await GastosController.create({
        gasto: gasto.trim(),
        categoria: categoriaActual,
        fecha,
        total: monto,
        ticket,
        ticketNombre: ticketNombre || undefined,
      });
      toast(t("gastos.creado"), "success");
      onSaved(nuevo);
      cerrar();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        title={t("gastos.formTitulo")}
        subtitle={t("gastos.formSub")}
        onClose={cerrar}
        size="lg"
        closeLabel={t("common.close")}
        footer={
          <>
            <Button variant="ghost" onClick={cerrar} disabled={saving}>{t("common.cancel")}</Button>
            <Button onClick={guardar} disabled={saving}>
              <Icon name="check" />
              {saving ? t("gastos.guardando") : t("gastos.guardar")}
            </Button>
          </>
        }
      >
        <div className={styles.formGrid}>
          {/* Fila 1 — nombre + categoría */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gf-nombre">{t("gastos.nombreGasto")}</label>
            <input
              id="gf-nombre"
              className={styles.input}
              value={gasto}
              autoFocus
              placeholder={t("gastos.nombrePlaceholder")}
              onChange={(e) => { setGasto(e.target.value); setError(""); }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gf-categoria">
              {t("gastos.categoria")}
              <span className={styles.hint}>{t("gastos.nuevaCategoria")} →</span>
            </label>
            <div className={styles.categoriaRow}>
              <div className={styles.selectWrap}>
                <select
                  id="gf-categoria"
                  className={styles.input}
                  value={categoriaActual}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className={styles.caret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <button
                type="button"
                className={styles.nuevaCatBtn}
                onClick={() => setCatOpen(true)}
                title={t("gastos.nuevaCategoria")}
                aria-label={t("gastos.nuevaCategoria")}
              >
                <Icon name="plus" />
              </button>
            </div>
          </div>

          {/* Fila 2 — fecha + total */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="gf-fecha">{t("common.date")}</label>
            <input
              id="gf-fecha"
              type="date"
              className={styles.input}
              value={fecha}
              onChange={(e) => { setFecha(e.target.value); setError(""); }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gf-total">{t("gastos.total")}</label>
            <input
              id="gf-total"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className={styles.input}
              value={total}
              placeholder={t("gastos.totalPlaceholder")}
              onChange={(e) => { setTotal(e.target.value); setError(""); }}
            />
          </div>

          {/* Fila 3 — adjunto del tickete a todo el ancho */}
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>
              {t("gastos.adjunto")}
              <span className={styles.hint}>{t("gastos.adjuntoHint")}</span>
            </label>

            {ticket ? (
              <div className={styles.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ticket} alt={t("gastos.adjunto")} />
                <div className={styles.previewBar}>
                  <span className={styles.previewName}>{ticketNombre}</span>
                  <button
                    type="button"
                    className={styles.previewQuitar}
                    onClick={() => { setTicket(null); setTicketNombre(""); }}
                  >
                    {t("gastos.quitarImagen")}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  onFile(e.dataTransfer.files?.[0]);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
              >
                <Icon name="image" />
                <span className={styles.dropzoneText}>{t("gastos.adjuntoCta")}</span>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>
        </div>

        {error && (
          <p className={styles.error}>
            <Icon name="circle-x" /> {error}
          </p>
        )}
      </Modal>

      {/* Popup anidado: crear categoría y seleccionarla al vuelo */}
      <CategoriaFormModal
        open={catOpen}
        onClose={() => setCatOpen(false)}
        onCreated={(nueva) => {
          setCatVersion((v) => v + 1);
          setCategoria(nueva);
          setCatOpen(false);
        }}
      />
    </>
  );
}
