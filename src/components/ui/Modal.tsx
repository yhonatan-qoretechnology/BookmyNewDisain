"use client";
/* ============================================================
   Modal — diálogo del design system
   ------------------------------------------------------------
   Con AnimatePresence el modal también anima al CERRARSE: antes
   entraba con un keyframe CSS y desaparecía de golpe, que es lo
   que hacía que se sintiera brusco.

   El fondo se desvanece y la caja sube con muelle; al salir, ambos
   con una curva corta para que no se quede "colgando".
============================================================ */
import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, SPRING_SOFT } from "@/components/animations";
import styles from "./Modal.module.css";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth,
  contentScroll = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  /** true cuando el contenido gestiona su propio scroll interno (listas
      largas): la caja deja de scrollear entera y la cabecera y los
      botones se quedan fijos a la vista. */
  contentScroll?: boolean;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={EASE_OUT}
        >
          <motion.div
            className={`${styles.box} ${contentScroll ? styles.contenido : ""}`}
            style={maxWidth ? { maxWidth } : undefined}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={reduce ? EASE_OUT : SPRING_SOFT}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h3>{children}</h3>;
}

export function ModalText({ children }: { children: React.ReactNode }) {
  return <p className={styles.muted}>{children}</p>;
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}
