"use client";
/* ============================================================
   TicketModal — popup con la imagen del tickete + descarga
============================================================ */
import { fmtFechaLarga, fmtMoneda } from "@/constants";
import type { Gasto } from "@/controllers/FacturacionControllers";
import { useI18n } from "@/i18n";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "./Modal";
import styles from "./facturacion.module.css";

export function descargarTicket(g: Gasto) {
  if (!g.ticket) return;
  const a = document.createElement("a");
  a.href = g.ticket;
  a.download = g.ticketNombre || `tickete-${g.id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function TicketModal({
  gasto,
  onClose,
}: {
  gasto: Gasto | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  if (!gasto) return null;

  return (
    <Modal
      title={gasto.gasto}
      subtitle={`${fmtFechaLarga(gasto.fecha)} · ${fmtMoneda(gasto.total, "EUR")}`}
      onClose={onClose}
      size="md"
      closeLabel={t("common.close")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t("common.close")}</Button>
          <Button onClick={() => descargarTicket(gasto)} disabled={!gasto.ticket}>
            <Icon name="download" /> {t("gastos.descargarImagen")}
          </Button>
        </>
      }
    >
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t("gastos.categoria")}</span>
          <span><Badge kind="activo">{gasto.categoria}</Badge></span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>{t("gastos.total")}</span>
          <span className={styles.metaValue}>{fmtMoneda(gasto.total, "EUR")}</span>
        </div>
      </div>

      {gasto.ticket ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={gasto.ticket}
          alt={`${t("gastos.tickete")} — ${gasto.gasto}`}
          className={styles.ticketFull}
        />
      ) : (
        <EmptyState icon="image" title={t("gastos.sinTickete")} />
      )}
    </Modal>
  );
}
