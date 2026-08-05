/* ============================================================
   Zona horaria del negocio — Europe/Madrid
   ------------------------------------------------------------
   El backend valida SIEMPRE en Europe/Madrid (appointment.service.ts
   → APP_TIMEZONE) pero guarda instantes UTC. El panel trabaja en hora
   de Madrid: una cita guardada como 08:00Z se ve y se agenda como las
   10:00, que es la hora real de la sede.

   No se usa un desfase fijo: España alterna CET (+1) y CEST (+2), así
   que el corrimiento se calcula con Intl para la fecha concreta.
============================================================ */

export const APP_TIMEZONE = "Europe/Madrid";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface WallParts {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
}

/** Descompone un instante en su hora de pared de Madrid. */
function madridParts(date: Date): WallParts {
  const raw = Object.fromEntries(
    partsFormatter.formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    /* en-US con hour12:false puede devolver "24" a medianoche */
    hour: Number(raw.hour) % 24,
    minute: Number(raw.minute),
    second: Number(raw.second),
  };
}

/** Minutos que Madrid va por delante de UTC en ese instante (60 o 120). */
export function madridOffsetMinutes(date: Date): number {
  const p = madridParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha "YYYY-MM-DD" del instante, en Madrid. */
export function madridYmd(date: Date): string {
  const p = madridParts(date);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Hora "HH:mm" del instante, en Madrid. */
export function madridHHmm(date: Date): string {
  const p = madridParts(date);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Minutos transcurridos desde medianoche en Madrid. */
export function madridMinutes(date: Date): number {
  const p = madridParts(date);
  return p.hour * 60 + p.minute;
}

/** Día de la semana en Madrid (0 = domingo, como Date.getDay()). */
export function madridDayOfWeek(date: Date): number {
  const p = madridParts(date);
  /* Date.UTC + getUTCDay da el día correcto sin arrastrar la zona local */
  return new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
}

/** Hoy en Madrid, como "YYYY-MM-DD". */
export function madridToday(): string {
  return madridYmd(new Date());
}

/**
 * Convierte una hora de pared de Madrid al instante UTC que le
 * corresponde. Es la operación inversa de madridHHmm y la que se
 * usa para construir lo que se manda al backend.
 *
 * Se resuelve iterando: se parte de tratar la hora como si fuera UTC
 * y se corrige con el desfase vigente en ese instante. La segunda
 * pasada cubre los saltos de horario de verano, donde el desfase del
 * punto de partida y el del resultado difieren.
 *
 * @param ymd Fecha "YYYY-MM-DD" en Madrid.
 * @param minutesOfDay Minutos desde medianoche en Madrid.
 */
export function madridWallToUtc(ymd: string, minutesOfDay: number): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const hour = Math.floor(minutesOfDay / 60);
  const minute = minutesOfDay % 60;
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0);

  let ts = naive;
  for (let i = 0; i < 2; i++) {
    const offset = madridOffsetMinutes(new Date(ts));
    const corrected = naive - offset * 60000;
    if (corrected === ts) break;
    ts = corrected;
  }
  return new Date(ts);
}

/** "HH:mm" → minutos desde medianoche. */
export function minutesOfHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Minutos desde medianoche → "HH:mm". */
export function hhmmOfMinutes(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Normaliza una clave de horario para comparar días.
 * Réplica exacta de AppointmentService.normalizeKey: el JSON de las
 * sedes trae claves inconsistentes ("Jueves", "miércoles", "Sábado").
 */
export function normalizeKey(key: string): string {
  return key.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Índice de Date.getDay() → nombre de día, igual que en el backend. */
export const DAY_NAMES = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
] as const;
