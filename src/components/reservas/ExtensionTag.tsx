"use client";
/* ============================================================
   ExtensionTag — marca de listados para citas extendidas
   · Cita de extensión (tiempo extra de otra) → "⏱ Extensión"
   · Cita original que se extendió            → "⏱ +15 min"
============================================================ */
import type { Reserva } from "@/models";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./ExtensionTag.module.css";

export default function ExtensionTag({ reserva }: { reserva: Reserva }) {
  const { t } = useI18n();

  if (reserva.extensionDeId != null) {
    return (
      <span className={styles.tag} title={t("popup.chipExtension", { id: `R-${reserva.extensionDeId}` })}>
        <Icon name="clock" width={12} height={12} />
        {t("extender.tagExtension")}
      </span>
    );
  }

  if (reserva.minutosExtendidos) {
    return (
      <span className={styles.tag} title={t("popup.chipExtendida", { n: reserva.minutosExtendidos })}>
        <Icon name="clock" width={12} height={12} />
        {t("extender.tagExtendida", { n: reserva.minutosExtendidos })}
      </span>
    );
  }

  return null;
}
