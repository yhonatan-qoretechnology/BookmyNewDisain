"use client";
/* ============================================================
   Sidebar — navegación por rol · marca del negocio (tenant)
============================================================ */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_BY_ROLE, ROUTES, initials } from "@/constants";
import type { Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import { RoleBadge } from "@/components/ui/Badge";
import styles from "./Sidebar.module.css";

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
                <span>{t(`nav.${item.id}`)}</span>
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
