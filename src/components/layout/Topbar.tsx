"use client";
/* ============================================================
   Topbar — título, idioma, tema y usuario
============================================================ */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROUTES, fotoUrl, initials } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { LOCALES, useI18n, type LocaleCode } from "@/i18n";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, SPRING } from "@/components/animations";
import { ease } from "@/lib/motion";
import Icon from "@/components/ui/Icon";
import NotificationBell from "./NotificationBell";
import styles from "./Topbar.module.css";

/* ── Selector de idioma ───────────────────────────────────
   ⚙️ No requiere configuración: lista los idiomas de
   `src/i18n/config.ts`. Al agregar un idioma allí, aparece aquí. */
export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

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
        <span className={styles.langLabel}>{current.code.toUpperCase()}</span>
        <svg className={styles.langCaret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          className={styles.langMenu}
          role="listbox"
          aria-label={t("topbar.language")}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
          transition={reduce ? EASE_OUT : SPRING}
          style={{ transformOrigin: "top right" }}
        >
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              className={`${styles.langOption} ${l.code === locale ? styles.langOptionActive : ""}`}
              onClick={() => pick(l.code)}
            >
              {l.label}
              {l.code === locale && (
                <svg className={styles.langCheck} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default function Topbar({
  title,
  accent,
  breadcrumb,
  breadcrumbRoot,
  onMenuToggle,
}: {
  title: string;
  accent?: string;
  breadcrumb?: string;
  breadcrumbRoot?: string;
  /** @deprecated la campana ya trae su propio contador real (NotificationBell). Prop ignorada, se deja para no romper a quien todavía la pase. */
  bellCount?: number;
  onMenuToggle: () => void;
}) {
  const { session } = useSession();
  const { toggleTheme, theme } = useTheme();
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const name = session?.name || "—";
  const role = session?.role || "superadmin";
  const roleLabel =
    role === "employee"
      ? `${session?.especialidad || t("roles.employee")} · ${session?.sedeName || ""}`
      : session?.sedeName || session?.negocioName || t(`roles.${role}`);

  return (
    <header className={styles.topbar} data-app-chrome>
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
          {/* El título es lo ÚNICO del armazón que se anima al navegar
              (MOTION_SPEC §6.6): el nuevo entra desde abajo y de
              desenfocado a nítido mientras el viejo se va. Comparten
              sitio -`popLayout` saca al que sale del flujo- para que la
              cabecera no dé un salto de alto. */}
          <div className={styles.titleStack}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.h1
                key={`${title}·${accent || ""}`}
                className={styles.pageTitle}
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
                {accent && <> <span className={styles.accent}>{accent}</span></>}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        {/* Selector de idioma — junto al botón de tema */}
        <LanguageToggle />

        <motion.button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
          whileTap={{ scale: 0.92, rotate: -20 }}
          whileHover={{ scale: 1.06 }}
          transition={SPRING}
        >
          <Icon name="moon" className={styles.iconMoon} />
          <Icon name="sun" className={styles.iconSun} />
        </motion.button>

        <NotificationBell />

        <div className={styles.userChip}>
          <div className={styles.userAvatar}>
            {fotoUrl(session?.foto)
              ? <img src={fotoUrl(session?.foto)!} alt="" />
              : initials(name)}
          </div>
          <div>
            <div className={styles.userName}>{name}</div>
            <div className={styles.userRole}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
