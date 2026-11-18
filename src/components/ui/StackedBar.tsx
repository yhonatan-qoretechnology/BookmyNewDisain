"use client";
/* ============================================================
   StackedBar — barra apilada por segmentos
   ------------------------------------------------------------
   MOTION_SPEC.md §6.10 ("Barra apilada (Invoices)") y las
   referencias 04 y 09: la barra se llena de izquierda a derecha,
   un segmento tras otro, con 0.12 s entre ellos.

   Reparte un total ya calculado; no hace cuentas de negocio.
   El color sale de `tono`, que solo admite tokens que ya existen
   en la paleta: así la barra sigue al tema, a la marca y al color
   que cada negocio elige, y no hay forma de colar un color suelto.
============================================================ */
import { motion, useReducedMotion } from "framer-motion";
import { ease, group } from "@/lib/motion";
import styles from "./StackedBar.module.css";

export type TonoSegmento = "accent" | "green" | "amber" | "red" | "blue" | "neutral";

export interface SegmentoBarra {
  id: string;
  /** Parte del total que ocupa este segmento */
  valor: number;
  /** Rótulo ya traducido */
  label: string;
  /** Cifra ya formateada (moneda, porcentaje…) para la leyenda */
  texto?: string;
  tono: TonoSegmento;
}

export default function StackedBar({
  segmentos,
  total,
  leyenda = true,
  "aria-label": ariaLabel,
}: {
  segmentos: SegmentoBarra[];
  /** Si no se pasa, es la suma de los segmentos */
  total?: number;
  leyenda?: boolean;
  "aria-label"?: string;
}) {
  const reduce = useReducedMotion();
  const suma = total ?? segmentos.reduce((s, x) => s + x.valor, 0);

  /* Sin datos la barra sería una pista vacía que no dice nada. */
  if (!suma) return null;

  const visibles = segmentos.filter((s) => s.valor > 0);

  return (
    <div className={styles.wrap}>
      {/* El contenedor orquesta; los segmentos se revelan uno tras otro.
          Lleva su propio initial/animate para no depender de que algún
          día haya o no una cascada de página por encima. */}
      <motion.div
        className={styles.track}
        role="img"
        aria-label={ariaLabel}
        variants={group(0.12, 0.1)}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        {visibles.map((s) => (
          <motion.span
            key={s.id}
            className={`${styles.segmento} ${styles[s.tono]}`}
            style={{ flex: `${s.valor} 1 0` }}
            variants={{
              hidden: { clipPath: "inset(0 100% 0 0 round 999px)" },
              show: {
                clipPath: "inset(0 0% 0 0 round 999px)",
                transition: { duration: 0.5, ease: ease.outExpo },
              },
            }}
          />
        ))}
      </motion.div>

      {leyenda && (
        <div className={styles.leyenda}>
          {visibles.map((s) => (
            <span key={s.id} className={styles.chip}>
              <span className={`${styles.punto} ${styles[s.tono]}`} aria-hidden />
              {s.label}
              {s.texto && <b className={styles.valor}>{s.texto}</b>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
