"use client";
/* ============================================================
   RecuperarPasswordModal — recuperación de contraseña por OTP
   ------------------------------------------------------------
   Tres pasos contra AuthModule, sin sesión iniciada:
     1. correo    → POST /auth/users/password/otp/request
     2. código    → POST /auth/users/password/otp/validate
     3. contraseña→ PATCH /auth/users/password/otp/change

   El código es de 6 dígitos y caduca a los 5 minutos; se muestra
   una cuenta atrás para que el usuario sepa cuándo reenviarlo.
============================================================ */
import { useEffect, useRef, useState } from "react";
import { PasswordRecoveryApi } from "@/api/modules";
import { useI18n } from "@/i18n";
import styles from "./RecuperarPasswordModal.module.css";

/** Vigencia del OTP en el backend (otp.service.ts) */
const VIGENCIA_SEGUNDOS = 5 * 60;

type Paso = "email" | "codigo" | "password";

export default function RecuperarPasswordModal({
  open,
  emailInicial = "",
  onClose,
  onExito,
}: {
  open: boolean;
  /** Prellena con lo que ya escribió en el login */
  emailInicial?: string;
  onClose: () => void;
  /** Se llama al terminar; el login muestra el aviso de éxito */
  onExito: (mensaje: string) => void;
}) {
  const { t } = useI18n();

  const [paso, setPaso] = useState<Paso>("email");
  const [email, setEmail] = useState(emailInicial);
  const [codigo, setCodigo] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [restante, setRestante] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);

  /* Cuenta atrás de vigencia del código */
  useEffect(() => {
    if (restante <= 0) return;
    const id = setInterval(() => setRestante((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [restante]);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) setEmail((prev) => prev || emailInicial);
  }, [open, emailInicial]);

  if (!open) return null;

  const reiniciar = () => {
    setPaso("email"); setCodigo(""); setNueva(""); setRepetir("");
    setError(""); setAviso(""); setRestante(0);
  };

  const cerrar = () => { reiniciar(); onClose(); };

  /** Traduce el error del backend, que ya viene en español y es claro. */
  const mensajeDeError = (e: unknown) =>
    e instanceof Error && e.message ? e.message : t("recuperar.errGenerico");

  const pedirCodigo = async (esReenvio = false) => {
    const correo = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError(t("recuperar.errEmail"));
      return;
    }
    setError(""); setAviso(""); setCargando(true);
    try {
      await PasswordRecoveryApi.solicitar(correo);
      setPaso("codigo");
      setRestante(VIGENCIA_SEGUNDOS);
      if (esReenvio) setAviso(t("recuperar.reenviado"));
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  const verificarCodigo = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) {
      setError(t("recuperar.errCodigo"));
      return;
    }
    setError(""); setAviso(""); setCargando(true);
    try {
      await PasswordRecoveryApi.validar(email.trim(), codigo.trim());
      setPaso("password");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  const guardarPassword = async () => {
    if (nueva.length < 6) { setError(t("recuperar.errCorta")); return; }
    if (nueva !== repetir) { setError(t("recuperar.errDistintas")); return; }
    setError(""); setCargando(true);
    try {
      await PasswordRecoveryApi.cambiar(email.trim(), codigo.trim(), nueva);
      onExito(t("recuperar.exito"));
      cerrar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  };

  const mmss = `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}`;

  const subtitulo =
    paso === "email" ? t("recuperar.subEmail")
    : paso === "codigo" ? t("recuperar.subCodigo", { email: email.trim() })
    : t("recuperar.subPassword");

  return (
    <div className={styles.overlay} onClick={cerrar} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-titulo"
      >
        <div className={styles.head}>
          <h2 id="rec-titulo">{t("recuperar.titulo")}</h2>
          <button
            type="button"
            className={styles.cerrar}
            onClick={cerrar}
            aria-label={t("common.close")}
          >
            ×
          </button>
        </div>

        <p className={styles.sub}>{subtitulo}</p>

        {/* Progreso de los tres pasos */}
        <ol className={styles.pasos} aria-hidden>
          {(["email", "codigo", "password"] as Paso[]).map((p, i) => (
            <li
              key={p}
              className={
                paso === p ? styles.pasoActivo
                : ["email", "codigo", "password"].indexOf(paso) > i ? styles.pasoHecho
                : styles.paso
              }
            >
              {i + 1}
            </li>
          ))}
        </ol>

        {error && <div className={styles.error} role="alert">{error}</div>}
        {aviso && <div className={styles.aviso} role="status">{aviso}</div>}

        {paso === "email" && (
          <form onSubmit={(e) => { e.preventDefault(); void pedirCodigo(); }} noValidate>
            <div className={styles.field}>
              <label htmlFor="rec-email">{t("recuperar.email")}</label>
              <input
                id="rec-email"
                type="email"
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
            </div>
            <button type="submit" className={styles.principal} disabled={cargando}>
              {cargando ? t("recuperar.enviando") : t("recuperar.enviar")}
            </button>
          </form>
        )}

        {paso === "codigo" && (
          <form onSubmit={(e) => { e.preventDefault(); void verificarCodigo(); }} noValidate>
            <div className={styles.field}>
              <label htmlFor="rec-codigo">{t("recuperar.codigo")}</label>
              <input
                id="rec-codigo"
                className={styles.codigo}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
              />
              {restante > 0 && <span className={styles.hint}>{mmss}</span>}
            </div>
            <button type="submit" className={styles.principal} disabled={cargando}>
              {cargando ? t("recuperar.verificando") : t("recuperar.verificar")}
            </button>
            <div className={styles.acciones}>
              <button
                type="button"
                className={styles.enlace}
                onClick={() => void pedirCodigo(true)}
                disabled={cargando || restante > VIGENCIA_SEGUNDOS - 30}
              >
                {t("recuperar.reenviar")}
              </button>
              <button
                type="button"
                className={styles.enlace}
                onClick={() => { setPaso("email"); setCodigo(""); setError(""); }}
              >
                {t("recuperar.cambiarCorreo")}
              </button>
            </div>
          </form>
        )}

        {paso === "password" && (
          <form onSubmit={(e) => { e.preventDefault(); void guardarPassword(); }} noValidate>
            <div className={styles.field}>
              <label htmlFor="rec-nueva">{t("recuperar.nueva")}</label>
              <input
                id="rec-nueva"
                type="password"
                autoFocus
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setError(""); }}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rec-repetir">{t("recuperar.repetir")}</label>
              <input
                id="rec-repetir"
                type="password"
                autoComplete="new-password"
                value={repetir}
                onChange={(e) => { setRepetir(e.target.value); setError(""); }}
              />
            </div>
            <button type="submit" className={styles.principal} disabled={cargando}>
              {cargando ? t("recuperar.guardando") : t("recuperar.guardar")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
