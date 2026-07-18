import { initials } from "@/constants";
import styles from "./People.module.css";

export function PersonRow({ name, bold = false }: { name: string; bold?: boolean }) {
  return (
    <div className={styles.personRow}>
      <span className={styles.personAvatar}>{initials(name)}</span>
      {bold ? <b>{name}</b> : <span>{name}</span>}
    </div>
  );
}

export function Stars({ n }: { n: number }) {
  return <span className={styles.stars}>{"★".repeat(n) + "☆".repeat(5 - n)}</span>;
}
