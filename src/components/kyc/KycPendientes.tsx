"use client";
/* ============================================================
   KycPendientes — la cola de verificaciones, en una ventana
   ------------------------------------------------------------
   Atajo desde Empresas. El contenido es el mismo ColaKyc que usa
   la pantalla /verificacion: aquí solo se le pone el marco.
============================================================ */
import { useI18n } from "@/i18n";
import Modal, { ModalActions, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ColaKyc from "./ColaKyc";

export default function KycPendientes({
  abierto,
  onClose,
}: {
  abierto: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <Modal open={abierto} onClose={onClose} maxWidth={720} contentScroll>
      <ModalTitle>{t("kyc.pendientesTitulo")}</ModalTitle>

      <ColaKyc activa={abierto} />

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
