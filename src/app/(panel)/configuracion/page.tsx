"use client";
/* ============================================================
   Configuración — perfil, seguridad y preferencias (View)
============================================================ */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useTheme } from "@/context/ThemeContext";
import { useUi } from "@/context/UiContext";
import { LOCALES, useI18n } from "@/i18n";
import { AuthApi } from "@/api/modules";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import styles from "./configuracion.module.css";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <span className={styles.switch}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className={styles.slider} />
    </span>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { session, updateSession, logout } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { toast, confirm } = useUi();
  const { t, locale, setLocale } = useI18n();

  const [nombre, setNombre] = useState(session?.name || "");
  const email = session?.email || "";
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhats, setNotifWhats] = useState(true);
  const [recordatorios, setRecordatorios] = useState(false);
  const [resumen, setResumen] = useState(true);

  /** PATCH /auth/users/:id { name } — UpdateUserDto acepta name. */
  const guardarPerfil = async () => {
    if (!nombre.trim()) { toast(t("configuracion.emptyName"), "error"); return; }
    try {
      if (session) await AuthApi.updateUser(Number(session.id), { name: nombre.trim() });
      updateSession({ name: nombre.trim() });
      toast(t("configuracion.profileSaved"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const cambiarPass = async () => {
    if (!passActual || passNueva.length < 6) {
      toast(t("configuracion.passTooShort"), "error");
      return;
    }
    try {
      /* PATCH /auth/users/:id/password (requiere contraseña actual) */
      if (session) await AuthApi.changePassword(Number(session.id), passActual, passNueva);
      setPassActual(""); setPassNueva("");
      toast(t("configuracion.passUpdated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    }
  };

  const cerrarSesion = () => {
    confirm({
      title: t("configuracion.logoutConfirmTitle"),
      message: t("configuracion.logoutConfirmMsg"),
      confirmLabel: t("configuracion.logoutBtn"),
      onConfirm: () => {
        logout();
        router.push(ROUTES.login);
      },
    });
  };

  return (
    <>
      <div className={styles.settingsGrid}>
        <Panel>
          <PanelHead title={t("configuracion.profileTitle")} sub={t("configuracion.profileSub", { rol: t(`roles.${session?.role || "superadmin"}`) })} />
          <div className={styles.formCol}>
            <div>
              <label htmlFor="cf-nombre">{t("common.name")}</label>
              <input id="cf-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cf-email">{t("common.email")}</label>
              <input id="cf-email" type="email" value={email} readOnly disabled aria-readonly="true" />
            </div>
            <div><Button onClick={() => void guardarPerfil()}>{t("configuracion.saveChanges")}</Button></div>
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("configuracion.securityTitle")} sub={t("configuracion.securitySub")} />
          <div className={styles.formCol}>
            <div>
              <label htmlFor="cf-pa">{t("configuracion.currentPass")}</label>
              <input id="cf-pa" type="password" value={passActual} onChange={(e) => setPassActual(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="cf-pn">{t("configuracion.newPass")}</label>
              <input id="cf-pn" type="password" value={passNueva} onChange={(e) => setPassNueva(e.target.value)} placeholder={t("configuracion.newPassPlaceholder")} />
            </div>
            <div><Button onClick={cambiarPass}>{t("configuracion.updatePass")}</Button></div>
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("configuracion.notifTitle")} sub={t("configuracion.notifSub")} />
          <div className={styles.switchRow}>
            <span className={styles.switchBody}><b>{t("configuracion.notifEmail")}</b><span>{t("configuracion.notifEmailSub")}</span></span>
            <Switch checked={notifEmail} onChange={setNotifEmail} label={t("configuracion.notifEmail")} />
          </div>
          <div className={styles.switchRow}>
            <span className={styles.switchBody}><b>{t("configuracion.notifWhats")}</b><span>{t("configuracion.notifWhatsSub")}</span></span>
            <Switch checked={notifWhats} onChange={setNotifWhats} label={t("configuracion.notifWhats")} />
          </div>
          <div className={styles.switchRow}>
            <span className={styles.switchBody}><b>{t("configuracion.notifRem")}</b><span>{t("configuracion.notifRemSub")}</span></span>
            <Switch checked={recordatorios} onChange={setRecordatorios} label={t("configuracion.notifRem")} />
          </div>
          <div className={styles.switchRow}>
            <span className={styles.switchBody}><b>{t("configuracion.notifSummary")}</b><span>{t("configuracion.notifSummarySub")}</span></span>
            <Switch checked={resumen} onChange={setResumen} label={t("configuracion.notifSummary")} />
          </div>
        </Panel>

        <Panel>
          <PanelHead title={t("configuracion.appearanceTitle")} sub={t("configuracion.appearanceSub")} />
          <div className={styles.switchRow}>
            <span className={styles.switchBody}>
              <b>{t("configuracion.darkMode")}</b>
              <span>{theme === "dark" ? t("configuracion.darkModeOn") : t("configuracion.darkModeOff")}</span>
            </span>
            <Switch checked={theme === "dark"} onChange={toggleTheme} label={t("configuracion.darkMode")} />
          </div>

          {/* Idioma: cambia el parámetro del usuario (equivalente al de la BD) */}
          <div className={styles.switchRow}>
            <span className={styles.switchBody}>
              <b>{t("configuracion.language")}</b>
              <span>{t("configuracion.languageSub")}</span>
            </span>
            <select
              className={styles.langSelect}
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
              aria-label={t("configuracion.language")}
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </Panel>
      </div>

      <div className={styles.dangerZone}>
        <span>
          <b>{t("configuracion.logoutTitle")}</b>
          <span>{t("configuracion.logoutSub")}</span>
        </span>
        <Button variant="danger" onClick={cerrarSesion}>{t("configuracion.logoutBtn")}</Button>
      </div>
    </>
  );
}
