"use client";
/* ============================================================
   KycPendientes — cola de verificaciones del superadmin
   ------------------------------------------------------------
   Lo que los negocios enviaron y está sin resolver. Se abren los
   archivos en otra pestaña y se aprueba, o se rechaza escribiendo el
   motivo: el negocio lo ve en su panel y puede volver a enviarlo.
============================================================ */
import { useState } from "react";
import type { ApiKycPendiente } from "@/api/types";
import { ARCHIVOS_KYC, KycController } from "@/controllers/KycController";
import { fotoUrl } from "@/constants";
import { useData } from "@/hooks/useData";
import { useUi } from "@/context/UiContext";
import { useI18n } from "@/i18n";
import Modal, { ModalActions, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./Kyc.module.css";

export default function KycPendientes({
  abierto,
  onClose,
}: {
  abierto: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useUi();

  const { data: pendientes, reload } = useData<ApiKycPendiente[]>(
    () => (abierto ? KycController.pendientes() : Promise.resolve([])),
    [abierto],
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

  return (
    <Modal open={abierto} onClose={onClose} maxWidth={720} contentScroll>
      <ModalTitle>{t("kyc.pendientesTitulo")}</ModalTitle>

      {pendientes.length === 0 ? (
        <p className={styles.vacio}>{t("kyc.pendientesVacio")}</p>
      ) : (
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
      )}

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
