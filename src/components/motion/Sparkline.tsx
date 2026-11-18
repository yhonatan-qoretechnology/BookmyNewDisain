"use client";
/* ============================================================
   Línea que se dibuja sola (MOTION_SPEC.md §6.4)
   ------------------------------------------------------------
   Va en la esquina de las tarjetas KPI. Usa `currentColor`, así
   cada tarjeta la pinta con su propio acento sin pasárselo.

   No lleva `initial`/`animate` propios: hereda hidden/show del
   padre para entrar dentro de la cascada de la tarjeta.

   Con "reducir movimiento" se pinta entera y quieta: `pathLength` no
   es un transform, asi que el `reducedMotion="user"` de MotionConfig
   no lo apaga y la linea se seguiria dibujando sola (§10).
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import styles from "./Sparkline.module.css";

type Props = {
  /** Path del SVG dentro del viewBox 0 0 64 24. */
  d: string;
  className?: string;
};

export function Sparkline({ d, className }: Props) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 64 24"
      className={className ? `${styles.svg} ${className}` : styles.svg}
      fill="none"
      aria-hidden
    >
      {reduce ? (
        <path
          d={d}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
      <motion.path
        d={d}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: 0.7, ease: ease.out },
              opacity: { duration: 0.15 },
            },
          },
          exit: { opacity: 0, transition: { duration: 0.2 } },
        }}
      />
      )}
    </svg>
  );
}
