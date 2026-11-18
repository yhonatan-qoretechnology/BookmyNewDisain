/* ============================================================
   Atajos de movimiento del dashboard
   ------------------------------------------------------------
   El movimiento NO se define aquí: sale todo de src/lib/motion.ts
   (MOTION_SPEC.md §3). La única excepción es la duración del fundido
   corto del §10, que es el valor de NO animar y por eso no tiene
   token. Esto resuelve una pregunta que se repite en cada pieza:
   "¿y si el usuario pidió menos movimiento?".

   framer-motion, con reducedMotion="user", apaga los `transform` y
   las animaciones de layout, pero NO el `filter`: el desenfoque
   seguiría corriendo. El §10 pide justo lo contrario -sin blur,
   sin rebotes, fundidos cortos-, así que la decisión se toma aquí
   una vez y las tarjetas solo preguntan.
============================================================ */
import type { Variants } from "framer-motion";
import { group } from "@/lib/motion";

/** Fundido corto, sin blur ni desplazamiento (§10). */
export const suave: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** La entrada normal, o el fundido corto si se pidió menos movimiento. */
export function entrada(reduce: boolean | null, normal: Variants): Variants {
  return reduce ? suave : normal;
}

/** Grupo que orquesta hijos; con movimiento reducido, sin cascada. */
export function grupo(reduce: boolean | null, gap: number, delay = 0): Variants {
  return reduce ? group(0, 0) : group(gap, delay);
}
