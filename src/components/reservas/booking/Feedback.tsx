"use client";
/* ============================================================
   Feedback — indicadores de carga y error del flujo de reservas
   SRP: solo presentación controlada por props.
============================================================ */
import { memo } from "react";
import styles from "./booking.module.css";

export const Loading = memo(function Loading({ label }: { label: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      {label}
    </div>
  );
});

export const ErrorBox = memo(function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.errorBox} role="alert">{children}</div>;
});
