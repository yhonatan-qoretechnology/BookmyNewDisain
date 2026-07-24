"use client";
/* ============================================================
   ReagendarModal — cambia la fecha/hora de una reserva existente
   Reutiliza el mismo calendario y grid de franjas del asistente
   de reservas (CalendarGrid + SlotPicker) para no romper el
   sistema de diseño. Solo cambia fecha/hora: cliente, servicio y
   profesional se conservan (PATCH /appointments/:id/reschedule).
============================================================ */
import { useEffect, useMemo, useState } from "react";
import type { Reserva, SlotHora } from "@/models";
import { DIAS_AGENDABLES } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import CalendarGrid from "@/components/ui/CalendarGrid";
import SlotPicker from "@/components/reservas/booking/SlotPicker";
import { ErrorBox, Loading } from "@/components/reservas/booking/Feedback";
import bookingStyles from "@/components/reservas/booking/booking.module.css";
import styles from "./ReagendarModal.module.css";

const ymd = (d: Date) => d.toISOString().slice(0, 10);

interface ReagendarModalProps {
  reserva: Reserva | null;
  onClose: () => void;
  onReagendada: (nueva: Reserva) => void;
}

export default function ReagendarModal({ reserva, onClose, onReagendada }: ReagendarModalProps) {
  const { t } = useI18n();
  const { toast } = useUi();

  const [fecha, setFecha] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotHora | null>(null);
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<SlotHora[]>([]);
  const [loadingDias, setLoadingDias] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Reinicia el estado al abrir el modal para otra reserva */
  useEffect(() => {
    setFecha(null);
    setSlot(null);
    setSlots([]);
    setError(null);
    setBloqueados(new Set());
  }, [reserva?.id]);

  /* Días del profesional sin franjas libres (bloquea el calendario) */
  useEffect(() => {
    if (!reserva) return;
    let alive = true;
    setLoadingDias(true);
    ReservasController.getDiasNoDisponiblesReagendar(reserva)
      .then((dias) => { if (alive) setBloqueados(dias); })
      .catch(() => { if (alive) setError(t("reservas.reagendarLoadError")); })
      .finally(() => { if (alive) setLoadingDias(false); });
    return () => { alive = false; };
  }, [reserva, t]);

  /* Franjas libres del día elegido */
  useEffect(() => {
    if (!reserva || !fecha) { setSlots([]); return; }
    let alive = true;
    setLoadingSlots(true);
    setSlot(null);
    ReservasController.getSlotsParaReagendar(reserva, fecha)
      .then((s) => { if (alive) setSlots(s); })
      .catch(() => { if (alive) setError(t("reservas.reagendarLoadError")); })
      .finally(() => { if (alive) setLoadingSlots(false); });
    return () => { alive = false; };
  }, [reserva, fecha, t]);

  const hoy = useMemo(() => ymd(new Date()), []);
  const limite = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + DIAS_AGENDABLES);
    return ymd(d);
  }, []);
  const isDateDisabled = (f: string) => f < hoy || f > limite || bloqueados.has(f);

  const confirmar = async () => {
    if (!reserva || !slot) return;
    setSaving(true);
    setError(null);
    try {
      const nueva = await ReservasController.reagendar(reserva, slot);
      toast(t("reservas.reagendarSuccess"), "success");
      onReagendada(nueva);
      onClose();
    } catch {
      setError(t("reservas.reagendarError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!reserva} onClose={onClose} maxWidth={640}>
      {reserva && (
        <>
          <ModalTitle>{t("reservas.reagendarTitle")}</ModalTitle>
          <ModalText>{t("reservas.reagendarSub", { servicio: reserva.servicio, cliente: reserva.cliente })}</ModalText>

          {error && <ErrorBox>{error}</ErrorBox>}

          <div className={styles.scrollBody}>
            {loadingDias ? (
              <Loading label={t("booking.checkingAgenda")} />
            ) : (
              <div className={bookingStyles.calendarioFull}>
                <CalendarGrid
                  events={{}}
                  selectable
                  selectedDate={fecha}
                  onSelectDate={setFecha}
                  isDateDisabled={isDateDisabled}
                />
              </div>
            )}

            {fecha && (
              loadingSlots ? (
                <Loading label={t("booking.checkingAgenda")} />
              ) : slots.length === 0 ? (
                <EmptyState icon="clock" title={t("booking.noSlotsTitle")} message={t("booking.noSlotsMsg")} />
              ) : (
                <SlotPicker slots={slots} selected={slot?.hora} onSelect={setSlot} />
              )
            )}
          </div>

          <ModalActions>
            <Button variant="ghost" block onClick={onClose} disabled={saving}>{t("common.cancel")}</Button>
            <Button block disabled={!slot || saving} onClick={confirmar}>
              {saving ? t("booking.loading") : t("reservas.reagendarConfirm")}
            </Button>
          </ModalActions>
        </>
      )}
    </Modal>
  );
}
