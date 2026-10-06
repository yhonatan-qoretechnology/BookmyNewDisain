"use client";
/* ============================================================
   SubidaArchivo — zona de arrastrar y soltar con vista previa
   ------------------------------------------------------------
   Antes era un <input type="file"> pelado: no se veía lo que se
   había elegido, ni si pesaba demasiado, hasta que fallaba el
   envío. Aquí se valida al soltar y se enseña la miniatura.
============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { fotoUrl } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import { MAX_BYTES, TIPOS_ARCHIVO } from "./estados";
import styles from "./KycWizard.module.css";

export default function SubidaArchivo({
  etiqueta,
  ayuda,
  archivo,
  guardado,
  onElegir,
}: {
  etiqueta: string;
  ayuda: string;
  /** Lo que el usuario acaba de elegir en esta sesión */
  archivo: File | null;
  /** Ruta de lo que ya estaba enviado, para no pedirlo otra vez */
  guardado?: string | null;
  onElegir: (f: File | null) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [encima, setEncima] = useState(false);

  /* Un blob URL por archivo, liberado al cambiar: si no, cada tecleo en el
     resto del formulario dejaría URLs colgando. */
  const preview = useMemo(
    () => (archivo && archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : null),
    [archivo],
  );
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const aceptar = (f?: File | null) => {
    if (!f) return;
    if (!TIPOS_ARCHIVO.includes(f.type)) { setError(t("kyc.errTipo")); return; }
    if (f.size > MAX_BYTES) { setError(t("kyc.errPeso")); return; }
    setError(null);
    onElegir(f);
  };

  const yaEnviado = !archivo && !!guardado;

  return (
    <div className={styles.campoArchivo}>
      <span className={styles.campoEtiqueta}>{etiqueta}</span>

      <div
        className={[
          styles.zona,
          encima ? styles.zonaEncima : "",
          archivo ? styles.zonaLista : "",
          error ? styles.zonaError : "",
        ].filter(Boolean).join(" ")}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); aceptar(e.dataTransfer.files?.[0]); }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.miniatura} src={preview} alt="" />
        ) : archivo ? (
          <span className={styles.pdf}><Icon name="fileText" width={24} height={24} />{archivo.name}</span>
        ) : yaEnviado ? (
          <a
            className={styles.verEnviado}
            href={fotoUrl(guardado) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="circle-check" width={20} height={20} />
            {t("kyc.yaSubido")}
          </a>
        ) : (
          <span className={styles.vacia}>
            <Icon name="download" width={22} height={22} />
            <b>{t("kyc.soltar")}</b>
            <small>{t("kyc.formatos")}</small>
          </span>
        )}
      </div>

      <small className={error ? styles.errorTexto : styles.ayuda}>{error ?? ayuda}</small>

      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={(e) => aceptar(e.target.files?.[0])}
      />
    </div>
  );
}
