"use client";
/* ============================================================
   ImageGallery — miniaturas con alta y baja de imágenes
   ------------------------------------------------------------
   Para colecciones (hoy, `sede.imagenes`). Cada operación devuelve
   la lista ya actualizada por el backend, que es la que manda: así
   el orden y las rutas son siempre las reales, no una copia local.
============================================================ */
import { useState } from "react";
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
  label?: string;
  disabled?: boolean;
}

export default function ImageGallery({
  imagenes,
  onAdd,
  onRemove,
  label,
  disabled = false,
}: ImageGalleryProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<string[] | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState("");

  /* Mientras no haya habido cambios se muestra lo que llega por props */
  const lista = items ?? imagenes;

  const añadir = async (file: File) => {
    setError("");
    const actualizadas = await onAdd(file);
    setItems(actualizadas);
    return actualizadas[actualizadas.length - 1] ?? null;
  };

  const quitar = async (ruta: string) => {
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
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.grid}>
        {lista.map((ruta) => (
          <figure key={ruta} className={styles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl(ruta) ?? ""} alt="" loading="lazy" />
            {!disabled && (
              <button
                type="button"
                className={styles.quitar}
                onClick={() => void quitar(ruta)}
                disabled={borrando === ruta}
                title={t("common.delete")}
                aria-label={`${t("common.delete")}: ${ruta.split("/").pop()}`}
              >
                <Icon name="x" />
              </button>
            )}
          </figure>
        ))}

        {!disabled && (
          <ImageUpload
            variant="card"
            value={null}
            onUpload={añadir}
            hint={t("imagen.hint")}
          />
        )}
      </div>

      {error && (
        <span className={styles.error}>
          <Icon name="circle-x" /> {error}
        </span>
      )}
    </div>
  );
}
