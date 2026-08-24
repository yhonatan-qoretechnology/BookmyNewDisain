"use client";
/* ============================================================
   Reveal — aparece al entrar en pantalla
   ------------------------------------------------------------
   Para contenido por debajo del pliegue (gráficas, bloques largos):
   en lugar de animarse al montar —cuando aún no se ve— espera a
   que el usuario llegue hasta él.

   `once` evita que se repita al subir y bajar, que es lo que hace
   que este recurso canse.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { RISE, SPRING } from "./transitions";
import type { MotionTag } from "./types";

export default function Reveal({
  children,
  as = "div",
  delay = 0,
  amount = 0.2,
  once = true,
  className,
  style,
}: {
  children: React.ReactNode;
  as?: MotionTag;
  delay?: number;
  /** Porción del bloque que debe verse para disparar (0–1) */
  amount?: number;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: RISE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </Tag>
  );
}
