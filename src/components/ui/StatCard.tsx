import styles from "./StatCard.module.css";

export type StatColor = "teal" | "amber" | "red" | "blue" | "purple" | "green" | "navy" | "coral";

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <section className={styles.statGrid}>{children}</section>;
}

export default function StatCard({
  color,
  icon,
  label,
  value,
  delta,
  deltaPositive = true,
  footer,
}: {
  color: StatColor;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaPositive?: boolean;
  footer?: string;
}) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.iconWrap} ${styles[color]}`}>{icon}</div>
      <div className={styles.top}>
        <div className={styles.body}>
          <span className={styles.label}>{label}</span>
          <span className={styles.value}>{value}</span>
        </div>
      </div>
      {(delta || footer) && (
        <div className={styles.footer}>
          {delta && (
            <span className={deltaPositive ? styles.deltaPos : styles.deltaNeg}>{delta}</span>
          )}
          {footer}
        </div>
      )}
    </div>
  );
}
