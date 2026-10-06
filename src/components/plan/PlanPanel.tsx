"use client";
/* ============================================================
   PlanPanel — "Tu plan", en Configuración
   ------------------------------------------------------------
   Hasta ahora el negocio solo sabía de su plan cuando chocaba con
   un módulo bloqueado o cuando le saltaba el aviso de la prueba:
   si tenía Pro, no se lo decía nada. Aquí ve qué tiene, qué le
   falta y, si nunca la usó, puede activar la prueba de 30 días.
============================================================ */
import { useState } from "react";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useSession } from "@/context/SessionContext";
import { usePlan } from "./usePlan";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./PlanPanel.module.css";

const VENTAS = "https://wa.me/34651026700?text=Hola%2C%20quiero%20Bookmy%20CRM%20Pro";
/** Lo que entra en Pro, en el mismo orden que la pantalla de bloqueo. */
const VENTAJAS = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;

export default function PlanPanel() {
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const { session } = useSession();
  const { estado, activarPrueba } = usePlan();
  const [activando, setActivando] = useState(false);

  /* El superadmin no pertenece a ningún negocio: su sitio es Empresas. */
  if (!session?.negocioId || session.role === "superadmin") return null;

  const pro = estado?.planEfectivo === "PRO";
  /* La prueba la activa el dueño; un admin de sede solo mira. */
  const puedeActivar = session.role === "owner" && (estado?.puedeProbar ?? false);

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

  return (
    <Panel>
      <PanelHead title={t("plan.panelTitle")} sub={t("plan.panelSub")} />

      <div className={styles.cabecera}>
        <Badge kind={pro ? "activo" : "inactivo"}>{pro ? t("plan.pro") : t("plan.free")}</Badge>
        {estado?.enPrueba && estado.trialEndsAt && (
          <span className={styles.nota}>
            {t("plan.trialUntil", { fecha: new Date(estado.trialEndsAt).toLocaleDateString(locale) })}
            {" · "}
            {estado.diasDePrueba <= 1
              ? t("plan.trialBannerOne")
              : t("plan.trialBanner", { n: estado.diasDePrueba })}
          </span>
        )}
      </div>

      <ul className={styles.ventajas}>
        {VENTAJAS.map((clave) => (
          <li key={clave} className={pro ? styles.incluida : styles.bloqueada}>
            <Icon name={pro ? "circle-check" : "shield"} width={16} height={16} />
            <span>{t(`plan.${clave}`)}</span>
            {!pro && <small>{t("plan.soloPro")}</small>}
          </li>
        ))}
      </ul>

      {puedeActivar ? (
        <div className={styles.acciones}>
          <p className={styles.nota}>{t("plan.tryLead")}</p>
          <Button onClick={() => void probar()} disabled={activando}>
            {activando ? t("plan.trying") : t("plan.tryCta")}
          </Button>
        </div>
      ) : !pro ? (
        <div className={styles.acciones}>
          <p className={styles.nota}>{t("plan.trialOverText")}</p>
          <a className={styles.ventas} href={VENTAS} target="_blank" rel="noopener noreferrer">
            {t("plan.salesCta")}
          </a>
        </div>
      ) : (
        <p className={styles.nota}>{t("plan.proActivo")}</p>
      )}
    </Panel>
  );
}
