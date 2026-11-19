"use client";
/* ============================================================
   Barra que se llena de izquierda a derecha (MOTION_SPEC.md §6.10)
   ------------------------------------------------------------
   El relleno se revela con `clip-path`, no animando `width`:
   animar width obliga al navegador a recalcular el layout en
   cada fotograma y se nota el tirón.

   Hereda hidden/show del padre, así entra dentro de la cascada
   de su tarjeta o de su fila.
============================================================ */
import { motion } from "framer-motion";
import { ease } from "@/lib/motion";
import styles from "./ProgressFill.module.css";

type Props = {
  /** Porcentaje 0-100. Se recorta por si llega algo fuera de rango. */
  value: number;
  /**
   * Medidor EN VIVO (una grabación corriendo, una subida en marcha).
   *
   * Sin esto el componente es un REVELADO: descubre de un tirón un
   * relleno que ya tiene su ancho final, y eso solo sirve para un dato
   * que no se mueve. Puesto de medidor, el revelado se gastaba en el
   * primer fotograma —cuando el valor todavía era 0— y el progreso real
   * lo acababa dando el ancho, que sí recalcula el layout.
   *
   * En vivo no hay entrada: el relleno ocupa todo el carril y lo que
   * sigue al valor es el recorte, que solo repinta.
   */
  live?: boolean;
  className?: string;
};

export function ProgressFill({ value, live = false, className }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const recorte = (p: number) => `inset(0 ${100 - p}% 0 0 round 999px)`;

  return (
    <div className={className ? `${styles.track} ${className}` : styles.track}>
      {live ? (
        <motion.div
          className={styles.fill}
          style={{ width: "100%" }}
          initial={{ clipPath: recorte(0) }}
          animate={{ clipPath: recorte(pct) }}
          /* Corto y lineal: va detrás de un dato que cambia solo, y un
             muelle o un ease largo lo dejarían siempre por detrás. */
          transition={{ duration: 0.25, ease: "linear" }}
        />
      ) : (
        <motion.div
          className={styles.fill}
          style={{ width: `${pct}%` }}
          variants={{
            hidden: { clipPath: recorte(0) },
            show: {
              clipPath: recorte(100),
              transition: { duration: 0.7, ease: ease.outExpo },
            },
          }}
        />
      )}
    </div>
  );
}
