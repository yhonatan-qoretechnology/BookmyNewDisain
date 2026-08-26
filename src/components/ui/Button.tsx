"use client";
/* ============================================================
   Button — botón del design system con respuesta táctil
   ------------------------------------------------------------
   El movimiento vive aquí y no en cada pantalla: al ser el botón
   que usa todo el panel, convertirlo en `motion.button` da la
   microinteracción a los cientos de botones existentes sin tocar
   sus archivos.

   Nota: el hundido al pulsar lo aplica framer-motion por estilo
   inline, así que Button.module.css ya no debe declarar
   `transform` — el inline gana y dejaría la regla muerta.
============================================================ */
import type { ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING, TAP_PRESS } from "@/components/animations";
import styles from "./Button.module.css";

/** Manejadores que React y framer-motion declaran con firmas distintas */
type MotionConflicts =
  | "onDrag" | "onDragStart" | "onDragEnd" | "onDragEnter" | "onDragLeave"
  | "onDragOver" | "onDrop" | "onAnimationStart" | "onAnimationEnd"
  | "onAnimationIteration";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts> {
  variant?: "primary" | "ghost" | "danger";
  size?: "md" | "sm";
  block?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const reduce = useReducedMotion();
  const inerte = disabled || reduce;
  const cls = [
    styles.btn,
    styles[variant],
    size === "sm" ? styles.sm : "",
    block ? styles.block : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <motion.button
      className={cls}
      disabled={disabled}
      whileTap={inerte ? undefined : TAP_PRESS}
      whileHover={inerte ? undefined : { y: -1 }}
      transition={SPRING}
      {...rest}
    />
  );
}

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflicts> {
  danger?: boolean;
}

export function IconButton({
  danger = false,
  className = "",
  disabled,
  ...rest
}: IconButtonProps) {
  const reduce = useReducedMotion();
  const inerte = disabled || reduce;
  const cls = [styles.iconBtn, danger ? styles.iconBtnDanger : "", className]
    .filter(Boolean).join(" ");

  return (
    <motion.button
      className={cls}
      disabled={disabled}
      whileTap={inerte ? undefined : TAP_PRESS}
      whileHover={inerte ? undefined : { scale: 1.06 }}
      transition={SPRING}
      {...rest}
    />
  );
}
