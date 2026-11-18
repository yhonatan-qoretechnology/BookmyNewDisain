"use client";
/* ============================================================
   Dock inferior (MOTION_SPEC.md §2.1, §6.8 · referencias 01 y 07)
   ------------------------------------------------------------
   Barra de pestañas en píldora, centrada sobre la ventana y fija
   por encima del contenido, con el MISMO indicador viajero del
   menú lateral (§6.5). A su derecha, separado, un botón circular
   "+" con la acción principal del panel: crear una reserva.

   En móvil es la navegación principal (el menú lateral es un
   cajón que hay que abrir); en escritorio convive con él.

   Vive en el AppShell, que es un layout persistente: entra una
   sola vez por carga y al navegar solo se mueve su indicador
   (§1, principio 5 — el armazón no se vuelve a animar).
============================================================ */
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion, type Variants } from "framer-motion";
import { ROUTES, navParaSesion } from "@/constants";
import type { Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { blurInSm, ease, spring } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import { seccionActiva, seccionesDelDock } from "./dockItems";
import styles from "./Dock.module.css";

/* Medido en el video (Anexo B): el dock sube ~45 px, sobrepasa ~15 %
   y se asienta a ~0.6 s; su ancho pasa de ~90 % a 100 % (eso es el
   `scale`, no un `width`: §8 prohíbe animar anchos).

   Los retardos van aquí dentro y no en los hijos porque el dock es
   una de las piezas con tiempo propio que permite §3.1: el resto del
   ritmo lo marcan `delayChildren` y `staggerChildren`. */
const DOCK: Variants = {
  hidden: { opacity: 0, y: 45, scale: 0.9, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: { ...spring.bouncy, delay: 0.57 },
      scale: { ...spring.bouncy, delay: 0.57 },
      opacity: { duration: 0.3, delay: 0.57 },
      filter: { duration: 0.35, delay: 0.57 },
      delayChildren: 0.77, // los labels, después del contenedor
      staggerChildren: 0.07,
    },
    transitionEnd: { filter: "none" }, // §3.1: sin esto el cristal se aplana
  },
};

/* §10 · con "reducir movimiento": sin blur, sin rebote y sin subida.
   El dock sigue apareciendo al final de la carga para no robarle la
   atención al contenido, pero con un fundido corto. */
const DOCK_PLANO: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.18, delay: 0.3, delayChildren: 0.35, staggerChildren: 0.03 },
  },
};
const TAB_PLANO: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

export default function Dock() {
  const pathname = usePathname();
  const { session } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const role: Rol = session?.role || "superadmin";
  const pro = session?.plan?.planEfectivo === "PRO";
  const items = useMemo(
    () => seccionesDelDock(role, navParaSesion(role, pro)),
    [role, pro]
  );

  const entrada = reduce ? DOCK_PLANO : DOCK;
  const pestana = reduce ? TAB_PLANO : blurInSm;

  /* El "+" lleva a crear una reserva, que es la acción principal del
     panel. La especialista no pasa por /reservas (el layout la
     devuelve a su panel), así que a ella no se le ofrece el botón. */
  const creaReservas = role !== "employee";

  /* Sin pestañas no hay barra. Con los roles de hoy nunca pasa
     (`seccionesDelDock` rellena hasta tres), y el hueco que el armazón
     reserva abajo va atado a este mismo `data-dock`, así que la barra y
     su sitio aparecen y desaparecen juntos. */
  if (items.length === 0) return null;

  const actual = seccionActiva(items, pathname);

  return (
    /* data-app-chrome: al imprimir, el armazón desaparece de la hoja. */
    <div className={styles.wrap} data-app-chrome data-dock>
      <LayoutGroup id="dock">
        <motion.nav
          className={styles.bar}
          aria-label={t("topbar.menu")}
          variants={entrada}
          initial="hidden"
          animate="show"
          style={{ transformOrigin: "50% 100%" }}
        >
          {items.map((item) => {
            const activo = item.id === actual;
            const label = t(`nav.${item.id}`);
            return (
              <motion.div key={item.id} className={styles.tabWrap} variants={pestana}>
                <Link
                  href={item.href}
                  className={`${styles.tab} ${activo ? styles.tabActive : ""}`}
                  aria-current={activo ? "page" : undefined}
                  /* En móvil el texto se oculta y queda solo el icono:
                     sin esto el enlace se quedaría sin nombre. */
                  aria-label={label}
                  title={label}
                >
                  {/* Hover: píldora translúcida (§6.14) */}
                  <span className={styles.tabHover} aria-hidden />
                  {/* Activo: la MISMA píldora viaja de una pestaña a otra */}
                  {activo && (
                    <motion.span
                      layoutId="dock-active-pill"
                      className={styles.tabPill}
                      transition={reduce ? { duration: 0 } : spring.indicator}
                      aria-hidden
                    />
                  )}
                  <span className={styles.tabIcon}>
                    <Icon name={item.icon} />
                  </span>
                  {/* El label hace crossfade con blur al ganar o perder el activo */}
                  <motion.span
                    key={activo ? "on" : "off"}
                    className={styles.tabLabel}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
                    animate={
                      reduce
                        ? { opacity: 1 }
                        : { opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }
                    }
                    transition={{ duration: 0.25, ease: ease.out }}
                  >
                    {label}
                  </motion.span>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        {creaReservas && (
          <motion.div
            className={styles.addWrap}
            variants={entrada}
            initial="hidden"
            animate="show"
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            /* Solo gobierna hover y tap: la entrada trae su propia
               transición dentro de la variante y esa manda. */
            transition={spring.hover}
            style={{ transformOrigin: "50% 100%" }}
          >
            <Link
              href={ROUTES.reservaNueva}
              className={styles.add}
              aria-label={t("reservas.modalTitle")}
              title={t("reservas.modalTitle")}
            >
              <Icon name="plus" />
            </Link>
          </motion.div>
        )}
      </LayoutGroup>
    </div>
  );
}
