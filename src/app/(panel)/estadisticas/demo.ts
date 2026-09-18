/* ============================================================
   Estadísticas · datos de ejemplo
   ------------------------------------------------------------
   Cifras de relleno para los bloques que todavía no tienen origen
   de datos (el embudo de conversión) o que en esta cuenta salen
   vacíos (una sede recién creada no tiene doce meses de historial).

   Se usan SOLO como respaldo y cada panel que las use se marca en
   pantalla con la etiqueta "datos de ejemplo": el objetivo es que la
   vista se pueda enseñar completa sin hacer pasar por real algo que
   no lo es. Cuando la cuenta tenga datos, cada bloque se rellena solo
   (ver datos.ts) y la etiqueta desaparece.
============================================================ */
import type { EstadoReserva } from "@/models";

/** Meses del eje, terminando en el mes en curso. */
export const MESES_EJE = ["May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"];

export interface PuntoSerie {
  mes: string;
  reservas: number;
  reservasPrev: number;
  ingresos: number;
  ingresosPrev: number;
}

export interface Ranking {
  nombre: string;
  valor: number;
}

export interface FilaProfesional {
  nombre: string;
  reservas: number;
  ingresos: number;
  /** Variación respecto al periodo anterior, en puntos porcentuales. */
  delta: number;
}

export interface FilaReserva {
  empresa: string;
  servicio: string;
  cliente: string;
  fecha: string;
  hora: string;
  importe: number;
  estado: EstadoReserva;
}

export const DEMO_SERIE: PuntoSerie[] = [
  { mes: "May", reservas: 686, reservasPrev: 560, ingresos: 10200, ingresosPrev: 8400 },
  { mes: "Jun", reservas: 1004, reservasPrev: 646, ingresos: 14800, ingresosPrev: 9600 },
  { mes: "Jul", reservas: 986, reservasPrev: 694, ingresos: 14600, ingresosPrev: 10300 },
  { mes: "Ago", reservas: 1032, reservasPrev: 712, ingresos: 15300, ingresosPrev: 10600 },
  { mes: "Sep", reservas: 1284, reservasPrev: 880, ingresos: 19000, ingresosPrev: 13100 },
  { mes: "Oct", reservas: 1156, reservasPrev: 902, ingresos: 17100, ingresosPrev: 13400 },
  { mes: "Nov", reservas: 1198, reservasPrev: 968, ingresos: 17700, ingresosPrev: 14300 },
  { mes: "Dic", reservas: 1344, reservasPrev: 1024, ingresos: 19900, ingresosPrev: 15200 },
  { mes: "Ene", reservas: 1412, reservasPrev: 1102, ingresos: 20900, ingresosPrev: 16300 },
  { mes: "Feb", reservas: 1268, reservasPrev: 1148, ingresos: 18800, ingresosPrev: 17000 },
  { mes: "Mar", reservas: 1396, reservasPrev: 1186, ingresos: 20700, ingresosPrev: 17600 },
  { mes: "Abr", reservas: 1420, reservasPrev: 1204, ingresos: 21000, ingresosPrev: 17800 },
];

export const DEMO = {
  kpis: {
    reservas: 12486,
    ingresos: 184590,
    clientesNuevos: 2148,
    ticketMedio: 14.8,
    cancelacion: 6.4,
    valoracion: 4.7,
  },
  /** Variación frente al periodo anterior, en porcentaje. */
  deltas: {
    reservas: 18.4,
    ingresos: 12.8,
    clientesNuevos: 21.3,
    ticketMedio: 4.7,
    cancelacion: -1.2,
    valoracion: 0,
  },
  serie: DEMO_SERIE,
  estados: [
    { clave: "confirmada" as EstadoReserva, valor: 8924 },
    { clave: "atendida" as EstadoReserva, valor: 2081 },
    { clave: "cancelado" as EstadoReserva, valor: 764 },
    { clave: "noShow" as EstadoReserva, valor: 452 },
    { clave: "pendiente" as EstadoReserva, valor: 265 },
  ],
  porDia: [
    { dia: "lun", confirmadas: 720, completadas: 300, canceladas: 120, noShow: 70 },
    { dia: "mar", confirmadas: 780, completadas: 330, canceladas: 130, noShow: 75 },
    { dia: "mie", confirmadas: 820, completadas: 350, canceladas: 140, noShow: 80 },
    { dia: "jue", confirmadas: 880, completadas: 380, canceladas: 150, noShow: 85 },
    { dia: "vie", confirmadas: 1180, completadas: 470, canceladas: 190, noShow: 110 },
    { dia: "sab", confirmadas: 1320, completadas: 520, canceladas: 210, noShow: 120 },
    { dia: "dom", confirmadas: 640, completadas: 260, canceladas: 110, noShow: 60 },
  ],
  /** Siete franjas de dos horas × siete días (lunes a domingo). */
  horas: [
    [12, 18, 20, 22, 30, 42, 10],
    [28, 34, 38, 40, 52, 68, 18],
    [46, 52, 58, 62, 78, 96, 26],
    [38, 44, 48, 54, 66, 84, 22],
    [58, 66, 72, 78, 92, 118, 30],
    [70, 80, 88, 96, 116, 140, 36],
    [24, 28, 32, 36, 46, 60, 14],
  ],
  empresas: [
    { nombre: "Glow Beauty & Spa", valor: 2842 },
    { nombre: "Hair Studio", valor: 2364 },
    { nombre: "Wellness Center", valor: 1892 },
    { nombre: "Nails & Beauty", valor: 1458 },
    { nombre: "Barber Club", valor: 1203 },
  ] as Ranking[],
  servicios: [
    { nombre: "Manicura Semipermanente", valor: 3124 },
    { nombre: "Pedicura Completa", valor: 2487 },
    { nombre: "Limpieza Facial", valor: 1982 },
    { nombre: "Depilación con Cera", valor: 1764 },
    { nombre: "Masaje Relajante", valor: 1203 },
  ] as Ranking[],
  profesionales: [
    { nombre: "Ana García", reservas: 482, ingresos: 7248, delta: 21.4 },
    { nombre: "Laura Torres", reservas: 415, ingresos: 6532, delta: 19.3 },
    { nombre: "Sofía Martínez", reservas: 378, ingresos: 5986, delta: 17.7 },
    { nombre: "Daniela Ruiz", reservas: 312, ingresos: 4862, delta: 14.4 },
    { nombre: "Cristina López", reservas: 298, ingresos: 4521, delta: 13.3 },
  ] as FilaProfesional[],
  /** Embudo de conversión: no hay analítica de navegación todavía. */
  embudo: [
    { clave: "visitas", valor: 28421 },
    { clave: "busquedas", valor: 18732 },
    { clave: "servicio", valor: 12486 },
    { clave: "reserva", valor: 8924 },
    { clave: "pago", valor: 7842 },
  ],
  clientes: { nuevos: 1452, recurrentes: 696 },
  sedes: [
    { nombre: "Málaga", valor: 4318 },
    { nombre: "Marbella", valor: 2846 },
    { nombre: "Fuengirola", valor: 2364 },
    { nombre: "Benalmádena", valor: 1958 },
  ] as Ranking[],
  ultimas: [
    { empresa: "Glow Beauty & Spa", servicio: "Manicura Semip.", cliente: "Lucía Fernández", fecha: "2026-04-30", hora: "14:32", importe: 28, estado: "confirmada" },
    { empresa: "Hair Studio", servicio: "Corte + Peinado", cliente: "Marta Ruiz", fecha: "2026-04-30", hora: "13:17", importe: 45, estado: "atendida" },
    { empresa: "Wellness Center", servicio: "Masaje Relajante", cliente: "Pablo Gómez", fecha: "2026-04-30", hora: "12:03", importe: 62, estado: "confirmada" },
    { empresa: "Nails & Beauty", servicio: "Pedicura Completa", cliente: "Elena Navarro", fecha: "2026-04-30", hora: "10:48", importe: 38, estado: "cancelado" },
    { empresa: "Barber Club", servicio: "Corte de Cabello", cliente: "Javier Molina", fecha: "2026-04-30", hora: "09:21", importe: 25, estado: "atendida" },
  ] as FilaReserva[],
  /** Serie corta para las mini-gráficas de las tarjetas. */
  sparks: {
    reservas: [42, 48, 45, 52, 58, 55, 62, 68, 66, 72, 78, 84],
    ingresos: [30, 34, 33, 38, 42, 40, 46, 50, 49, 54, 58, 63],
    clientes: [18, 22, 20, 26, 28, 27, 32, 36, 34, 40, 44, 48],
    ticket: [12, 12.4, 12.2, 12.8, 13.1, 13, 13.4, 13.8, 13.6, 14.1, 14.5, 14.8],
    cancelacion: [8.2, 8, 7.8, 7.6, 7.5, 7.2, 7.1, 6.9, 6.8, 6.6, 6.5, 6.4],
    valoracion: [4.3, 4.35, 4.4, 4.38, 4.45, 4.5, 4.52, 4.55, 4.6, 4.62, 4.66, 4.7],
  },
};
