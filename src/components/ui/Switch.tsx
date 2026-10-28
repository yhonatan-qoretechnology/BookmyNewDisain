/* ============================================================
   Switch — interruptor sí/no del design system
   ------------------------------------------------------------
   Por debajo es una casilla de verdad (input checkbox con
   role="switch"): teclado, lector de pantalla y clic en el
   <label> que lo envuelva funcionan como en cualquier casilla.
   Vivía dentro de Configuración; ahora lo usa también la ficha
   de los insumos («Publicar en la web»).
============================================================ */
import styles from "./Switch.module.css";

export default function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Nombre accesible: la casilla en sí no enseña texto */
  label: string;
}) {
  return (
    <span className={styles.switch}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <span className={styles.slider} aria-hidden />
    </span>
  );
}
