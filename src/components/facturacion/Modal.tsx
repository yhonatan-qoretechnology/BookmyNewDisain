"use client";
/* ============================================================
   Modal — popup del módulo de facturación (design system)
   · Cierra con Escape y con clic en el fondo
   · Pie fijo: las acciones quedan siempre visibles
   · El cuerpo solo hace scroll si el contenido no cabe
============================================================ */
import { ReactNode, useEffect } from "react";
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
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Acciones del pie (quedan fijas, fuera del área con scroll) */
  footer?: ReactNode;
  size?: ModalSize;
  closeLabel?: string;
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

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.box} style={{ maxWidth: ANCHO[size] }}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={closeLabel}>
            <Icon name="x" />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
