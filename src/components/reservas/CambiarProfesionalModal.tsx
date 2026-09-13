"use client";
/* ============================================================
   CambiarProfesionalModal — pasa una cita a otro especialista
   ------------------------------------------------------------
   PATCH /appointments/:id/reassign. Lista solo profesionales
   activos de la misma sede que prestan ese servicio
   (GET /profesionales/by-sede/:id). Si el elegido está ocupado a
   esa hora, el backend responde 400 con el motivo y se muestra tal
   cual. El cliente recibe la notificación del cambio.
============================================================ */
import { useEffect, useState } from "react";
import type { Reserva } from "@/models";
import { ReservasController, type ProfesionalReasignable } from "@/controllers/ReservasController";
import { fmtFechaLarga } from "@/constants";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { Field, ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PersonRow } from "@/components/ui/People";
import { ErrorBox, Loading } from "@/components/reservas/booking/Feedback";
import styles from "./CambiarProfesionalModal.module.css";

interface CambiarProfesionalModalProps {
  /** Cita a reasignar; null cierra el modal */
  reserva: Reserva | null;
  onClose: () => void;
  onReasignada: () => void;
}

export default function CambiarProfesionalModal({ reserva, onClose, onReasignada }: CambiarProfesionalModalProps) {
  const { t, locale } = useI18n();
  const { toast } = useUi();

  const [lista, setLista] = useState<ProfesionalReasignable[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!reserva) return;
    let vigente = true;
    setCargando(true);
    setError(null);
    setLista([]);
    setMotivo("");
    ReservasController.getProfesionalesParaReasignar(reserva, locale)
      .then((l) => { if (vigente) setLista(l); })
      .catch(() => { if (vigente) setError(t("popup.reasignarLoadError")); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [reserva, locale, t]);

  const elegir = async (p: ProfesionalReasignable) => {
    if (reserva?.apiId == null) return;
    setGuardando(p.id);
    setError(null);
    try {
      await ReservasController.reasignarCita(reserva.apiId, p.id, motivo);
      toast(t("popup.reasignada", { nombre: p.nombre }), "success");
      onReasignada();
      onClose();
    } catch (e) {
      /* 400 del backend: no ofrece el servicio o ya está ocupado a esa hora */
      setError(e instanceof Error && e.message ? e.message : t("common.error"));
    } finally {
      setGuardando(null);
    }
  };

  const ocupado = guardando !== null;

  return (
    <Modal open={!!reserva} onClose={onClose} maxWidth={520}>
      {reserva && (
        <>
          <ModalTitle>{t("popup.reasignarTitle")}</ModalTitle>
          <ModalText>
            {t("popup.reasignarSub", {
              servicio: reserva.servicio,
              fecha: fmtFechaLarga(reserva.fecha),
              hora: reserva.hora,
              actual: reserva.empleadoName || "—",
            })}
          </ModalText>

          {error && <ErrorBox>{error}</ErrorBox>}

          <Field label={t("extender.motivo")} htmlFor="reasignar-motivo">
            <input
              id="reasignar-motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("popup.reasignarMotivoPlaceholder")}
            />
          </Field>

          {cargando ? (
            <Loading label={t("common.loading")} />
          ) : lista.length === 0 ? (
            <EmptyState icon="team" title={t("popup.reasignarVacioTitle")} message={t("popup.reasignarVacioMsg")} />
          ) : (
            <div className={styles.lista}>
              {lista.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.item}
                  onClick={() => void elegir(p)}
                  disabled={ocupado}
                >
                  <PersonRow name={p.nombre} photo={p.imagen} bold />
                  {guardando === p.id && <span className={styles.guardando}>{t("common.saving")}</span>}
                </button>
              ))}
            </div>
          )}

          <p className={styles.nota}>{t("popup.reasignarNota")}</p>

          <ModalActions>
            <Button variant="ghost" block onClick={onClose} disabled={ocupado}>
              {t("common.cancel")}
            </Button>
          </ModalActions>
        </>
      )}
    </Modal>
  );
}
