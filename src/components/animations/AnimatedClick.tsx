"use client";
/* ============================================================
   AnimatedClick — respuesta táctil para lo pulsable
   ------------------------------------------------------------
   Eleva ligeramente al pasar el ratón y hunde al pulsar, para que
   tarjetas y enlaces se sientan físicos. Los botones del design
   system ya lo traen de serie (ui/Button), así que este envoltorio
   es para lo demás: tarjetas, filas clicables, accesos directos.

       <AnimatedClick onClick={abrir}><SimpleCard>…</SimpleCard></AnimatedClick>
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { HOVER_LIFT, SPRING, TAP_PRESS } from "./transitions";
import type { MotionTag } from "./types";

interface AnimatedClickProps {
  children: React.ReactNode;
  as?: MotionTag;
  onClick?: React.MouseEventHandler;
  /** Desactiva la interacción (no eleva ni hunde) */
  disabled?: boolean;
  /** Solo hunde al pulsar, sin elevación al pasar el ratón */
  tapOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export default function AnimatedClick({
  children,
  as = "div",
  onClick,
  disabled = false,
  tapOnly = false,
  className,
  style,
  title,
}: AnimatedClickProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const inerte = disabled || reduce;

  return (
    <Tag
      className={className}
      style={style}
      title={title}
      onClick={disabled ? undefined : onClick}
      whileHover={inerte || tapOnly ? undefined : HOVER_LIFT}
      whileTap={inerte ? undefined : TAP_PRESS}
      transition={SPRING}
    >
      {children}
    </Tag>
  );
}
