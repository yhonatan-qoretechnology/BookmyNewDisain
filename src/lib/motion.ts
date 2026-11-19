/* ============================================================
   Tokens de movimiento del panel — "Soft 3D / Clay-Glass"
   ------------------------------------------------------------
   Valores medidos del video de referencia a 30 fps; ver
   MOTION_SPEC.md §3 y las imágenes de docs/motion/referencias/.
   NO se tocan a ojo: si algo se siente raro, se cambia aquí y
   cambia en todo el panel a la vez.

   El proyecto ya traía framer-motion, así que se importa de ahí
   (misma API que el paquete `motion`, ver MOTION_SPEC.md §0.3).
============================================================ */
import type { Transition, Variants } from "framer-motion";

type Bezier = [number, number, number, number];

export const ease: Record<"out" | "outExpo" | "inOut", Bezier> = {
  out: [0.22, 1, 0.36, 1], // entradas: fade, blur, desplazamientos
  outExpo: [0.16, 1, 0.3, 1], // contadores, barras, líneas
  inOut: [0.65, 0, 0.35, 1], // salidas
};

export const spring = {
  /** Pill activo (sidebar y dock). Pico de sobrepaso a ~170 ms (~10 %), asentado en ~400 ms. */
  indicator: { type: "spring", stiffness: 500, damping: 26, mass: 1 },
  /** Objetos que entran con rebote visible: dock, ilustración 3D. ~12 % de sobrepaso, ~0.75 s. */
  bouncy: { type: "spring", stiffness: 100, damping: 11, mass: 1 },
  /** Panel del sidebar al cargar: rebote corto tipo "gelatina". Solo con escalas pequeñas (0.95 → 1). */
  jelly: { type: "spring", stiffness: 350, damping: 8, mass: 1 },
  /** Hover / tap. */
  hover: { type: "spring", stiffness: 400, damping: 22, mass: 1 },
  /** Pop-in sin rebote visible (planta, badges). */
  pop: { type: "spring", stiffness: 260, damping: 22, mass: 1 },
} satisfies Record<string, Transition>;

export const stagger = {
  nav: 0.06, // ítems del sidebar
  cards: 0.065, // KPI cards, chips, columnas, secciones
  inner: 0.07, // hijos dentro de una tarjeta
  items: 0.045, // ítems de lista, tarjetas dentro de una columna
  rows: 0.04, // filas de tabla
  chat: 0.05, // burbujas
  exit: 0.035, // salida escalonada al cambiar de página
};

/** Grupo que orquesta a sus hijos (no se anima él mismo). */
export const group = (gap: number = stagger.cards, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
  exit: { transition: { staggerChildren: stagger.exit } },
});

/* Por qué `transitionEnd: { filter: "none" }` en todas las variantes que
   usan blur (MOTION_SPEC.md §3.1): un `filter` distinto de `none` -aunque
   sea blur(0px)- convierte al elemento en contenedor de sus hijos
   `position: fixed`, lo que rompe desplegables, tooltips y modales, y
   además corta el `backdrop-filter` de los hijos, dejando el cristal
   plano. Se limpia al terminar la animación. */

/** Blur reveal estándar: secciones, ítems, tarjetas simples. */
export const blurIn: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: ease.out },
    transitionEnd: { filter: "none" },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(8px)",
    transition: { duration: 0.25, ease: ease.inOut },
  },
};

/** Versión ligera para texto, iconos y labels dentro de tarjetas. */
export const blurInSm: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: ease.out },
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.2, ease: ease.inOut } },
};

/** Tarjeta que además orquesta a sus hijos (icono → label → valor → delta → gráfico). */
export const cardIn = (childDelay = 0.13, gap: number = stagger.inner): Variants => ({
  hidden: { opacity: 0, y: 12, scale: 0.97, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: ease.out, delayChildren: childDelay, staggerChildren: gap },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});

/** Objetos 3D que suben con rebote (ilustración del hero). Úsalo con initial/animate propios. */
export const riseIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 48, scale: 0.92, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.bouncy, delay },
      scale: { ...spring.bouncy, delay },
      opacity: { duration: 0.3, delay },
      filter: { duration: 0.35, delay },
    },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});

/** Objetos que "crecen" desde abajo sin rebote visible (planta, decoraciones). */
export const growIn = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 16, scale: 0.75, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.pop, delay },
      scale: { ...spring.pop, delay },
      opacity: { duration: 0.25, delay },
      filter: { duration: 0.3, delay },
    },
    transitionEnd: { filter: "none" },
  },
  exit: blurIn.exit,
});
