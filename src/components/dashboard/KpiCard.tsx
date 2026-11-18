"use client";
/* ============================================================
   Tarjeta KPI del dashboard (MOTION_SPEC.md §6.2, referencia 01)
   ------------------------------------------------------------
   Squircle con el icono arriba a la izquierda, sparkline arriba a
   la derecha, label pequeño, número grande y línea de variación
   con flecha.

   La tarjeta entra con `cardIn()` y ORQUESTA a sus hijos: icono →
   label → valor → variación → sparkline, cada uno 70 ms después
   del anterior (§4: "card + 130 → + 410"). Por eso la sparkline va
   la última del DOM: así se dibuja al final, como en el video.

   El número no se escribe: cuenta desde cero con AnimatedNumber,
   y el formato lo pone quien llama -el importe pasa por fmtMoneda
   del RegionContext, porque cada país tiene su moneda-.
============================================================ */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Sparkline } from "@/components/motion/Sparkline";
import Icon from "@/components/ui/Icon";
import { blurInSm, cardIn, spring, stagger } from "@/lib/motion";
import { entrada } from "./motionDashboard";
import styles from "./KpiCard.module.css";

/** Tonos disponibles. Cada uno redefine --accent para sí mismo, así
    el halo de .squircle sigue saliendo de un token y no de un color
    escrito a mano (ningún tono rompe marca, tema ni color del negocio). */
export type TonoKpi = "marca" | "verde" | "ambar" | "coral";

interface Props {
  /** Posición en la fila: marca cuándo empieza a contar el número. */
  index: number;
  icono: ReactNode;
  label: string;
  /** Cifra que cuenta desde 0. */
  valor?: number;
  /** Cifra ya escrita, para lo que no es un número (la valoración). */
  texto?: ReactNode;
  /** Cómo se escribe `valor` (moneda, decimales, %). */
  formato?: (n: number) => string;
  /** Path de la sparkline (viewBox 0 0 64 24). null = sin serie. */
  spark?: string | null;
  /** Variación en % contra el periodo anterior. null = sin flecha. */
  variacion?: number | null;
  /** Texto de la línea de abajo (con o sin variación delante). */
  pie?: string;
  tono?: TonoKpi;
}

export default function KpiCard({
  index,
  icono,
  label,
  valor,
  texto,
  formato,
  spark,
  variacion,
  pie,
  tono = "marca",
}: Props) {
  const reduce = useReducedMotion();
  const sube = (variacion ?? 0) >= 0;

  return (
    <motion.article
      className={`glass-card ${styles.card} ${styles[tono]}`}
      variants={entrada(reduce, cardIn())}
      whileHover={reduce ? undefined : { y: -5 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      /* Solo gobierna hover y tap: show y exit traen la suya. */
      transition={spring.hover}
    >
      <motion.div variants={entrada(reduce, blurInSm)} className={`squircle ${styles.icono}`}>
        {icono}
      </motion.div>

      <motion.p variants={entrada(reduce, blurInSm)} className={styles.label}>
        {label}
      </motion.p>

      <motion.p variants={entrada(reduce, blurInSm)} className={styles.valor}>
        {valor != null ? (
          <AnimatedNumber
            value={valor}
            format={formato}
            delay={0.35 + index * stagger.cards}
          />
        ) : (
          texto
        )}
      </motion.p>

      <motion.p variants={entrada(reduce, blurInSm)} className={styles.pie}>
        {variacion != null && (
          <span className={sube ? styles.sube : styles.baja}>
            <Icon name={sube ? "trend-up" : "trendDown"} width={14} height={14} />
            {sube ? "+" : "−"}
            {Math.abs(Math.round(variacion))}%
          </span>
        )}
        {pie}
      </motion.p>

      {/* Última del DOM a propósito: se dibuja al final de la cascada. */}
      {spark && (
        <div className={styles.spark}>
          <Sparkline d={spark} />
        </div>
      )}
    </motion.article>
  );
}
