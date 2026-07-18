import styles from "./Panel.module.css";

export default function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return <section className={`${styles.panel} ${className}`} style={style}>{children}</section>;
}

export function PanelHead({
  title,
  sub,
  right,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className={styles.panelHead}>
      <div>
        <h2 className={styles.panelTitle}>{title}</h2>
        {sub && <span className={styles.panelSub}>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

export function SelectPill({
  children,
  onClick,
  id,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  id?: string;
}) {
  return (
    <button className={styles.selectPill} onClick={onClick} id={id} type="button">
      {children}
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
    </button>
  );
}
