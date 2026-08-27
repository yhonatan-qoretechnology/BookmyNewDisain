"use client";
/* ============================================================
   Pagination — controles de página del design system
   ------------------------------------------------------------
   Lo pinta DataTable cuando recibe la prop `paginacion`, así que las
   páginas solo tienen que llamar a usePaginacion y pasar el resultado.

   Con muchas páginas se muestran la primera, la última y las vecinas
   de la actual, con elipsis en medio: una fila de treinta números es
   tan inútil como no tener paginación.
============================================================ */
import { useI18n } from "@/i18n";
import Icon from "./Icon";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  pagina: number;
  totalPaginas: number;
  total: number;
  desde: number;
  hasta: number;
  irA: (pagina: number) => void;
}

/** Primera, última, actual y sus vecinas; `null` = elipsis. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const cerca = new Set([1, total, actual, actual - 1, actual + 1]);
  if (actual <= 3) [2, 3, 4].forEach((n) => cerca.add(n));
  if (actual >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => cerca.add(n));

  const ordenadas = [...cerca].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const salida: (number | null)[] = [];
  let previa = 0;
  for (const n of ordenadas) {
    if (previa && n - previa > 1) salida.push(null);
    salida.push(n);
    previa = n;
  }
  return salida;
}

export default function Pagination({
  pagina, totalPaginas, total, desde, hasta, irA,
}: PaginationProps) {
  const { t } = useI18n();

  /* Una sola página no necesita controles, pero el recuento sigue
     siendo útil ("12 resultados"). Con la tabla vacía no se pinta nada:
     de eso ya se encarga el EmptyState de cada página. */
  if (total === 0) return null;

  return (
    <nav className={styles.wrap} aria-label={t("paginacion.aria")}>
      <span className={styles.recuento}>
        {t("paginacion.mostrando", { desde, hasta, total })}
      </span>

      {totalPaginas > 1 && (
        <div className={styles.controles}>
          <button
            type="button"
            className={styles.flecha}
            onClick={() => irA(pagina - 1)}
            disabled={pagina === 1}
            aria-label={t("paginacion.anterior")}
          >
            <Icon name="chevron-left" />
          </button>

          {paginasVisibles(pagina, totalPaginas).map((n, i) =>
            n === null ? (
              <span key={`gap-${i}`} className={styles.elipsis} aria-hidden>…</span>
            ) : (
              <button
                key={n}
                type="button"
                className={`${styles.numero} ${n === pagina ? styles.activa : ""}`}
                onClick={() => irA(n)}
                aria-label={t("paginacion.irA", { n })}
                aria-current={n === pagina ? "page" : undefined}
              >
                {n}
              </button>
            ),
          )}

          <button
            type="button"
            className={styles.flecha}
            onClick={() => irA(pagina + 1)}
            disabled={pagina === totalPaginas}
            aria-label={t("paginacion.siguiente")}
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      )}
    </nav>
  );
}
