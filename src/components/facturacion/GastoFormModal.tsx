"use client";
/* ============================================================
   GastoFormModal — "Agregar gasto"
   Popup ancho (780px) en dos columnas: todos los campos y el
   adjunto quedan a la vista sin necesidad de hacer scroll.
   Incluye el acceso directo para crear una categoría nueva.
============================================================ */
import { useEffect, useRef, useState } from "react";
import {
  CategoriasGastoController,
  FiltroFacturasController,
  Gasto,
  GastosController,
  OpcionFiltro,
} from "@/controllers/FacturacionControllers";
import { useData } from "@/hooks/useData";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Modal from "./Modal";
import CategoriaFormModal from "./CategoriaFormModal";
import styles from "./facturacion.module.css";

const hoy = () => new Date().toISOString().slice(0, 10);
/** Mismas restricciones que POST /gastos/upload */
const TICKET_TIPOS = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
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
  const [categoriaId, setCategoriaId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [total, setTotal] = useState("");
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  /* Base + propias de la empresa de la sesión; se recarga al crear una nueva */
  const { data: categorias, reload: reloadCategorias } = useData(
    () => (open ? CategoriasGastoController.list() : Promise.resolve([])),
    [open], []
  );
  const categoriaActual = categoriaId || categorias[0]?.id || "";

  /* Empresa: solo superadmin elige (owner ya tiene la suya fija) */
  const esSuperadmin = session?.role === "superadmin";
  const { data: empresasOpt } = useData(
    () => (open && esSuperadmin ? FiltroFacturasController.empresas(session) : Promise.resolve([] as OpcionFiltro[])),
    [open, esSuperadmin, session?.id], []
  );

  /* Sede a la que se factura: fija para admin de sede, elegible para owner/superadmin.
     El superadmin debe elegir primero la empresa; owner ya tiene la suya fija. */
  const puedeElegirSede = session?.role === "owner" || esSuperadmin;
  const { data: sedesOpt } = useData(
    () => {
      if (!open || !puedeElegirSede) return Promise.resolve([] as OpcionFiltro[]);
      if (esSuperadmin && !empresaId) return Promise.resolve([] as OpcionFiltro[]);
      return FiltroFacturasController.sedes(session, esSuperadmin ? empresaId : undefined);
    },
    [open, puedeElegirSede, esSuperadmin, empresaId, session?.id], []
  );
  useEffect(() => { setSedeId(""); }, [empresaId]);
  const sedeActual = puedeElegirSede ? (sedeId || sedesOpt[0]?.id || "") : (session?.sedeId || "");

  const esPdf = ticketFile?.type === "application/pdf";

  const reset = () => {
    setGasto(""); setCategoriaId(""); setEmpresaId(""); setSedeId(""); setFecha(hoy());
    setTotal(""); setTicketFile(null);
    if (ticketPreviewUrl) URL.revokeObjectURL(ticketPreviewUrl);
    setTicketPreviewUrl(null);
    setError(""); setDragging(false);
  };

  /* Libera el object URL del preview al cambiar de archivo o desmontar */
  useEffect(() => () => { if (ticketPreviewUrl) URL.revokeObjectURL(ticketPreviewUrl); }, [ticketPreviewUrl]);

  if (!open) return null;

  const cerrar = () => { reset(); onClose(); };

  const onFile = (file?: File | null) => {
    if (!file) return;
    if (!TICKET_TIPOS.includes(file.type)) return setError(t("gastos.errTipo"));
    if (file.size > MAX_BYTES) return setError(t("gastos.errPeso"));
    setError("");
    if (ticketPreviewUrl) URL.revokeObjectURL(ticketPreviewUrl);
    setTicketFile(file);
    setTicketPreviewUrl(file.type === "application/pdf" ? null : URL.createObjectURL(file));
  };

  const quitarTicket = () => {
    if (ticketPreviewUrl) URL.revokeObjectURL(ticketPreviewUrl);
    setTicketFile(null);
    setTicketPreviewUrl(null);
  };

  const guardar = async () => {
    const monto = Number(total);
    if (!gasto.trim()) return setError(t("gastos.errNombre"));
    if (!fecha) return setError(t("gastos.errFecha"));
    if (!monto || monto <= 0) return setError(t("gastos.errTotal"));
    if (esSuperadmin && !empresaId) return setError(t("gastos.errEmpresa"));
    if (!sedeActual) return setError(t("gastos.errSede"));

    setSaving(true);
    try {
      const nuevo = await GastosController.create({
        gasto: gasto.trim(),
        categoriaId: categoriaActual,
        sedeId: sedeActual,
        fecha,
        total: monto,
        ticket: ticketFile,
      });
      toast(t("gastos.creado"), "success");
      onSaved(nuevo);
      cerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("gastos.errGuardar"));
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
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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

          {/* Empresa — solo superadmin elige, define qué sedes se pueden facturar */}
          {esSuperadmin && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gf-empresa">{t("gastos.empresa")}</label>
              <div className={styles.selectWrap}>
                <select
                  id="gf-empresa"
                  className={styles.input}
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                >
                  <option value="">{t("gastos.elegirEmpresa")}</option>
                  {empresasOpt.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <svg className={styles.caret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          )}

          {/* Sede a la que se factura — solo owner/superadmin eligen, admin de sede ya está fijo */}
          {puedeElegirSede && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gf-sede">{t("gastos.sede")}</label>
              <div className={styles.selectWrap}>
                <select
                  id="gf-sede"
                  className={styles.input}
                  value={sedeActual}
                  disabled={esSuperadmin && !empresaId}
                  onChange={(e) => setSedeId(e.target.value)}
                >
                  <option value="">
                    {esSuperadmin && !empresaId ? t("gastos.primeroEmpresa") : t("gastos.elegirSede")}
                  </option>
                  {sedesOpt.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                <svg className={styles.caret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>
          )}

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

            {ticketFile ? (
              <div className={styles.preview}>
                {esPdf ? (
                  <div className={styles.previewPdf}>
                    <Icon name="fileText" />
                    <span>{ticketFile.name}</span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={ticketPreviewUrl!} alt={t("gastos.adjunto")} />
                )}
                <div className={styles.previewBar}>
                  <span className={styles.previewName}>{ticketFile.name}</span>
                  <button type="button" className={styles.previewQuitar} onClick={quitarTicket}>
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
              accept={TICKET_TIPOS.join(",")}
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
          reloadCategorias();
          setCategoriaId(nueva.id);
          setCatOpen(false);
        }}
      />
    </>
  );
}
