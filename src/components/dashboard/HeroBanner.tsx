"use client";
/* ============================================================
   Banner del dashboard (MOTION_SPEC.md §6.9, referencias 01 y 12)
   ------------------------------------------------------------
   Saludo, resumen del día con los números en negrita y un CTA en
   píldora; a la izquierda la ilustración 3D y al borde derecho la
   planta. La base en relieve la pone la clase global .hero-3d.

   Los tiempos salen del §4 y NO se tocan a ojo:
     · el banner entra a los 120 ms con la cascada de la página;
     · sus textos, a 300 / 370 / 440 ms (cardIn(0.18) + 70 ms);
     · la ilustración sube a los 450 ms con rebote (riseIn);
     · la planta aparece tarde, a los 970 ms, creciendo desde
       abajo (growIn), igual que en la referencia 11.
   Ilustración y planta llevan initial/animate propios porque su
   tiempo es especial: si heredaran la cascada, entrarían con los
   textos.
============================================================ */
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { blurInSm, cardIn, growIn, riseIn } from "@/lib/motion";
import { entrada } from "./motionDashboard";
import { ArtePlanta, ArteVentana } from "./HeroArte";
import styles from "./HeroBanner.module.css";

export interface DatoHero {
  etiqueta: string;
  valor: number;
}

interface Props {
  /** "Buenas tardes, Marta" — ya montado por quien llama. */
  saludo: string;
  /** Lo que hay hoy sobre la mesa. Números reales; nunca de relleno. */
  datos: DatoHero[];
  cta: string;
  onCta: () => void;
  /** Píldora flotante de la esquina (la última reserva). Sin datos, nada. */
  chip?: string | null;
  /** Acción secundaria opcional («Personaliza tu panel», solo al dueño). */
  extra?: ReactNode;
}

export default function HeroBanner({ saludo, datos, cta, onCta, chip, extra }: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.section className={`hero-3d ${styles.hero}`} variants={entrada(reduce, cardIn(0.18))}>
      {/* Decoraciones sin variants: entran con el banner, no después */}
      <span className={styles.brillo} aria-hidden />
      <span className={`${styles.chispa} ${styles.chispaA}`} aria-hidden />
      <span className={`${styles.chispa} ${styles.chispaB}`} aria-hidden />
      {chip && (
        <div className={`pill ${styles.chip}`}>
          <span className={styles.chipPunto} aria-hidden />
          {chip}
        </div>
      )}
      <div className={styles.burbuja} aria-hidden>
        <i /><i /><i />
      </div>

      <motion.div
        className={styles.arte}
        variants={entrada(reduce, riseIn(0.45))}
        initial="hidden"
        animate="show"
      >
        {/* Flotación muy lenta, solo para que no parezca pegado al fondo */}
        <motion.div
          className={styles.arteFlota}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
        >
          <ArteVentana className={styles.svgVentana} />
        </motion.div>
      </motion.div>

      <div className={styles.texto}>
        <motion.h2 className={styles.saludo} variants={entrada(reduce, blurInSm)}>
          {saludo}
        </motion.h2>
        <motion.p className={styles.resumen} variants={entrada(reduce, blurInSm)}>
          {datos.map((d) => (
            <span key={d.etiqueta}>
              {d.etiqueta} <b>{d.valor}</b>
            </span>
          ))}
        </motion.p>
        <motion.div className={styles.acciones} variants={entrada(reduce, blurInSm)}>
          <Button onClick={onCta}>
            <Icon name="plus" /> {cta}
          </Button>
          {extra}
        </motion.div>
      </div>

      <motion.div
        className={styles.planta}
        variants={entrada(reduce, growIn(0.97))}
        initial="hidden"
        animate="show"
      >
        <ArtePlanta className={styles.svgPlanta} />
      </motion.div>
    </motion.section>
  );
}
