"use client";
/* ============================================================
   Entrada de cada página del panel (MOTION_SPEC.md §5 y §6.1)
   ------------------------------------------------------------
   Al cambiar de sección, el contenido entra en cascada: cada
   bloque llega detrás del anterior con su propio desenfoque y su
   desplazamiento. El envoltorio solo marca el compás; el blur y
   el movimiento los pone cada sección con sus variants, porque
   difuminar la página entera de una vez está prohibido (§3.1) y
   además se nota en el rendimiento.

   POR QUÉ NO HAY SALIDA SOLAPADA
   ------------------------------------------------------------
   El §5 describe un cruce: la página vieja se difumina mientras
   la nueva entra. En el App Router eso exige congelar el contexto
   del router para el árbol que se va (el "FrozenRouter" que
   circula por ahí), porque si no, la vista saliente vuelve a
   pintarse con el contenido de la NUEVA ruta y se ve doble.

   Se montó y se midió en este panel, y congelar ese contexto lo
   rompe de dos maneras distintas, las dos comprobadas en el
   navegador:

     · Congelándolo siempre: la primera visita a cada sección se
       queda en su esqueleto PARA SIEMPRE. Next sirve el
       `loading.tsx` desde un Suspense y entrega el contenido de
       verdad por ese mismo contexto; congelado, la entrega nunca
       llega. Pasaba nada más iniciar sesión.
     · Congelándolo solo para la vista que sale: con `mode="sync"`
       solo funciona UNA navegación por carga de página; con
       `mode="wait"`, ninguna. El árbol viejo, re-renderizado con
       un contexto caducado, deja la transición del router sin
       cerrar y la URL nunca cambia.

   Un panel que no navega no es negociable, así que la salida
   solapada se queda fuera y el cruce se resuelve con la entrada:
   la cascada arranca enseguida (0,06 s) para que no haya un hueco
   en blanco entre una pantalla y otra.
============================================================ */
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { stagger } from "@/lib/motion";
import styles from "./PageTransition.module.css";

const construirVariants = (reducido: boolean): Variants => ({
  hidden: {},

  /* La primera carga espera un poco más (0,12 s) porque llega junto
     con el armazón, que también está entrando; al navegar arranca ya,
     que es cuando el usuario está esperando a ver algo. */
  show: (primera: boolean) => ({
    opacity: 1,
    transition: reducido
      ? { duration: 0.15, delayChildren: 0, staggerChildren: 0 }
      : { delayChildren: primera ? 0.12 : 0.06, staggerChildren: stagger.cards },
  }),
});

function useIsFirstRender() {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current;
}

export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const first = useIsFirstRender();
  /* §10: con "reducir movimiento" no hay cascada ni espera; la página
     aparece ya, con un fundido corto. El hook está suscrito a la media
     query, así que si se cambia la preferencia del sistema esto se
     re-renderiza; el useMemo solo evita rehacer el objeto en cada
     repintado. */
  const reduce = useReducedMotion();
  const variants = useMemo(() => construirVariants(!!reduce), [reduce]);

  return (
    /* La `key` es lo que hace que la cascada se repita en cada
       sección: React desmonta la vista anterior y monta la nueva
       desde `hidden`. */
    <motion.div
      key={routeKey}
      className={styles.stack}
      custom={first}
      variants={variants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}
