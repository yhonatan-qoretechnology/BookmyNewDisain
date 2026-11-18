"use client";
/* ============================================================
   Sidebar — navegación por rol · marca del negocio (tenant)
   Soporta ítems con submenú (NavItem.children): el grupo se
   despliega al hacer clic y se auto-abre cuando la ruta activa
   pertenece al grupo (p. ej. Facturación → Facturas · Gastos).

   Movimiento (MOTION_SPEC.md §6.7, referencia 10): el panel entra
   una sola vez con una escala tipo gelatina desde abajo y sus
   ítems caen en cascada. Vive en un layout persistente, así que al
   navegar NO se vuelve a animar: lo único que se mueve es la
   píldora del ítem activo, que viaja de una opción a otra (§6.5).
============================================================ */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES, navParaSesion, initials } from "@/constants";
import type { NavItem, Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { rutaDeLogin } from "@/lib/loginOrigen";
import { LayoutGroup, motion, useReducedMotion, type Variants } from "framer-motion";
import { blurInSm, group, spring, stagger } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import { RoleBadge } from "@/components/ui/Badge";
import styles from "./Sidebar.module.css";

/** ¿La ruta activa pertenece a este grupo? */
const grupoActivo = (item: NavItem, pathname: string): boolean =>
  !!item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));

/* §6.5 · el lateral y el dock tienen que leer la ruta CON EL MISMO
   criterio, o al entrar en una subpágina se descoordinan: en
   /reservas/nueva (donde lleva el botón "+" del dock) la píldora del
   dock se queda en Reservas y la del lateral desaparecía, porque el
   ítem simple comparaba la ruta por igualdad exacta. Gana la ruta más
   larga que encaje, igual que `seccionActiva` de dockItems.ts.

   Fuera del concurso: "Cerrar sesión", que apunta al login, y
   cualquier href de un solo carácter, que encajaría con todo. */
const itemActivo = (items: NavItem[], pathname: string): string | null => {
  let mejor: NavItem | null = null;
  for (const item of items) {
    if (item.children?.length || item.id === "logout" || item.href.length < 2) continue;
    const encaja = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (encaja && (!mejor || item.href.length > mejor.href.length)) mejor = item;
  }
  return mejor?.id ?? null;
};

/* §10 · con "reducir movimiento" los ítems solo se funden: ni blur ni
   desplazamiento. El estado final es idéntico. */
const ITEM_PLANO: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

/**
 * Hueco entre ítems. El token son 60 ms (medidos en el video, que
 * tiene 9 opciones), pero el superadmin ve más de veinte: a 60 ms la
 * cascada duraría 1,4 s y §8 pone el techo de la carga en ~1,3 s. Con
 * menús cortos sale el valor del token tal cual; con menús largos se
 * aprieta para que la cascada entera quepa en 0,7 s.
 */
const huecoNav = (n: number) => Math.min(stagger.nav, 0.7 / Math.max(n, 1));

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useSession();
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const role: Rol = session?.role || "superadmin";
  /* El menú depende del plan del negocio: con Pro (contratado o de
     prueba) aparecen facturación, estadísticas, stock y comunicación. */
  const pro = session?.plan?.planEfectivo === "PRO";
  const items = useMemo(() => navParaSesion(role, pro), [role, pro]);

  /* Un solo ítem simple puede llevar la píldora, y si la ruta cae dentro
     de un grupo la lleva el grupo: las dos píldoras comparten layoutId,
     así que dibujar las dos a la vez las haría pelearse. */
  const idActivo = useMemo(() => {
    const enAlgunGrupo = items.some((i) => i.children?.length && grupoActivo(i, pathname));
    return enAlgunGrupo ? null : itemActivo(items, pathname);
  }, [items, pathname]);
  // Multi-tenant: la marca muestra el negocio del usuario
  const negocio = session?.negocioName || "BookMy";

  /* Grupos desplegados (por id). El grupo de la ruta activa se abre solo. */
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const activos: Record<string, boolean> = {};
    for (const item of items) {
      if (item.children && grupoActivo(item, pathname)) activos[item.id] = true;
    }
    if (Object.keys(activos).length) setAbiertos((prev) => ({ ...prev, ...activos }));
  }, [pathname, items]);

  const toggleGrupo = (id: string) =>
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));

  /* Se sale por la misma puerta por la que se entró (BookMy o QoreTech) */
  const loginHref = rutaDeLogin();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    router.push(loginHref);
  };

  /* Cascada de los ítems: el ritmo lo marca el contenedor con
     `delayChildren`/`staggerChildren`, nunca un `delay` por ítem (§3.1).
     Se memoriza para no fabricar un objeto nuevo en cada repintado. */
  const itemVar = reduce ? ITEM_PLANO : blurInSm;
  const navVariants = useMemo(() => group(huecoNav(items.length), 0.1), [items.length]);

  return (
    <>
      {/* El panel sube desde abajo, se pasa un poco y vuelve
          (referencia 10). Solo escala: §6.7 avisa de que `spring.jelly`
          únicamente vale para escalas pequeñas. El cajón de móvil se
          desplaza con la propiedad CSS `translate`, no con `transform`,
          precisamente para que esta escala no lo pise. */}
      <motion.aside
        className={`${styles.sidebar} ${open ? styles.open : ""}`}
        data-app-chrome
        initial={reduce ? false : { scale: 0.95 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={spring.jelly}
        style={{ transformOrigin: "50% 100%" }}
      >
        <div className={styles.brand}>
          <div className={styles.brandMark}>{initials(negocio).slice(0, 1)}</div>
          <div className={styles.brandText}>
            {negocio}<span>BookMy · {t("sidebar.platform")}</span>
          </div>
        </div>

        <div className={styles.roleWrap}>
          <RoleBadge role={role} label={t(`roles.${role}`)} />
        </div>

        <LayoutGroup id="sidebar">
        <motion.nav
          className={styles.navGroup}
          variants={navVariants}
          initial="hidden"
          animate="show"
        >
          {items.map((item) => {
            /* ── Ítem con submenú ───────────────────────────── */
            if (item.children?.length) {
              const abierto = !!abiertos[item.id];
              const enGrupo = grupoActivo(item, pathname);
              return (
                <motion.div key={item.id} className={styles.group} variants={itemVar}>
                  <button
                    type="button"
                    className={`${styles.navItem} ${styles.groupToggle} ${enGrupo ? styles.navItemActive : ""}`}
                    onClick={() => toggleGrupo(item.id)}
                    aria-expanded={abierto}
                    aria-controls={`submenu-${item.id}`}
                  >
                    {/* Estando dentro del grupo, la píldora viajera para
                        aquí: si no, al abrir Facturación desaparecía. */}
                    {enGrupo && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className={styles.navActiveBg}
                        transition={reduce ? { duration: 0 } : spring.indicator}
                        aria-hidden
                      />
                    )}
                    <span className={styles.navIcon}><Icon name={item.icon} /></span>
                    <span className={styles.navLabel}>{t(`nav.${item.id}`)}</span>
                    <svg
                      className={`${styles.caret} ${abierto ? styles.caretOpen : ""}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  <div
                    id={`submenu-${item.id}`}
                    className={`${styles.submenu} ${abierto ? styles.submenuOpen : ""}`}
                  >
                    <div className={styles.submenuInner}>
                      {item.children.map((sub) => {
                        const activo = pathname === sub.href;
                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            className={`${styles.subItem} ${activo ? styles.subItemActive : ""}`}
                            onClick={onClose}
                          >
                            <span className={styles.subDot} aria-hidden />
                            <span>{t(`nav.${sub.id}`)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            }

            /* ── Ítem simple ────────────────────────────────── */
            const active = item.id === idActivo;
            const isLogout = item.id === "logout";
            return (
              <motion.div key={item.id} variants={itemVar}>
                <Link
                  href={isLogout ? loginHref : item.href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  onClick={isLogout ? handleLogout : onClose}
                >
                  {/* Una única píldora con layoutId: al navegar VIAJA
                      desde la sección anterior en vez de saltar
                      (§6.5 · spring.indicator: pico de sobrepaso a
                      ~170 ms y asentada a ~400 ms). */}
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className={styles.navActiveBg}
                      transition={reduce ? { duration: 0 } : spring.indicator}
                      aria-hidden
                    />
                  )}
                  <span className={styles.navIcon}><Icon name={item.icon} /></span>
                  <span className={styles.navLabel}>{t(`nav.${item.id}`)}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
        </LayoutGroup>

        <div className={styles.help}>
          <div className={styles.helpIcon}><Icon name="help" /></div>
          <h4>{t("sidebar.helpTitle")}</h4>
          <p>{role === "employee" ? t("sidebar.helpBodyEmployee") : t("sidebar.helpBody")}</p>
          <Link className={styles.helpBtn} href={ROUTES.ayuda} onClick={onClose}>
            {role === "employee" ? t("sidebar.helpCtaEmployee") : t("sidebar.helpCta")}
          </Link>
        </div>
      </motion.aside>

      <div
        className={`${styles.backdrop} ${open ? styles.backdropShow : ""}`}
        onClick={onClose}
        aria-hidden
      />
    </>
  );
}
