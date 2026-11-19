"use client";
/* ============================================================
   Cards — tarjetas del design system
   ------------------------------------------------------------
   La rejilla escalona la entrada de sus tarjetas y cada una se
   eleva al pasar el ratón. Si recibe `onClick` pasa a comportarse
   como algo pulsable y añade el hundido al hacer clic.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { cardIn, group, spring, stagger } from "@/lib/motion";
import styles from "./Cards.module.css";

export function CardGrid({
  children,
  resetKey,
  className = "",
}: {
  children: React.ReactNode;
  /** Cambia para repetir la entrada al filtrar */
  resetKey?: string | number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`${styles.cardGrid} ${className}`}
      key={resetKey}
      initial="hidden"
      animate="show"
      variants={group(reduce ? 0 : stagger.cards, reduce ? 0 : 0.02)}
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
    /* "glass-card" es la clase global del Anexo A: material, radio de
       tarjeta (20-24 px) y sombra tenida con el acento. Va primero para
       que lo propio del modulo pueda matizarla. */
    <motion.div
      className={`glass-card ${styles.simpleCard} ${className}`}
      onClick={onClick}
      variants={reduce ? undefined : cardIn()}
      /* 6.14: la tarjeta se levanta 5 px y se hunde al pulsarla. */
      whileHover={reduce ? undefined : { y: -5 }}
      whileTap={reduce || !onClick ? undefined : { scale: 0.98 }}
      transition={spring.hover}
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
