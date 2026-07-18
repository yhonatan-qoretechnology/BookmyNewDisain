import styles from "./Badge.module.css";

type BadgeKind = "pendiente" | "confirmada" | "atendida" | "cancelado" | "noShow" | "activo" | "inactivo" | "pagado";

export default function Badge({
  kind,
  children,
  style,
}: {
  kind: BadgeKind;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <span className={`${styles.badge} ${styles[kind]}`} style={style}>{children}</span>;
}

export function RoleBadge({
  role,
  label,
}: {
  role: "superadmin" | "owner" | "admin" | "employee";
  /** Etiqueta ya traducida (i18n); si no se pasa, usa el rol en crudo */
  label?: string;
}) {
  const fallback = role;
  return <span className={`${styles.roleBadge} ${styles[role]}`}>{label || fallback}</span>;
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className={styles.tag}>{children}</span>;
}
