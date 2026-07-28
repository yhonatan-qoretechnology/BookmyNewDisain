"use client";
/* ============================================================
   TicketModal — popup con la imagen del tickete + descargar
============================================================ */
import { Gasto } from "@/controllers/FacturacionControllers";
import Modal from "./Modal";

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
  if (!gasto) return null;

  return (
    <Modal title={`Tickete — ${gasto.gasto}`} onClose={onClose} width={640}>
      {gasto.ticket ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gasto.ticket}
            alt={`Tickete de ${gasto.gasto}`}
            style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border,#eee)" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => descargarTicket(gasto)}>
              Descargar imagen
            </button>
          </div>
        </>
      ) : (
        <p style={{ color: "var(--muted,#777)" }}>Este gasto no tiene tickete adjunto.</p>
      )}
    </Modal>
  );
}
