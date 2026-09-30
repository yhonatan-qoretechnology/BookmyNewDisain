"use client";
/* ============================================================
   Pantalla de un módulo de pago cuando el negocio no lo tiene.
   ------------------------------------------------------------
   En vez de devolverlo al dashboard sin explicación —que era lo
   que hacía antes— se le enseña qué se está perdiendo y se le
   ofrecen los 30 días. Es la pantalla que más tiene que vender
   de todo el panel.
============================================================ */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { usePlan } from "./usePlan";
import Icon, { type IconName } from "@/components/ui/Icon";
import styles from "./PlanProLock.module.css";

const ICONO: Record<string, IconName> = {
  facturacion: "dollar",
  estadisticas: "barChart",
  stock: "box",
  comunicacion: "message",
};

/** Ventajas de Pro, en el orden en el que mejor se venden. */
const VENTAJAS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;

export default function PlanProLock({ modulo }: { modulo: string }) {
  const { t } = useI18n();
  const { toast } = useUi();
  const router = useRouter();
  const { estado, activarPrueba } = usePlan();
  const [activando, setActivando] = useState(false);

  const puedeProbar = estado?.puedeProbar ?? false;
  const nombreModulo = t(`plan.modules.${modulo}`);

  const probar = async () => {
    if (activando) return;
    setActivando(true);
    try {
      await activarPrueba();
      toast(t("plan.tryDone"), "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Error", "error");
    } finally {
      setActivando(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.copy}>
          <span className={styles.badge}>
            <Icon name="star" /> {t("plan.badge")}
          </span>

          <h1 className={styles.title}>{t("plan.lockTitle", { modulo: nombreModulo })}</h1>
          <p className={styles.lead}>{t("plan.lockLead")}</p>

          <ul className={styles.ventajas}>
            {VENTAJAS.map((clave) => (
              <li key={clave}>
                <span className={styles.check} aria-hidden>
                  <Icon name="check" />
                </span>
                {t(`plan.${clave}`)}
              </li>
            ))}
          </ul>

          {puedeProbar ? (
            <>
              <div className={styles.oferta}>
                <strong>{t("plan.tryTitle")}</strong>
                <p>{t("plan.tryLead")}</p>
              </div>
              <div className={styles.acciones}>
                <button type="button" className={styles.cta} onClick={probar} disabled={activando}>
                  {activando ? (
                    <><span className={styles.spinner} aria-hidden />{t("plan.trying")}</>
                  ) : (
                    <><Icon name="star" />{t("plan.tryCta")}</>
                  )}
                </button>
                <button type="button" className={styles.secundario} onClick={() => router.push(ROUTES.dashboard)}>
                  {t("plan.backCta")}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.oferta}>
                <strong>{t("plan.trialOverTitle")}</strong>
                <p>{t("plan.trialOverText")}</p>
              </div>
              <div className={styles.acciones}>
                <a
                  className={styles.cta}
                  href="https://wa.me/34651026700?text=Hola%2C%20quiero%20Bookmy%20CRM%20Pro"
                  target="_blank"
                  rel="noopener"
                >
                  <Icon name="message" /> {t("plan.salesCta")}
                </a>
                <button type="button" className={styles.secundario} onClick={() => router.push(ROUTES.dashboard)}>
                  {t("plan.backCta")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Vista del módulo bloqueado: se intuye lo que hay detrás */}
        <div className={styles.visual} aria-hidden>
          <div className={styles.visualIcon}>
            <Icon name={ICONO[modulo] ?? "star"} />
          </div>
          <div className={styles.visualShot}>
            <img src="/web/img/dashboard-b.png" alt="" loading="lazy" decoding="async" />
            <span className={styles.visualLock}>
              <Icon name="shield" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
