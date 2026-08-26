"use client";
/* ============================================================
   FadeIn — monta un elemento con desvanecido y subida sutil
   ------------------------------------------------------------
   Envuelve cualquier bloque:  <FadeIn><Panel>…</Panel></FadeIn>

   `as` permite renderizar la etiqueta correcta (section, li, tr…)
   en lugar de meter siempre un <div>, que rompería tablas y listas.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, RISE, SPRING } from "./transitions";
import type { MotionTag } from "./types";

interface FadeInProps {
  children: React.ReactNode;
  /** Etiqueta a renderizar (por defecto div) */
  as?: MotionTag;
  /** Retardo en segundos antes de entrar */
  delay?: number;
  /** Desplazamiento vertical inicial; 0 = solo desvanecido */
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function FadeIn({
  children,
  as = "div",
  delay = 0,
  y = RISE,
  className,
  style,
}: FadeInProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  /* Accesibilidad: quien pide menos movimiento recibe solo el
     desvanecido, nunca desplazamiento. */
  const desde = reduce ? { opacity: 0 } : { opacity: 0, y };
  const hasta = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <Tag
      className={className}
      style={style}
      initial={desde}
      animate={hasta}
      transition={{ ...(reduce ? EASE_OUT : SPRING), delay }}
    >
      {children}
    </Tag>
  );
}
