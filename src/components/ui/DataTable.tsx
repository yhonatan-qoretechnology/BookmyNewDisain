import styles from "./DataTable.module.css";

/** Envoltorio de tabla con estilos del design system */
export default function DataTable({
  headers,
  children,
}: {
  headers: React.ReactNode[];
  children: React.ReactNode;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function PriceCell({ value }: { value: number }) {
  return <td className={styles.priceCell}>{value.toFixed(2)}€</td>;
}
