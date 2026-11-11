"use client";
/* ============================================================
   ClienteReservasModal — reservas de un cliente desde Clientes.

   GET /appointments/users/:userId/services devuelve las citas
   activas (pendientes y confirmadas) y las ya atendidas. Para un
   admin de negocio, el backend se queda solo con las de su empresa
   o su sede: el mismo cliente puede reservar en otros negocios.
============================================================ */
import { useState } from "react";
import { fmtFechaCorta } from "@/constants";
import { ClienteReservasController, type ReservaDeCliente } from "@/controllers/CrudControllers";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/i18n";
import Modal, { ModalTitle, ModalText, ModalActions } from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import styles from "./ClienteReservasModal.module.css";

export default function ClienteReservasModal({
  cliente,
  onClose,
}: {
  /** Cliente cuyas reservas se ven; null con el modal cerrado */
  cliente: { id: number; nombre: string } | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pestana, setPestana] = useState<"activas" | "atendidas">("activas");

  const { data, loading, error } = useData(
    () => (cliente
      ? ClienteReservasController.listar(cliente.id)
      : Promise.resolve({ activas: [], atendidas: [] })),
    [cliente?.id],
    { activas: [] as ReservaDeCliente[], atendidas: [] as ReservaDeCliente[] }
  );

  const lista = pestana === "activas" ? data.activas : data.atendidas;

  return (
    <Modal open={!!cliente} onClose={onClose} maxWidth={640}>
      <ModalTitle>{t("clientes.reservasTitle", { nombre: cliente?.nombre || "" })}</ModalTitle>
      <ModalText>{t("clientes.reservasSub")}</ModalText>

      <Tabs
        active={pestana}
        onChange={(id) => setPestana(id as "activas" | "atendidas")}
        tabs={[
          { id: "activas", label: t("clientes.reservasActivas", { n: data.activas.length }) },
          { id: "atendidas", label: t("clientes.reservasAtendidas", { n: data.atendidas.length }) },
        ]}
      />

      <div className={styles.lista}>
        {loading ? (
          <p className={styles.nota}>{t("common.loading")}</p>
        ) : error ? (
          <p className={styles.error} role="alert">{error}</p>
        ) : lista.length === 0 ? (
          <EmptyState
            icon="calendar"
            title={t(pestana === "activas" ? "clientes.reservasSinActivas" : "clientes.reservasSinAtendidas")}
            message={t("clientes.reservasSinMsg")}
          />
        ) : (
          lista.map((r) => (
            <div key={r.id} className={styles.fila}>
              <div className={styles.cuando}>
                <b>{fmtFechaCorta(r.fecha)}</b>
                <span>{r.hora}{r.horaFin ? ` – ${r.horaFin}` : ""}</span>
              </div>
              <div className={styles.que}>
                <b>{r.servicio}</b>
                <span>{[r.profesional, r.sede].filter(Boolean).join(" · ")}</span>
              </div>
              <Badge kind={r.estado}>{t(`estados.${r.estado}`)}</Badge>
            </div>
          ))
        )}
      </div>

      <ModalActions>
        <Button variant="ghost" block onClick={onClose}>{t("common.close")}</Button>
      </ModalActions>
    </Modal>
  );
}
