"use client";
/* ============================================================
   DataTable — envoltorio de tabla del design system
   ------------------------------------------------------------
   Las páginas siguen escribiendo <tr> normales; aquí se convierten
   en filas animadas y el <tbody> orquesta su entrada escalonada.

   Se hace en este punto a propósito: las variantes de framer-motion
   solo se propagan a componentes `motion`, así que la alternativa
   era tocar las doce pantallas que usan tablas para envolver cada
   fila. Centralizarlo mantiene las vistas limpias, que es el
   objetivo del sistema de animaciones.

   `resetKey` vuelve a lanzar la entrada al cambiar un filtro; sin
   él React reutiliza el tbody y los resultados nuevos aparecerían
   de golpe.
============================================================ */
import { Children, isValidElement } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { STAGGER, staggerChild, staggerParent } from "@/components/animations";
import Pagination, { type PaginationProps } from "./Pagination";
import styles from "./DataTable.module.css";

export default function DataTable({
  headers,
  children,
  resetKey,
  paginacion,
}: {
  headers: React.ReactNode[];
  children: React.ReactNode;
  /** Cambia para repetir la animación (p. ej. el término buscado) */
  resetKey?: string | number;
  /** Resultado de usePaginacion. Si se pasa, se pintan los controles
      bajo la tabla; la página decide qué filas le entrega. */
  paginacion?: PaginationProps;
}) {
  const reduce = useReducedMotion();

  /* Cada <tr> pasa a ser motion.tr para poder heredar las variantes;
     lo que no sea una fila (un fragmento, null…) se deja intacto. */
  const filas = Children.map(children, (fila) => {
    if (!isValidElement(fila) || fila.type !== "tr") return fila;
    const { children: celdas, ...resto } = fila.props as {
      children?: React.ReactNode;
    } & Record<string, unknown>;
    return (
      <motion.tr {...resto} variants={reduce ? undefined : staggerChild}>
        {celdas}
      </motion.tr>
    );
  });

  return (
    /* La paginación va FUERA de .tableWrap: ese contenedor tiene
       overflow-x para que la tabla scrolle en horizontal, y dentro los
       controles se irían de pantalla con ella. */
    <>
      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <motion.tbody
            key={resetKey}
            initial="hidden"
            animate="visible"
            variants={{
              ...staggerParent,
              visible: {
                transition: {
                  staggerChildren: reduce ? 0 : STAGGER,
                  delayChildren: reduce ? 0 : 0.02,
                },
              },
            }}
          >
            {/* initial={false}: la entrada ya la orquesta el tbody; aquí
                AnimatePresence solo se ocupa de que una fila eliminada se
                desvanezca en vez de desaparecer de golpe. */}
            <AnimatePresence initial={false}>{filas}</AnimatePresence>
          </motion.tbody>
        </table>
      </div>

      {paginacion && <Pagination {...paginacion} />}
    </>
  );
}

export function PriceCell({ value }: { value: number }) {
  return <td className={styles.priceCell}>{value.toFixed(2)}€</td>;
}
