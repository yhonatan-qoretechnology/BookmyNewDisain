"use client";
/* ============================================================
   Pestañas de la sección — el submenú, dentro de la pantalla
   ------------------------------------------------------------
   Hay secciones con hijos (hoy solo Facturación: Tickets, Facturas
   y Gastos). Esos hijos existían en el menú desde siempre, pero el
   armazón nuevo NO los pintaba en ningún sitio: solo los usaba para
   saber qué icono marcar. Se llegaba a /facturacion/gastos
   escribiendo la dirección a mano.

   Ahora están en dos sitios, que es lo que se decidió:
     · en la burbuja del raíl, para saltar directo desde cualquier
       pantalla (Rail.tsx);
     · aquí, en una fila bajo el título, para moverse entre ellas una
       vez dentro. Esta es además la vía del teclado: la burbuja vive
       en un portal y sus enlaces se quedan fuera del tabulador.

   No pinta nada si la sección en la que estás no tiene hijos, así
   que puede vivir en el armazón sin que cada pantalla se entere.

   El subrayado del activo es un solo nodo con `layoutId`, igual que
   el de la barra de arriba: VIAJA de una pestaña a otra en vez de
   aparecer y desaparecer (MOTION_SPEC §6.5).
============================================================ */
import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { navParaSesion } from "@/constants";
import type { Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { spring } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import { hijoActivo, seccionConHijos } from "./reparto";
import styles from "./SubTabs.module.css";

export default function SubTabs() {
  const pathname = usePathname();
  const { session } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const role: Rol = session?.role || "superadmin";
  const pro = session?.plan?.planEfectivo === "PRO";
  const menu = useMemo(() => navParaSesion(role, pro), [role, pro]);
  const seccion = useMemo(() => seccionConHijos(menu, pathname), [menu, pathname]);
  const activo = useMemo(() => (seccion ? hijoActivo(seccion, pathname) : null), [seccion, pathname]);

  if (!seccion?.children?.length) return null;

  return (
    <LayoutGroup id="subtabs">
      <nav className={styles.tabs} data-app-chrome aria-label={t(`nav.${seccion.id}`)}>
        {seccion.children.map((h) => {
          const esActivo = h.id === activo;
          return (
            <Link
              key={h.id}
              href={h.href}
              className={`${styles.tab} ${esActivo ? styles.tabActivo : ""}`}
              aria-current={esActivo ? "page" : undefined}
            >
              <Icon name={h.icon} width={15} height={15} />
              {t(`nav.${h.id}`)}
              {esActivo && (
                <motion.span
                  layoutId="subtab-activo"
                  className={styles.subrayado}
                  transition={reduce ? { duration: 0 } : spring.indicator}
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
