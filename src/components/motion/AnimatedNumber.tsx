"use client";
/* ============================================================
   Número que cuenta desde cero al aparecer (MOTION_SPEC.md §6.3)
   ------------------------------------------------------------
   Cuenta solo la primera vez que entra en pantalla. Si el dato
   cambia después, anima desde el valor actual al nuevo.

   `format` se queda fuera de las dependencias del efecto a
   proposito: casi siempre llega como funcion nueva en cada
   render, y meterla dentro relanzaria el conteo en cada repintado.
============================================================ */
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import styles from "./AnimatedNumber.module.css";

type Props = {
  value: number;
  /** Cómo se escribe el número (moneda, "K", %, locale). Por defecto, entero con separadores. */
  format?: (v: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
};

export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString(),
  duration = 1.1,
  delay = 0.1,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;

    /* Con "reducir movimiento" se muestra el valor final directo. */
    if (reduce) {
      current.current = value;
      el.textContent = formatRef.current(value);
      return;
    }

    const controls = animate(current.current, value, {
      duration,
      delay,
      ease: ease.outExpo,
      onUpdate: (v) => {
        current.current = v;
        el.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, reduce, duration, delay]);

  return (
    <span ref={ref} className={className ? `${styles.num} ${className}` : styles.num}>
      {format(0)}
    </span>
  );
}
