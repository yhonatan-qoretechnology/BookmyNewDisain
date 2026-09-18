"use client";
/* ============================================================
   Modal — popup del módulo de facturación (design system)
   · Cierra con Escape y con clic en el fondo
   · Entra y sale animado: el AnimatePresence lo pone cada envoltorio
     (FacturaViewModal, GastoFormModal…), que es quien decide cuándo
     se monta; aquí solo se declaran las variantes
   · Pie fijo: las acciones quedan siempre visibles
   · El cuerpo solo hace scroll si el contenido no cabe
   · `printable`: el modal se monta directamente en <body> y, al
     imprimir, sale él solo (sin el listado de detrás ni los botones)
============================================================ */
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, SPRING_SOFT } from "@/components/animations";
import Icon from "@/components/ui/Icon";
import styles from "./facturacion.module.css";

/** Anchos del módulo: el formulario de gasto usa "lg" para verse completo */
const ANCHO = { sm: 460, md: 620, lg: 780, xl: 900 } as const;
export type ModalSize = keyof typeof ANCHO;

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
  closeLabel = "Cerrar",
  printable = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Acciones del pie (quedan fijas, fuera del área con scroll) */
  footer?: ReactNode;
  size?: ModalSize;
  closeLabel?: string;
  /** Imprimible con window.print(): ver globals.css ([data-print-root]) */
  printable?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  const reduce = useReducedMotion();

  const modal = (
    <motion.div
      className={styles.overlay}
      data-print-root={printable ? "" : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={EASE_OUT}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        className={styles.box}
        style={{ maxWidth: ANCHO[size] }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
        transition={reduce ? EASE_OUT : SPRING_SOFT}
      >
        <div className={styles.head}>
          <div className={styles.headText}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel} data-no-print>
            <Icon name="x" />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer} data-no-print>{footer}</div>}
      </motion.div>
    </motion.div>
  );

  /* Para imprimirlo solo, el modal tiene que ser hijo directo de <body>:
     dentro del panel no hay forma de ocultar el listado sin ocultarlo a él. */
  if (printable && typeof document !== "undefined") return createPortal(modal, document.body);
  return modal;
}
