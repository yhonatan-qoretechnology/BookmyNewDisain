"use client";
/* ============================================================
   CalendarGrid — calendario mensual reutilizable
============================================================ */
import { useState } from "react";
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import styles from "./Calendar.module.css";

export interface CalendarEvent {
  id: string;
  label: string;
  data?: any; // Additional data (e.g., full reservation object)
}

interface CalendarGridProps {
  /** Mapa fecha (YYYY-MM-DD) → eventos */
  events: Record<string, CalendarEvent[]>;
  onEventClick?: (id: string, data?: any) => void;
  /** Máximo de eventos visibles por celda (el resto se resume como "+N más") */
  maxPerCell?: number;
  onViewChange?: (view: string) => void;
  /* ── Modo selección de fecha (opcional, aditivo) ─────────
     Permite reutilizar este mismo calendario para elegir un día
     (flujo de reservas) sin alterar el comportamiento del módulo
     Calendario (OCP: extensión sin modificación del uso previo). */
  selectable?: boolean;
  selectedDate?: string | null;
  onSelectDate?: (fecha: string) => void;
  /** Fechas YYYY-MM-DD que no se pueden elegir (pasado, sin cupo…) */
  isDateDisabled?: (fecha: string) => boolean;
}

export default function CalendarGrid({
  events,
  onEventClick,
  maxPerCell = Infinity,
  onViewChange,
  selectable = false,
  selectedDate = null,
  onSelectDate,
  isDateDisabled,
}: CalendarGridProps) {
  const { t, tList } = useI18n();
  const MESES = tList("calendar.months");
  const DOW = tList("calendar.dow");
  const VIEWS = [
    { id: "day", label: t("calendar.day") },
    { id: "week", label: t("calendar.week") },
    { id: "month", label: t("calendar.month") },
  ];

  // El calendario abre en el mes actual real
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState("month");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const totalCells = startOffset + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;

  const shiftMonth = (delta: number) =>
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const changeView = (v: { id: string; label: string }) => {
    setView(v.id);
    if (v.id !== "month") onViewChange?.(v.label);
  };

  const cells: React.ReactNode[] = [];
  DOW.forEach((d) => cells.push(<div key={`dow-${d}`} className={styles.dow}>{d}</div>));

  for (let i = startOffset; i > 0; i--) {
    cells.push(
      <div key={`prev-${i}`} className={`${styles.calCell} ${styles.mutedCell}`}>
        <span className={styles.dayNum}>{daysInPrev - i + 1}</span>
      </div>
    );
  }

  const hoy = new Date();
  const todayKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const evts = events[key] || [];
    const visible = evts.slice(0, maxPerCell === Infinity ? evts.length : maxPerCell);
    const hidden = evts.length - visible.length;
    const disabled = selectable ? (isDateDisabled?.(key) ?? false) : false;
    const clickable = selectable && !disabled;
    const cellCls = [
      styles.calCell,
      selectable ? styles.cellSelectable : "",
      disabled ? styles.cellDisabled : "",
      selectable && selectedDate === key ? styles.cellSelected : "",
      selectable && todayKey === key ? styles.cellToday : "",
    ].filter(Boolean).join(" ");
    cells.push(
      <div
        key={key}
        className={cellCls}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-pressed={clickable ? selectedDate === key : undefined}
        aria-disabled={selectable && disabled ? true : undefined}
        onClick={clickable ? () => onSelectDate?.(key) : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectDate?.(key); }
              }
            : undefined
        }
      >
        <span className={styles.dayNum}>{day}</span>
        {visible.map((e, i) => (
          <div
            key={`${e.id}-${i}`}
            className={styles.calEvent}
            onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e.id, e.data); }}
            role={onEventClick ? "button" : undefined}
          >
            {e.label}
          </div>
        ))}
        {hidden > 0 && <div className={`${styles.calEvent} ${styles.calEventMore}`}>{t("calendar.more", { n: hidden })}</div>}
      </div>
    );
  }

  for (let d = 1; d <= trailing; d++) {
    cells.push(
      <div key={`next-${d}`} className={`${styles.calCell} ${styles.mutedCell}`}>
        <span className={styles.dayNum}>{d}</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.calMainTop}>
        <button
          className={styles.todayLink}
          onClick={() => {
            const now = new Date();
            setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          {t("common.today")}
        </button>
        <div className={styles.monthSwitch}>
          <button className={styles.navArrow} onClick={() => shiftMonth(-1)} aria-label={t("calendar.prevMonth")}>
            <Icon name="chevron-left" strokeWidth={2.2} width={18} height={18} />
          </button>
          <span>{MESES[month]} {year}</span>
          <button className={styles.navArrow} onClick={() => shiftMonth(1)} aria-label={t("calendar.nextMonth")}>
            <Icon name="chevron-right" strokeWidth={2.2} width={18} height={18} />
          </button>
        </div>
        <div className={styles.viewToggle}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={view === v.id ? styles.viewActive : ""}
              onClick={() => changeView(v)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.calGrid}>{cells}</div>
    </>
  );
}

export const calendarStyles = styles;
