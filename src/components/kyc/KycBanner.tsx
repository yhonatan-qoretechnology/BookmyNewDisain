"use client";
/* ============================================================
   KycBanner — aviso de verificación pendiente, sobre el panel
   ------------------------------------------------------------
   Solo lo ve el dueño del negocio, y solo mientras le toque hacer
   algo: no ha enviado la documentación, o se la rechazaron. No
   bloquea nada; lleva a Configuración, donde está el formulario.
============================================================ */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { KycController } from "@/controllers/KycController";
import type { ApiKycEstado } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./Kyc.module.css";

export default function KycBanner() {
  const { session } = useSession();
  const { t } = useI18n();
  const [estado, setEstado] = useState<ApiKycEstado | null>(null);

  const empresaId = Number(session?.negocioId) || 0;
  /* Solo el dueño: el superadmin tiene su cola de revisión y el resto
     de roles no puede enviar la documentación. */
  const esDuenio = session?.role === "owner";

  useEffect(() => {
    if (!esDuenio || !empresaId) return;
    let vigente = true;
    KycController.estado(empresaId)
      .then((k) => { if (vigente) setEstado(k.estado); })
      .catch(() => { /* sin verificación no hay aviso que dar */ });
    return () => { vigente = false; };
  }, [esDuenio, empresaId]);

  if (!KycController.requiereAccion(estado ?? undefined)) return null;

  const rechazada = estado === "RECHAZADA";

  return (
    <div className={`${styles.banner} ${rechazada ? styles.bannerRechazada : ""}`} role="status">
      <Icon name="shield" />
      <p className={styles.bannerTexto}>
        {rechazada ? t("kyc.bannerRechazada") : t("kyc.bannerPendiente")}
      </p>
      <Link className={styles.bannerCta} href={ROUTES.configuracion}>
        {t("kyc.bannerCta")}
      </Link>
    </div>
  );
}
