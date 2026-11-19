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
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { ease } from "@/lib/motion";
import styles from "./PageHeader.module.css";

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
    </div>
  );
}
