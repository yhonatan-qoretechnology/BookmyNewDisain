"use client";
/* ============================================================
   Acceso al panel — POST /auth/login
   ------------------------------------------------------------
   Vive en /login: la raíz la ocupa la web pública. La pantalla
   es de dos mitades: a la izquierda la marca con una vista real
   del producto, a la derecha el formulario.
============================================================ */
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants";
import { AuthController } from "@/controllers/AuthController";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";
import { LanguageToggle } from "@/components/layout/Topbar";
import RecuperarPasswordModal from "@/components/auth/RecuperarPasswordModal";
import styles from "./login.module.css";

export default function LoginPage() {
  /* useSearchParams obliga a un límite de Suspense en el build estático */
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, login } = useSession();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [exito, setExito] = useState("");
  /* Se llega aquí desde una sesión caducada: conviene decirlo, si no
     parece que el panel se ha cerrado solo sin motivo. */
  const [caducada] = useState(() => params.get("caducada") === "1");

  /* Con sesión abierta no se enseña el formulario: al panel directamente. */
  useEffect(() => {
    if (session) {
      router.replace(session.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard);
    }
  }, [session, router]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const { session: s, error: err } = await AuthController.login(email.trim(), password);
      if (!s) {
        setError(
          err === "API_NOT_CONFIGURED"
            ? t("login.apiNotConfigured")
            : err === "CLIENT_ROLE"
              ? t("login.clientRole")
              : err || t("login.invalid")
        );
        return;
      }
      login(s);
      router.push(s.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("login.invalid"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* ── Mitad de marca ─────────────────────────────── */}
      <aside className={styles.art}>
        <div className={styles.artGlow} aria-hidden />
        <div className={styles.artTop}>
          <Link href="/" className={styles.artBrand}>
            <span className={styles.artBrandMark}>B</span>
            <span className={styles.artBrandText}>
              <b>Bookmy</b>
              <span>{t("login.badge")}</span>
            </span>
          </Link>
        </div>

        <div className={styles.artBody}>
          <h2 className={styles.artTitle}>{t("login.quote")}</h2>
          <ul className={styles.artList}>
            {[1, 2, 3].map((n) => (
              <li key={n}>
                <span className={styles.artCheck} aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                {t(`login.point${n}`)}
              </li>
            ))}
          </ul>

          <div className={styles.artShot}>
            <img src="/web/img/dashboard-b.png" alt="" loading="lazy" decoding="async" />
          </div>
        </div>

        <p className={styles.artFoot}>{t("login.foot")}</p>
      </aside>

      {/* ── Mitad del formulario ───────────────────────── */}
      <main className={styles.formSide}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.back}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t("login.backToSite")}
          </Link>
          <div className={styles.topActions}>
            <LanguageToggle />
            <button
              type="button"
              className={styles.themeBtn}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
            >
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
              )}
            </button>
          </div>
        </div>

        <form className={styles.card} onSubmit={submit} noValidate>
          <span className={styles.badge}>{t("login.badge")}</span>
          <h1 className={styles.title}>{t("login.welcome")}</h1>
          <p className={styles.lede}>{t("login.lede")}</p>

          {caducada && !error && (
            <div className={styles.aviso} role="status">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <span>{t("login.expired")}</span>
            </div>
          )}

          {error && (
            <div className={styles.error} role="alert">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5.5M12 16.2v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              <span>{error}</span>
            </div>
          )}
          {exito && (
            <div className={styles.exito} role="status">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>{exito}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="lg-email">{t("login.email")}</label>
            <div className={styles.control}>
              <span className={styles.icon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <input
                id="lg-email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="lg-pass">{t("login.password")}</label>
            <div className={styles.control}>
              <span className={styles.icon} aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="4" y="10" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </span>
              <input
                id="lg-pass"
                type={verPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.verPass}
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? t("login.hidePassword") : t("login.showPassword")}
                aria-pressed={verPassword}
              >
                {verPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><path d="M10.6 10.7a2 2 0 0 0 2.8 2.8" stroke="currentColor" strokeWidth="1.7" /><path d="M6.5 6.8C4.6 8 3.2 9.8 2.5 12c1.6 4 5.2 6.4 9.5 6.4 1.6 0 3.1-.35 4.4-.98M17.8 16A11 11 0 0 0 21.5 12C19.9 8 16.3 5.6 12 5.6c-.8 0-1.6.08-2.3.24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden><path d="M2.5 12C4.1 8 7.7 5.6 12 5.6S19.9 8 21.5 12c-1.6 4-5.2 6.4-9.5 6.4S4.1 16 2.5 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>{t("login.remember")}</span>
            </label>
            <button
              type="button"
              className={styles.forgot}
              onClick={() => { setError(""); setExito(""); setRecuperarOpen(true); }}
            >
              {t("login.forgot")}
            </button>
          </div>

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? (
              <>
                <span className={styles.spinner} aria-hidden />
                {t("login.signingIn")}
              </>
            ) : (
              t("login.submit")
            )}
          </button>

          <p className={styles.alt}>
            {t("login.noAccount")} <Link href="/#planes">{t("login.seePlans")}</Link>
          </p>
        </form>
      </main>

      <RecuperarPasswordModal
        open={recuperarOpen}
        emailInicial={email}
        onClose={() => setRecuperarOpen(false)}
        onExito={(mensaje) => { setExito(mensaje); setError(""); }}
      />
    </div>
  );
}
