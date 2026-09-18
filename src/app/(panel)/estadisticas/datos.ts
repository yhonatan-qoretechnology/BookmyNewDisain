/* ============================================================
   Estadísticas · cálculo del panel
   ------------------------------------------------------------
   Reúne en un solo modelo todo lo que pinta la vista. Las cifras
   salen de los endpoints que ya existen:

     · reservas visibles de la sesión  → ReservasController
     · pagos (/payments)              → ingresos y ticket medio
     · reseñas (/resenas)             → valoración media
     · rankings del servidor          → /estadisticas/*

   Bloque a bloque, si la cuenta todavía no tiene datos se cae a las
   cifras de demo.ts y se marca en `demo` para que el panel lo diga
   en pantalla. Así la vista nunca aparece vacía en una demo, pero
   tampoco presenta como real algo inventado.

   El backend no tiene analítica de navegación, así que el embudo de
   conversión es siempre de ejemplo.
============================================================ */
import type { EstadoReserva, Reserva, Session } from "@/models";
import { EstadisticasApi, PaymentsApi, ResenasApi } from "@/api/modules";
import type { EstadisticasFiltro } from "@/api/types";
import { MESES_CORTOS } from "@/constants";
import { ReservasController } from "@/controllers/ReservasController";
import {
  DEMO,
  type FilaProfesional,
  type FilaReserva,
  type PuntoSerie,
  type Ranking,
} from "./demo";

/** Franjas del mapa de calor: de 08:00 a 22:00 en tramos de dos horas. */
export const FRANJAS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
/** Claves de día, de lunes a domingo (el eje del gráfico semanal). */
export const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;

export interface DiaReservas {
  dia: string;
  confirmadas: number;
  completadas: number;
  canceladas: number;
  noShow: number;
}

export interface PanelDatos {
  kpis: {
    reservas: number;
    ingresos: number;
    clientesNuevos: number;
    ticketMedio: number;
    cancelacion: number;
    valoracion: number | null;
  };
  deltas: Record<"reservas" | "ingresos" | "clientesNuevos" | "ticketMedio" | "cancelacion" | "valoracion", number>;
  sparks: Record<"reservas" | "ingresos" | "clientes" | "ticket" | "cancelacion" | "valoracion", number[]>;
  serie: PuntoSerie[];
  estados: { clave: EstadoReserva; valor: number }[];
  porDia: DiaReservas[];
  horas: number[][];
  empresas: Ranking[];
  servicios: Ranking[];
  profesionales: FilaProfesional[];
  embudo: { clave: string; valor: number }[];
  clientes: { nuevos: number; recurrentes: number };
  sedes: Ranking[];
  ultimas: FilaReserva[];
  /** Bloques que se están pintando con cifras de ejemplo. */
  demo: {
    kpis: boolean;
    valoracion: boolean;
    serie: boolean;
    estados: boolean;
    porDia: boolean;
    horas: boolean;
    empresas: boolean;
    servicios: boolean;
    profesionales: boolean;
    embudo: boolean;
    clientes: boolean;
    sedes: boolean;
    ultimas: boolean;
  };
}

const ESTADOS_DONUT: EstadoReserva[] = ["confirmada", "atendida", "cancelado", "noShow", "pendiente"];

/** "YYYY-MM-DD" del día de hoy, sin arrastrar la zona horaria del navegador. */
function hoyYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function restarDias(ymd: string, dias: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/** Días que abarca un rango, ambos extremos incluidos. */
function longitudRango(desde: string, hasta: string): number {
  const ms = new Date(`${hasta}T00:00:00.000Z`).getTime() - new Date(`${desde}T00:00:00.000Z`).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function dentro(fecha: string, desde: string, hasta: string): boolean {
  /* Las fechas viajan como "YYYY-MM-DD", así que comparar cadenas ya ordena
     bien y evita crear un Date por cita. */
  return !!fecha && fecha >= desde && fecha <= hasta;
}

/** Índice 0-6 (lunes a domingo) de una fecha "YYYY-MM-DD". */
function indiceDia(fecha: string): number {
  const d = new Date(`${fecha}T00:00:00.000Z`).getUTCDay();
  return (d + 6) % 7;
}

/** Fila del mapa de calor: 08-10 → 0 … 20-22 → 6. Fuera de horario, -1. */
function indiceFranja(hora: string): number {
  const h = Number((hora || "").slice(0, 2));
  if (!Number.isFinite(h) || h < 8 || h >= 22) return -1;
  return Math.floor((h - 8) / 2);
}

function suma(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0);
}

/** Variación porcentual entre dos periodos; 0 si no había base con la que comparar. */
function variacion(actual: number, previo: number): number {
  if (!previo) return actual ? 100 : 0;
  return ((actual - previo) / previo) * 100;
}

function esPagado(estado?: string | null): boolean {
  return estado === "PAID";
}

export interface RangoPanel {
  desde: string;
  hasta: string;
}

/** Rango por defecto: el último mes, que es el atajo activo al entrar. */
export function rangoPorDefecto(): RangoPanel {
  const hasta = hoyYmd();
  return { desde: restarDias(hasta, 29), hasta };
}

/**
 * Carga y calcula todo el panel.
 * @param session  Sesión activa: acota las reservas visibles por rol.
 * @param locale   Idioma para resolver nombres de servicio.
 * @param rango    Fechas del filtro, ambas incluidas.
 */
export async function cargarPanel(
  session: Session | null,
  locale: string,
  rango: RangoPanel,
): Promise<PanelDatos> {
  const filtro: EstadisticasFiltro = { desde: rango.desde, hasta: rango.hasta, limit: 5 };

  const [citas, pagos, resenas, empresasApi, serviciosApi, empleadosApi] = await Promise.all([
    ReservasController.getForSession(session, locale).catch(() => [] as Reserva[]),
    PaymentsApi.findAll().catch(() => []),
    ResenasApi.findAll().catch(() => []),
    EstadisticasApi.empresas(filtro).catch(() => []),
    EstadisticasApi.servicios(filtro).catch(() => []),
    EstadisticasApi.empleados(filtro).catch(() => []),
  ]);

  const largo = longitudRango(rango.desde, rango.hasta);
  const previoHasta = restarDias(rango.desde, 1);
  const previoDesde = restarDias(previoHasta, largo - 1);

  const enRango = citas.filter((c) => dentro(c.fecha, rango.desde, rango.hasta));
  const enPrevio = citas.filter((c) => dentro(c.fecha, previoDesde, previoHasta));
  const hayCitas = enRango.length > 0;

  /* ── KPIs ──────────────────────────────────────────────── */
  const pagosPagados = (pagos || []).filter((p) => esPagado(p.status) && p.createdAt);
  const ingresosDe = (desde: string, hasta: string) =>
    suma(pagosPagados.filter((p) => dentro((p.createdAt || "").slice(0, 10), desde, hasta)).map((p) => p.totalAmount || 0));
  const ingresos = ingresosDe(rango.desde, rango.hasta);
  const ingresosPrev = ingresosDe(previoDesde, previoHasta);

  const canceladas = enRango.filter((c) => c.estado === "cancelado").length;
  const canceladasPrev = enPrevio.filter((c) => c.estado === "cancelado").length;
  const tasa = hayCitas ? (canceladas / enRango.length) * 100 : 0;
  const tasaPrev = enPrevio.length ? (canceladasPrev / enPrevio.length) * 100 : 0;

  /* Cliente "nuevo" = su primera reserva de todo el histórico cae dentro del
     rango. No hay endpoint de altas por fecha, así que se deduce de las citas. */
  const primeraCita = new Map<string, string>();
  for (const c of citas) {
    const clave = c.clienteId != null ? String(c.clienteId) : c.email || c.cliente;
    const actual = primeraCita.get(clave);
    if (!actual || c.fecha < actual) primeraCita.set(clave, c.fecha);
  }
  const clientesRango = new Set(
    enRango.map((c) => (c.clienteId != null ? String(c.clienteId) : c.email || c.cliente)),
  );
  const nuevos = [...clientesRango].filter((k) => {
    const p = primeraCita.get(k);
    return !!p && dentro(p, rango.desde, rango.hasta);
  }).length;
  const recurrentes = clientesRango.size - nuevos;

  const clientesPrev = new Set(
    enPrevio.map((c) => (c.clienteId != null ? String(c.clienteId) : c.email || c.cliente)),
  );
  const nuevosPrev = [...clientesPrev].filter((k) => {
    const p = primeraCita.get(k);
    return !!p && dentro(p, previoDesde, previoHasta);
  }).length;

  const ticket = enRango.length ? ingresos / enRango.length : 0;
  const ticketPrev = enPrevio.length ? ingresosPrev / enPrevio.length : 0;

  const notas = (resenas || []).map((r) => r.calificacion).filter((n): n is number => typeof n === "number");
  const valoracion = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  /* ── Serie de doce meses ───────────────────────────────── */
  const hoy = new Date();
  const serieReal: PuntoSerie[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - i, 1));
    const prefijo = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const prefijoPrev = `${d.getUTCFullYear() - 1}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    serieReal.push({
      mes: MESES_CORTOS[d.getUTCMonth()],
      reservas: citas.filter((c) => c.fecha.startsWith(prefijo)).length,
      reservasPrev: citas.filter((c) => c.fecha.startsWith(prefijoPrev)).length,
      ingresos: Math.round(suma(pagosPagados.filter((p) => (p.createdAt || "").startsWith(prefijo)).map((p) => p.totalAmount || 0))),
      ingresosPrev: Math.round(suma(pagosPagados.filter((p) => (p.createdAt || "").startsWith(prefijoPrev)).map((p) => p.totalAmount || 0))),
    });
  }
  const haySerie = serieReal.some((p) => p.reservas > 0 || p.ingresos > 0);

  /* ── Estado de las reservas ────────────────────────────── */
  const estadosReales = ESTADOS_DONUT.map((clave) => ({
    clave,
    valor: enRango.filter((c) => c.estado === clave).length,
  }));

  /* ── Por día de la semana y mapa de calor ──────────────── */
  const porDiaReal: DiaReservas[] = DIAS.map((dia) => ({ dia, confirmadas: 0, completadas: 0, canceladas: 0, noShow: 0 }));
  const horasReales: number[][] = FRANJAS.map(() => DIAS.map(() => 0));
  for (const c of enRango) {
    const d = indiceDia(c.fecha);
    if (d >= 0 && d < 7) {
      if (c.estado === "confirmada") porDiaReal[d].confirmadas += 1;
      else if (c.estado === "atendida") porDiaReal[d].completadas += 1;
      else if (c.estado === "cancelado") porDiaReal[d].canceladas += 1;
      else if (c.estado === "noShow") porDiaReal[d].noShow += 1;
      const f = indiceFranja(c.hora);
      if (f >= 0) horasReales[f][d] += 1;
    }
  }
  const hayHoras = horasReales.some((fila) => fila.some((v) => v > 0));

  /* ── Sedes y últimas reservas ──────────────────────────── */
  const porSede = new Map<string, number>();
  for (const c of enRango) {
    const nombre = c.sedeName || `#${c.sedeId}`;
    porSede.set(nombre, (porSede.get(nombre) || 0) + 1);
  }
  const sedes: Ranking[] = [...porSede.entries()]
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const ultimas: FilaReserva[] = [...enRango]
    .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`))
    .slice(0, 5)
    .map((c) => ({
      empresa: c.sedeName || "—",
      servicio: c.servicio,
      cliente: c.cliente,
      fecha: c.fecha,
      hora: c.hora,
      importe: c.precio,
      estado: c.estado,
    }));

  /* ── Rankings del servidor ─────────────────────────────── */
  const empresas: Ranking[] = (empresasApi || []).map((e) => ({ nombre: e.nombre, valor: e.reservas }));
  const servicios: Ranking[] = (serviciosApi || []).map((e) => ({ nombre: e.nombre, valor: e.reservas }));
  const profesionales: FilaProfesional[] = (empleadosApi || []).map((e) => ({
    nombre: e.nombre,
    reservas: e.reservas,
    ingresos: e.ingresos,
    delta: 0,
  }));

  const hayIngresos = ingresos > 0;

  return {
    kpis: hayCitas
      ? {
          reservas: enRango.length,
          ingresos,
          clientesNuevos: nuevos,
          ticketMedio: ticket,
          cancelacion: tasa,
          valoracion: valoracion ?? DEMO.kpis.valoracion,
        }
      : { ...DEMO.kpis, valoracion: valoracion ?? DEMO.kpis.valoracion },
    deltas: hayCitas
      ? {
          reservas: variacion(enRango.length, enPrevio.length),
          ingresos: variacion(ingresos, ingresosPrev),
          clientesNuevos: variacion(nuevos, nuevosPrev),
          ticketMedio: variacion(ticket, ticketPrev),
          /* En cancelaciones, bajar es bueno: se guarda la diferencia en puntos. */
          cancelacion: tasa - tasaPrev,
          valoracion: 0,
        }
      : DEMO.deltas,
    sparks: haySerie
      ? {
          reservas: serieReal.map((p) => p.reservas),
          ingresos: serieReal.map((p) => p.ingresos),
          clientes: serieReal.map((p) => p.reservas),
          ticket: serieReal.map((p) => (p.reservas ? p.ingresos / p.reservas : 0)),
          cancelacion: DEMO.sparks.cancelacion,
          valoracion: DEMO.sparks.valoracion,
        }
      : DEMO.sparks,
    serie: haySerie ? serieReal : DEMO.serie,
    estados: hayCitas ? estadosReales : DEMO.estados,
    porDia: hayCitas ? porDiaReal : DEMO.porDia,
    horas: hayHoras ? horasReales : DEMO.horas,
    empresas: empresas.length ? empresas : DEMO.empresas,
    servicios: servicios.length ? servicios : DEMO.servicios,
    profesionales: profesionales.length ? profesionales : DEMO.profesionales,
    /* Sin analítica de navegación en el backend, el embudo es siempre de ejemplo. */
    embudo: DEMO.embudo,
    clientes: hayCitas ? { nuevos, recurrentes } : DEMO.clientes,
    sedes: sedes.length ? sedes : DEMO.sedes,
    ultimas: ultimas.length ? ultimas : DEMO.ultimas,
    demo: {
      kpis: !hayCitas,
      valoracion: valoracion == null,
      serie: !haySerie,
      estados: !hayCitas,
      porDia: !hayCitas,
      horas: !hayHoras,
      empresas: !empresas.length,
      servicios: !servicios.length,
      profesionales: !profesionales.length,
      embudo: true,
      clientes: !hayCitas,
      sedes: !sedes.length,
      ultimas: !ultimas.length,
    },
  };
}

/** Ingresos del periodo sin datos reales: se usa para el aviso del KPI. */
export function ingresosSonDemo(d: PanelDatos): boolean {
  return d.demo.kpis;
}
