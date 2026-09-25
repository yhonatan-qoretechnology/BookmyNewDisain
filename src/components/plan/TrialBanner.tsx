"use client";
/* ============================================================
   Aviso del estado de la prueba, sobre el contenido del panel.
   ------------------------------------------------------------
   Tres estados y ninguno más, para no cansar:
   · en prueba  → cuántos días quedan y cómo seguir
   · caducada   → qué se ha perdido y con quién hablar
   · gratuito   → la invitación a probar Pro 30 días
============================================================ */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { usePlan } from "./usePlan";
import Icon from "@/components/ui/Icon";
import styles from "./TrialBanner.module.css";

const OCULTO_KEY = "bm_plan_aviso_oculto";
const VENTAS = "https://wa.me/34651026700?text=Hola%2C%20quiero%20Bookmy%20CRM%20Pro";

export default function TrialBanner() {
  const { t } = useI18n();
  const { toast } = useUi();
  const { estado, activarPrueba } = usePlan();
  const [oculto, setOculto] = useState(true);
  const [activando, setActivando] = useState(false);

  /* Se oculta a mano y no vuelve en el resto del día: el aviso tiene que
     insistir, no molestar. */
  useEffect(() => {
    try {
      setOculto(localStorage.getItem(OCULTO_KEY) === new Date().toDateString());
    } catch { setOculto(false); }
  }, []);

  if (!estado || oculto) return null;

  const cerrar = () => {
    try { localStorage.setItem(OCULTO_KEY, new Date().toDateString()); } catch { /* noop */ }
    setOculto(true);
  };

  const probar = async () => {
    if (activando) return;
    setActivando(true);
    try {
      await activarPrueba();
      toast(t("plan.tryDone"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActivando(false);
    }
  };

  /* ── En prueba ── */
  if (estado.enPrueba) {
    const quedan = estado.diasDePrueba;
    const urgente = quedan <= 7;
    return (
      <div className={`${styles.banner} ${urgente ? styles.urgente : ""}`} role="status">
        <span className={styles.icono}><Icon name="star" /></span>
        <p className={styles.texto}>
          {quedan <= 1 ? t("plan.trialBannerOne") : t("plan.trialBanner", { n: quedan })}
        </p>
        <a className={styles.cta} href={VENTAS} target="_blank" rel="noopener">
          {t("plan.trialBannerCta")}
        </a>
        <button type="button" className={styles.cerrar} onClick={cerrar} aria-label={t("common.close")}>
          <Icon name="x" />
        </button>
      </div>
    );
  }

  /* ── Prueba terminada ── */
  if (estado.pruebaCaducada) {
    return (
      <div className={`${styles.banner} ${styles.caducada}`} role="status">
        <span className={styles.icono}><Icon name="clock" /></span>
        <p className={styles.texto}>{t("plan.trialOverTitle")}</p>
        <a className={styles.cta} href={VENTAS} target="_blank" rel="noopener">
          {t("plan.salesCta")}
        </a>
        <button type="button" className={styles.cerrar} onClick={cerrar} aria-label={t("common.close")}>
          <Icon name="x" />
        </button>
      </div>
    );
  }

  /* ── Plan gratuito que todavía no ha probado Pro ── */
  if (estado.puedeProbar) {
    return (
      <div className={`${styles.banner} ${styles.oferta}`} role="status">
        <span className={styles.icono}><Icon name="star" /></span>
        <p className={styles.texto}>
          <b>{t("plan.offerTitle")}</b>
          <span>{t("plan.offerText")}</span>
        </p>
        <button type="button" className={styles.cta} onClick={probar} disabled={activando}>
          {activando ? t("plan.trying") : t("plan.offerCta")}
        </button>
        <button type="button" className={styles.cerrar} onClick={cerrar} aria-label={t("common.close")}>
          <Icon name="x" />
        </button>
      </div>
    );
  }

  return null;
}
