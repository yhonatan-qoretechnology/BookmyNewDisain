"use client";
/* ============================================================
   DocumentUpload — control para subir un documento (PDF/Word)
   ------------------------------------------------------------
   Hermano de ImageUpload, pero para un archivo que no se puede
   previsualizar como imagen (la hoja de vida de un profesional):
   en vez de miniatura, muestra el nombre y un enlace de descarga.
   Mismo contrato `onUpload` — no sabe nada de HTTP, el llamador
   decide a qué endpoint va.
============================================================ */
import { useRef, useState } from "react";
import { fotoUrl } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import styles from "./DocumentUpload.module.css";

const TIPOS_VALIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_BYTES = 10 * 1024 * 1024;

export interface DocumentUploadProps {
  /** Ruta actual tal como la devuelve el API (relativa o absoluta) */
  value?: string | null;
  /** Sube el archivo y devuelve la nueva ruta ya guardada */
  onUpload: (file: File) => Promise<string | null>;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export default function DocumentUpload({
  value,
  onUpload,
  label,
  hint,
  disabled = false,
}: DocumentUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [nombreLocal, setNombreLocal] = useState<string | null>(null);

  const seleccionar = async (file?: File | null) => {
    if (!file || disabled) return;

    if (!TIPOS_VALIDOS.includes(file.type)) {
      setError(t("imagen.errTipoDoc"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("imagen.errPeso"));
      return;
    }

    setError("");
    setNombreLocal(file.name);
    setSubiendo(true);
    try {
      await onUpload(file);
    } catch (e) {
      setNombreLocal(null);
      setError(e instanceof Error ? e.message : t("imagen.errSubida"));
    } finally {
      setSubiendo(false);
    }
  };

  const abrir = () => { if (!disabled && !subiendo) inputRef.current?.click(); };
  const url = fotoUrl(value);

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.row}>
        {url ? (
          <a className={styles.archivo} href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="fileText" />
            <span>{nombreLocal || t("imagen.verDocumento")}</span>
          </a>
        ) : (
          <span className={styles.vacio}>
            <Icon name="fileText" />
            {t("imagen.sinDocumento")}
          </span>
        )}

        <button type="button" className={styles.boton} onClick={abrir} disabled={disabled || subiendo}>
          {subiendo ? t("imagen.subiendo") : value ? t("imagen.cambiarDocumento") : t("imagen.subirDocumento")}
        </button>
      </div>

      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && (
        <span className={styles.error}>
          <Icon name="circle-x" /> {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={TIPOS_VALIDOS.join(",")}
        hidden
        disabled={disabled}
        onChange={(e) => { void seleccionar(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
