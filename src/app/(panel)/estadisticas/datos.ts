/* ============================================================
   Estadísticas · cálculo del panel
   ------------------------------------------------------------
   Reúne en un solo modelo todo lo que pinta la vista. Todas las
   cifras salen del MISMO universo: las reservas que la sesión puede
   ver (empresa o sede elegida; toda la plataforma para un superadmin
   sin empresa). Así reservas, ingresos y rankings siempre cuadran:

     · reservas visibles de la sesión  → ReservasController
     · pagos (/payments)              → solo los PAID de esas reservas
     · reseñas (/resenas)             → aprobadas, de sus sedes, del periodo
     · rankings                       → contados aquí sobre esas reservas

   Los ingresos se imputan a la fecha de la cita, no a la del cobro:
   así el ticket medio divide cosas del mismo periodo. Los días son los
   de Madrid y las extensiones de cita no cuentan como reservas nuevas.

   Solo si la CUENTA todavía no tiene reservas se cae a las cifras de
   demo.ts, y cada bloque que las usa se marca en `demo` para que el
   panel lo diga en pantalla. Una cuenta con datos y un periodo vacío
   (un domingo cerrado, "Hoy" a primera hora) muestra ceros reales.
   Si falla la carga de reservas o pagos se lanza el error: rellenar con
   la demo haría pasar un fallo por datos reales.

   El backend no tiene analítica de navegación, así que el embudo de
   conversión es siempre de ejemplo.
============================================================ */
import type { EstadoReserva, Reserva, Session } from "@/models";
import { EmpresasApi, PaymentsApi, ResenasApi, SedesApi } from "@/api/modules";
import type { ApiEmpresa, ApiResena, ApiSede } from "@/api/types";
import { ReservasController } from "@/controllers/ReservasController";
import { madridToday, madridYmd } from "@/lib/timezone";
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

type ClaveKpi = "reservas" | "ingresos" | "clientesNuevos" | "ticketMedio" | "cancelacion" | "valoracion";

export interface PanelDatos {
  kpis: {
    reservas: number;
    ingresos: number;
    clientesNuevos: number;
    ticketMedio: number;
    cancelacion: number;
    /** null: hay reseñas en la cuenta, pero ninguna en el periodo. */
    valoracion: number | null;
  };
  /**
   * Cambio frente al periodo anterior de la misma duración. null cuando no
   * hay con qué comparar (la tarjeta no pinta flecha). Porcentaje, salvo la
   * cancelación (puntos porcentuales) y la valoración (estrellas).
   */
  deltas: Record<ClaveKpi, number | null>;
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
  /** Ingresos de TODOS los profesionales del periodo (base del % de la tabla). */
  ingresosProfesionales: number;
  /** Rango con el que se calcularon estas cifras. */
  rango: RangoPanel;
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

/** "YYYY-MM-DD" desplazado `dias` hacia atrás. */
export function restarDias(ymd: string, dias: number): string {
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

function media(ns: number[]): number | null {
  return ns.length ? suma(ns) / ns.length : null;
}

/** Variación porcentual entre dos periodos; null si no había base con la que comparar. */
function variacion(actual: number, previo: number): number | null {
  if (!previo) return null;
  return ((actual - previo) / previo) * 100;
}

/** Suma las filas con el mismo nombre: dos servicios distintos que se
    llaman igual (uno por sede) se leían como dos puestos del ranking. */
function fusionarPorNombre(filas: Ranking[]): Ranking[] {
  const porNombre = new Map<string, number>();
  for (const f of filas) {
    const k = f.nombre.trim();
    porNombre.set(k, (porNombre.get(k) || 0) + f.valor);
  }
  return [...porNombre.entries()]
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);
}

/** Cliente de una cita: el id de usuario si lo hay; si no, email o nombre. */
function claveCliente(c: Reserva): string {
  return c.clienteId != null ? String(c.clienteId) : c.email || c.cliente;
}

/** Fecha de Madrid de una reseña (createdAt viene en UTC). */
function fechaResena(r: ApiResena): string {
  const d = new Date(r.createdAt);
  return Number.isNaN(d.getTime()) ? "" : madridYmd(d);
}

export interface RangoPanel {
  desde: string;
  hasta: string;
}

/** Rango por defecto: el último mes, que es el atajo activo al entrar. */
export function rangoPorDefecto(): RangoPanel {
  const hasta = madridToday();
  return { desde: restarDias(hasta, 29), hasta };
}

/** Rango de un atajo, calculado sobre el día de hoy en Madrid. */
export function rangoAtajo(cual: "hoy" | "mes" | "anio"): RangoPanel {
  const hasta = madridToday();
  if (cual === "hoy") return { desde: hasta, hasta };
  if (cual === "mes") return { desde: restarDias(hasta, 29), hasta };
  /* Doce meses exactos: del día siguiente al de hoy hace un año, hasta hoy. */
  const [y, m, d] = hasta.split("-").map(Number);
  const haceUnAnio = new Date(Date.UTC(y - 1, m - 1, d));
  haceUnAnio.setUTCDate(haceUnAnio.getUTCDate() + 1);
  return { desde: haceUnAnio.toISOString().slice(0, 10), hasta };
}

/**
 * Sedes que abarca la sesión, para acotar las reseñas. null = todas
 * (superadmin sin empresa elegida).
 */
function sedesDeSesion(session: Session | null, sedes: ApiSede[]): Set<number> | null {
  if (session?.sedeId) return new Set([Number(session.sedeId)]);
  const empresaId = Number(session?.negocioId);
  if (!empresaId) return null;
  return new Set(sedes.filter((s) => s.empresaId === empresaId).map((s) => s.id));
}

/** Cuenta por nombre y deja los cinco primeros. */
function top5(claves: string[]): Ranking[] {
  return fusionarPorNombre(claves.map((nombre) => ({ nombre, valor: 1 }))).slice(0, 5);
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
  const [citasTodas, pagos, resenas, sedesTodas, empresasTodas] = await Promise.all([
    ReservasController.getForSession(session, locale),
    PaymentsApi.findAll(),
    ResenasApi.findAll().catch(() => [] as ApiResena[]),
    /* Solo para poner nombre de empresa a cada sede y acotar reseñas. */
    SedesApi.findAll().catch(() => [] as ApiSede[]),
    EmpresasApi.findAll().catch(() => [] as ApiEmpresa[]),
  ]);
  const sedesVisibles = sedesDeSesion(session, sedesTodas);

  const largo = longitudRango(rango.desde, rango.hasta);
  const previoHasta = restarDias(rango.desde, 1);
  const previoDesde = restarDias(previoHasta, largo - 1);

  /* ── Cobros de las reservas visibles ────────────────────────
     Una extensión de cita ("necesito más tiempo") es otra cita con su
     propio pago: su dinero cuenta en los ingresos de la cita original,
     pero no es una reserva nueva. */
  const cobradoPorCita = new Map<number, number>();
  for (const p of pagos || []) {
    if (p.status !== "PAID") continue;
    cobradoPorCita.set(p.appointmentId, (cobradoPorCita.get(p.appointmentId) || 0) + (p.totalAmount || 0));
  }
  const cobradoDe = (c: Reserva) => (c.apiId != null ? cobradoPorCita.get(c.apiId) || 0 : 0);

  const reservas = citasTodas.filter((c) => c.extensionDeId == null);
  const cobroReserva = new Map<string, number>();
  for (const c of reservas) cobroReserva.set(c.id, cobradoDe(c));
  const porApiId = new Map(reservas.filter((c) => c.apiId != null).map((c) => [c.apiId as number, c]));
  for (const ext of citasTodas) {
    if (ext.extensionDeId == null) continue;
    const original = porApiId.get(ext.extensionDeId);
    if (original) cobroReserva.set(original.id, (cobroReserva.get(original.id) || 0) + cobradoDe(ext));
  }
  const cobrado = (c: Reserva) => cobroReserva.get(c.id) || 0;

  /* La demo depende de la cuenta, no del periodo elegido. */
  const cuentaVacia = reservas.length === 0;
  const enRango = reservas.filter((c) => dentro(c.fecha, rango.desde, rango.hasta));
  const enPrevio = reservas.filter((c) => dentro(c.fecha, previoDesde, previoHasta));

  /* ── KPIs ──────────────────────────────────────────────── */
  const ingresosDe = (lista: Reserva[]) => suma(lista.map(cobrado));
  const pagadasDe = (lista: Reserva[]) => lista.filter((c) => cobrado(c) > 0).length;
  const ingresos = ingresosDe(enRango);
  const ingresosPrev = ingresosDe(enPrevio);
  const pagadas = pagadasDe(enRango);
  const pagadasPrev = pagadasDe(enPrevio);
  const ticket = pagadas ? ingresos / pagadas : 0;
  const ticketPrev = pagadasPrev ? ingresosPrev / pagadasPrev : 0;

  const tasaDe = (lista: Reserva[]) =>
    lista.length ? (lista.filter((c) => c.estado === "cancelado").length / lista.length) * 100 : 0;
  const tasa = tasaDe(enRango);
  const tasaPrev = tasaDe(enPrevio);

  /* Cliente "nuevo" = su primera reserva de todo el histórico cae dentro del
     rango. No hay endpoint de altas por fecha, así que se deduce de las citas. */
  const primeraCita = new Map<string, string>();
  for (const c of reservas) {
    const k = claveCliente(c);
    const actual = primeraCita.get(k);
    if (!actual || c.fecha < actual) primeraCita.set(k, c.fecha);
  }
  const nuevosEn = (lista: Reserva[], desde: string, hasta: string) => {
    const unicos = new Set(lista.map(claveCliente));
    const nuevos = [...unicos].filter((k) => {
      const p = primeraCita.get(k);
      return !!p && dentro(p, desde, hasta);
    }).length;
    return { unicos: unicos.size, nuevos };
  };
  const clientesRango = nuevosEn(enRango, rango.desde, rango.hasta);
  const nuevos = clientesRango.nuevos;
  const recurrentes = clientesRango.unicos - nuevos;
  const nuevosPrev = nuevosEn(enPrevio, previoDesde, previoHasta).nuevos;

  /* Valoración: reseñas aprobadas (las pendientes o rechazadas no son la
     opinión publicada) de las sedes de la sesión, dentro del periodo. */
  const resenasVisibles = (resenas || []).filter(
    (r) =>
      r.aprobado === true &&
      typeof r.calificacion === "number" &&
      (sedesVisibles == null || (r.sedeId != null && sedesVisibles.has(r.sedeId))),
  );
  const sinResenas = resenasVisibles.length === 0;
  const notasEn = (desde: string, hasta: string) =>
    resenasVisibles.filter((r) => dentro(fechaResena(r), desde, hasta)).map((r) => r.calificacion);
  const valoracion = media(notasEn(rango.desde, rango.hasta));
  const valoracionPrev = media(notasEn(previoDesde, previoHasta));

  /* ── Serie de doce meses, terminando en el mes en curso ─── */
  const [anioHoy, mesHoy] = madridToday().split("-").map(Number);
  const serieReal: PuntoSerie[] = [];
  const sparkClientes: number[] = [];
  const sparkCancelacion: number[] = [];
  const sparkValoracion: number[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(anioHoy, mesHoy - 1 - i, 1));
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const prefijo = `${d.getUTCFullYear()}-${mm}`;
    const prefijoPrev = `${d.getUTCFullYear() - 1}-${mm}`;
    const delMes = reservas.filter((c) => c.fecha.startsWith(prefijo));
    const delMesPrev = reservas.filter((c) => c.fecha.startsWith(prefijoPrev));
    serieReal.push({
      mes: d.getUTCMonth(),
      reservas: delMes.length,
      reservasPrev: delMesPrev.length,
      ingresos: Math.round(ingresosDe(delMes)),
      ingresosPrev: Math.round(ingresosDe(delMesPrev)),
      pagadas: pagadasDe(delMes),
    });
    sparkClientes.push([...primeraCita.values()].filter((f) => f.startsWith(prefijo)).length);
    sparkCancelacion.push(tasaDe(delMes));
    const notasMes = resenasVisibles.filter((r) => fechaResena(r).startsWith(prefijo)).map((r) => r.calificacion);
    const m = media(notasMes);
    if (m != null) sparkValoracion.push(m);
  }

  /* Si se cae a la demo, sus doce puntos se reetiquetan con los meses
     reales para que el eje no diga "May…Abr" en septiembre. */
  const serieDemo: PuntoSerie[] = DEMO.serie.map((p, i) => ({ ...p, mes: serieReal[i].mes }));

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

  /* ── Sedes y últimas reservas ──────────────────────────── */
  const sedes = top5(enRango.map((c) => c.sedeName || `#${c.sedeId}`));

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

  /* ── Rankings ──────────────────────────────────────────────
     Se cuentan aquí, sobre las mismas reservas que los KPI y con la misma
     regla que el servidor (sin canceladas ni no-show). Los endpoints
     /estadisticas/* contaban las extensiones como reservas, cortaban los
     días en UTC y agrupaban por id: dos servicios que se llaman igual en
     dos sedes salían como dos puestos. */
  const validas = enRango.filter((c) => c.estado !== "cancelado" && c.estado !== "noShow");
  const empresaDeSede = new Map(sedesTodas.map((s) => [String(s.id), s.empresaId]));
  const nombreEmpresa = new Map(empresasTodas.map((e) => [e.id, e.nombre]));
  const empresas = top5(
    validas.map((c) => {
      const empresaId = empresaDeSede.get(c.sedeId);
      return (empresaId != null && nombreEmpresa.get(empresaId)) || session?.negocioName || "—";
    }),
  );
  const servicios = top5(validas.map((c) => c.servicio || "—"));

  const porProfesional = new Map<string, FilaProfesional>();
  for (const c of validas) {
    if (!c.empleadoId) continue;
    const fila = porProfesional.get(c.empleadoId) ?? {
      nombre: c.empleadoName || `#${c.empleadoId}`,
      reservas: 0,
      ingresos: 0,
      delta: 0,
    };
    fila.reservas += 1;
    fila.ingresos += cobrado(c);
    porProfesional.set(c.empleadoId, fila);
  }
  const todosProfesionales = [...porProfesional.values()];
  const profesionales = todosProfesionales
    .sort((a, b) => b.ingresos - a.ingresos || b.reservas - a.reservas)
    .slice(0, 5);

  const demo = cuentaVacia;

  return {
    kpis: {
      ...(demo
        ? DEMO.kpis
        : { reservas: enRango.length, ingresos, clientesNuevos: nuevos, ticketMedio: ticket, cancelacion: tasa }),
      valoracion: sinResenas ? DEMO.kpis.valoracion : valoracion,
    },
    deltas: {
      reservas: demo ? null : variacion(enRango.length, enPrevio.length),
      ingresos: demo ? null : variacion(ingresos, ingresosPrev),
      clientesNuevos: demo ? null : variacion(nuevos, nuevosPrev),
      ticketMedio: demo ? null : variacion(ticket, ticketPrev),
      /* En cancelaciones se compara en puntos: pasar de 5 % a 6 % es +1 pp. */
      cancelacion: demo || !enPrevio.length ? null : tasa - tasaPrev,
      valoracion: valoracion != null && valoracionPrev != null ? valoracion - valoracionPrev : null,
    },
    sparks: {
      ...(demo
        ? {
            reservas: DEMO.sparks.reservas,
            ingresos: DEMO.sparks.ingresos,
            clientes: DEMO.sparks.clientes,
            ticket: DEMO.sparks.ticket,
            cancelacion: DEMO.sparks.cancelacion,
          }
        : {
            reservas: serieReal.map((p) => p.reservas),
            ingresos: serieReal.map((p) => p.ingresos),
            clientes: sparkClientes,
            ticket: serieReal.map((p) => (p.pagadas ? p.ingresos / p.pagadas : 0)),
            cancelacion: sparkCancelacion,
          }),
      valoracion: sinResenas ? DEMO.sparks.valoracion : sparkValoracion.length > 1 ? sparkValoracion : [],
    },
    serie: demo ? serieDemo : serieReal,
    estados: demo ? DEMO.estados : estadosReales,
    porDia: demo ? DEMO.porDia : porDiaReal,
    horas: demo ? DEMO.horas : horasReales,
    empresas: demo ? DEMO.empresas : empresas,
    servicios: demo ? DEMO.servicios : servicios,
    profesionales: demo ? DEMO.profesionales : profesionales,
    ingresosProfesionales: demo
      ? suma(DEMO.profesionales.map((x) => x.ingresos))
      : suma(todosProfesionales.map((x) => x.ingresos)),
    /* Sin analítica de navegación en el backend, el embudo es siempre de ejemplo. */
    embudo: DEMO.embudo,
    clientes: demo ? DEMO.clientes : { nuevos, recurrentes },
    sedes: demo ? DEMO.sedes : sedes,
    /* Las de ejemplo se fechan hoy: con su fecha fija parecían de hace meses. */
    ultimas: demo ? DEMO.ultimas.map((u) => ({ ...u, fecha: madridToday() })) : ultimas,
    rango,
    demo: {
      kpis: demo,
      valoracion: sinResenas,
      serie: demo,
      estados: demo,
      porDia: demo,
      horas: demo,
      empresas: demo,
      servicios: demo,
      profesionales: demo,
      embudo: true,
      clientes: demo,
      sedes: demo,
      ultimas: demo,
    },
  };
}
