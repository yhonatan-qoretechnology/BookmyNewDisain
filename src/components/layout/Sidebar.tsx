"use client";
/* ============================================================
   Sidebar — navegación por rol · marca del negocio (tenant)
   Soporta ítems con submenú (NavItem.children): el grupo se
   despliega al hacer clic y se auto-abre cuando la ruta activa
   pertenece al grupo (p. ej. Facturación → Facturas · Gastos).
============================================================ */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_BY_ROLE, ROUTES, initials } from "@/constants";
import type { NavItem, Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import { RoleBadge } from "@/components/ui/Badge";
import styles from "./Sidebar.module.css";

/** ¿La ruta activa pertenece a este grupo? */
const grupoActivo = (item: NavItem, pathname: string): boolean =>
  !!item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`));

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

  const role: Rol = session?.role || "superadmin";
  const items = NAV_BY_ROLE[role];
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

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    router.push(ROUTES.login);
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>{initials(negocio).slice(0, 1)}</div>
          <div className={styles.brandText}>
            {negocio}<span>BookMy · {t("sidebar.platform")}</span>
          </div>
        </div>

        <div className={styles.roleWrap}>
          <RoleBadge role={role} label={t(`roles.${role}`)} />
        </div>

        <nav className={styles.navGroup}>
          {items.map((item) => {
            /* ── Ítem con submenú ───────────────────────────── */
            if (item.children?.length) {
              const abierto = !!abiertos[item.id];
              const enGrupo = grupoActivo(item, pathname);
              return (
                <div key={item.id} className={styles.group}>
                  <button
                    type="button"
                    className={`${styles.navItem} ${styles.groupToggle} ${enGrupo ? styles.navItemActive : ""}`}
                    onClick={() => toggleGrupo(item.id)}
                    aria-expanded={abierto}
                    aria-controls={`submenu-${item.id}`}
                  >
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
                </div>
              );
            }

            /* ── Ítem simple ────────────────────────────────── */
            const active = pathname === item.href;
            const isLogout = item.id === "logout";
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                onClick={isLogout ? handleLogout : onClose}
              >
                <span className={styles.navIcon}><Icon name={item.icon} /></span>
                <span className={styles.navLabel}>{t(`nav.${item.id}`)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.help}>
          <div className={styles.helpIcon}><Icon name="help" /></div>
          <h4>{t("sidebar.helpTitle")}</h4>
          <p>{role === "employee" ? t("sidebar.helpBodyEmployee") : t("sidebar.helpBody")}</p>
          <button className={styles.helpBtn} type="button">
            {role === "employee" ? t("sidebar.helpCtaEmployee") : t("sidebar.helpCta")}
          </button>
        </div>
      </aside>

      <div
        className={`${styles.backdrop} ${open ? styles.backdropShow : ""}`}
        onClick={onClose}
        aria-hidden
      />
    </>
  );
}
