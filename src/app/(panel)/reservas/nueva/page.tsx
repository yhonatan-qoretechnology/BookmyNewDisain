"use client";
/* ============================================================
   Nueva reserva — flujo secuencial de agendado
   ------------------------------------------------------------
   Pasos validados en orden (la lógica de navegación se conserva;
   la apariencia de asistente/wizard se eliminó por completo):

     1 Sede (tarjetas + mapa) → 2 Cliente (catálogo en grid) →
     3 Profesional (carrusel) → 4 Servicio (acordeón por categoría)
     → 5 Fecha (calendario del módulo Calendario, ancho completo)
     → 6 Hora → 7 Confirmación (comprobante tipo factura)

   · Cada paso carga sus datos bajo demanda (lazy) vía
     BookingController, que cachea para no duplicar solicitudes;
     la selección persiste al navegar entre pasos.
   · Al crear la reserva: mensaje de éxito, limpieza del estado,
     invalidación de consultas y redirección al Dashboard.
============================================================ */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DIAS_AGENDABLES, ROUTES, fmtFechaLarga } from "@/constants";
import type { CategoriaServicios, MetodoPago, SedeOpcion, SlotHora } from "@/models";
import { BookingController } from "@/controllers/BookingController";
import { useBooking, BOOKING_STEPS, type BookingStep } from "@/context/BookingContext";
import { useSession } from "@/context/SessionContext";
import { useI18n } from "@/i18n";
import { useUi } from "@/context/UiContext";
import { useData } from "@/hooks/useData";
import Panel, { PanelHead } from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SearchBox } from "@/components/ui/Toolbar";
import CalendarGrid from "@/components/ui/CalendarGrid";
import { ErrorBox, Loading } from "@/components/reservas/booking/Feedback";
import { ProgressHeader } from "@/components/reservas/booking/ProgressHeader";
import SedeSelector from "@/components/reservas/booking/SedeSelector";
import ClienteGrid from "@/components/reservas/booking/ClienteGrid";
import ProfesionalCarousel from "@/components/reservas/booking/ProfesionalCarousel";
import ServicioAccordion from "@/components/reservas/booking/ServicioAccordion";
import SlotPicker from "@/components/reservas/booking/SlotPicker";
import ReciboConfirmacion, { type CardDraft } from "@/components/reservas/booking/ReciboConfirmacion";
import styles from "@/components/reservas/booking/booking.module.css";

/** Idioma con el que el backend traduce servicios (flujo en español) */
const IDIOMA_SERVICIOS = "es";

export default function NuevaReservaPage() {
  const router = useRouter();
  const { session } = useSession();
  const { t } = useI18n();
  const { toast } = useUi();
  const booking = useBooking();
  const { draft } = booking;

  /* ── Contexto de empresa (estado global / sesión) ───────── */
  const empresaId = draft.empresaId || session?.negocioId || "";
  const empresaNombre = draft.empresaNombre || session?.negocioName || "—";

  /* ── Sedes de la empresa (paso 1) ───────────────────────── */
  const { data: sedes, loading: lSedes, error: eSedes } = useData<SedeOpcion[]>(
    () => (empresaId ? BookingController.getSedes(empresaId) : Promise.resolve([])),
    [empresaId],
    []
  );

  /* Un usuario de sede solo ve (y agenda en) su propia sede */
  const sedesVisibles = useMemo(
    () => (session?.sedeId ? sedes.filter((s) => s.id === session.sedeId) : sedes),
    [sedes, session?.sedeId]
  );

  const elegirSede = useCallback((id: string) => {
    const sede = sedes.find((s) => s.id === id);
    if (sede) booking.setSede({ empresaId, empresaNombre, sede });
  }, [sedes, empresaId, empresaNombre, booking]);

  /* Autoselección: sede fija del usuario de sede, o única sede */
  useEffect(() => {
    if (draft.sedeId || !empresaId || sedesVisibles.length === 0) return;
    const fija = session?.sedeId
      ? sedesVisibles.find((s) => s.id === session.sedeId)
      : sedesVisibles.length === 1 ? sedesVisibles[0] : null;
    if (fija) booking.setSede({ empresaId, empresaNombre, sede: fija });
  }, [sedesVisibles, draft.sedeId, empresaId, empresaNombre, session?.sedeId, booking]);

  /* Hidratación: si la sede llegó solo como id (Administración de
     Empresas), completar el objeto en cuanto carguen las sedes */
  useEffect(() => {
    if (!draft.sedeId || draft.sede?.id === draft.sedeId) return;
    const sede = sedes.find((s) => s.id === draft.sedeId);
    if (sede) booking.setSede({ empresaId, empresaNombre, sede });
  }, [sedes, draft.sedeId, draft.sede?.id, empresaId, empresaNombre, booking]);

  /* ── Navegación secuencial validada (lógica conservada) ─── */
  const [stepIdx, setStepIdx] = useState(0);
  const step: BookingStep = BOOKING_STEPS[stepIdx];
  const maxReachable = BOOKING_STEPS.indexOf(booking.firstIncompleteStep());
  const goto = useCallback(
    (i: number) => { if (i <= maxReachable) setStepIdx(i); },
    [maxReachable]
  );
  const next = useCallback(() => goto(stepIdx + 1), [goto, stepIdx]);
  const prev = useCallback(() => setStepIdx((i) => Math.max(0, i - 1)), []);

  /* Resumen de selección para el encabezado de progreso */
  const stepDefs = useMemo(() => {
    const resumen: Record<BookingStep, string | null> = {
      sede: draft.sedeNombre,
      cliente: draft.cliente?.nombre ?? null,
      profesional: draft.profesional?.nombre ?? null,
      servicio: draft.servicio?.nombre ?? null,
      fecha: draft.fecha ? fmtFechaLarga(draft.fecha) : null,
      hora: draft.slot?.hora ?? null,
      confirmar: null,
    };
    return BOOKING_STEPS.map((id) => ({
      id,
      label: t(`booking.steps.${id}`),
      resumen: resumen[id],
    }));
  }, [t, draft.sedeNombre, draft.cliente?.nombre, draft.profesional?.nombre, draft.servicio?.nombre, draft.fecha, draft.slot?.hora]);

  /* ── Datos por paso (lazy + caché en el controlador) ───── */
  const [query, setQuery] = useState("");
  const { data: clientes, loading: lC, error: eC } = useData(
    () => (step === "cliente"
      ? BookingController.searchClientes(query)
      : Promise.resolve([])),
    [query, step],
    []
  );

  const { data: profesionales, loading: lP, error: eP } = useData(
    () => (draft.sedeId && step === "profesional"
      ? BookingController.getProfesionales(draft.sedeId)
      : Promise.resolve([])),
    [draft.sedeId, step],
    []
  );

  /* Servicios del profesional agrupados por categoría
     (GET /profesionales/:id/detalle?lang=es) */
  const { data: categorias, loading: lS, error: eS } = useData<CategoriaServicios[]>(
    () => (draft.profesional && step === "servicio"
      ? BookingController.getServiciosPorCategoria(draft.profesional.id, IDIOMA_SERVICIOS)
      : Promise.resolve([])),
    [draft.profesional?.id, step],
    []
  );

  const maxDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + DIAS_AGENDABLES); return d;
  }, []);

  const { data: blockedDays, loading: lF, error: eF } = useData(
    () => (draft.sedeId && draft.profesional && draft.servicio && step === "fecha"
      ? BookingController.getDiasNoDisponibles(draft.profesional.id, draft.sedeId, draft.servicio.duracion)
      : Promise.resolve(new Set<string>())),
    [draft.profesional?.id, draft.servicio?.id, step],
    new Set<string>()
  );

  /** Bloquea días pasados, fuera de la ventana o sin franjas libres */
  const esFechaBloqueada = useCallback((fecha: string) => {
    const [y, m, d] = fecha.split("-").map(Number);
    const dia = new Date(y, m - 1, d);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    return dia < hoy || dia > maxDate || blockedDays.has(fecha);
  }, [blockedDays, maxDate]);

  const { data: slots, loading: lH, error: eH } = useData(
    () => (draft.sedeId && draft.profesional && draft.servicio && draft.fecha && step === "hora"
      ? BookingController.getSlotsDisponibles(draft.profesional.id, draft.sedeId, draft.fecha, draft.servicio.duracion)
      : Promise.resolve([] as SlotHora[])),
    [draft.profesional?.id, draft.fecha, draft.servicio?.id, step],
    [] as SlotHora[]
  );

  /* ── Confirmación ──────────────────────────────────────── */
  const [card, setCard] = useState<CardDraft>({ number: "", expiry: "", cvv: "" });
  const onCardChange = useCallback(
    (patch: Partial<CardDraft>) => setCard((c) => ({ ...c, ...patch })),
    []
  );
  const onMetodoPago = useCallback(
    (m: MetodoPago) => booking.patch({ metodoPago: m }),
    [booking]
  );
  const [saving, setSaving] = useState(false);
  const needsCard = draft.metodoPago === "tarjeta";

  const confirmar = useCallback(async () => {
    if (!draft.metodoPago) { toast(t("booking.pickPayment"), "error"); return; }
    if (needsCard && (!card.number || !card.expiry || !card.cvv)) {
      toast(t("booking.fillCard"), "error");
      return;
    }
    setSaving(true);
    try {
      await BookingController.crear({ ...draft, card: needsCard ? card : undefined });
      /* Finalización: éxito + limpiar estado + invalidar consultas
         + redirección automática al Dashboard principal */
      booking.reset();
      BookingController.invalidateAll();
      toast(t("booking.created"), "success");
      router.push(ROUTES.dashboard);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SLOT_TAKEN") {
        toast(t("booking.slotTaken"), "error");
        booking.setSlot(null);
        setStepIdx(BOOKING_STEPS.indexOf("hora"));
      } else {
        toast(msg || t("booking.incomplete"), "error");
      }
    } finally {
      setSaving(false);
    }
  }, [draft, needsCard, card, booking, toast, t, router]);

  /* ── Render ────────────────────────────────────────────── */
  const canNext =
    (step === "sede" && !!draft.sedeId) ||
    (step === "cliente" && !!draft.cliente) ||
    (step === "profesional" && !!draft.profesional) ||
    (step === "servicio" && !!draft.servicio) ||
    (step === "fecha" && !!draft.fecha) ||
    (step === "hora" && !!draft.slot);

  return (
    <Panel>
      <PanelHead
        title={t("booking.title")}
        sub={t("booking.sub")}
        right={
          <Button variant="ghost" size="sm" onClick={() => router.push(ROUTES.reservas)}>
            {t("booking.backToList")}
          </Button>
        }
      />

      {/* Contexto: empresa activa (y sede una vez elegida) */}
      <div className={styles.contextBar}>
        <span>{t("booking.business")}: <b>{empresaNombre}</b></span>
        {draft.sedeNombre && (
          <span>{t("booking.branch")}: <b>{draft.sedeNombre}</b></span>
        )}
      </div>

      <ProgressHeader
        steps={stepDefs}
        activeIndex={stepIdx}
        maxReachable={maxReachable}
        onSelect={goto}
      />

      <h3 className={styles.stepTitle}>{t(`booking.stepTitle.${step}`)}</h3>

      {/* 1 · Sede — tarjetas con datos + mapa de Google Maps */}
      {step === "sede" && (
        <>
          {eSedes && <ErrorBox>{eSedes}</ErrorBox>}
          {lSedes ? <Loading label={t("booking.loading")} /> : sedesVisibles.length === 0 ? (
            <EmptyState icon="mapPin" title={t("booking.noBranchesTitle")} message={t("booking.noBranchesMsg")} />
          ) : (
            <SedeSelector sedes={sedesVisibles} selectedId={draft.sedeId} onSelect={elegirSede} />
          )}
        </>
      )}

      {/* 2 · Cliente — catálogo en grid 4/3/1 (nombre y teléfono) */}
      {step === "cliente" && (
        <>
          <SearchBox value={query} onChange={setQuery} placeholder={t("booking.clientSearch")} />
          {eC && <ErrorBox>{eC}</ErrorBox>}
          {lC ? <Loading label={t("booking.loading")} /> : clientes.length === 0 ? (
            <EmptyState icon="users" title={t("booking.noClientsTitle")} message={t("booking.noClientsMsg")} />
          ) : (
            <ClienteGrid clientes={clientes} selectedId={draft.cliente?.id} onSelect={booking.setCliente} />
          )}
        </>
      )}

      {/* 3 · Profesional — carrusel de tarjetas */}
      {step === "profesional" && (
        <>
          {eP && <ErrorBox>{eP}</ErrorBox>}
          {lP ? <Loading label={t("booking.loading")} /> : profesionales.length === 0 ? (
            <EmptyState icon="user" title={t("booking.noProsTitle")} message={t("booking.noProsMsg")} />
          ) : (
            <ProfesionalCarousel
              profesionales={profesionales}
              selectedId={draft.profesional?.id}
              onSelect={booking.setProfesional}
            />
          )}
        </>
      )}

      {/* 4 · Servicio — acordeón por categoría */}
      {step === "servicio" && (
        <>
          {eS && <ErrorBox>{eS}</ErrorBox>}
          {lS ? <Loading label={t("booking.loading")} /> : categorias.length === 0 ? (
            <EmptyState icon="scissors" title={t("booking.noServicesTitle")} message={t("booking.noServicesMsg")} />
          ) : (
            <ServicioAccordion
              categorias={categorias}
              selectedId={draft.servicio?.id}
              onSelect={booking.setServicio}
            />
          )}
        </>
      )}

      {/* 5 · Fecha — mismo calendario del módulo Calendario, a
             ancho completo, con selección de día habilitada */}
      {step === "fecha" && (
        <>
          {eF && <ErrorBox>{eF}</ErrorBox>}
          {lF ? <Loading label={t("booking.checkingAgenda")} /> : (
            <div className={styles.calendarioFull}>
              <CalendarGrid
                events={{}}
                selectable
                selectedDate={draft.fecha}
                onSelectDate={booking.setFecha}
                isDateDisabled={esFechaBloqueada}
              />
            </div>
          )}
        </>
      )}

      {/* 6 · Hora — franjas reales disponibles */}
      {step === "hora" && (
        <>
          {eH && <ErrorBox>{eH}</ErrorBox>}
          {lH ? <Loading label={t("booking.checkingAgenda")} /> : slots.length === 0 ? (
            <EmptyState icon="clock" title={t("booking.noSlotsTitle")} message={t("booking.noSlotsMsg")} />
          ) : (
            <SlotPicker slots={slots} selected={draft.slot?.hora} onSelect={booking.setSlot} />
          )}
        </>
      )}

      {/* 7 · Confirmación — comprobante tipo factura */}
      {step === "confirmar" && draft.cliente && draft.profesional && draft.servicio && (
        <ReciboConfirmacion
          empresaNombre={empresaNombre}
          sede={draft.sede}
          sedeNombre={draft.sedeNombre || "—"}
          cliente={draft.cliente}
          profesional={draft.profesional}
          servicio={draft.servicio}
          fecha={draft.fecha}
          hora={draft.slot?.hora ?? null}
          metodoPago={draft.metodoPago}
          onMetodoPago={onMetodoPago}
          card={card}
          onCardChange={onCardChange}
        />
      )}

      {/* Navegación */}
      <div className={styles.navRow}>
        <Button variant="ghost" onClick={prev} disabled={stepIdx === 0 || saving}>
          {t("booking.back")}
        </Button>
        {step === "confirmar" ? (
          <Button onClick={confirmar} disabled={saving}>
            {saving ? "…" : t("booking.confirm")}
          </Button>
        ) : (
          <Button onClick={next} disabled={!canNext}>
            {t("booking.next")}
          </Button>
        )}
      </div>
    </Panel>
  );
}
