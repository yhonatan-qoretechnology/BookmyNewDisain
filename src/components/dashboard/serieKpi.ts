/* ============================================================
   Series de las tarjetas KPI (MOTION_SPEC.md §6.2 y §6.4)
   ------------------------------------------------------------
   La sparkline y la variación con flecha salen de las reservas
   que el dashboard YA tiene cargadas: ni una llamada más al API
   ni un número inventado. Lo que no se puede calcular con eso
   -la valoración media, que llega sin fecha- se queda sin línea
   y la tarjeta deja el hueco vacío a propósito.

   Todo mira a los últimos días CERRADOS (hasta hoy): las citas
   futuras, que en una agenda son muchas, falsearían la tendencia.
============================================================ */
import type { Reserva } from "@/models";

/** Días que cubre una sparkline. 14 = dos semanas, para poder
    comparar la última con la anterior. */
export const DIAS_SERIE = 14;

export interface SerieKpi {
  /** Un valor por día, del más antiguo a hoy. */
  valores: number[];
  /** Variación en % de los últimos 7 días contra los 7 previos.
      null cuando la semana anterior fue cero (dividir por cero no
      dice nada: no se pinta flecha). */
  variacion: number | null;
}

export interface SeriesDashboard {
  citas: SerieKpi;
  ingresos: SerieKpi;
  clientes: SerieKpi;
}

const MS_DIA = 86_400_000;

/** Las últimas `dias` fechas YYYY-MM-DD, de la más antigua a `hoyISO`. */
function ultimosDias(hoyISO: string, dias: number): string[] {
  const hoy = new Date(`${hoyISO}T00:00:00Z`).getTime();
  const lista: string[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    lista.push(new Date(hoy - i * MS_DIA).toISOString().slice(0, 10));
  }
  return lista;
}

/** Con qué se identifica a un cliente: el id de usuario si lo hay;
    si no, su correo, y como último recurso el nombre. Misma regla
    que usa EstadisticasController para contar clientes. */
function claveCliente(r: Reserva): string {
  return r.clienteId != null ? String(r.clienteId) : r.email || r.cliente;
}

function variacionSemanal(valores: number[]): number | null {
  if (valores.length < 14) return null;
  const suma = (desde: number, hasta: number) =>
    valores.slice(desde, hasta).reduce((a, b) => a + b, 0);
  const previa = suma(valores.length - 14, valores.length - 7);
  const ultima = suma(valores.length - 7, valores.length);
  if (previa === 0) return null;
  return ((ultima - previa) / previa) * 100;
}

/**
 * Tendencia diaria de reservas, importe reservado y clientes nuevos.
 * @param reservas Todas las reservas visibles para la sesión.
 * @param hoyISO   Día de hoy en YYYY-MM-DD.
 */
export function seriesDelDashboard(
  reservas: Reserva[],
  hoyISO: string,
  dias = DIAS_SERIE,
): SeriesDashboard {
  const fechas = ultimosDias(hoyISO, dias);
  const indice = new Map(fechas.map((f, i) => [f, i] as const));
  const citas = new Array<number>(dias).fill(0);
  const ingresos = new Array<number>(dias).fill(0);
  const clientes = new Array<number>(dias).fill(0);

  /* "Cliente nuevo" es el día de su PRIMERA reserva, así que la
     primera vuelta mira el historial entero, no solo la ventana. */
  const estreno = new Map<string, string>();
  for (const r of reservas) {
    if (!r.fecha) continue;
    const k = claveCliente(r);
    const previo = estreno.get(k);
    if (!previo || r.fecha < previo) estreno.set(k, r.fecha);
  }

  for (const r of reservas) {
    const i = indice.get(r.fecha);
    if (i === undefined) continue;
    citas[i] += 1;
    ingresos[i] += r.precio || 0;
  }
  for (const fecha of estreno.values()) {
    const i = indice.get(fecha);
    if (i !== undefined) clientes[i] += 1;
  }

  return {
    citas: { valores: citas, variacion: variacionSemanal(citas) },
    ingresos: { valores: ingresos, variacion: variacionSemanal(ingresos) },
    clientes: { valores: clientes, variacion: variacionSemanal(clientes) },
  };
}

/**
 * Serie → path para `Sparkline` (viewBox 0 0 64 24).
 * Devuelve null cuando no hay nada que contar: una línea plana en
 * una tarjeta sin datos haría creer que hay actividad.
 */
export function pathSparkline(valores: number[]): string | null {
  if (valores.length < 2) return null;
  if (valores.every((v) => v === 0)) return null;

  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const rango = max - min || 1;
  const puntos = valores.map((v, i) => {
    const x = 2 + (i / (valores.length - 1)) * 60;
    const y = 22 - ((v - min) / rango) * 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M${puntos.join(" L")}`;
}
