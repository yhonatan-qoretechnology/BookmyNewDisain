"use client";
/* ============================================================
   ImagenesNuevas — fotos elegidas antes de que exista la ficha
   ------------------------------------------------------------
   Para las altas (servicios, insumos): no sube nada, guarda los
   File en memoria y quien la usa los manda al crear. Usa las
   mismas clases que ImageGallery para verse igual que la galería
   de edición.
============================================================ */
import { useEffect, useMemo } from "react";
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import ImageUpload from "./ImageUpload";
import styles from "./ImageGallery.module.css";

export default function ImagenesNuevas({
  archivos,
  onChange,
  label,
  max,
}: {
  archivos: File[];
  onChange: (files: File[]) => void;
  label: string;
  /** Tope de archivos: al llegar a él desaparece el hueco de subida */
  max?: number;
}) {
  const { t } = useI18n();
  /* Un blob URL por archivo, memoizado: si no se recalcula así, cada
     tecleo en el resto del modal (que re-renderiza este hijo con el
     mismo array) generaría URLs nuevas sin liberar las anteriores. */
  const urls = useMemo(() => archivos.map((f) => URL.createObjectURL(f)), [archivos]);
  useEffect(() => () => { urls.forEach((u) => URL.revokeObjectURL(u)); }, [urls]);
  const lleno = max != null && archivos.length >= max;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.grid}>
        {archivos.map((file, i) => (
          <figure key={`${file.name}-${i}`} className={styles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[i]} alt="" />
            <button
              type="button"
              className={styles.quitar}
              onClick={() => onChange(archivos.filter((_, idx) => idx !== i))}
              title={t("common.delete")}
              aria-label={`${t("common.delete")}: ${file.name}`}
            >
              <Icon name="x" />
            </button>
          </figure>
        ))}
        {!lleno && (
          <ImageUpload
            key={archivos.length}
            variant="card"
            value={null}
            hint={t("imagen.hint")}
            onUpload={(file) => { onChange([...archivos, file]); return Promise.resolve(null); }}
          />
        )}
      </div>
    </div>
  );
}
