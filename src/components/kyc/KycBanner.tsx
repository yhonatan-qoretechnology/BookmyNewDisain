"use client";
/* ============================================================
   KycBanner — aviso de verificación pendiente, sobre el panel
   ------------------------------------------------------------
   Solo lo ve el dueño del negocio, y solo mientras le toque hacer
   algo: no ha enviado la documentación, o se la rechazaron. No
   bloquea nada; lleva a Configuración, donde está el formulario.

   El backend da un plazo (7 días desde el alta) y aquí se cuenta en
   voz alta, pero sigue siendo un aviso: pase el plazo o no, el
   negocio trabaja igual y no se esconde ninguna pantalla. Lo único
   que cambia al vencer es el tono.
============================================================ */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { KycController } from "@/controllers/KycController";
import type { ApiEmpresaKyc } from "@/api/types";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./Kyc.module.css";

export default function KycBanner() {
  const { session } = useSession();
  const { t } = useI18n();
  const [kyc, setKyc] = useState<ApiEmpresaKyc | null>(null);

  const empresaId = Number(session?.negocioId) || 0;
  /* Solo el dueño: el superadmin tiene su cola de revisión y el resto
     de roles no puede enviar la documentación. */
  const esDuenio = session?.role === "owner";

  useEffect(() => {
    if (!esDuenio || !empresaId) return;
    let vigente = true;
    KycController.estado(empresaId)
      .then((k) => { if (vigente) setKyc(k); })
      .catch(() => { /* sin verificación no hay aviso que dar */ });
    return () => { vigente = false; };
  }, [esDuenio, empresaId]);

  if (!KycController.requiereAccion(kyc?.estado)) return null;

  const rechazada = kyc?.estado === "RECHAZADA";
  const vencido = kyc?.plazoVencido === true;
  const dias = kyc?.diasParaVerificar;

  /* Un rechazo gasta el mismo rojo que el plazo vencido, pero su texto es
     el que dice qué hacer, así que gana. */
  const texto = rechazada
    ? t("kyc.bannerRechazada")
    : vencido
      ? t("kyc.bannerVencido")
      /* Sin plazo (backend viejo, o la cuenta sin fecha de alta) se queda el
         aviso de siempre antes que inventarse una cuenta atrás. */
      : dias === undefined
        ? t("kyc.bannerPendiente")
        : dias <= 1
          ? t("kyc.bannerUltimoDia")
          : t("kyc.bannerDias", { n: dias });

  return (
    <div className={`${styles.banner} ${rechazada || vencido ? styles.bannerRechazada : ""}`} role="status">
      <Icon name="shield" />
      <p className={styles.bannerTexto}>{texto}</p>
      <Link className={styles.bannerCta} href={ROUTES.configuracion}>
        {t("kyc.bannerCta")}
      </Link>
    </div>
  );
}
