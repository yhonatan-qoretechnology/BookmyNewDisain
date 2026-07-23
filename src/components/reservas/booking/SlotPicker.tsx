"use client";
/* ============================================================
   SlotPicker — franjas horarias disponibles
   Mantiene la implementación previa (grid de horas) con los
   textos completamente en español.
============================================================ */
import { memo } from "react";
import type { SlotHora } from "@/models";
import styles from "./booking.module.css";

interface SlotPickerProps {
  slots: SlotHora[];
  selected?: string | null;
  onSelect: (s: SlotHora) => void;
}

function SlotPickerBase({ slots, selected, onSelect }: SlotPickerProps) {
  return (
    <div className={styles.slotGrid} role="listbox" aria-label="Horas disponibles">
      {slots.map((s) => (
        <button
          key={s.hora}
          type="button"
          role="option"
          aria-selected={s.hora === selected}
          className={`${styles.slot} ${s.hora === selected ? styles.selected : ""}`}
          onClick={() => onSelect(s)}
        >
          {s.hora}
        </button>
      ))}
    </div>
  );
}

export default memo(SlotPickerBase);
