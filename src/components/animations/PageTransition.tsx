"use client";
/* ============================================================
   PageTransition — crossfade al cambiar de ruta
   ------------------------------------------------------------
   Envuelve el contenido del panel. Al cambiar `pathname` el bloque
   saliente se desvanece y el entrante aparece, en lugar del corte
   brusco por defecto.

   `mode="wait"` evita que las dos vistas se solapen y provoquen un
   salto de altura; la duración es corta (~0.18s) para que siga
   sintiéndose instantáneo.
============================================================ */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, RISE } from "./transitions";

export default function PageTransition({
  children,
  /** Identifica la vista: al cambiar, dispara el crossfade */
  routeKey,
}: {
  children: React.ReactNode;
  routeKey: string;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: RISE * 0.5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={EASE_OUT}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
