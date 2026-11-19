"use client";
/* ============================================================
   Cabecera de la pantalla — migas y título
   ------------------------------------------------------------
   Vivía dentro de la barra de arriba. Ahora esa barra lleva la
   navegación, así que el título baja al contenido, que es donde
   lo pone la referencia.

   El título sigue siendo lo ÚNICO del armazón que se anima al
   navegar (MOTION_SPEC §6.6): el nuevo entra desde abajo y de
   desenfocado a nítido mientras el viejo se va. Comparten sitio
   -`popLayout` saca al que sale del flujo- para que la cabecera no
   dé un salto de alto.
============================================================ */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { ease } from "@/lib/motion";
import styles from "./PageHeader.module.css";

/** El hueco de la fila del título donde aterriza lo de cada pantalla. */
const HUECO_ACCIONES = "cabecera-acciones";

/**
 * Lo que una pantalla quiera poner EN LA FILA DEL TÍTULO, a la derecha.
 *
 * Se hace con un portal y no pasando la cabecera por props porque el
 * que pinta `<PageHeader>` es el armazón (AppShell), y el armazón no
 * sabe nada del contenido de cada pantalla. Con un portal, la pantalla
 * escribe su barra donde está y aparece arriba, sin que el armazón
 * tenga que conocerla ni que haya que pasar nodos de React por un
 * contexto (que obliga a memorizarlos para no repintar en bucle).
 *
 * El hueco existe desde el primer pintado, pero el portal necesita el
 * nodo DEL DOM, que solo hay tras montar: por eso el estado.
 */
export function AccionesDeCabecera({ children }: { children: ReactNode }) {
  const [hueco, setHueco] = useState<HTMLElement | null>(null);
  useEffect(() => setHueco(document.getElementById(HUECO_ACCIONES)), []);
  return hueco ? createPortal(children, hueco) : null;
}

export default function PageHeader({
  title,
  accent,
  breadcrumb,
  breadcrumbRoot,
}: {
  title: string;
  accent?: string;
  breadcrumb?: string;
  breadcrumbRoot?: string;
}) {
  const { session } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const inicio = session?.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard;

  return (
    <div className={styles.cabecera} data-app-chrome>
      <span className={styles.migas}>
        <Link href={inicio}>{breadcrumbRoot || t("topbar.breadcrumbRoot")}</Link>{" "}
        / <span>{breadcrumb || title}</span>
      </span>

      <div className={styles.fila}>
        <div className={styles.pila}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h1
              key={`${title}·${accent || ""}`}
              className={styles.titulo}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={
                reduce
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }
              }
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={reduce ? { duration: 0.15 } : { duration: 0.3, ease: ease.out }}
            >
              {title}
              {accent && <> <span className={styles.acento}>{accent}</span></>}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* El hueco de la derecha: aquí aterriza lo que cada pantalla
            quiera poner en la fila del título (ver AccionesDeCabecera).
            Se queda vacío en las pantallas que no pongan nada, y
            entonces no ocupa ni reserva sitio. */}
        <div className={styles.acciones} id={HUECO_ACCIONES} />
      </div>
    </div>
  );
}
