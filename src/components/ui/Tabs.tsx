"use client";
import styles from "./Tabs.module.css";

export interface TabDef {
  id: string;
  label: React.ReactNode;
}

export default function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className={styles.tabBar}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.tabBtn} ${t.id === active ? styles.active : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
