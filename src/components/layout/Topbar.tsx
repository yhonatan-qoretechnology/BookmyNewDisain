"use client";
/* ============================================================
   Topbar — título, buscador, idioma, tema y usuario
============================================================ */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROUTES, initials } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { LOCALES, useI18n, type LocaleCode } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./Topbar.module.css";

/* ── Selector de idioma ───────────────────────────────────
   ⚙️ No requiere configuración: lista los idiomas de
   `src/i18n/config.ts`. Al agregar un idioma allí, aparece aquí. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  const pick = (code: LocaleCode) => {
    setLocale(code); // persiste en localStorage y en el parámetro de la sesión
    setOpen(false);
  };

  return (
    <div className={styles.langWrap} ref={ref}>
      <button
        className={styles.langToggle}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("topbar.language")}
      >
        <span className={styles.langFlag} aria-hidden>{current.flag}</span>
        {current.code.toUpperCase()}
        <svg className={styles.langCaret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className={styles.langMenu} role="listbox" aria-label={t("topbar.language")}>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              className={`${styles.langOption} ${l.code === locale ? styles.langOptionActive : ""}`}
              onClick={() => pick(l.code)}
            >
              <span className={styles.langFlag} aria-hidden>{l.flag}</span>
              {l.label}
              {l.code === locale && (
                <svg className={styles.langCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Topbar({
  title,
  accent,
  breadcrumb,
  breadcrumbRoot,
  bellCount = 6,
  onMenuToggle,
}: {
  title: string;
  accent?: string;
  breadcrumb?: string;
  breadcrumbRoot?: string;
  bellCount?: number;
  onMenuToggle: () => void;
}) {
  const { session } = useSession();
  const { toggleTheme, theme } = useTheme();
  const { t } = useI18n();

  const name = session?.name || "—";
  const role = session?.role || "superadmin";
  const roleLabel =
    role === "employee"
      ? `${session?.especialidad || t("roles.employee")} · ${session?.sedeName || ""}`
      : session?.sedeName || session?.negocioName || t(`roles.${role}`);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuToggle} onClick={onMenuToggle} aria-label={t("topbar.menu")}>
          <Icon name="menu" />
        </button>
        <div className={styles.leftCol}>
          <span className={styles.breadcrumb}>
            <Link href={role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard}>
              {breadcrumbRoot || t("topbar.breadcrumbRoot")}
            </Link>{" "}
            / <span>{breadcrumb || title}</span>
          </span>
          <h1 className={styles.pageTitle}>
            {title}
            {accent && <> <span className={styles.accent}>{accent}</span></>}
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <Icon name="search" />
          <input type="text" placeholder={t("topbar.searchPlaceholder")} aria-label={t("common.search")} />
        </div>

        {/* Selector de idioma — junto al botón de tema */}
        <LanguageToggle />

        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
        >
          <Icon name="moon" className={styles.iconMoon} />
          <Icon name="sun" className={styles.iconSun} />
        </button>

        <button className={styles.iconAction} aria-label={t("topbar.notifications")}>
          <Icon name="bell" />
          <span className={styles.bellDot}>{bellCount}</span>
        </button>

        <div className={styles.userChip}>
          <div className={styles.userAvatar}>{initials(name)}</div>
          <div>
            <div className={styles.userName}>{name}</div>
            <div className={styles.userRole}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
