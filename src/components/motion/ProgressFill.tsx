"use client";
/* ============================================================
   Barra que se llena de izquierda a derecha (MOTION_SPEC.md §6.10)
   ------------------------------------------------------------
   El relleno se revela con `clip-path`, no animando `width`:
   animar width obliga al navegador a recalcular el layout en
   cada fotograma y se nota el tirón.

   Hereda hidden/show del padre, así entra dentro de la cascada
   de su tarjeta o de su fila.
============================================================ */
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import styles from "./ProgressFill.module.css";

type Props = {
  /** Porcentaje 0-100. Se recorta por si llega algo fuera de rango. */
  value: number;
  className?: string;
};

export function ProgressFill({ value, className }: Props) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={className ? `${styles.track} ${className}` : styles.track}>
      <motion.div
        className={styles.fill}
        style={{ width: `${pct}%` }}
        variants={{
          hidden: { clipPath: "inset(0 100% 0 0 round 999px)" },
          show: {
            clipPath: "inset(0 0% 0 0 round 999px)",
            transition: { duration: 0.7, ease: ease.outExpo },
          },
        }}
      />
    </div>
  );
}
