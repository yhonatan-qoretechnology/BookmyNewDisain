"use client";
/* ============================================================
   AnimatedNumber — cifras que cuentan hasta su valor
   ------------------------------------------------------------
   Usa un MotionValue con muelle en vez de un setInterval: el
   navegador interpola fuera del ciclo de React, así que la cuenta
   no provoca un re-render por fotograma.

   `format` permite reutilizarlo con moneda, porcentajes o enteros
   sin duplicar el componente.
============================================================ */
import { useEffect, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";

export default function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  /** Muelle más suave que el general: las cifras largas marean si van rápidas */
  stiffness = 90,
  damping = 22,
}: {
  value: number;
  format?: (n: number) => string;
  stiffness?: number;
  damping?: number;
}) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness, damping, mass: 1 });
  const [texto, setTexto] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    if (reduce) { setTexto(format(value)); return; }
    motionValue.set(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  useEffect(() => {
    if (reduce) return;
    return spring.on("change", (n) => setTexto(format(n)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spring, reduce]);

  return <>{texto}</>;
}
