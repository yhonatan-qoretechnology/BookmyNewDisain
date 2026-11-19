"use client";
/* Las tarjetas de KPI entran escalonadas con la rejilla y se elevan
   al pasar el ratón; el movimiento se define en el sistema de
   animaciones para que todas las superficies compartan curva. */
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "@/components/animations";
import { cardIn, group, spring, stagger } from "@/lib/motion";
import styles from "./StatCard.module.css";

export type StatColor = "teal" | "amber" | "red" | "blue" | "purple" | "green" | "navy" | "coral";

export function StatGrid({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      className={styles.statGrid}
      initial="hidden"
      animate="show"
      variants={group(reduce ? 0 : stagger.cards, reduce ? 0 : 0.02)}
    >
      {children}
    </motion.section>
  );
}

export default function StatCard({
  color,
  icon,
  label,
  value,
  count,
  format,
  delta,
  deltaPositive = true,
  footer,
}: {
  color: StatColor;
  icon: React.ReactNode;
  label: string;
  /** Cifra ya formateada. Alternativa a `count` cuando no es numérica. */
  value?: React.ReactNode;
  /** Si se pasa, la cifra cuenta hasta este valor en vez de aparecer fija */
  count?: number;
  /** Da formato a `count` (moneda, decimales, sufijos…) */
  format?: (n: number) => string;
  delta?: string;
  deltaPositive?: boolean;
  footer?: string;
}) {
  const reduce = useReducedMotion();
  return (
    /* 6.14: la tarjeta sube 5 px al pasar por encima y se hunde al
       pulsarla. Las clases globales ponen el material: cristal en la
       tarjeta, plastilina en el squircle del icono. */
    <motion.div
      className={`glass-card ${styles.statCard}`}
      variants={reduce ? undefined : cardIn()}
      whileHover={reduce ? undefined : { y: -5 }}
      /* Sin `whileTap`: la tarjeta KPI no recibe onClick, y dar respuesta
         de pulsación a algo que no se pulsa engaña al dedo. El §6.14 pide
         el hundido para un KPI pulsable; SimpleCard lo condiciona igual. */
      transition={spring.hover}
    >
      <div className={`squircle ${styles.iconWrap} ${styles[color]}`}>{icon}</div>
      <div className={styles.top}>
        <div className={styles.body}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>
            {count != null
              ? <AnimatedNumber value={count} format={format} />
              : value}
          </span>
        </div>
      </div>
      {(delta || footer) && (
        <div className={styles.footer}>
          {delta && (
            <span className={deltaPositive ? styles.deltaPos : styles.deltaNeg}>{delta}</span>
          )}
          {footer}
        </div>
      )}
    </motion.div>
  );
}
