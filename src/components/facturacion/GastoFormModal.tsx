"use client";
/* ============================================================
   GastoFormModal — "Agregar gasto"
   Popup ancho (780px) en dos columnas: todos los campos y el
   adjunto quedan a la vista sin necesidad de hacer scroll.

   Flujo contra el backend (GastoModule):
   1. Si hay tickete → POST /gastos/upload devuelve su URL pública.
   2. POST /gastos con esa URL en `ticketUrl` + categoriaId + sedeId.
   La sede es obligatoria: un BRANCH_ADMIN la tiene fija en su sesión,
   owner y superadmin la eligen en el selector.
============================================================ */
import { useEffect, useRef, useState } from "react";
import {
  CategoriaGasto,
  CategoriasGastoController,
  Gasto,
  GastosController,
} from "@/controllers/FacturacionControllers";
import type { OpcionFiltro } from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import { useSession } from "@/context/SessionContext";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "./Modal";
import CategoriaFormModal from "./CategoriaFormModal";
import styles from "./facturacion.module.css";

const hoy = () => new Date().toISOString().slice(0, 10);
/** Mismo tope que el backend (GASTO_MAX_FILE_SIZE_BYTES) */
const MAX_BYTES = 10 * 1024 * 1024;

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
  const { session } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [gasto, setGasto] = useState("");
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [sedeId, setSedeId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [total, setTotal] = useState("");
  /* Archivo real a subir + previsualización local (no se manda tal cual) */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [catVersion, setCatVersion] = useState(0);

  /* Categorías del API (base + propias); se recarga al crear una nueva */
  const { data: categorias } = useData<CategoriaGasto[]>(
    () => (open ? CategoriasGastoController.list() : Promise.resolve([])),
    [open, catVersion],
    []
  );

  /* Sedes donde este usuario puede registrar el gasto */
  const { data: sedes } = useData<OpcionFiltro[]>(
    () => (open ? GastosController.sedesDisponibles(session) : Promise.resolve([])),
    [open, session?.id],
    []
  );

  /* Preselección: primera categoría y sede única */
  useEffect(() => {
    if (categoriaId == null && categorias.length) setCategoriaId(categorias[0].id);
  }, [categorias, categoriaId]);

  useEffect(() => {
    if (!sedeId && sedes.length) setSedeId(sedes[0].id);
  }, [sedes, sedeId]);

  if (!open) return null;

  const reset = () => {
    setGasto(""); setCategoriaId(null); setFecha(hoy());
    setTotal(""); setFile(null); setPreview(null);
    setError(""); setDragging(false);
  };

  const cerrar = () => { reset(); onClose(); };

  const onFile = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError(t("gastos.errTipo"));
    if (f.size > MAX_BYTES) return setError(t("gastos.errPeso"));
    setError("");
    /* El File es lo que se sube; el dataURL solo alimenta la miniatura
       (sin object URLs, así no hay que liberar nada al cerrar el popup). */
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const quitarAdjunto = () => {
    setFile(null);
    setPreview(null);
  };

  const guardar = async () => {
    const monto = Number(total);
    if (!gasto.trim()) return setError(t("gastos.errNombre"));
    if (!fecha) return setError(t("gastos.errFecha"));
    if (!monto || monto <= 0) return setError(t("gastos.errTotal"));
    if (categoriaId == null) return setError(t("gastos.errCategoria"));
    if (!sedeId) return setError(t("gastos.errSede"));

    setSaving(true);
    try {
      /* 1 · Subir el tickete si lo hay (el backend lo comprime) */
      let ticketUrl: string | undefined;
      if (file) {
        setSubiendo(true);
        try {
          ticketUrl = await GastosController.subirTicket(file);
        } catch (e) {
          setError(e instanceof Error ? e.message : t("gastos.errSubida"));
          return;
        } finally {
          setSubiendo(false);
        }
      }

      /* 2 · Crear el gasto ya con la URL del comprobante */
      const nuevo = await GastosController.create({
        gasto: gasto.trim(),
        categoriaId,
        fecha,
        total: monto,
        sedeId: Number(sedeId),
        ticketUrl,
      });
      toast(t("gastos.creado"), "success");
      onSaved(nuevo);
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("gastos.errGuardar"));
    } finally {
      setSaving(false);
    }
  };

  /* El selector de sede solo aparece si hay más de una opción */
  const mostrarSedes = sedes.length > 1;

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
              {subiendo ? t("gastos.subiendo") : saving ? t("gastos.guardando") : t("gastos.guardar")}
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
              maxLength={160}
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
                  value={categoriaId ?? ""}
                  onChange={(e) => setCategoriaId(Number(e.target.value))}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
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

          {/* Sede — solo cuando el usuario tiene más de una a su alcance */}
          {mostrarSedes && (
            <div className={`${styles.field} ${styles.full}`}>
              <label className={styles.label} htmlFor="gf-sede">{t("gastos.sede")}</label>
              <div className={styles.selectWrap}>
                <select
                  id="gf-sede"
                  className={styles.input}
                  value={sedeId}
                  onChange={(e) => { setSedeId(e.target.value); setError(""); }}
                >
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <svg className={styles.caret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          )}

          {/* Fila 3 — adjunto del tickete a todo el ancho */}
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>
              {t("gastos.adjunto")}
              <span className={styles.hint}>{t("gastos.adjuntoHint")}</span>
            </label>

            {preview ? (
              <div className={styles.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={t("gastos.adjunto")} />
                <div className={styles.previewBar}>
                  <span className={styles.previewName}>{file?.name}</span>
                  <button
                    type="button"
                    className={styles.previewQuitar}
                    onClick={quitarAdjunto}
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
          setCategoriaId(nueva.id);
          setCatOpen(false);
        }}
      />
    </>
  );
}
