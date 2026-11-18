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

   Las filas suben y se enfocan en cascada cada 40 ms
   (MOTION_SPEC.md §6.13 y docs/motion/referencias/09).
============================================================ */
import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useRegion } from "@/context/RegionContext";
import { ease, stagger } from "@/lib/motion";
import Pagination, { type PaginationProps } from "./Pagination";
import styles from "./DataTable.module.css";

/** Filas que entran en cascada. El resto aparece ya puesto.
 *
 *  No es un capricho de rendimiento: estas tablas llevan datos reales
 *  —hay 497 citas en la base de pruebas— y con 40 ms por fila una
 *  tabla sin paginar tardaría veinte segundos en terminar de pintarse,
 *  además de romper el tope de "~20 elementos con blur a la vez" de la
 *  §9. Quince son, con holgura, las que caben en pantalla: la cascada
 *  se ve completa y lo que hay más abajo ya está nítido cuando se
 *  llega haciendo scroll. */
const FILAS_ANIMADAS = 15;

/** Fila: sube 10 px y pasa de desenfocada a nítida (§6.13). */
const fila: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: ease.out },
    /* Obligatorio (§3.1): un filter puesto convierte la fila en
       contenedor de sus hijos `fixed` y aplana el cristal de dentro. */
    transitionEnd: { filter: "none" },
  },
  exit: { opacity: 0, filter: "blur(6px)", transition: { duration: 0.2 } },
};

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
     lo que no sea una fila (un fragmento, null…) se deja intacto.

     De paso, cada celda recibe `data-label` con el título de su columna:
     en móvil la tabla se apila en tarjetas (ver DataTable.module.css) y sin
     esa etiqueta los valores quedarían sueltos, sin saber qué son. */
  const etiqueta = (i: number) =>
    typeof headers[i] === "string" ? (headers[i] as string) : undefined;

  /* Cuenta aparte de la posición en `children`: ahí puede haber nulos y
     fragmentos, y lo que se quiere limitar son las filas de verdad. */
  let nFila = 0;

  const filas = Children.map(children, (f) => {
    if (!isValidElement(f) || f.type !== "tr") return f;
    const { children: celdas, ...resto } = f.props as {
      children?: React.ReactNode;
    } & Record<string, unknown>;
    const conEtiqueta = Children.map(celdas, (celda, i) => {
      if (!isValidElement(celda)) return celda;
      const props = celda.props as Record<string, unknown>;
      if (props["data-label"] !== undefined) return celda;
      return cloneElement(celda as ReactElement, { "data-label": etiqueta(i) });
    });
    const enCascada = !reduce && nFila++ < FILAS_ANIMADAS;
    return (
      <motion.tr {...resto} variants={enCascada ? fila : undefined}>
        {conEtiqueta}
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
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reduce ? 0 : stagger.rows,
                  delayChildren: reduce ? 0 : 0.1,
                },
              },
              exit: {},
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

/* Recibe y reenvía el resto de props (`data-label`) para que en móvil el
   precio también salga con el título de su columna delante.

   El importe lo da el país de la empresa: esta celda la comparten cinco
   pantallas (dashboard, reservas, stock…), así que el euro escrito a mano que
   había aquí era el que se le colaba a un negocio colombiano en más sitios. */
export function PriceCell({ value, ...rest }: { value: number } & React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { fmtMoneda } = useRegion();
  return <td className={styles.priceCell} {...rest}>{fmtMoneda(value)}</td>;
}
