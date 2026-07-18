"use client";
/* ============================================================
   Nueva reserva — asistente secuencial (Stepper/Wizard)
   ------------------------------------------------------------
   Flujo validado paso a paso:
     1 Cliente → 2 Profesional → 3 Servicio → 4 Fecha →
     5 Hora → 6 Confirmación (resumen + método de pago)

   · La empresa y la sede vienen del estado global (BookingContext),
     seleccionadas en el módulo de Administración de Empresas; si
     faltan, se resuelven desde la sesión y se ofrece el selector.
   · Cada paso carga sus datos bajo demanda (lazy) vía
     BookingWizardController, que cachea para no duplicar
     solicitudes; la selección persiste al navegar entre pasos.
============================================================ */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DIAS_AGENDABLES, ROUTES, fmtFechaLarga } from "@/constants";
import type { MetodoPago, Sede, SlotHora } from "@/models";
import { BookingWizardController } from "@/controllers/BookingWizardController";
import { NegociosController } from "@/controllers/NegociosController";
import { useBooking, WIZARD_STEPS, type WizardStep } from "@/context/BookingContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useData } from "@/hooks/useData";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/ui/Toolbar";
import { Field } from "@/components/ui/Modal";
import {
  ClienteList, DisponibilidadCalendar, ErrorBox, Loading,
  ProfesionalCarousel, ServicioCards, SlotPicker, Stepper,
} from "@/components/reservas/wizard/WizardParts";
import styles from "@/components/reservas/wizard/wizard.module.css";

export default function NuevaReservaPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t, locale } = useI18n();
  const { toast } = useUi();
  const booking = useBooking();
  const { draft } = booking;

  /* ── Contexto empresa/sede (estado global) ─────────────── */
  /* Si el asistente se abre sin contexto, se resuelve desde la
     sesión y se cargan automáticamente las sedes de la empresa. */
  const empresaId = draft.empresaId || session?.negocioId || "";
  const empresaNombre = draft.empresaNombre || session?.negocioName || "—";

  const { data: sedes, loading: loadingSedes } = useData<Sede[]>(
    () => (empresaId ? NegociosController.getSedes(empresaId) : Promise.resolve([])),
    [empresaId],
    []
  );

  useEffect(() => {
    /* Autoselección: sede fija del usuario de sede, o única sede */
    if (draft.sedeId || !empresaId) return;
    const fija = session?.sedeId
      ? sedes.find((s) => s.id === session.sedeId)
      : sedes.length === 1 ? sedes[0] : null;
    if (fija) {
      booking.setEmpresaSede({ empresaId, empresaNombre, sedeId: fija.id, sedeNombre: fija.nombre });
    }
  }, [sedes, draft.sedeId, empresaId, empresaNombre, session?.sedeId, booking]);

  const elegirSede = (id: string) => {
    const s = sedes.find((x) => x.id === id);
    if (s) booking.setEmpresaSede({ empresaId, empresaNombre, sedeId: s.id, sedeNombre: s.nombre });
  };

  /* ── Navegación secuencial validada ────────────────────── */
  const [stepIdx, setStepIdx] = useState(0);
  const step: WizardStep = WIZARD_STEPS[stepIdx];
  const maxReachable = WIZARD_STEPS.indexOf(booking.firstIncompleteStep());
  const goto = (i: number) => { if (i <= maxReachable) setStepIdx(i); };
  const next = () => goto(stepIdx + 1);
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  const stepDefs = useMemo(
    () => WIZARD_STEPS.map((id) => ({ id, label: t(`wizard.steps.${id}`) })),
    [t]
  );

  /* ── Datos por paso (lazy + caché en el controlador) ───── */
  const [query, setQuery] = useState("");
  const { data: clientes, loading: lC, error: eC } = useData(
    () => BookingWizardController.searchClientes(query),
    [query, step],
    []
  )

  const { data: profesionales, loading: lP, error: eP } = useData(
    () => (draft.sedeId && step === "profesional"
      ? BookingWizardController.getProfesionales(draft.sedeId)
      : Promise.resolve([])),
    [draft.sedeId, step],
    []
  );

  const { data: servicios, loading: lS, error: eS } = useData(
    () => (draft.sedeId && draft.profesional && step === "servicio"
      ? BookingWizardController.getServicios(draft.sedeId, draft.profesional.id, locale)
      : Promise.resolve([])),
    [draft.sedeId, draft.profesional?.id, locale, step],
    []
  )

  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const maxDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + DIAS_AGENDABLES); return d;
  }, []);

  const { data: blockedDays, loading: lF, error: eF } = useData(
    () => (draft.sedeId && draft.profesional && draft.servicio && step === "fecha"
      ? BookingWizardController.getDiasNoDisponibles(draft.profesional.id, draft.sedeId, draft.servicio.duracion)
      : Promise.resolve(new Set<string>())),
    [draft.profesional?.id, draft.servicio?.id, step],
    new Set<string>()
  )

  const { data: slots, loading: lH, error: eH } = useData(
    () => (draft.sedeId && draft.profesional && draft.servicio && draft.fecha && step === "hora"
      ? BookingWizardController.getSlotsDisponibles(draft.profesional.id, draft.sedeId, draft.fecha, draft.servicio.duracion)
      : Promise.resolve([] as SlotHora[])),
    [draft.profesional?.id, draft.fecha, draft.servicio?.id, step],
    [] as SlotHora[]
  )

  /* ── Paso 6 · Confirmación ─────────────────────────────── */
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saving, setSaving] = useState(false);
  const needsCard = draft.metodoPago === "tarjeta";

  const confirmar = async () => {
    if (!draft.metodoPago) { toast(t("wizard.pickPayment"), "error"); return; }
    if (needsCard && (!cardNumber || !cardExpiry || !cardCvv)) {
      toast(t("reservas.fillCard"), "error");
      return;
    }
    setSaving(true);
    try {
      const { id } = await BookingWizardController.crear({
        ...draft,
        card: needsCard ? { number: cardNumber, expiry: cardExpiry, cvv: cardCvv } : undefined,
      });
      booking.reset();
      toast(t("reservas.created"), "success");
      router.push(`${ROUTES.reservas}?creada=R-${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SLOT_TAKEN") {
        toast(t("wizard.slotTaken"), "error");
        booking.setSlot(null);
        setStepIdx(WIZARD_STEPS.indexOf("hora"));
      } else {
        toast(msg || t("reservas.fillFlow"), "error");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  const canNext =
    (step === "cliente" && !!draft.cliente) ||
    (step === "profesional" && !!draft.profesional) ||
    (step === "servicio" && !!draft.servicio) ||
    (step === "fecha" && !!draft.fecha) ||
    (step === "hora" && !!draft.slot);

  return (
    <Panel>
      <PanelHead
        title={t("wizard.title")}
        sub={t("wizard.sub")}
        right={
          <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.reservas)}>
            {t("wizard.backToList")}
          </Button>
        }
      />

      {/* Contexto global: empresa + sede (Administración de Empresas) */}
      <div className={styles.contextBar}>
        <span>{t("common.business")}: <b>{empresaNombre}</b></span>
        <span>
          {t("common.branch")}:{" "}
          {session?.sedeId ? (
            <b>{draft.sedeNombre || session.sedeName || "—"}</b>
          ) : (
            <select
              value={draft.sedeId || ""}
              onChange={(e) => elegirSede(e.target.value)}
              disabled={loadingSedes}
              aria-label={t("reservas.selectBranch")}
            >
              <option value="">{t("reservas.selectPlaceholder")}</option>
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          )}
        </span>
      </div>

      {!draft.sedeId ? (
        <EmptyState icon="mapPin" title={t("wizard.noBranchTitle")} message={t("wizard.noBranchMsg")} />
      ) : (
        <>
          <Stepper steps={stepDefs} activeIndex={stepIdx} maxReachable={maxReachable} onSelect={goto} />

          {/* 1 · Cliente */}
          {step === "cliente" && (
            <>
              <SearchBox value={query} onChange={setQuery} placeholder={t("wizard.clientSearch")} />
              {eC && <ErrorBox>{eC}</ErrorBox>}
              {lC ? <Loading label={t("wizard.loading")} /> : clientes.length === 0 ? (
                <EmptyState icon="users" title={t("wizard.noClientsTitle")} message={t("wizard.noClientsMsg")} />
              ) : (
                <ClienteList clientes={clientes} selectedId={draft.cliente?.id} onSelect={(c) => booking.setCliente(c)} />
              )}
            </>
          )}

          {/* 2 · Profesional (carrusel; carga sus servicios al elegir) */}
          {step === "profesional" && (
            <>
              {eP && <ErrorBox>{eP}</ErrorBox>}
              {lP ? <Loading label={t("wizard.loading")} /> : profesionales.length === 0 ? (
                <EmptyState icon="user" title={t("wizard.noProsTitle")} message={t("wizard.noProsMsg")} />
              ) : (
                <ProfesionalCarousel
                  profesionales={profesionales}
                  selectedId={draft.profesional?.id}
                  onSelect={(p) => booking.setProfesional(p)}
                />
              )}
            </>
          )}

          {/* 3 · Servicio (solo los del profesional/sede) */}
          {step === "servicio" && (
            <>
              {eS && <ErrorBox>{eS}</ErrorBox>}
              {lS ? <Loading label={t("wizard.loading")} /> : servicios.length === 0 ? (
                <EmptyState icon="scissors" title={t("wizard.noServicesTitle")} message={t("wizard.noServicesMsg")} />
              ) : (
                <ServicioCards servicios={servicios} selectedId={draft.servicio?.id} onSelect={(s) => booking.setServicio(s)} />
              )}
            </>
          )}

          {/* 4 · Fecha (bloquea días sin disponibilidad) */}
          {step === "fecha" && (
            <>
              {eF && <ErrorBox>{eF}</ErrorBox>}
              {lF ? <Loading label={t("wizard.checkingAgenda")} /> : (
                <DisponibilidadCalendar
                  viewDate={viewDate}
                  onShiftMonth={(d) => setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + d, 1))}
                  blockedDays={blockedDays}
                  maxDate={maxDate}
                  selected={draft.fecha}
                  onSelect={(f) => booking.setFecha(f)}
                />
              )}
            </>
          )}

          {/* 5 · Hora (disponibilidad real, sin conflictos) */}
          {step === "hora" && (
            <>
              {eH && <ErrorBox>{eH}</ErrorBox>}
              {lH ? <Loading label={t("wizard.checkingAgenda")} /> : slots.length === 0 ? (
                <EmptyState icon="clock" title={t("wizard.noSlotsTitle")} message={t("wizard.noSlotsMsg")} />
              ) : (
                <SlotPicker slots={slots} selected={draft.slot?.hora} onSelect={(s) => booking.setSlot(s)} />
              )}
            </>
          )}

          {/* 6 · Confirmación */}
          {step === "confirmar" && draft.cliente && draft.profesional && draft.servicio && (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryBlock}>
                  <h4>{t("wizard.sumClient")}</h4>
                  <div className={styles.summaryRow}><label>{t("common.fullName")}</label><span>{draft.cliente.nombre}</span></div>
                  <div className={styles.summaryRow}><label>{t("wizard.document")}</label><span>{draft.cliente.documento || "—"}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.phone")}</label><span>{draft.cliente.telefono || "—"}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.email")}</label><span>{draft.cliente.email}</span></div>
                </div>
                <div className={styles.summaryBlock}>
                  <h4>{t("wizard.sumPro")}</h4>
                  <div className={styles.summaryRow}><label>{t("common.name")}</label><span>{draft.profesional.nombre}</span></div>
                  <div className={styles.summaryRow}><label>{t("wizard.specialty")}</label><span>{draft.profesional.especialidad || "—"}</span></div>
                </div>
                <div className={styles.summaryBlock}>
                  <h4>{t("wizard.sumService")}</h4>
                  <div className={styles.summaryRow}><label>{t("common.name")}</label><span>{draft.servicio.nombre}</span></div>
                  <div className={styles.summaryRow}><label>{t("wizard.duration")}</label><span>{t("wizard.minutes", { n: draft.servicio.duracion })}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.price")}</label><span>{draft.servicio.precio.toFixed(2)}€</span></div>
                </div>
                <div className={styles.summaryBlock}>
                  <h4>{t("wizard.sumBooking")}</h4>
                  <div className={styles.summaryRow}><label>{t("common.business")}</label><span>{empresaNombre}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.branch")}</label><span>{draft.sedeNombre}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.date")}</label><span>{fmtFechaLarga(draft.fecha || "")}</span></div>
                  <div className={styles.summaryRow}><label>{t("common.time")}</label><span>{draft.slot?.hora}</span></div>
                </div>
              </div>

              {/* Método de pago */}
              <div className={styles.summaryBlock} style={{ marginTop: 14 }}>
                <h4>{t("reservas.paymentMethod")}</h4>
                <div className={styles.payRow}>
                  {(["tarjeta", "efectivo"] as MetodoPago[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${styles.payOption} ${draft.metodoPago === m ? styles.selected : ""}`}
                      onClick={() => booking.patch({ metodoPago: m })}
                    >
                      {t(`reservas.pay.${m}`)}
                    </button>
                  ))}
                </div>
                {needsCard && (
                  <div style={{ marginTop: 12 }}>
                    <Field label={t("reservas.cardNumber")} htmlFor="wz-card">
                      <input id="wz-card" inputMode="numeric" placeholder="4242424242424242" value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))} />
                    </Field>
                    <Field label={t("reservas.cardExpiry")} htmlFor="wz-exp">
                      <input id="wz-exp" placeholder="MM/YY" maxLength={5} value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)} />
                    </Field>
                    <Field label={t("reservas.cardCvv")} htmlFor="wz-cvv">
                      <input id="wz-cvv" inputMode="numeric" placeholder="123" maxLength={4} value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} />
                    </Field>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navegación */}
          <div className={styles.navRow}>
            <Button variant="ghost" onClick={prev} disabled={stepIdx === 0 || saving}>
              {t("wizard.back")}
            </Button>
            {step === "confirmar" ? (
              <Button onClick={confirmar} disabled={saving}>
                {saving ? "…" : t("wizard.confirm")}
              </Button>
            ) : (
              <Button onClick={next} disabled={!canNext}>
                {t("wizard.next")}
              </Button>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
