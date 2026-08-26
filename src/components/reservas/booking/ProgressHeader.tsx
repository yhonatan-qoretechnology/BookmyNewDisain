"use client";
/* ============================================================
   ProgressHeader — línea de tiempo del flujo de reservas
   ------------------------------------------------------------
   Barra de avance + pasos numerados unidos por una línea.

   Todos los pasos miden exactamente lo mismo (misma base flex y
   sin encoger): es lo que permite que la línea que los une caiga
   siempre sobre el centro de los círculos. Por eso el resumen de
   lo elegido viaja en el `title` y no como texto del paso — un
   nombre largo ("Glow Benalmádena") ensanchaba solo ese paso y
   descuadraba toda la fila.
============================================================ */
import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/components/animations";
import Icon from "@/components/ui/Icon";
import styles from "./booking.module.css";

export interface ProgressStep {
  id: string;
  label: string;
  /** Resumen de lo elegido en el paso; se muestra al pasar el ratón */
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
  const reduce = useReducedMotion();
  const pct = steps.length > 1 ? Math.round((activeIndex / (steps.length - 1)) * 100) : 0;

  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack} aria-hidden>
        {/* La barra crece con muelle: acompaña al paso en vez de saltar */}
        <motion.span
          className={styles.progressFill}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : SPRING}
        />
      </div>

      <div className={styles.trail}>
        {steps.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          const cls = [
            styles.trailStep,
            done ? styles.done : "",
            active ? styles.active : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              key={s.id}
              type="button"
              className={cls}
              disabled={i > maxReachable}
              onClick={() => onSelect(i)}
              aria-current={active ? "step" : undefined}
              title={s.resumen ? `${s.label}: ${s.resumen}` : s.label}
            >
              <span className={styles.trailMark} aria-hidden>
                {done
                  ? <Icon name="check" width={15} height={15} strokeWidth={3} />
                  : i + 1}
              </span>
              <span className={styles.trailLabel}>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
