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
============================================================ */
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { SPRING } from "@/components/animations";
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
              <span className={styles.tabLabel}>{t.label}</span>
              {esActiva && (
                <motion.span
                  layoutId="tab-indicador"
                  className={styles.indicator}
                  transition={reduce ? { duration: 0 } : SPRING}
                />
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
