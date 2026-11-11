"use client";
/* ============================================================
   ImageGallery — miniaturas con alta y baja de imágenes
   ------------------------------------------------------------
   Para colecciones (hoy, `sede.imagenes`). Cada operación devuelve
   la lista ya actualizada por el backend, que es la que manda: así
   el orden y las rutas son siempre las reales, no una copia local.
   · `max`: muestra «n/max» y deja de ofrecer subidas al llegar.
   · `onAddMany`: botón para elegir varias a la vez, con vista previa
     y opción de quitar alguna antes de subirlas.
   · Borrar pide confirmación en la propia miniatura (el diálogo
     global quedaría debajo si la galería está dentro de un modal).
============================================================ */
import { useEffect, useRef, useState } from "react";
import { fotoUrl } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import ImageUpload from "./ImageUpload";
import styles from "./ImageGallery.module.css";

export interface ImageGalleryProps {
  imagenes: string[];
  /** Sube una imagen y devuelve la colección actualizada */
  onAdd: (file: File) => Promise<string[]>;
  /** Elimina una imagen y devuelve la colección actualizada */
  onRemove: (ruta: string) => Promise<string[]>;
  /** Sube varias a la vez y devuelve la colección actualizada */
  onAddMany?: (files: File[]) => Promise<string[]>;
  /** Tope de imágenes de la colección */
  max?: number;
  label?: string;
  disabled?: boolean;
}

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_PESO = 10 * 1024 * 1024;

export default function ImageGallery({
  imagenes,
  onAdd,
  onRemove,
  onAddMany,
  max,
  label,
  disabled = false,
}: ImageGalleryProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<string[] | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [error, setError] = useState("");
  /* Selección múltiple pendiente de subir */
  const [pendientes, setPendientes] = useState<Array<{ file: File; url: string }>>([]);
  const [subiendoVarias, setSubiendoVarias] = useState(false);
  const inputVarias = useRef<HTMLInputElement>(null);

  /* Mientras no haya habido cambios se muestra lo que llega por props */
  const lista = items ?? imagenes;
  const libres = max != null ? Math.max(0, max - lista.length) : Infinity;
  const lleno = max != null && libres === 0;

  /* Las vistas previas son URLs de objeto: se liberan al desmontar */
  useEffect(() => () => pendientes.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirVarias = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const validas: File[] = [];
    for (const f of Array.from(files)) {
      if (!TIPOS.includes(f.type)) { setError(t("imagen.errTipo")); continue; }
      if (f.size > MAX_PESO) { setError(t("imagen.errPeso")); continue; }
      validas.push(f);
    }
    const hueco = libres - pendientes.length;
    if (validas.length > hueco) setError(t("imagen.limite", { max: max ?? 0 }));
    const nuevas = validas.slice(0, Math.max(0, hueco)).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPendientes((p) => [...p, ...nuevas]);
    if (inputVarias.current) inputVarias.current.value = "";
  };

  const descartar = (url: string) => {
    URL.revokeObjectURL(url);
    setPendientes((p) => p.filter((x) => x.url !== url));
  };

  const subirVarias = async () => {
    if (!onAddMany || pendientes.length === 0) return;
    setSubiendoVarias(true);
    setError("");
    try {
      setItems(await onAddMany(pendientes.map((p) => p.file)));
      pendientes.forEach((p) => URL.revokeObjectURL(p.url));
      setPendientes([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("imagen.errSubida"));
    } finally {
      setSubiendoVarias(false);
    }
  };

  const añadir = async (file: File) => {
    setError("");
    const actualizadas = await onAdd(file);
    setItems(actualizadas);
    return actualizadas[actualizadas.length - 1] ?? null;
  };

  const quitar = async (ruta: string) => {
    setConfirmando(null);
    setBorrando(ruta);
    setError("");
    try {
      setItems(await onRemove(ruta));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("imagen.errSubida"));
    } finally {
      setBorrando(null);
    }
  };

  return (
    <div className={styles.wrap}>
      {label && (
        <span className={styles.label}>
          {label}
          {max != null && <span className={styles.contador}>{lista.length}/{max}</span>}
          {!disabled && <span className={styles.hint}>{t("imagen.hint")}</span>}
        </span>
      )}

      <div className={styles.grid}>
        {lista.map((ruta) => (
          <figure key={ruta} className={styles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl(ruta) ?? ""} alt="" loading="lazy" />
            {!disabled && confirmando !== ruta && (
              <button
                type="button"
                className={styles.quitar}
                onClick={() => setConfirmando(ruta)}
                disabled={borrando === ruta}
                title={t("common.delete")}
                aria-label={`${t("common.delete")}: ${ruta.split("/").pop()}`}
              >
                <Icon name="x" />
              </button>
            )}
            {confirmando === ruta && (
              <div className={styles.confirmar} role="group" aria-label={t("imagen.confirmarBorrado")}>
                <span>{t("imagen.confirmarBorrado")}</span>
                <div>
                  <button type="button" className={styles.si} onClick={() => void quitar(ruta)} disabled={borrando === ruta}>
                    {t("common.delete")}
                  </button>
                  <button type="button" className={styles.no} onClick={() => setConfirmando(null)}>
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}
          </figure>
        ))}

        {/* Vista previa de lo elegido para subir de una vez */}
        {pendientes.map((p) => (
          <figure key={p.url} className={`${styles.item} ${styles.pendiente}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" />
            <button
              type="button"
              className={styles.quitar}
              onClick={() => descartar(p.url)}
              disabled={subiendoVarias}
              title={t("imagen.descartar")}
              aria-label={`${t("imagen.descartar")}: ${p.file.name}`}
            >
              <Icon name="x" />
            </button>
          </figure>
        ))}

        {!disabled && !lleno && pendientes.length === 0 && (
          <ImageUpload
            variant="card"
            value={null}
            onUpload={añadir}
          />
        )}
      </div>

      {!disabled && onAddMany && !lleno && (
        <div className={styles.varias}>
          <input
            ref={inputVarias}
            type="file"
            accept={TIPOS.join(",")}
            multiple
            hidden
            onChange={(e) => elegirVarias(e.target.files)}
          />
          <button type="button" className={styles.variasBtn} onClick={() => inputVarias.current?.click()} disabled={subiendoVarias}>
            <Icon name="plus" /> {t("imagen.elegirVarias")}
          </button>
          {pendientes.length > 0 && (
            <button type="button" className={styles.variasSubir} onClick={() => void subirVarias()} disabled={subiendoVarias}>
              {subiendoVarias ? t("imagen.subiendo") : t("imagen.subirN", { n: pendientes.length })}
            </button>
          )}
        </div>
      )}

      {!disabled && lleno && (
        <span className={styles.aviso}>{t("imagen.limiteAlcanzado", { max: max ?? 0 })}</span>
      )}

      {error && (
        <span className={styles.error}>
          <Icon name="circle-x" /> {error}
        </span>
      )}
    </div>
  );
}
