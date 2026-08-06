"use client";
import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={`${styles.box} ${contentScroll ? styles.contenido : ""}`}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {children}
      </div>
    </div>
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
