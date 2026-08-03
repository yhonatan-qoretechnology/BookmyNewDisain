"use client";
/* ============================================================
   Login — POST /auth/login del backend (View)
   El rol lo determina el backend (enum Role); el parámetro de
   idioma (user_data.idioma) llega en la sesión y el I18nProvider
   lo aplica automáticamente.
============================================================ */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { AuthController } from "@/controllers/AuthController";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { LanguageToggle } from "@/components/layout/Topbar";
import RecuperarPasswordModal from "@/components/auth/RecuperarPasswordModal";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { session, login } = useSession();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /* Recuperación de contraseña por OTP */
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [exito, setExito] = useState("");

  // Si ya hay sesión, redirigir directamente
  useEffect(() => {
    if (session) {
      router.replace(session.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard);
    }
  }, [session, router]);

  /**
   * Envía las credenciales al backend y crea la sesión del panel.
   */
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
      {/* Panel de arte */}
      <div className={styles.art}>
        <div className={styles.artBrand}>
          <div className={styles.artBrandMark}>B</div>
          <div className={styles.artBrandText}>
            <b>BookMy</b>
            <span>{t("sidebar.platform")}</span>
          </div>
        </div>
        <p className={styles.artQuote}>{t("login.quote")}</p>
        <span className={styles.artFoot}>{t("login.foot")}</span>
      </div>

      {/* Formulario */}
      <div className={styles.formSide}>
        <div className={styles.langCorner}>
          <LanguageToggle />
        </div>

        <form className={styles.card} onSubmit={submit} noValidate>
          <h1>{t("login.welcome")}</h1>
          <p className={styles.lede}>{t("login.lede")}</p>

          {error && <div className={styles.error} role="alert">{error}</div>}
          {exito && <div className={styles.exito} role="status">{exito}</div>}

          <div className={styles.field}>
            <label htmlFor="lg-email">{t("login.email")}</label>
            <input
              id="lg-email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="lg-pass">{t("login.password")}</label>
            <input
              id="lg-pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              {t("login.remember")}
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
            {submitting ? "…" : t("login.submit")}
          </button>
        </form>
      </div>

      <RecuperarPasswordModal
        open={recuperarOpen}
        emailInicial={email}
        onClose={() => setRecuperarOpen(false)}
        onExito={(mensaje) => { setExito(mensaje); setError(""); }}
      />
    </div>
  );
}
