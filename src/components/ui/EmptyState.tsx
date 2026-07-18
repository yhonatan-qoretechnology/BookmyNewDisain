import Icon, { type IconName } from "./Icon";
import styles from "./EmptyState.module.css";

export default function EmptyState({
  icon,
  title,
  message,
  style,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={styles.emptyState} style={style}>
      {icon && <Icon name={icon} strokeWidth={1.5} />}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
