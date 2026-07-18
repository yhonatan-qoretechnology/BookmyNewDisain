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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={styles.searchBox}>
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

export function ToolbarActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
