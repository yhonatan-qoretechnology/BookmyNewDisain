"use client";
/* ============================================================
   ProgressHeader — progreso discreto del flujo de reservas
   ------------------------------------------------------------
   Sustituye al stepper numerado: una barra de avance y una fila
   de chips con lo ya seleccionado (clicables para volver atrás).
   Conserva la lógica de navegación secuencial validada.
============================================================ */
import { memo } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./booking.module.css";

export interface ProgressStep {
  id: string;
  label: string;
  /** Resumen de lo elegido en el paso (p. ej. nombre de la sede) */
  resumen: string | null;
}

interface ProgressHeaderProps {
  steps: ProgressStep[];
  activeIndex: number;
  /** Índice máximo alcanzable (validación secuencial) */
  maxReachable: number;
  onSelect: (index: number) => void;
}

export const ProgressHeader = memo(function ProgressHeader({
  steps, activeIndex, maxReachable, onSelect,
}: ProgressHeaderProps) {
  const pct = steps.length > 1 ? Math.round((activeIndex / (steps.length - 1)) * 100) : 0;

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack} aria-hidden>
        <span className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.trail}>
        {steps.map((s, i) => {
          const done = i < activeIndex;
          const cls = [
            styles.trailStep,
            done ? styles.done : "",
            i === activeIndex ? styles.active : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={s.id}
              type="button"
              className={cls}
              disabled={i > maxReachable}
              onClick={() => onSelect(i)}
              aria-current={i === activeIndex ? "step" : undefined}
            >
              {done && (
                <span className={styles.trailCheck} aria-hidden>
                  <Icon name="check" width={13} height={13} strokeWidth={2.8} />
                </span>
              )}
              <span>{s.label}</span>
              {done && s.resumen && <span className={styles.trailValue}>· {s.resumen}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
});
