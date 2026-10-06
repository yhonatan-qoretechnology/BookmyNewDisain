"use client";
/* ============================================================
   ColaKyc — verificaciones a la espera de revisión
   ------------------------------------------------------------
   El trabajo del superadmin: abrir los documentos de cada negocio
   y aprobar, o rechazar escribiendo el motivo (que el negocio ve
   en su panel para corregir y volver a enviar).

   Vive aparte de la pantalla y de la ventana que la muestran: la
   misma cola se usa en /verificacion y en el modal de Empresas.
============================================================ */
import { useState } from "react";
import type { ApiKycPendiente } from "@/api/types";
import { ARCHIVOS_KYC, KycController } from "@/controllers/KycController";
import { fotoUrl } from "@/constants";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import styles from "./Kyc.module.css";

export default function ColaKyc({ activa = true }: { activa?: boolean }) {
  const { t } = useI18n();
  const { toast } = useUi();

  const { data: pendientes, reload } = useData<ApiKycPendiente[]>(
    () => (activa ? KycController.pendientes() : Promise.resolve([])),
    [activa],
    [],
  );

  /** empresaId → motivo que se está escribiendo para rechazar */
  const [motivos, setMotivos] = useState<Record<number, string>>({});
  const [ocupada, setOcupada] = useState<number | null>(null);

  const resolver = async (empresaId: number, accion: "aprobar" | "rechazar") => {
    const motivo = (motivos[empresaId] || "").trim();
    if (accion === "rechazar" && !motivo) {
      toast(t("kyc.faltaMotivo"), "error");
      return;
    }
    setOcupada(empresaId);
    try {
      if (accion === "aprobar") await KycController.aprobar(empresaId);
      else await KycController.rechazar(empresaId, motivo);
      toast(accion === "aprobar" ? t("kyc.aprobada") : t("kyc.rechazada"), "success");
      setMotivos((prev) => ({ ...prev, [empresaId]: "" }));
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setOcupada(null);
    }
  };

  if (pendientes.length === 0) {
    return (
      <div className={styles.vacioCola}>
        <Icon name="circle-check" width={28} height={28} />
        <b>{t("kyc.pendientesVacio")}</b>
        <span>{t("kyc.pendientesVacioSub")}</span>
      </div>
    );
  }

  return (
    <div className={styles.cola}>
      {pendientes.map((p) => (
        <article key={p.empresaId} className={styles.item}>
          <header className={styles.itemHead}>
            <b>{p.empresa?.nombre || `#${p.empresaId}`}</b>
            <span>
              {p.nifCif ? `${t("kyc.nifCif")}: ${p.nifCif} · ` : ""}
              {p.enviadoEn ? new Date(p.enviadoEn).toLocaleDateString() : "—"}
            </span>
          </header>

          <div className={styles.archivos}>
            {ARCHIVOS_KYC.filter((campo) => p[campo]).map((campo) => (
              <a
                key={campo}
                className={styles.archivo}
                href={fotoUrl(p[campo]) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="fileText" width={13} height={13} />
                {t(`kyc.archivos.${campo}`)}
              </a>
            ))}
          </div>

          <div className={styles.acciones}>
            <input
              value={motivos[p.empresaId] || ""}
              onChange={(e) => setMotivos((prev) => ({ ...prev, [p.empresaId]: e.target.value }))}
              placeholder={t("kyc.rechazarMotivo")}
            />
            <Button
              size="sm"
              variant="danger"
              disabled={ocupada !== null}
              onClick={() => void resolver(p.empresaId, "rechazar")}
            >
              {t("kyc.rechazar")}
            </Button>
            <Button
              size="sm"
              disabled={ocupada !== null}
              onClick={() => void resolver(p.empresaId, "aprobar")}
            >
              {t("kyc.aprobar")}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
