"use client";
/* ============================================================
   ImageUpload — control reutilizable para subir una imagen
   ------------------------------------------------------------
   Cubre todas las subidas del panel (foto de perfil, imagen de
   profesional, logo de empresa, imagen de sede o de categoría).
   Recibe la operación concreta en `onUpload`, así que no sabe nada
   de HTTP: el controlador decide a qué endpoint va.

   Dos variantes:
     · "avatar" → círculo, para personas
     · "card"   → rectángulo, para logos e imágenes de sede

   ⚠️ Estos endpoints del backend NO validan tipo ni tamaño (a
   diferencia del chat o los gastos), así que la comprobación de
   aquí es la única que existe.
============================================================ */
import { useRef, useState } from "react";
import { fotoUrl, initials } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import styles from "./ImageUpload.module.css";

/** Tipos que aceptan sharp y el navegador sin sorpresas */
const TIPOS_VALIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 10 * 1024 * 1024;

export interface ImageUploadProps {
  /** Ruta actual tal como la devuelve el API (relativa o absoluta) */
  value?: string | null;
  /** Sube el archivo y devuelve la nueva ruta ya guardada */
  onUpload: (file: File) => Promise<string | null>;
  /** Texto alternativo y base de las iniciales de respaldo */
  nombre?: string;
  variant?: "avatar" | "card";
  /** Deshabilita la interacción (p. ej. sin permisos) */
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export default function ImageUpload({
  value,
  onUpload,
  nombre = "",
  variant = "avatar",
  disabled = false,
  label,
  hint,
}: ImageUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [fallo, setFallo] = useState(false);
  const [dragging, setDragging] = useState(false);

  /* La previsualización local manda mientras se sube; luego se
     descarta y se vuelve a la ruta que confirmó el backend. */
  const src = preview ?? (fallo ? null : fotoUrl(value));

  const seleccionar = async (file?: File | null) => {
    if (!file || disabled) return;

    if (!TIPOS_VALIDOS.includes(file.type)) {
      setError(t("imagen.errTipo"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("imagen.errPeso"));
      return;
    }

    setError("");
    /* dataURL en vez de object URL: no hay nada que liberar después */
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setSubiendo(true);
    try {
      const nueva = await onUpload(file);
      setFallo(false);
      /* Si el backend devolvió ruta, se pinta desde ella */
      if (nueva) setPreview(null);
    } catch (e) {
      setPreview(null);
      setError(e instanceof Error ? e.message : t("imagen.errSubida"));
    } finally {
      setSubiendo(false);
    }
  };

  const abrir = () => { if (!disabled && !subiendo) inputRef.current?.click(); };

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}

      <div
        className={[
          styles.zona,
          variant === "avatar" ? styles.avatar : styles.card,
          dragging ? styles.dragging : "",
          disabled ? styles.disabled : "",
        ].join(" ")}
        onClick={abrir}
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragging(true); } }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void seleccionar(e.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label || t("imagen.cambiar")}
        aria-busy={subiendo}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={nombre} onError={() => setFallo(true)} />
        ) : (
          <span className={styles.placeholder} aria-hidden>
            {variant === "avatar" && nombre ? initials(nombre) : <Icon name="image" />}
          </span>
        )}

        {!disabled && (
          <span className={styles.overlay} aria-hidden>
            {subiendo ? <span className={styles.spinner} /> : <Icon name="image" />}
          </span>
        )}
      </div>

      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {subiendo && <span className={styles.hint}>{t("imagen.subiendo")}</span>}
      {error && (
        <span className={styles.error}>
          <Icon name="circle-x" /> {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_VALIDOS.join(",")}
        className={styles.input}
        disabled={disabled}
        onChange={(e) => { void seleccionar(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
