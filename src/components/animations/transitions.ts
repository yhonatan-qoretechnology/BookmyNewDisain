/* ============================================================
   Tokens de movimiento — una sola fuente de verdad
   ------------------------------------------------------------
   Igual que los colores viven en globals.css, las curvas viven
   aquí: si el movimiento se define en cada componente, la app
   acaba con veinte velocidades distintas y deja de sentirse
   como un mismo producto.

   Regla: nada lineal y nada lento. Los muelles se sienten
   inmediatos pero sin rebote; las salidas usan una curva de
   desaceleración corta porque un `spring` de salida deja restos
   visibles al desmontar.
============================================================ */
import type { Transition, Variants } from "framer-motion";

/** Muelle por defecto: reacciona al instante y asienta sin rebote */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/** Muelle más blando para superficies grandes (modales, paneles) */
export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 28,
  mass: 0.9,
};

/** Salidas y crossfades: duración corta con desaceleración */
export const EASE_OUT: Transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
};

/** Desplazamiento vertical de entrada, en píxeles */
export const RISE = 15;

/** Retardo entre hijos de una lista escalonada */
export const STAGGER = 0.06;

/* ── Variantes compartidas ──────────────────────────────── */

/** Entrada con desvanecido + subida sutil */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: RISE },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, y: -8, transition: EASE_OUT },
};

/** Contenedor que orquesta la entrada de sus hijos */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren: 0.02 } },
  exit: {},
};

/** Hijo de una lista escalonada */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: RISE },
  visible: { opacity: 1, y: 0, transition: SPRING },
  exit: { opacity: 0, transition: EASE_OUT },
};

/* ── Microinteracciones ─────────────────────────────────── */

/** Elevación al pasar el ratón sobre algo pulsable */
export const HOVER_LIFT = { y: -2, scale: 1.01 };
/** Respuesta física al pulsar */
export const TAP_PRESS = { scale: 0.97 };
