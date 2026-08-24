"use client";
/* ============================================================
   Cards — tarjetas del design system
   ------------------------------------------------------------
   La rejilla escalona la entrada de sus tarjetas y cada una se
   eleva al pasar el ratón. Si recibe `onClick` pasa a comportarse
   como algo pulsable y añade el hundido al hacer clic.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import {
  HOVER_LIFT, SPRING, STAGGER, TAP_PRESS, staggerChild, staggerParent,
} from "@/components/animations";
import styles from "./Cards.module.css";

export function CardGrid({
  children,
  resetKey,
}: {
  children: React.ReactNode;
  /** Cambia para repetir la entrada al filtrar */
  resetKey?: string | number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={styles.cardGrid}
      key={resetKey}
      initial="hidden"
      animate="visible"
      variants={{
        ...staggerParent,
        visible: {
          transition: {
            staggerChildren: reduce ? 0 : STAGGER,
            delayChildren: reduce ? 0 : 0.02,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function SimpleCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  /** Si se pasa, la tarjeta responde al clic con el hundido táctil */
  onClick?: React.MouseEventHandler;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`${styles.simpleCard} ${className}`}
      onClick={onClick}
      variants={reduce ? undefined : staggerChild}
      whileHover={reduce ? undefined : HOVER_LIFT}
      whileTap={reduce || !onClick ? undefined : TAP_PRESS}
      transition={SPRING}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
      {children}
    </motion.div>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function TagRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.tagRow}>{children}</div>;
}
