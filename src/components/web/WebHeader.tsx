"use client";
/* ============================================================
   Cabecera de la web pública.
   Mantiene el diseño de la web original (logo, navegación,
   desplegable de planes, idioma, tema) y añade el acceso al
   panel, que antes no existía en ningún sitio.
============================================================ */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { useTheme } from "@/context/ThemeContext";
import { useWebT } from "./useWebT";

/** Enlace que salta a un ancla del inicio aunque se esté en otra página. */
function AnclaInicio({ hash, children, className, onClick }: {
  hash: string; children: React.ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <Link href={`/${hash}`} className={className} onClick={onClick} scroll>
      {children}
    </Link>
  );
}

export default function WebHeader() {
  const { w, locale, setLocale } = useWebT();
  const { theme, toggleTheme } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [planesAbierto, setPlanesAbierto] = useState(false);
  const cerrarTimer = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cerrarMenu = () => setMenuAbierto(false);

  /* El desplegable espera un momento antes de cerrarse para que el ratón
     pueda cruzar el hueco entre el disparador y el menú. */
  const abrirPlanes = () => {
    if (cerrarTimer.current) { clearTimeout(cerrarTimer.current); cerrarTimer.current = null; }
    setPlanesAbierto(true);
  };
  const programarCierre = () => {
    if (cerrarTimer.current) clearTimeout(cerrarTimer.current);
    cerrarTimer.current = window.setTimeout(() => setPlanesAbierto(false), 350);
  };

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setPlanesAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setPlanesAbierto(false); setMenuAbierto(false); }
    };
    document.addEventListener("click", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", fuera);
      document.removeEventListener("keydown", escape);
      if (cerrarTimer.current) clearTimeout(cerrarTimer.current);
    };
  }, []);

  const logo = (
    <>
      <img src="/web/img/logo.png" alt="Bookmy" className="logo-img logo-img-dark" />
      <img src="/web/img/logo-bookmy2.png" alt="Bookmy" className="logo-img logo-img-light" />
    </>
  );

  return (
    <header className="site-header" id="top">
      <div className="container header-inner">
        <Link href="/" className="logo" aria-label="Bookmy">{logo}</Link>

        <nav className="main-nav" id="mainNav">
          <AnclaInicio hash="#top">{w("nav.home")}</AnclaInicio>
          <AnclaInicio hash="#app">{w("nav.app")}</AnclaInicio>
          <AnclaInicio hash="#funciona">{w("nav.how")}</AnclaInicio>

          <div
            className={`nav-dropdown ${planesAbierto ? "is-open" : ""}`}
            ref={dropdownRef}
            onMouseEnter={abrirPlanes}
            onMouseLeave={programarCierre}
            onFocus={abrirPlanes}
          >
            <Link href="/#planes" className="nav-dropdown-trigger">
              <span>{w("nav.plans")}</span>
              <svg className="nav-dropdown-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="nav-dropdown-menu">
              <Link href="/bookmy-free" className="nav-dropdown-item">
                <span className="nav-dropdown-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span className="nav-dropdown-text">
                  <strong>{w("nav.planFree")}</strong>
                  <small>{w("nav.planFreeDesc")}</small>
                </span>
              </Link>
              <Link href="/bookmy-crm-pro" className="nav-dropdown-item">
                <span className="nav-dropdown-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M12 2.5l2.2 5.6L20 10l-5.3 2.4L12 18l-2.2-5.6L4 10l5.8-1.9L12 2.5Z" fill="currentColor" /></svg>
                </span>
                <span className="nav-dropdown-text">
                  <strong>{w("nav.planPro")}</strong>
                  <small>{w("nav.planProDesc")}</small>
                </span>
              </Link>
            </div>
          </div>

          <Link href="/contacto">{w("nav.contact")}</Link>
        </nav>

        <div className="header-actions">
          <div className="lang-switch" role="group" aria-label={w("nav.langLabel")}>
            <button className={`lang-btn ${locale === "es" ? "is-active" : ""}`} onClick={() => setLocale("es")} type="button">ES</button>
            <button className={`lang-btn ${locale === "en" ? "is-active" : ""}`} onClick={() => setLocale("en")} type="button">EN</button>
          </div>

          <button className="theme-toggle" onClick={toggleTheme} type="button"
            aria-label={theme === "dark" ? w("nav.themeLight") : w("nav.themeDark")}>
            <svg className="icon-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <svg className="icon-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          </button>

          {/* Acceso al panel: lo que pedía la web y no tenía */}
          <Link href={ROUTES.login} className="btn btn-ghost btn-small header-login">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
              <path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{w("nav.panel")}</span>
          </Link>

          <Link href="/#planes" className="btn btn-primary btn-small header-cta">{w("nav.cta")}</Link>

          <button
            className={`burger ${menuAbierto ? "is-open" : ""}`}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={w("nav.menuLabel")}
            aria-expanded={menuAbierto}
            type="button"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div className={`mobile-nav ${menuAbierto ? "is-open" : ""}`} id="mobileNav">
        <span className="mobile-nav-label">{w("nav.menuLabel")}</span>
        <AnclaInicio hash="#top" onClick={cerrarMenu}>
          <span className="mobile-nav-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{w("nav.home")}</span>
        </AnclaInicio>
        <AnclaInicio hash="#app" onClick={cerrarMenu}>
          <span className="mobile-nav-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><rect x="6" y="2.5" width="12" height="19" rx="2.4" stroke="currentColor" strokeWidth="1.7" /><path d="M10.5 18.2h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></span>
          <span>{w("nav.app")}</span>
        </AnclaInicio>
        <AnclaInicio hash="#funciona" onClick={cerrarMenu}>
          <span className="mobile-nav-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" /><path d="M12 7.5v5l3.2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg></span>
          <span>{w("nav.how")}</span>
        </AnclaInicio>
        <AnclaInicio hash="#planes" onClick={cerrarMenu}>
          <span className="mobile-nav-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M4 12 9 7l4 4 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 4h5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v3h16v-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{w("nav.plans")}</span>
        </AnclaInicio>
        <Link href="/bookmy-free" className="mobile-nav-sublink" onClick={cerrarMenu}>
          <span className="mobile-nav-icon mobile-nav-icon-sm"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{w("nav.planFree")}</span>
        </Link>
        <Link href="/bookmy-crm-pro" className="mobile-nav-sublink" onClick={cerrarMenu}>
          <span className="mobile-nav-icon mobile-nav-icon-sm"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden><path d="M12 2.5l2.2 5.6L20 10l-5.3 2.4L12 18l-2.2-5.6L4 10l5.8-1.9L12 2.5Z" fill="currentColor" /></svg></span>
          <span>{w("nav.planPro")}</span>
        </Link>
        <Link href="/contacto" onClick={cerrarMenu}>
          <span className="mobile-nav-icon"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M4 6.5l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
          <span>{w("nav.contact")}</span>
        </Link>
        <div className="mobile-nav-divider" />
        <Link href={ROUTES.login} className="btn btn-ghost" onClick={cerrarMenu}>{w("nav.panel")}</Link>
        <Link href="/#planes" className="btn btn-primary" onClick={cerrarMenu}>{w("nav.cta")}</Link>
      </div>
    </header>
  );
}
