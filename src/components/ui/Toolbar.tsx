"use client";
import Icon from "./Icon";
import styles from "./Toolbar.module.css";

export default function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Buscar…",
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Ancho reducido: para barras con varios filtros por columna */
  compact?: boolean;
}) {
  return (
    <div className={`${styles.searchBox} ${compact ? styles.compact : ""}`}>
      <Icon name="search" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

/** Select con el mismo lenguaje visual que SearchBox */
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  icon = "tag",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  label: string;
  icon?: string;
}) {
  return (
    <div className={`${styles.control} ${styles.selectControl}`}>
      <Icon name={icon} />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className={styles.caret} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

/** Input de fecha con el mismo lenguaje visual que SearchBox */
export function FilterDate({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className={`${styles.control} ${styles.dateControl}`}>
      <Icon name="calendar" />
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange("")}
          aria-label={`${label} — limpiar`}
        >
          <Icon name="x" />
        </button>
      )}
    </div>
  );
}

export function ToolbarActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

/** Grupo de filtros por columna (se apila en móvil) */
export function FilterGroup({ children }: { children: React.ReactNode }) {
  return <div className={styles.filterGroup}>{children}</div>;
}
