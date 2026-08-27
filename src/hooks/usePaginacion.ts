"use client";
/* ============================================================
   usePaginacion — recorta una lista en páginas
   ------------------------------------------------------------
   El panel trae las listas completas del API y las filtra en el
   navegador, así que la paginación también es de cliente: aquí solo
   se decide QUÉ tramo se pinta.

   Existe porque las tablas crecían sin techo (Facturación pasaba de
   cien filas) y, además de obligar a un scroll interminable, cada
   fila entra con la animación escalonada de DataTable: sin tope, la
   última tardaba segundos en aparecer.
============================================================ */
import { useEffect, useMemo, useState } from "react";

export interface Paginacion<T> {
  /** Tramo que toca pintar */
  visibles: T[];
  pagina: number;
  totalPaginas: number;
  /** Elementos totales, antes de recortar */
  total: number;
  irA: (pagina: number) => void;
  /** Índices humanos del tramo (1-based) para el "mostrando X–Y de Z" */
  desde: number;
  hasta: number;
}

export function usePaginacion<T>(
  items: T[],
  opciones: {
    porPagina?: number;
    /** Cambia al filtrar o buscar para volver a la primera página */
    resetKey?: string | number;
  } = {},
): Paginacion<T> {
  const { porPagina = 15, resetKey } = opciones;
  const [pagina, setPagina] = useState(1);

  /* Al cambiar el filtro, la página 7 del listado anterior casi nunca
     tiene sentido en el nuevo: se vuelve al principio. */
  useEffect(() => { setPagina(1); }, [resetKey]);

  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  /* Si borrar un elemento deja la última página vacía, se sirve la
     última que sí existe en vez de una tabla en blanco. */
  const actual = Math.min(Math.max(pagina, 1), totalPaginas);

  const visibles = useMemo(
    () => items.slice((actual - 1) * porPagina, actual * porPagina),
    [items, actual, porPagina],
  );

  return {
    visibles,
    pagina: actual,
    totalPaginas,
    total,
    irA: (p: number) => setPagina(Math.min(Math.max(p, 1), totalPaginas)),
    desde: total === 0 ? 0 : (actual - 1) * porPagina + 1,
    hasta: Math.min(actual * porPagina, total),
  };
}
