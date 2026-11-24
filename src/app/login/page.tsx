"use client";
/* ============================================================
   Acceso al panel — POST /auth/login
   ------------------------------------------------------------
   Vive en /login: la raíz la ocupa la web pública. Diseño «la
   agenda de hoy»: a la izquierda un anillo 3D con las reservas
   del día (LoginSky) y a la derecha la tarjeta de cristal.
   La lógica es la de siempre: AuthController.login, sesión,
   redirección por rol, aviso de sesión caducada y recuperar
   contraseña con RecuperarPasswordModal. Solo cambia el aspecto.
============================================================ */
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants";
import { AuthController } from "@/controllers/AuthController";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { useI18n } from "@/i18n";
import { recordarOrigenLogin } from "@/lib/loginOrigen";
import RecuperarPasswordModal from "@/components/auth/RecuperarPasswordModal";
import LoginSky, { type LoginSkyHandle } from "@/components/auth/LoginSky";
import styles from "./login.module.css";
import { usePrecargaRecaptcha } from "@/lib/recaptcha";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function LoginPage() {
  /* useSearchParams obliga a un límite de Suspense en el build estático */
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}

function Login() {
  usePrecargaRecaptcha();
  const router = useRouter();
  const params = useSearchParams();
  const { session, login } = useSession();
  const { t, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hecho, setHecho] = useState(false);
  const [recuperarOpen, setRecuperarOpen] = useState(false);
  const [exito, setExito] = useState("");
  /* Validación en el propio campo */
  const [errEmail, setErrEmail] = useState<"" | "vacio" | "malo">("");
  const [errPass, setErrPass] = useState(false);
  const [mayus, setMayus] = useState(false);
  const [sacudir, setSacudir] = useState(0);
  /* Tras entrar: pantalla de «Sesión iniciada» antes de ir al panel */
  const [entrando, setEntrando] = useState<{ nombre: string } | null>(null);
  const [progreso, setProgreso] = useState(false);
  /* Se llega aquí desde una sesión caducada: conviene decirlo, si no
     parece que el panel se ha cerrado solo sin motivo. */
  const [caducada] = useState(() => params.get("caducada") === "1");

  const screenRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<LoginSkyHandle>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  /* Mientras se enseña «Sesión iniciada» no se redirige desde el efecto */
  const animandoEntrada = useRef(false);

  /* Con sesión abierta no se enseña el formulario: al panel directamente. */
  useEffect(() => {
    if (session && !animandoEntrada.current) {
      router.replace(session.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard);
    }
  }, [session, router]);

  const emailValido = EMAIL_RE.test(email.trim());

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    setError("");
    setExito("");
    /* Comprobación previa: no se llama al API con el formulario vacío */
    const fallaEmail = !email.trim() ? "vacio" : !emailValido ? "malo" : "";
    const fallaPass = !password;
    setErrEmail(fallaEmail);
    setErrPass(fallaPass);
    if (fallaEmail || fallaPass) {
      setSacudir((n) => n + 1);
      (fallaEmail ? emailRef : passRef).current?.focus();
      return;
    }

    setSubmitting(true);
    skyRef.current?.busy(true);
    const t0 = performance.now();
    try {
      const { session: s, error: err } = await AuthController.login(email.trim(), password);
      /* Un mínimo de espera para que la animación de carga se lea */
      const pasado = performance.now() - t0;
      if (pasado < 700) await espera(700 - pasado);
      skyRef.current?.busy(false);
      if (!s) {
        setError(
          err === "API_NOT_CONFIGURED"
            ? t("login.apiNotConfigured")
            : err === "CLIENT_ROLE"
              ? t("login.clientRole")
              : err || t("login.invalid")
        );
        setSacudir((n) => n + 1);
        passRef.current?.focus();
        passRef.current?.select();
        setSubmitting(false);
        return;
      }
      /* Borra la marca de QoreTech si la pestaña venía de allí */
      recordarOrigenLogin("bookmy");
      animandoEntrada.current = true;
      setHecho(true);
      skyRef.current?.celebrate();
      await espera(650);
      setEntrando({ nombre: (s.name || "").trim().split(/\s+/)[0] || "" });
      requestAnimationFrame(() => setProgreso(true));
      await espera(1500);
      login(s);
      router.push(s.role === "employee" ? ROUTES.employeeDashboard : ROUTES.dashboard);
    } catch (ex) {
      skyRef.current?.busy(false);
      setError(ex instanceof Error ? ex.message : t("login.invalid"));
      setSubmitting(false);
      animandoEntrada.current = false;
    }
  };

  const mirarMayus = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) setMayus(e.getModifierState("CapsLock"));
  };

  /* Luz que sigue al puntero en la tarjeta y en el botón */
  const onCardMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  const onBtnMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--bx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--by", `${e.clientY - r.top}px`);
  };

  const errorEmailTexto = errEmail === "vacio" ? t("login.errEmailVacio") : errEmail === "malo" ? t("login.errEmailMalo") : "";
  const servicios = t("login.servicios").split("|");
  const palabras = t("login.pitch").split(" ");

  return (
    <div className={styles.screen} ref={screenRef}>
      <div className={styles.layout}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.logo} aria-label={t("login.backToSite")}>
            <svg className={styles.logoSvg} viewBox="-198 606 1124 254" aria-hidden="true" focusable="false">
              <g transform="translate(-317.75 517.77) scale(0.5425)">
                <path className={styles.la} d="M685.46,390.03c-11.69-9.06-25.68-16.35-41.78-21.67c38.04-20.53,56.95-53.77,55.72-93.02 c-2.01-64.01-57.81-108.81-174.36-105.15l-149.85,4.7c-41.970,1.32-74.93,36.4-73.61,78.37l5.3,169.03 c0.26,2.64,0.58,5.27,0.94,7.89l32.07-7.71c3.61-0.87,7.3-1.19,10.95-0.96c11.73,0.75,22.46,7.22,28.71,17.31 c6.29,10.16,7.23,22.33,2.57,33.39l-25.47,60.48c1.04,1.12,2.07,2.26,3.14,3.36c32.99,33.88,76.97,54.18,123.81,57.17 c6.01,0.38,12.14,0.48,18.19,0.29c50.62-1.59,97.65-22.85,132.43-59.88c34.78-37.03,53.06-85.3,51.47-135.91L685.46,390.03z M442.42,272.51l66.43-2.08c32-1,46.84,9.41,47.48,29.94c0.64,20.53-13.51,31.85-45.51,32.86l-66.43,2.08L442.42,272.51z M535.17,493.26l-85.75,2.69l-2.08-66.43l85.75-2.69c31.4-0.98,47.46,10,48.14,31.74 C581.91,480.31,566.57,492.27,535.17,493.26z" />
                <path className={`${styles.lk} ${styles.cursor}`} d="M349.52,442.35c-1.53-0.1-3.12,0.03-4.75,0.42l-105.4,25.32c-13.71,3.29-16.44,21.6-4.29,28.76 l38.35,22.59c3.33,1.96,5.82,5.08,6.99,8.77l10.97,34.54c2.17,6.84,7.95,10.52,13.94,10.9c6.18,0.39,12.58-2.74,15.46-9.56 l42.11-99.98C367.23,453.8,359.77,443,349.52,442.35z" />
              </g>
              <path className={styles.lk} d="M235.55,765.2c0,32-23.31,40.81-68.3,40.81h-19.02c-25.05,0-36.06-9.16-36.06-33.28v-84.18 c0-24.12,11.020-33.28,35.94-33.28h15.89c42.32,0,64.24,8.58,64.24,38.26c0,16.58-6.73,27.36-20.06,33.63 C226.28,733.2,235.55,745.03,235.55,765.2z M167.95,716.04c21.1,0,28.87-4.52,28.87-18.32c0-12.52-7.65-16.93-28.87-16.93 h-13.68c-8.12,0-9.51,3.71-9.51,9.62v25.62H167.95z M202.97,762.42c0-14.73-7.65-19.25-28.76-19.25h-29.45v27.71 c0,5.91,1.39,9.62,9.51,9.62h19.94C195.55,780.51,202.97,776.1,202.97,762.42z M243.2,749.08c0-37.68,20.76-59.13,58.67-59.13s58.67,21.45,58.67,59.13c0,37.57-20.76,59.02-58.67,59.02 S243.2,786.65,243.2,749.08z M327.84,749.08c0-22.49-8.58-32-25.97-32s-25.97,9.51-25.97,32c0,22.26,8.58,31.89,25.97,31.89 S327.84,771.35,327.84,749.08z M368.19,749.08c0-37.68,20.76-59.13,58.67-59.13s58.67,21.45,58.67,59.13c0,37.57-20.76,59.02-58.67,59.02 S368.19,786.65,368.19,749.08z M452.83,749.08c0-22.49-8.58-32-25.97-32s-25.97,9.51-25.97,32c0,22.26,8.58,31.89,25.97,31.89 S452.83,771.35,452.83,749.08z M596.14,806.02h-10.2c-6.72,0-11.94-1.86-14.96-5.68l-43.13-49.97v44.99c0,6.84-3.83,10.67-10.67,10.67 h-10.9c-6.84,0-10.67-3.83-10.67-10.67v-141c0-6.84,3.83-10.67,10.67-10.67h10.9c6.84,0,10.67,3.83,10.67,10.67v85.92 l43.02-43.02c3.01-3.59,8.12-5.22,14.84-5.22h9.28c9.970,0,14.03,5.45,8.46,11.36l-42.55,41.63l44.06,49.51 C609.94,800.8,605.88,806.02,596.14,806.02z" />
              <path className={styles.la} d="M614.5,796.85l12.52-110.04c2.44-22.84,11.48-31.54,30.26-31.54c19.02,0,27.020,8.7,31.31,31.54l15.89,80.01 c0.7,3.59,1.97,4.75,3.48,4.75c1.51,0,2.9-1.16,3.48-4.75l16-80.01c4.29-22.84,12.29-31.54,31.19-31.54s27.94,8.7,30.38,31.54 l12.52,110.04c0.81,7.07-2.9,11.25-10.09,11.25h-11.13c-6.61,0-10.44-3.36-11.13-10.09L758.4,694.12 c-0.23-1.62-1.04-2.43-2.55-2.43c-1.51,0-2.2,0.81-2.43,2.32l-18.9,94.27c-2.9,14.15-11.13,19.83-26.55,19.83 c-15.31,0-23.65-5.68-26.44-19.83L662.62,694c-0.23-1.51-0.93-2.32-2.44-2.32c-1.51,0-2.32,0.81-2.55,2.43l-10.78,103.89 c-0.7,6.73-4.52,10.09-11.13,10.09h-11.13C617.4,808.1,613.69,803.92,614.5,796.85z M901.01,694.12h10.9c6.84,0,10.67,3.83,10.67,10.67v107.14c0,30.73-24.12,44.64-55.31,44.64 c-9.86,0-20.52-1.39-31.31-4.17c-6.15-1.51-9.04-5.68-9.04-11.94v-4.29c0-7.54,4.41-10.9,11.83-9.28 c8.93,1.97,17.28,3.25,25.05,3.25c15.65,0,26.55-5.22,26.55-18.21v-2.43c-5.68,0.46-11.13,0.7-16.23,0.7 c-40.58,0-64.7-14.84-64.7-59.02v-46.38c0-6.84,3.83-10.67,10.67-10.67h10.9c6.84,0,10.67,3.83,10.67,10.67v44.41 c0,26.09,9.04,33.86,31.54,33.86c4.99,0,10.67-0.35,17.16-1.04v-77.22C890.35,697.94,894.17,694.12,901.01,694.12z" />
            </svg>
          </Link>

          <div className={styles.tools}>
            <Link href={ROUTES.loginQore} className={`${styles.qore} ${styles.glass}`}>
              {t("login.switchToQore")}
            </Link>
            <div className={`${styles.lang} ${styles.glass} ${locale === "en" ? styles.langEn : ""}`} role="group" aria-label={t("login.idioma")}>
              <span className={styles.langThumb} aria-hidden="true" />
              {(["es", "en"] as const).map((l) => (
                <button key={l} type="button" lang={l} className={styles.langBtn} aria-pressed={locale === l}
                  aria-label={l === "es" ? "Español" : "English"} onClick={() => setLocale(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`${styles.theme} ${styles.glass}`}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
              title={theme === "dark" ? t("topbar.lightMode") : t("topbar.darkMode")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <mask id="bmMoonCut"><rect width="24" height="24" fill="#fff" /><circle className={styles.themeCut} cx="17" cy="7" r="6.5" fill="#000" /></mask>
                <circle className={styles.themeCore} cx="12" cy="12" r="5" mask="url(#bmMoonCut)" />
                <path className={styles.themeRays} d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.35 5.35l1.5 1.5M17.15 17.15l1.5 1.5M5.35 18.65l1.5-1.5M17.15 6.85l1.5-1.5" />
              </svg>
            </button>
          </div>
        </header>

        {/* La agenda de hoy (decorativa) */}
        <div className={styles.stage} ref={stageRef} aria-hidden="true">
          <LoginSky
            ref={skyRef}
            temaRef={screenRef}
            tarjetaRef={cardWrapRef}
            stageRef={stageRef}
            tema={theme}
            verbo={t("login.chipVerbo")}
            formatoHora={(servicio, hora) => t("login.chipHora", { servicio, hora })}
            servicios={servicios}
            reservasHoy={t("login.reservasHoy")}
            clases={{
              sky: styles.sky, clock: styles.clock, time: styles.clockTime, colon: styles.clockColon, count: styles.clockCount,
              tick: styles.tick, chips: styles.chips, chip: styles.chip, chipLeft: styles.chipLeft, chipTop: styles.chipTop,
              chipCard: styles.chipCard, chipAv: styles.chipAv, chipTxt: styles.chipTxt, chipL1: styles.chipL1, chipL2: styles.chipL2,
              isIn: styles.isIn, isOut: styles.isOut,
            }}
          />
        </div>

        <div className={styles.pitch}>
          <p className={styles.pitchTitle} key={locale}>
            {palabras.map((p, i) => (
              <span key={i}>
                <span className={styles.w}><span style={{ ["--i" as string]: i } as React.CSSProperties}>{p}</span></span>
                {i < palabras.length - 1 ? " " : ""}
              </span>
            ))}
          </p>
          <p className={styles.pitchSub}>{t("login.pitchSub")}</p>
        </div>

        <main className={styles.cardWrap} ref={cardWrapRef}>
          <div className={styles.card} ref={cardRef} onPointerMove={onCardMove}>
            <div className={styles.views}>
              {/* ── Iniciar sesión ── */}
              <form
                className={`${styles.view} ${entrando ? styles.viewOff : ""}`}
                onSubmit={submit}
                noValidate
                aria-labelledby="lgTitulo"
                aria-hidden={entrando ? true : undefined}
              >
                <div className={styles.in} style={{ ["--d" as string]: 0 } as React.CSSProperties}>
                  <span className={styles.badge}>{t("login.badge")}</span>
                  <h1 id="lgTitulo">{t("login.welcome")}</h1>
                  <p className={styles.lead}>{t("login.lede")}</p>
                </div>

                {/* Avisos: caducada, error del servidor y éxito de recuperar */}
                <div className={`${styles.alert} ${styles.alertInfo} ${caducada && !error && !exito ? styles.alertOn : ""}`} role="status">
                  <div><p>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5l3 2" /></svg>
                    <span>{t("login.expired")}</span>
                  </p></div>
                </div>
                <div className={`${styles.alert} ${styles.alertError} ${error ? styles.alertOn : ""}`} role="alert">
                  <div><p>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5" /><path d="M12 16.3v.1" /></svg>
                    <span>{error}</span>
                  </p></div>
                </div>
                <div className={`${styles.alert} ${styles.alertInfo} ${exito ? styles.alertOn : ""}`} role="status">
                  <div><p>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 8" /></svg>
                    <span>{exito}</span>
                  </p></div>
                </div>

                <div className={`${styles.fields} ${sacudir ? styles.shake : ""}`} key={sacudir} >
                  <div
                    className={`${styles.field} ${styles.in} ${emailValido ? styles.isValid : ""} ${errEmail ? styles.hasError : ""}`}
                    style={{ ["--d" as string]: 1 } as React.CSSProperties}
                  >
                    <label className={styles.fieldLabel} htmlFor="lg-email">{t("login.email")}</label>
                    <div className={styles.fieldBox}>
                      <input
                        ref={emailRef}
                        id="lg-email"
                        type="email"
                        inputMode="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={t("login.emailPlaceholder")}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); if (errEmail && EMAIL_RE.test(e.target.value.trim())) setErrEmail(""); }}
                        onBlur={() => { const v = email.trim(); setErrEmail(v && !EMAIL_RE.test(v) ? "malo" : ""); }}
                        onKeyDown={(e) => {
                          /* Enter en el correo pasa a la contraseña si aún está vacía */
                          if (e.key === "Enter" && !password) {
                            e.preventDefault();
                            if (EMAIL_RE.test(email.trim())) passRef.current?.focus();
                            else setErrEmail(email.trim() ? "malo" : "vacio");
                          }
                        }}
                        autoComplete="email"
                        autoFocus
                        required
                        aria-invalid={!!errEmail}
                        aria-describedby="lg-email-msg"
                      />
                      <svg className={styles.fieldIcon} viewBox="0 0 24 24" aria-hidden="true"><path className={styles.d} pathLength={1} d="M6 5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" /><path className={styles.d} pathLength={1} d="m4 7.5 8 5.5 8-5.5" /></svg>
                      <span className={styles.fieldOk} aria-hidden="true"><svg viewBox="0 0 24 24"><path className={styles.d} pathLength={1} d="M6 12.5l4 4L18 8" /></svg></span>
                    </div>
                    <div className={styles.fieldMsg} id="lg-email-msg" aria-live="polite"><div><p>{errorEmailTexto}</p></div></div>
                  </div>

                  <div
                    className={`${styles.field} ${styles.in} ${errPass ? styles.hasError : ""} ${verPassword ? styles.isRevealed : ""} ${mayus ? styles.isCaps : ""}`}
                    style={{ ["--d" as string]: 2 } as React.CSSProperties}
                  >
                    <label className={styles.fieldLabel} htmlFor="lg-pass">{t("login.password")}</label>
                    <div className={styles.fieldBox}>
                      <input
                        ref={passRef}
                        id="lg-pass"
                        type={verPassword ? "text" : "password"}
                        placeholder={t("login.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); if (e.target.value) setErrPass(false); }}
                        onKeyDown={mirarMayus}
                        onKeyUp={mirarMayus}
                        onBlur={() => setMayus(false)}
                        autoComplete="current-password"
                        required
                        aria-invalid={errPass}
                        aria-describedby="lg-pass-msg lg-caps"
                      />
                      <svg className={styles.fieldIcon} viewBox="0 0 24 24" aria-hidden="true"><path className={styles.d} pathLength={1} d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" /><path className={`${styles.d} ${styles.shackle}`} pathLength={1} d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></svg>
                      <button
                        type="button"
                        className={styles.eye}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setVerPassword((v) => !v); passRef.current?.focus({ preventScroll: true }); }}
                        aria-label={verPassword ? t("login.hidePassword") : t("login.showPassword")}
                        aria-pressed={verPassword}
                        aria-controls="lg-pass"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle className={styles.pupil} cx="12" cy="12" r="3" /><path className={styles.slash} pathLength={1} d="M4.5 4.5l15 15" /></svg>
                      </button>
                    </div>
                    <div className={styles.fieldMsg} id="lg-pass-msg" aria-live="polite"><div><p>{errPass ? t("login.errPassVacia") : ""}</p></div></div>
                    <div className={styles.caps}><div><p id="lg-caps" aria-live="polite">{mayus ? t("login.mayusculas") : ""}</p></div></div>
                  </div>
                </div>

                <div className={`${styles.row} ${styles.in}`} style={{ ["--d" as string]: 3 } as React.CSSProperties}>
                  <label className={styles.check}>
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span className={styles.checkBox} aria-hidden="true"><svg viewBox="0 0 24 24"><path className={styles.d} pathLength={1} d="M5.5 12.5l4.2 4.2L18.5 8" /></svg></span>
                    <span>{t("login.remember")}</span>
                  </label>
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => { setError(""); setExito(""); setRecuperarOpen(true); }}
                  >
                    {t("login.forgot")}
                  </button>
                </div>

                <div className={styles.in} style={{ ["--d" as string]: 4 } as React.CSSProperties}>
                  <button
                    type="submit"
                    className={`${styles.submit} ${submitting ? styles.isBusy : ""} ${hecho ? styles.isDone : ""}`}
                    aria-busy={submitting}
                    onPointerMove={onBtnMove}
                  >
                    <span className={styles.submitLabel}>{t("login.submit")}</span>
                    <span className={styles.submitSpinner} aria-hidden="true" />
                    <svg className={styles.submitCheck} viewBox="0 0 24 24" aria-hidden="true"><path className={styles.d} pathLength={1} d="M5.5 12.5l4.5 4.5L18.5 8" /></svg>
                    {submitting && <span className={styles.srOnly}>{t("login.signingIn")}</span>}
                  </button>
                </div>

                <p className={`${styles.alt} ${styles.in}`} style={{ ["--d" as string]: 5 } as React.CSSProperties}>
                  {t("login.noAccount")} <Link href="/planes" className={styles.link}>{t("login.seePlans")}</Link>
                </p>
              </form>

              {/* ── Sesión iniciada ── */}
              <section
                className={`${styles.view} ${styles.result} ${entrando ? styles.viewOn : styles.viewNext}`}
                aria-hidden={entrando ? undefined : true}
                aria-live="polite"
              >
                <div className={styles.mark} aria-hidden="true"><svg viewBox="0 0 24 24"><path className={styles.d} pathLength={1} d="M5.5 12.5l4.5 4.5L18.5 8" /></svg></div>
                <h1>{entrando?.nombre ? t("login.hola", { nombre: entrando.nombre }) : t("login.sesionIniciada")}</h1>
                <p className={styles.lead}>{t("login.abriendoPanel")}</p>
                <div className={`${styles.progress} ${progreso ? styles.progressRun : ""}`}><i /></div>
              </section>
            </div>
          </div>
          <p className={styles.foot}>© {new Date().getFullYear()} Bookmy</p>
        </main>
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
