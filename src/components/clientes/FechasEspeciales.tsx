"use client";
/* ============================================================
   FechasEspeciales — qué celebra el cliente
   ------------------------------------------------------------
   Chips para marcar las fechas que le importan (Navidad, Día de
   la Madre…). Sirven para las campañas: «clientes que celebran el
   Día de la Madre». Mismas claves que FECHAS_ESPECIALES del backend.
============================================================ */
import { useI18n } from "@/i18n";
import styles from "./FechasEspeciales.module.css";

export const FECHAS_ESPECIALES = [
  "NAVIDAD", "ANO_NUEVO", "SAN_VALENTIN", "AMOR_AMISTAD", "DIA_MUJER", "DIA_MADRE",
  "DIA_PADRE", "DIA_NINO", "HALLOWEEN", "BLACK_FRIDAY", "VUELTA_COLE", "ANIVERSARIO",
] as const;

export default function FechasEspeciales({
  value,
  onChange,
  id,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  id?: string;
}) {
  const { t } = useI18n();
  const alternar = (f: string) => onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f]);
  return (
    <div className={styles.chips} id={id} role="group" aria-label={t("clientes.fechasEspeciales")}>
      {FECHAS_ESPECIALES.map((f) => {
        const on = value.includes(f);
        return (
          <button
            key={f}
            type="button"
            aria-pressed={on}
            className={`${styles.chip} ${on ? styles.chipOn : ""}`}
            onClick={() => alternar(f)}
          >
            {t(`fechasEspeciales.${f}`)}
          </button>
        );
      })}
    </div>
  );
}
