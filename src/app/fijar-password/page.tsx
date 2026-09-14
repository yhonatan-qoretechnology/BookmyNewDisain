"use client";
/* ============================================================
   /fijar-password — el empleado elige su propia contrasena
   ------------------------------------------------------------
   Es la pagina a la que apunta el enlace del correo de alta
   ({APP_URL}/fijar-password?token=...). Vive FUERA de (panel)
   a proposito: quien entra aqui todavia no tiene contrasena, y
   por tanto no puede tener sesion.

   El token se comprueba al cargar (sin gastarlo) para poder
   avisar del enlace caducado antes de que escriba nada.
============================================================ */
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordSetupApi } from "@/api/modules";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { ROUTES } from "@/constants";
import { useI18n } from "@/i18n";
import Button from "@/components/ui/Button";
import styles from "./fijar.module.css";

function FijarPasswordContent() {
  const { t } = useI18n();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [estado, setEstado] = useState<"comprobando" | "valido" | "invalido" | "hecho">("comprobando");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) { setEstado("invalido"); setError(t("fijarPassword.sinToken")); return; }
    let vigente = true;
    PasswordSetupApi.validar(token)
      .then((r) => { if (!vigente) return; setEmail(r.email); setEstado("valido"); })
      .catch((e) => {
        if (!vigente) return;
        setEstado("invalido");
        setError(e instanceof Error ? e.message : t("fijarPassword.enlaceInvalido"));
      });
    return () => { vigente = false; };
  }, [token, t]);

  const enviar = useCallback(async () => {
    if (!isStrongPassword(password)) { setError(t("fijarPassword.reglas")); return; }
    if (password !== repetir) { setError(t("recuperar.errDistintas")); return; }
    setError(""); setGuardando(true);
    try {
      await PasswordSetupApi.completar(token, password);
      setEstado("hecho");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("fijarPassword.error"));
    } finally {
      setGuardando(false);
    }
  }, [password, repetir, token, t]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {estado === "comprobando" && <p className={styles.centro}>{t("fijarPassword.comprobando")}</p>}

        {estado === "invalido" && (
          <>
            <h1 className={styles.titulo}>{t("fijarPassword.tituloInvalido")}</h1>
            <div className={styles.error}>{error}</div>
            <p className={styles.sub}>{t("fijarPassword.pideOtro")}</p>
            <Button className={styles.boton} onClick={() => router.push(ROUTES.login)}>
              {t("fijarPassword.irLogin")}
            </Button>
          </>
        )}

        {estado === "hecho" && (
          <>
            <h1 className={styles.titulo}>{t("fijarPassword.tituloHecho")}</h1>
            <div className={styles.ok}>{t("fijarPassword.hecho")}</div>
            <Button className={styles.boton} onClick={() => router.push(ROUTES.login)}>
              {t("fijarPassword.irLogin")}
            </Button>
          </>
        )}

        {estado === "valido" && (
          <>
            <h1 className={styles.titulo}>{t("fijarPassword.titulo")}</h1>
            <p className={styles.sub}>{t("fijarPassword.sub", { email })}</p>

            {error && <div className={styles.error}>{error}</div>}

            <label className={styles.campo}>
              <span>{t("fijarPassword.nueva")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={PASSWORD_MIN_LENGTH}
              />
            </label>

            <label className={styles.campo}>
              <span>{t("recuperar.repetir")}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void enviar(); }}
              />
            </label>

            <p className={styles.reglas}>{t("fijarPassword.reglas")}</p>

            <Button className={styles.boton} onClick={() => void enviar()} disabled={guardando}>
              {guardando ? t("booking.loading") : t("fijarPassword.guardar")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FijarPasswordPage() {
  return (
    <Suspense fallback={null}>
      <FijarPasswordContent />
    </Suspense>
  );
}
