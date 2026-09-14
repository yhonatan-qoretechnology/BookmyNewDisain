"use client";
/* ============================================================
   EditarReservaModal — ajustes sobre una reserva ya creada
   ------------------------------------------------------------
   · Horario  → abre ExtenderCitaModal, el mismo flujo que usa la
                especialista en su agenda: minutos extra y, si chocan
                con la siguiente cita, reasignarla, moverla o
                cancelarla. Este modal se cierra para no apilar dos.
   · Detalles → PATCH /appointments/:id/observacion-espera, la nota
                del cliente que esta esperando. Va aparte de `notas`
                porque esas son del cliente y el reagendado las
                machaca.

   El precio NO se toca aqui: los importes se ajustan en Facturacion
   anadiendo conceptos adicionales, que es donde vive la factura.
============================================================ */
import { useEffect, useState } from "react";
import type { Reserva } from "@/models";
import { ReservasController } from "@/controllers/ReservasController";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { Field, ModalActions, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./EditarReservaModal.module.css";

interface Props {
  reserva: Reserva | null;
  onClose: () => void;
  onActualizada: (r: Reserva) => void;
  /** Pide abrir ExtenderCitaModal para esta reserva */
  onExtender: (r: Reserva) => void;
}

export default function EditarReservaModal({ reserva, onClose, onActualizada, onExtender }: Props) {
  const { t } = useI18n();
  const { toast } = useUi();

  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!reserva) return;
    setObservacion(reserva.observacionEspera ?? "");
  }, [reserva]);

  if (!reserva) return null;

  const guardarDetalles = async () => {
    setGuardando(true);
    try {
      const r = await ReservasController.guardarObservacionEspera(reserva, observacion);
      onActualizada(r);
      toast(t("reservas.observacionGuardada"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("reservas.observacionError"), "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal open={!!reserva} onClose={onClose}>
      <ModalTitle>{t("reservas.editarTitulo", { id: reserva.id })}</ModalTitle>

      <div className={styles.resumen}>
        <span>{t("common.client")}: <b>{reserva.cliente}</b></span>
        <span>{t("common.service")}: <b>{reserva.servicio}</b></span>
        <span>{t("common.time")}: <b>{reserva.hora}</b></span>
      </div>

      {/* ── Horario ── */}
      <div className={styles.seccion}>
        <p className={styles.seccionTitulo}>{t("reservas.extenderHorario")}</p>
        <div className={styles.fila}>
          <p className={styles.ayuda}>{t("reservas.extenderAyuda", { actual: reserva.duracion })}</p>
          <div className={styles.acciones}>
            <Button size="sm" onClick={() => onExtender(reserva)} disabled={guardando}>
              {t("extender.boton")}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Detalles ── */}
      <div className={styles.seccion}>
        <p className={styles.seccionTitulo}>{t("reservas.detalles")}</p>
        <Field label={t("reservas.observacionEspera")} htmlFor="er-obs">
          <textarea
            id="er-obs"
            className={styles.area}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder={t("reservas.observacionPlaceholder")}
            maxLength={500}
          />
        </Field>
        <div className={styles.fila}>
          <div className={styles.acciones}>
            <Button size="sm" onClick={() => void guardarDetalles()} disabled={guardando}>
              {guardando ? t("booking.loading") : t("common.save")}
            </Button>
          </div>
        </div>
        {reserva.notas ? (
          <>
            <p className={styles.ayuda}>{t("reservas.notasCliente")}</p>
            <div className={styles.notas}>{reserva.notas}</div>
          </>
        ) : null}
        <p className={styles.ayuda}>{t("reservas.precioAyuda")}</p>
      </div>

      <ModalActions>
        <Button variant="ghost" onClick={onClose} disabled={guardando}>
          {t("common.close")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
