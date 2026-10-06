/* ============================================================
   Festivos -> { "2026-07-16": "Fiesta local · Benalmádena, Fuengirola" }

   Es lo que CalendarGrid pinta en la celda. Dos cosas que la lista cruda
   no resuelve:

   - El nombre de las fiestas locales oficiales es genérico ("Fiesta
     Local"): sin el municipio al lado no se sabe de dónde es, y el dueño
     que mira todas sus sedes a la vez ve 16 de julio marcado sin saber
     cuál de sus locales cierra.
   - Dos municipios pueden tener fiesta el mismo día (16 de julio es la
     Virgen del Carmen en Fuengirola y en Benalmádena): si se indexa por
     fecha a secas, el segundo pisa al primero.
============================================================ */
import type { ApiFestivo } from "@/api/types";

export function mapaFestivos(lista: ApiFestivo[] | null | undefined): Record<string, string> {
  const porFecha = new Map<string, string[]>();

  for (const f of lista ?? []) {
    const fecha = f.fecha.slice(0, 10);
    const etiqueta =
      f.ambito === "LOCAL" && f.municipio ? `${f.nombre} · ${f.municipio}` : f.nombre;
    const previas = porFecha.get(fecha);
    if (!previas) {
      porFecha.set(fecha, [etiqueta]);
    } else if (!previas.includes(etiqueta)) {
      previas.push(etiqueta);
    }
  }

  return Object.fromEntries([...porFecha].map(([fecha, nombres]) => [fecha, nombres.join(" / ")]));
}
