"use client";
/* ============================================================
   ExtenderCitaModal — "Necesito más tiempo" en la cita en curso
   ------------------------------------------------------------
   PATCH /appointments/:id/extend. Si el tramo extra está libre, el
   backend estira la cita y aquí solo se actualiza la hora de fin.

   Si choca con otra reserva del mismo profesional, el backend NO
   cambia nada y devuelve las citas afectadas con tres salidas:
     · reasignar  → PATCH /appointments/:id/reassign
     · reprogramar→ PATCH /appointments/:id/reschedule (hueco sugerido
                    o cualquier otro horario con ReagendarModal)
     · cancelar   → PATCH /appointments/:id/cancel
   Cuando todas quedan resueltas se vuelve a pedir la extensión, que
   ya encuentra el tramo libre.
============================================================ */
import { useEffect, useState } from "react";
import type { Reserva } from "@/models";
import type { ApiCitaEnConflicto, ApiEspecialistaLibre, ApiHuecoSugerido } from "@/api/types";
import { ReservasController } from "@/controllers/ReservasController";
import { madridHHmm } from "@/lib/timezone";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import Modal, { Field, ModalActions, ModalText, ModalTitle } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { PersonRow } from "@/components/ui/People";
import { ErrorBox } from "@/components/reservas/booking/Feedback";
import ReagendarModal from "./ReagendarModal";
import styles from "./ExtenderCitaModal.module.css";

const MINUTOS_RAPIDOS = [10, 15, 30, 45];
const OPCIONES = ["reasignar", "reprogramar", "cancelar"] as const;
type Opcion = (typeof OPCIONES)[number];

const hora = (iso: string | null | undefined) => (iso ? madridHHmm(new Date(iso)) : "—");
const mensajeDe = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

interface Conflicto {
  nuevaHoraFin: string;
  citas: ApiCitaEnConflicto[];
}

interface ExtenderCitaModalProps {
  /** Cita en curso; null cierra el modal */
  reserva: Reserva | null;
  onClose: () => void;
  /** Se llama tras cada cambio aplicado para refrescar la agenda */
  onCambios: () => void;
}

export default function ExtenderCitaModal({ reserva, onClose, onCambios }: ExtenderCitaModalProps) {
  const { t } = useI18n();
  const { toast, confirm } = useUi();

  const [minutos, setMinutos] = useState(15);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicto, setConflicto] = useState<Conflicto | null>(null);
  /** appointmentId → texto de cómo se resolvió */
  const [resueltas, setResueltas] = useState<Record<number, string>>({});
  const [opcion, setOpcion] = useState<Record<number, Opcion>>({});
  /** Cita sobre la que hay una petición en marcha (bloquea el resto) */
  const [ocupada, setOcupada] = useState<number | null>(null);
  const [reagendando, setReagendando] = useState<Reserva | null>(null);

  const reiniciar = () => {
    setMinutos(15);
    setMotivo("");
    setError(null);
    setConflicto(null);
    setResueltas({});
    setOpcion({});
    setOcupada(null);
  };

  useEffect(reiniciar, [reserva?.id]);

  const cerrar = () => {
    reiniciar();
    onClose();
  };

  const extender = async () => {
    if (!reserva) return;
    if (!Number.isInteger(minutos) || minutos < 1 || minutos > 240) {
      setError(t("extender.rangoError"));
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const r = await ReservasController.extender(reserva, minutos, motivo);
      if (r.status === "EXTENDED") {
        toast(t("extender.extendida", { hora: r.reserva.horaFin || "—" }), "success");
        onCambios();
        cerrar();
      } else {
        setConflicto({ nuevaHoraFin: r.nuevaHoraFin, citas: r.citasEnConflicto });
        setResueltas({});
        setOpcion({});
      }
    } catch (e) {
      setError(mensajeDe(e, t("extender.error")));
    } finally {
      setEnviando(false);
    }
  };

  /** Anota la resolución y, si ya no queda ninguna cita pendiente, reintenta extender. */
  const marcarResuelta = (appointmentId: number, texto: string) => {
    const siguientes = { ...resueltas, [appointmentId]: texto };
    setResueltas(siguientes);
    toast(texto, "success");
    onCambios();
    if (conflicto?.citas.every((c) => siguientes[c.appointment.appointmentId])) void extender();
  };

  /** Envuelve una acción sobre una cita en conflicto con bloqueo y manejo de error. */
  const aplicar = async (appointmentId: number, accion: () => Promise<string>) => {
    setOcupada(appointmentId);
    setError(null);
    try {
      marcarResuelta(appointmentId, await accion());
    } catch (e) {
      setError(mensajeDe(e, t("extender.error")));
    } finally {
      setOcupada(null);
    }
  };

  const reasignar = (c: ApiCitaEnConflicto, esp: ApiEspecialistaLibre) =>
    aplicar(c.appointment.appointmentId, async () => {
      await ReservasController.reasignarCita(c.appointment.appointmentId, esp.id, motivo);
      return t("extender.reasignada", { nombre: esp.nombre });
    });

  const reprogramar = (c: ApiCitaEnConflicto, hueco: ApiHuecoSugerido) =>
    aplicar(c.appointment.appointmentId, async () => {
      await ReservasController.reprogramarAHueco(c.appointment.appointmentId, hueco);
      return t("extender.reprogramada", { hora: hora(hueco.horaInicio) });
    });

  const cancelar = (c: ApiCitaEnConflicto) => {
    const a = c.appointment;
    confirm({
      title: t("extender.cancelarTitle"),
      message: t("extender.cancelarMsg", {
        cliente: a.userNombre || a.userEmail || "—",
        hora: hora(a.horaInicio),
      }),
      confirmLabel: t("extender.cancelarConfirm"),
      onConfirm: () =>
        aplicar(a.appointmentId, async () => {
          await ReservasController.cancelarCita(a.appointmentId);
          return t("extender.cancelada");
        }),
    });
  };

  const bloqueado = ocupada !== null || enviando;

  return (
    <>
      <Modal open={!!reserva} onClose={cerrar} maxWidth={620}>
        {reserva && !conflicto && (
          <>
            <ModalTitle>{t("extender.titulo")}</ModalTitle>
            <ModalText>
              {t("extender.sub", { cliente: reserva.cliente, fin: reserva.horaFin || "—" })}
            </ModalText>

            {error && <ErrorBox>{error}</ErrorBox>}

            <div className={styles.chips} role="group" aria-label={t("extender.minutosLabel")}>
              {MINUTOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${styles.chip} ${minutos === m ? styles.chipActivo : ""}`}
                  aria-pressed={minutos === m}
                  onClick={() => setMinutos(m)}
                >
                  +{m} min
                </button>
              ))}
            </div>

            <Field label={t("extender.minutosLabel")} htmlFor="ext-min">
              <input
                id="ext-min"
                type="number"
                min={1}
                max={240}
                value={Number.isNaN(minutos) ? "" : minutos}
                onChange={(e) => setMinutos(e.target.valueAsNumber)}
              />
            </Field>
            <Field label={t("extender.motivo")} htmlFor="ext-motivo">
              <input
                id="ext-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={t("extender.motivoPlaceholder")}
              />
            </Field>

            <ModalActions>
              <Button variant="ghost" block onClick={cerrar} disabled={enviando}>
                {t("common.cancel")}
              </Button>
              <Button block onClick={() => void extender()} disabled={enviando}>
                {enviando ? t("booking.loading") : t("extender.confirmar")}
              </Button>
            </ModalActions>
          </>
        )}

        {reserva && conflicto && (
          <>
            <ModalTitle>{t("extender.conflictoTitulo")}</ModalTitle>
            <ModalText>
              {t("extender.conflictoSub", { n: minutos, hora: hora(conflicto.nuevaHoraFin) })}
            </ModalText>

            {error && <ErrorBox>{error}</ErrorBox>}

            <div className={styles.lista}>
              {conflicto.citas.map((c) => {
                const a = c.appointment;
                const id = a.appointmentId;
                const hecha = resueltas[id];
                const elegida = opcion[id];
                const especialistas = c.opciones.reasignarEspecialista.especialistasDisponibles;
                const huecos = c.opciones.reprogramar.huecosSugeridosMismoDia;

                return (
                  <article key={id} className={`${styles.cita} ${hecha ? styles.citaResuelta : ""}`}>
                    <header className={styles.citaHead}>
                      <div className={styles.citaInfo}>
                        <b>{a.serviceName || "—"}</b>
                        <span>{a.userNombre || a.userEmail || "—"}</span>
                      </div>
                      <span className={styles.citaHora}>
                        <Icon name="clock" width={14} height={14} />
                        {hora(a.horaInicio)} – {hora(a.horaFin)}
                      </span>
                    </header>

                    {hecha ? (
                      <p className={styles.resuelta}>
                        <Icon name="circle-check" width={16} height={16} />
                        {hecha}
                      </p>
                    ) : (
                      <>
                        <div className={styles.opciones} role="radiogroup" aria-label={t("extender.queHacer")}>
                          {OPCIONES.map((o) => (
                            <button
                              key={o}
                              type="button"
                              role="radio"
                              aria-checked={elegida === o}
                              className={[
                                styles.opcion,
                                elegida === o ? styles.opcionActiva : "",
                                o === "cancelar" ? styles.opcionPeligro : "",
                              ].filter(Boolean).join(" ")}
                              onClick={() => setOpcion((p) => ({ ...p, [id]: o }))}
                              disabled={bloqueado}
                            >
                              {t(`extender.op.${o}`)}
                            </button>
                          ))}
                        </div>

                        {elegida === "reasignar" && (
                          <div className={styles.panel}>
                            {especialistas.length === 0 ? (
                              <p className={styles.nota}>{t("extender.sinEspecialistas")}</p>
                            ) : (
                              <>
                                <p className={styles.nota}>{t("extender.elegirEspecialista")}</p>
                                <div className={styles.especialistas}>
                                  {especialistas.map((esp) => (
                                    <button
                                      key={esp.id}
                                      type="button"
                                      className={styles.especialista}
                                      onClick={() => void reasignar(c, esp)}
                                      disabled={bloqueado}
                                    >
                                      <PersonRow name={esp.nombre} photo={esp.imagen} />
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {elegida === "reprogramar" && (
                          <div className={styles.panel}>
                            {huecos.length === 0 ? (
                              <p className={styles.nota}>{t("extender.sinHuecos")}</p>
                            ) : (
                              <>
                                <p className={styles.nota}>{t("extender.huecos")}</p>
                                <div className={styles.chips}>
                                  {huecos.map((h) => (
                                    <button
                                      key={h.horaInicio}
                                      type="button"
                                      className={styles.chip}
                                      onClick={() => void reprogramar(c, h)}
                                      disabled={bloqueado}
                                    >
                                      {hora(h.horaInicio)} – {hora(h.horaFin)}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReagendando(ReservasController.reservaDeConflicto(a))}
                              disabled={bloqueado}
                            >
                              <Icon name="calendar" width={15} height={15} />
                              {t("extender.otroHorario")}
                            </Button>
                          </div>
                        )}

                        {elegida === "cancelar" && (
                          <div className={styles.panel}>
                            <p className={styles.nota}>{t("extender.cancelarNota")}</p>
                            <Button size="sm" variant="danger" onClick={() => cancelar(c)} disabled={bloqueado}>
                              {t("extender.cancelarConfirm")}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            {enviando && <p className={styles.nota}>{t("extender.reintentando")}</p>}

            <ModalActions>
              <Button variant="ghost" block onClick={cerrar} disabled={enviando}>
                {t("extender.cerrar")}
              </Button>
            </ModalActions>
          </>
        )}
      </Modal>

      <ReagendarModal
        reserva={reagendando}
        onClose={() => setReagendando(null)}
        onReagendada={(nueva) => {
          if (nueva.apiId != null) {
            marcarResuelta(nueva.apiId, t("extender.reprogramada", { hora: nueva.hora }));
          }
        }}
      />
    </>
  );
}
