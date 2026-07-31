"use client";
/* ============================================================
   WizardParts — componentes de presentación del asistente
   ------------------------------------------------------------
   SRP: aquí solo hay UI controlada por props; los datos llegan
   desde la página (que usa el BookingWizardController). Cada
   componente es reutilizable fuera del wizard si hace falta.
============================================================ */
import { useRef } from "react";
import type { ClienteOpcion, ProfesionalCard, ServicioOpcion, SlotHora } from "@/models";
import { fotoUrl, initials } from "@/constants";
import { useI18n } from "@/i18n";
import Icon from "@/components/ui/Icon";
import styles from "./wizard.module.css";

/* ── Indicador de carga ──────────────────────────────────── */
export function Loading({ label }: { label: string }) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      {label}
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div className={styles.errorBox} role="alert">{children}</div>;
}

/* ── Stepper ─────────────────────────────────────────────── */
export function Stepper({
  steps,
  activeIndex,
  maxReachable,
  onSelect,
}: {
  steps: Array<{ id: string; label: string }>;
  activeIndex: number;
  /** Índice máximo al que se puede saltar (validación secuencial) */
  maxReachable: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className={styles.stepper} aria-label="wizard">
      {steps.map((s, i) => {
        const cls = [styles.step, i === activeIndex ? styles.active : "", i < activeIndex ? styles.done : ""]
          .filter(Boolean).join(" ");
        return (
          <button
            key={s.id}
            type="button"
            className={cls}
            disabled={i > maxReachable}
            onClick={() => onSelect(i)}
            aria-current={i === activeIndex ? "step" : undefined}
          >
            <span className={styles.stepDot}>
              {i < activeIndex ? <Icon name="check" width={15} height={15} strokeWidth={2.6} /> : i + 1}
            </span>
            <span className={styles.stepLabel}>{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Paso 1 · Lista de clientes ──────────────────────────── */
export function ClienteList({
  clientes,
  selectedId,
  onSelect,
}: {
  clientes: ClienteOpcion[];
  selectedId?: string;
  onSelect: (c: ClienteOpcion) => void;
}) {
  return (
    <div className={styles.clientList} role="listbox" aria-label="clientes">
      {clientes.map((c) => (
        <button
          key={c.id}
          type="button"
          role="option"
          aria-selected={c.id === selectedId}
          className={`${styles.clientRow} ${c.id === selectedId ? styles.selected : ""}`}
          onClick={() => onSelect(c)}
        >
          <span className={styles.proAvatar} style={{ width: 40, height: 40, fontSize: 14 }}>
            {fotoUrl(c.foto) ? <img src={fotoUrl(c.foto)!} alt="" /> : initials(c.nombre)}
          </span>
          <span className={styles.clientMeta}>
            <span className={styles.clientName}>{c.nombre}</span>
            <span className={styles.clientSub}>
              {[c.email, c.telefono, c.documento].filter(Boolean).join(" · ")}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Paso 2 · Carrusel de profesionales ──────────────────── */
export function ProfesionalCarousel({
  profesionales,
  selectedId,
  onSelect,
}: {
  profesionales: ProfesionalCard[];
  selectedId?: string;
  onSelect: (p: ProfesionalCard) => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <div className={styles.carouselWrap}>
      <button type="button" className={`${styles.carouselNav} ${styles.prev}`} onClick={() => scroll(-1)} aria-label="prev">
        <Icon name="chevron-left" width={16} height={16} strokeWidth={2.4} />
      </button>
      <div className={styles.carousel} ref={ref} role="listbox" aria-label="profesionales">
        {profesionales.map((p) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={p.id === selectedId}
            disabled={!p.disponible}
            className={`${styles.proCard} ${p.id === selectedId ? styles.selected : ""}`}
            onClick={() => onSelect(p)}
          >
            <span className={styles.proAvatar}>
              {fotoUrl(p.foto) ? <img src={fotoUrl(p.foto)!} alt="" /> : initials(p.nombre)}
            </span>
            <span className={styles.proName}>{p.nombre}</span>
            {p.especialidad && <span className={styles.proSpec}>{p.especialidad}</span>}
            <span className={`${styles.proBadge} ${p.disponible ? "" : styles.off}`}>
              {p.disponible ? t("wizard.available") : t("wizard.unavailable")}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={`${styles.carouselNav} ${styles.next}`} onClick={() => scroll(1)} aria-label="next">
        <Icon name="chevron-right" width={16} height={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

/* ── Paso 3 · Tarjetas de servicio ───────────────────────── */
export function ServicioCards({
  servicios,
  selectedId,
  onSelect,
}: {
  servicios: ServicioOpcion[];
  selectedId?: string;
  onSelect: (s: ServicioOpcion) => void;
}) {
  const { t } = useI18n();
  return (
    <div className={styles.serviceGrid} role="listbox" aria-label="servicios">
      {servicios.map((s) => (
        <button
          key={s.id}
          type="button"
          role="option"
          aria-selected={s.id === selectedId}
          className={`${styles.serviceCard} ${s.id === selectedId ? styles.selected : ""}`}
          onClick={() => onSelect(s)}
        >
          <span className={styles.serviceName}>{s.nombre}</span>
          {s.descripcion && <span className={styles.serviceDesc}>{s.descripcion}</span>}
          <span className={styles.serviceMeta}>
            <span className={styles.serviceDur}>
              <Icon name="clock" width={13} height={13} />
              {t("wizard.minutes", { n: s.duracion })}
            </span>
            <span className={styles.servicePrice}>{s.precio.toFixed(2)}€</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Paso 4 · Calendario de disponibilidad ───────────────── */
export function DisponibilidadCalendar({
  viewDate,
  onShiftMonth,
  blockedDays,
  maxDate,
  selected,
  onSelect,
}: {
  viewDate: Date;
  onShiftMonth: (delta: number) => void;
  /** Fechas YYYY-MM-DD sin franjas libres */
  blockedDays: Set<string>;
  maxDate: Date;
  selected?: string | null;
  onSelect: (fecha: string) => void;
}) {
  const { tList } = useI18n();
  const MESES = tList("calendar.months");
  const DOW = tList("calendar.dow");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const canPrev = new Date(year, month, 1) > new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const canNext = new Date(year, month + 1, 1) <= maxDate;

  const cells: React.ReactNode[] = [];
  DOW.forEach((d) => cells.push(<div key={`dw-${d}`} className={styles.calDow}>{d}</div>));
  for (let i = 0; i < startOffset; i++) cells.push(<div key={`e-${i}`} className={styles.calEmpty} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    const disabled = date < hoy || date > maxDate || blockedDays.has(key);
    const cls = [
      styles.calDay,
      key === selected ? styles.selected : "",
      date.getTime() === hoy.getTime() ? styles.today : "",
    ].filter(Boolean).join(" ");
    cells.push(
      <button key={key} type="button" className={cls} disabled={disabled} onClick={() => onSelect(key)}>
        {day}
      </button>
    );
  }

  return (
    <div className={styles.calWrap}>
      <div className={styles.calHead}>
        <button type="button" className={styles.calNav} disabled={!canPrev} onClick={() => onShiftMonth(-1)} aria-label="prev month">
          <Icon name="chevron-left" width={15} height={15} strokeWidth={2.4} />
        </button>
        <span className={styles.calTitle}>{MESES[month]} {year}</span>
        <button type="button" className={styles.calNav} disabled={!canNext} onClick={() => onShiftMonth(1)} aria-label="next month">
          <Icon name="chevron-right" width={15} height={15} strokeWidth={2.4} />
        </button>
      </div>
      <div className={styles.calGrid}>{cells}</div>
    </div>
  );
}

/* ── Paso 5 · Franjas horarias ───────────────────────────── */
export function SlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: SlotHora[];
  selected?: string | null;
  onSelect: (s: SlotHora) => void;
}) {
  return (
    <div className={styles.slotGrid} role="listbox" aria-label="horas">
      {slots.map((s) => (
        <button
          key={s.hora}
          type="button"
          role="option"
          aria-selected={s.hora === selected}
          className={`${styles.slot} ${s.hora === selected ? styles.selected : ""}`}
          onClick={() => onSelect(s)}
        >
          {s.hora}
        </button>
      ))}
    </div>
  );
}
