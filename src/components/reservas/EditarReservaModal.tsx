"use client";
/* ============================================================
   EditarReservaModal — ajustes sobre una reserva ya creada
   ------------------------------------------------------------
   Dos bloques independientes, cada uno con su propio guardado:

   · Horario  → PATCH /appointments/:id/extend. Alarga la cita sin
                moverla de hora. El backend rechaza la ampliacion si
                pisa la cita siguiente del mismo profesional.
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
}

export default function EditarReservaModal({ reserva, onClose, onActualizada }: Props) {
  const { t } = useI18n();
  const { toast } = useUi();

  const [duracion, setDuracion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState<"horario" | "detalles" | null>(null);

  useEffect(() => {
    if (!reserva) return;
    setDuracion(String(reserva.duracion ?? 30));
    setMotivo("");
    setObservacion(reserva.observacionEspera ?? "");
  }, [reserva]);

  if (!reserva) return null;

  const guardarHorario = async () => {
    const minutos = Number(duracion);
    if (!Number.isFinite(minutos) || minutos <= reserva.duracion) {
      toast(t("reservas.extenderMayor", { actual: reserva.duracion }), "error");
      return;
    }
    setGuardando("horario");
    try {
      const r = await ReservasController.extenderHorario(reserva, minutos, motivo.trim() || undefined);
      onActualizada(r);
      toast(t("reservas.extendida", { minutos }), "success");
      setMotivo("");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("reservas.extenderError"), "error");
    } finally {
      setGuardando(null);
    }
  };

  const guardarDetalles = async () => {
    setGuardando("detalles");
    try {
      const r = await ReservasController.guardarObservacionEspera(reserva, observacion);
      onActualizada(r);
      toast(t("reservas.observacionGuardada"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("reservas.observacionError"), "error");
    } finally {
      setGuardando(null);
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
          <Field label={t("reservas.duracionTotal")} htmlFor="er-dur">
            <input
              id="er-dur"
              type="number"
              min={reserva.duracion + 1}
              step={15}
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          </Field>
          <Field label={t("reservas.motivoOpcional")} htmlFor="er-motivo">
            <input
              id="er-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("reservas.motivoPlaceholder")}
            />
          </Field>
          <div className={styles.acciones}>
            <Button size="sm" onClick={() => void guardarHorario()} disabled={guardando !== null}>
              {guardando === "horario" ? t("booking.loading") : t("common.save")}
            </Button>
          </div>
        </div>
        <p className={styles.ayuda}>{t("reservas.extenderAyuda", { actual: reserva.duracion })}</p>
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
            <Button size="sm" onClick={() => void guardarDetalles()} disabled={guardando !== null}>
              {guardando === "detalles" ? t("booking.loading") : t("common.save")}
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
        <Button variant="ghost" onClick={onClose} disabled={guardando !== null}>
          {t("common.close")}
        </Button>
      </ModalActions>
    </Modal>
  );
}
