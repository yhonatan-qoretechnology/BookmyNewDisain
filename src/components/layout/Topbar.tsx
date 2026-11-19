"use client";
/* ============================================================
   Barra de arriba — marca, secciones principales y usuario
   ------------------------------------------------------------
   Es una píldora flotante sobre el lienzo. Lleva escritas las
   secciones más usadas del rol; el resto vive en el raíl de la
   izquierda, solo con iconos (ver reparto.ts).

   La píldora del activo VIAJA de una sección a otra (§6.5) y lee
   la ruta con el mismo criterio que el raíl, así que los dos
   indicadores se mueven a la vez.
============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, fotoUrl, initials, navParaSesion } from "@/constants";
import type { Rol } from "@/models";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { LOCALES, useI18n, type LocaleCode } from "@/i18n";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT, SPRING } from "@/components/animations";
import { spring } from "@/lib/motion";
import { seccionActiva, seccionesPrincipales } from "./reparto";
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

export default function Topbar() {
  const pathname = usePathname();
  const { session } = useSession();
  const { toggleTheme, theme } = useTheme();
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const role: Rol = session?.role || "superadmin";
  /* El menú depende del plan del negocio: con Pro (contratado o de
     prueba) aparecen facturación, estadísticas, stock y comunicación. */
  const pro = session?.plan?.planEfectivo === "PRO";
  const menu = useMemo(() => navParaSesion(role, pro), [role, pro]);
  const principales = useMemo(() => seccionesPrincipales(role, menu), [role, menu]);
  const idActivo = useMemo(() => seccionActiva(menu, pathname), [menu, pathname]);

  const name = session?.name || "—";
  const negocio = session?.negocioName || "BookMy";
  const roleLabel =
    role === "employee"
      ? `${session?.especialidad || t("roles.employee")} · ${session?.sedeName || ""}`
      : session?.sedeName || session?.negocioName || t(`roles.${role}`);
  const inicio = role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard;

  return (
    <header className={styles.topbar} data-app-chrome>
      <Link href={inicio} className={styles.brand} aria-label={negocio}>
        <span className={styles.brandMark} aria-hidden>{negocio.charAt(0).toUpperCase()}</span>
        {/* Solo el nombre, como en la referencia: el rol y la sede ya
            van en el chip de usuario, a la derecha. */}
        <span className={styles.brandName}>{negocio}</span>
      </Link>

      <LayoutGroup id="topnav">
        <nav className={styles.nav} aria-label={t("topbar.menu")}>
          {principales.map((item) => {
            const activo = item.id === idActivo;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${activo ? styles.navItemActivo : ""}`}
                aria-current={activo ? "page" : undefined}
              >
                {/* Un solo nodo compartido: por eso VIAJA en vez de
                    aparecer y desaparecer en cada sección. */}
                {activo && (
                  <motion.span
                    layoutId="topnav-activo"
                    className={styles.navFondo}
                    transition={reduce ? { duration: 0 } : spring.indicator}
                    aria-hidden
                  />
                )}
                <span className={styles.navIcono}><Icon name={item.icon} /></span>
                <span className={styles.navLabel}>{t(`nav.${item.id}`)}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

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
          <div className={styles.userText}>
            <div className={styles.userName}>{name}</div>
            <div className={styles.userRole}>{roleLabel}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
