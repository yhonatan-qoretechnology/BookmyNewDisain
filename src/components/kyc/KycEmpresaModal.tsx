"use client";
/* ============================================================
   KycEmpresaModal — verificación de UNA empresa (superadmin)
   ------------------------------------------------------------
   La cola solo muestra lo que está en revisión. Esto abre la de
   cualquier empresa: si ya subió documentación se ve y se puede
   aprobar o rechazar, y si no, se dice que le toca subirla a ella
   desde su propio panel.
============================================================ */
import { useState } from "react";
import type { ApiEmpresaKyc } from "@/api/types";
import { ARCHIVOS_KYC, KycController } from "@/controllers/KycController";
import { fotoUrl } from "@/constants";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Modal, { ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { BADGE_KYC } from "./estados";
import styles from "./Kyc.module.css";

export default function KycEmpresaModal({
  empresaId,
  empresaNombre,
  onClose,
  onResuelto,
}: {
  /** null cierra el modal */
  empresaId: number | null;
  empresaNombre: string;
  onClose: () => void;
  /** Tras aprobar o rechazar, para refrescar el listado de empresas */
  onResuelto: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();

  const { data: kyc, reload } = useData<ApiEmpresaKyc | null>(
    () => (empresaId ? KycController.estado(empresaId).catch(() => null) : Promise.resolve(null)),
    [empresaId],
    null,
  );

  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const estado = kyc?.estado ?? "PENDIENTE";
  const archivos = ARCHIVOS_KYC.filter((campo) => kyc?.[campo]);

  const resolver = async (accion: "aprobar" | "rechazar") => {
    if (empresaId == null) return;
    if (accion === "rechazar" && !motivo.trim()) {
      toast(t("kyc.faltaMotivo"), "error");
      return;
    }
    setGuardando(true);
    try {
      if (accion === "aprobar") await KycController.aprobar(empresaId);
      else await KycController.rechazar(empresaId, motivo.trim());
      toast(accion === "aprobar" ? t("kyc.aprobada") : t("kyc.rechazada"), "success");
      setMotivo("");
      await reload();
      onResuelto();
    } catch (e) {
      toast(e instanceof Error ? e.message : t("common.error"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={empresaId != null} onClose={onClose} maxWidth={620} contentScroll>
      <ModalTitle>{t("kyc.empresaTitulo", { empresa: empresaNombre })}</ModalTitle>

      <div className={styles.estadoRow}>
        <Badge kind={BADGE_KYC[estado]}>{t(`kyc.estados.${estado}`)}</Badge>
        {kyc?.enviadoEn && (
          <span className={styles.nota}>
            {t("kyc.enviadoEl", { fecha: new Date(kyc.enviadoEn).toLocaleDateString() })}
          </span>
        )}
        {kyc?.nifCif && <span className={styles.nota}>{t("kyc.nifCif")}: {kyc.nifCif}</span>}
      </div>

      {estado === "RECHAZADA" && kyc?.motivoRechazo && (
        <p className={styles.motivo}>{t("kyc.motivoRechazo", { motivo: kyc.motivoRechazo })}</p>
      )}

      {archivos.length === 0 ? (
        /* Sin fila de KYC o sin archivos: nadie puede subirlos por ella */
        <ModalText>{t("kyc.sinDocumentos")}</ModalText>
      ) : (
        <>
          <p className={styles.nota}>{t("kyc.elegirArchivo")}</p>
          <div className={styles.archivos}>
            {archivos.map((campo) => (
              <a
                key={campo}
                className={styles.archivo}
                href={fotoUrl(kyc?.[campo]) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(`kyc.archivos.${campo}`)}
              </a>
            ))}
          </div>

          <div className={styles.acciones}>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("kyc.rechazarMotivo")}
            />
            <Button size="sm" variant="danger" disabled={guardando} onClick={() => void resolver("rechazar")}>
              {t("kyc.rechazar")}
            </Button>
            <Button size="sm" disabled={guardando || estado === "APROBADA"} onClick={() => void resolver("aprobar")}>
              {t("kyc.aprobar")}
            </Button>
          </div>
        </>
      )}

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
