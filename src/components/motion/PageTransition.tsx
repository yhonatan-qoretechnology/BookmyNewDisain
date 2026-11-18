"use client";
/* ============================================================
   Cruce entre páginas del panel (MOTION_SPEC.md §6.1)
   ------------------------------------------------------------
   La página que sale se difumina escalonada mientras la nueva
   entra en cascada, y las dos se solapan. Comparten celda de
   grid para que el cruce no empuje el layout ni dé saltos.

   El FrozenRouter es necesario en el App Router: sin él, Next
   sustituye el contenido en cuanto cambia la ruta y la
   animación de salida no llega a verse. Congela el contexto del
   router para el árbol que se está yendo.

   Ese import es interno de Next y puede cambiar entre versiones.
   Comprobado en la 14.2.5, que es la del proyecto. Si un día
   desaparece, el panel sigue funcionando: se quita el
   FrozenRouter y quedan solo las entradas.
============================================================ */
import { useEffect, useRef, useContext, type ReactNode } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { stagger } from "@/lib/motion";
import styles from "./PageTransition.module.css";

const page: Variants = {
  hidden: {},
  /* La primera carga arranca antes (0.12 s) porque no hay nada que
     esperar; al navegar se deja 0.25 s para que la salida de la
     anterior se solape con la entrada de esta. */
  show: (first: boolean) => ({
    transition: { delayChildren: first ? 0.12 : 0.25, staggerChildren: stagger.cards },
  }),
  exit: { transition: { staggerChildren: stagger.exit } },
};

function useIsFirstRender() {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current;
}

function FrozenRouter({ children }: { children: ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}

export function PageTransition({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const first = useIsFirstRender();

  return (
    <div className={styles.stack}>
      <AnimatePresence custom={first} mode="sync">
        <motion.div
          key={routeKey}
          custom={first}
          variants={page}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <FrozenRouter>{children}</FrozenRouter>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
