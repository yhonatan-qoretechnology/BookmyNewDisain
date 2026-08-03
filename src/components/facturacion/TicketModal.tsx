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

/**
 * Descarga el comprobante. Ahora el tickete vive en otro origen
 * (bookmy.es), y ahí el navegador ignora el atributo `download` y se
 * limita a abrir la imagen; por eso se baja el binario y se descarga
 * desde un blob local. Si falla (CORS o red), se abre en otra pestaña.
 */
export async function descargarTicket(g: Gasto) {
  if (!g.ticket) return;
  const nombre = g.ticketNombre || `tickete-${g.id}.jpg`;
  try {
    const res = await fetch(g.ticket);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(g.ticket, "_blank", "noopener");
  }
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
          <Button onClick={() => void descargarTicket(gasto)} disabled={!gasto.ticket}>
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
