"use client";
/* ============================================================
   Tabs — pestañas con indicador deslizante
   ------------------------------------------------------------
   El subrayado no se pinta con `border-bottom` en el botón activo,
   sino como un único elemento con `layoutId`. Al cambiar de
   pestaña, framer-motion reconoce que es el MISMO nodo y anima su
   posición y anchura entre una y otra: el subrayado se desliza en
   lugar de saltar.

   El contenido también aparece con un desvanecido corto ligado a
   la pestaña activa, así el cambio de panel no es un corte seco.

   Desde la fase 2 el indicador no es un subrayado sino la píldora
   sólida entera (MOTION_SPEC.md §2.2 y §6.5): viaja con `spring.indicator`
   —sobrepasa un 10 % y se asienta en menos de medio segundo— y el
   rótulo que gana o pierde el activo hace un fundido con desenfoque.
============================================================ */
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { ease, spring } from "@/lib/motion";
import styles from "./Tabs.module.css";

export interface TabDef {
  id: string;
  label: React.ReactNode;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  /* Aísla el layoutId por instancia: dos grupos de pestañas en la
     misma pantalla no deben compartir (ni robarse) el indicador. */
  const grupo = useId();

  return (
    <LayoutGroup id={grupo}>
      <div className={styles.tabBar} role="tablist">
        {tabs.map((t) => {
          const esActiva = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={esActiva}
              className={`${styles.tabBtn} ${esActiva ? styles.active : ""}`}
              onClick={() => onChange(t.id)}
            >
              {esActiva && (
                <motion.span
                  layoutId="tab-indicador"
                  className={styles.indicator}
                  transition={reduce ? { duration: 0 } : spring.indicator}
                />
              )}
              {/* El rótulo cruza con desenfoque al cambiar de color (§6.5).
                  La `key` fuerza el remontaje, que es lo que dispara el
                  fundido; sin ella el color saltaría de golpe. */}
              <motion.span
                key={esActiva ? "on" : "off"}
                className={styles.tabLabel}
                initial={reduce ? false : { opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
                transition={{ duration: 0.25, ease: ease.out }}
              >
                {t.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
