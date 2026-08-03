/* ============================================================
   Disponibilidad — réplica de las reglas del backend
   ------------------------------------------------------------
   appointment.service.ts valida cada cita (al crear y al reagendar)
   contra cuatro cosas, en este orden. Este módulo reproduce las
   mismas reglas para que el panel solo ofrezca franjas que el
   backend vaya a aceptar:

     1. Horario de la sede    tabla horario_sede → si no hay, JSON sede.horario
     2. Días cerrados         tabla dias_cerrados_sede → si no hay, JSON sede.diasCerrado
     3. Disponibilidad del profesional (tabla, por fecha)
     4. Solapamiento con otras citas del profesional

   Todo se calcula en minutos desde medianoche EN HORA DE MADRID,
   que es como valida el backend (APP_TIMEZONE).

   ⚠️ Deuda consciente: esta lógica está duplicada del backend. Si allí
   cambian las reglas, aquí hay que replicarlo. La alternativa correcta
   es un endpoint de franjas libres en el servidor, pero eso exige
   tocar el backend.
============================================================ */
import type {
  ApiDiaCerradoSede, ApiDisponibilidadProfesional, ApiHorarioSede, ApiSede,
} from "@/api/types";
import {
  DAY_NAMES, hhmmOfMinutes, madridMinutes, madridWallToUtc, madridYmd,
  minutesOfHHmm, normalizeKey,
} from "./timezone";

export interface Rango {
  /** minutos desde medianoche (hora de Madrid) */
  start: number;
  end: number;
}

/**
 * Interpreta una entrada del JSON `sede.horario`.
 * Réplica de AppointmentService.parseScheduleRanges: admite varios
 * tramos separados por espacios ("09:00-14:00 16:00-20:00") y trata
 * "Cerrado" (en cualquier capitalización) como sin horario.
 */
export function parseScheduleRanges(entry?: string | null): Rango[] {
  if (!entry) return [];
  const trimmed = entry.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.toLowerCase() === "cerrado") return [];

  return trimmed.split(" ").reduce<Rango[]>((acc, tramo) => {
    const [start, end] = tramo.split("-");
    if (!start || !end) return acc;
    const s = minutesOfHHmm(start);
    const e = minutesOfHHmm(end);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return acc;
    acc.push({ start: s, end: e });
    return acc;
  }, []);
}

/**
 * Horario operativo de la sede para un día de la semana.
 * Precedencia idéntica a la del backend: manda la tabla `horario_sede`
 * y, si no hay fila activa para ese día, se lee el JSON de la sede
 * buscando la clave por nombre de día sin acentos ni mayúsculas.
 *
 * @param diaSemana 0 = domingo … 6 = sábado.
 */
export function resolverHorario(
  sede: Pick<ApiSede, "horario">,
  horarios: ApiHorarioSede[],
  diaSemana: number,
): Rango[] {
  const registro = horarios.find((h) => h.diaSemana === diaSemana && h.activo);
  if (registro) {
    const start = minutesOfHHmm(registro.horaApertura);
    const end = minutesOfHHmm(registro.horaCierre);
    return end > start ? [{ start, end }] : [];
  }

  if (sede.horario && typeof sede.horario === "object") {
    const objetivo = normalizeKey(DAY_NAMES[diaSemana]);
    const entrada = Object.entries(sede.horario as Record<string, string | null>)
      .find(([clave]) => normalizeKey(clave) === objetivo)?.[1];
    return parseScheduleRanges(entrada ?? undefined);
  }

  return [];
}

interface CierreNormalizado {
  /** "YYYY-MM-DD" en Madrid */
  dia: string;
  todoElDia: boolean;
  inicio: number | null;
  fin: number | null;
}

/**
 * Cierres de la sede, con la misma precedencia que el backend.
 * El JSON `sede.diasCerrado` contiene datos sucios en producción
 * (p. ej. ["string"]); las fechas no interpretables se descartan,
 * igual que hace el backend con su guarda de NaN.
 */
export function resolverCierres(
  sede: Pick<ApiSede, "diasCerrado">,
  registros: ApiDiaCerradoSede[],
): CierreNormalizado[] {
  if (registros.length) {
    return registros.reduce<CierreNormalizado[]>((acc, r) => {
      const d = new Date(r.fecha);
      if (Number.isNaN(d.getTime())) return acc;
      acc.push({
        dia: madridYmd(d),
        todoElDia: r.todoElDia ?? true,
        inicio: r.horaInicio ? minutesOfHHmm(r.horaInicio) : null,
        fin: r.horaFin ? minutesOfHHmm(r.horaFin) : null,
      });
      return acc;
    }, []);
  }

  const json = Array.isArray(sede.diasCerrado) ? sede.diasCerrado : [];
  return json.reduce<CierreNormalizado[]>((acc, valor) => {
    const d = new Date(`${valor}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return acc;
    acc.push({ dia: madridYmd(d), todoElDia: true, inicio: null, fin: null });
    return acc;
  }, []);
}

export interface Ocupacion { start: number; end: number }

export interface OpcionesSlots {
  /** "YYYY-MM-DD" en Madrid */
  fecha: string;
  duracionMin: number;
  horarios: Rango[];
  cierres: CierreNormalizado[];
  /** Fila de disponibilidad del profesional para esa fecha, si existe */
  disponibilidad?: ApiDisponibilidadProfesional | null;
  /** Citas ya ocupadas ese día, en minutos de Madrid */
  ocupadas: Ocupacion[];
  /** Instante actual, para descartar franjas pasadas */
  ahora?: Date;
}

export interface Slot {
  /** "HH:mm" en hora de Madrid — lo que ve el usuario */
  hora: string;
  /** Instante real en UTC — lo que se manda al backend */
  inicioISO: string;
  finISO: string;
}

const solapan = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && aEnd > bStart;

/**
 * Franjas libres de un día concreto.
 *
 * Nota sobre el borde superior: el backend acepta que una cita empiece
 * justo a la hora de cierre (usa `range.end + duracion` como tope), lo
 * que permitiría reservar a las 19:00 en una sede que cierra a las
 * 19:00. Aquí se aplica el criterio estricto (la cita debe terminar
 * dentro del horario), que además de correcto nunca ofrece una franja
 * que el backend fuese a rechazar.
 */
export function construirSlots(o: OpcionesSlots): Slot[] {
  const { fecha, duracionMin, horarios, cierres, disponibilidad, ocupadas } = o;
  if (duracionMin <= 0 || horarios.length === 0) return [];

  /* Cierre total del día → sin franjas */
  const cierresDelDia = cierres.filter((c) => c.dia === fecha);
  if (cierresDelDia.some((c) => c.todoElDia)) return [];

  /* El profesional marcado como no disponible ese día */
  if (disponibilidad && !disponibilidad.disponible) return [];

  /* Ventana propia del profesional, si la tiene acotada */
  const ventana =
    disponibilidad?.horaInicio && disponibilidad?.horaFin
      ? {
          start: minutesOfHHmm(disponibilidad.horaInicio),
          end: minutesOfHHmm(disponibilidad.horaFin),
        }
      : null;

  const ahora = o.ahora ?? new Date();
  const slots: Slot[] = [];

  for (const rango of horarios) {
    for (let t = rango.start; t + duracionMin <= rango.end; t += duracionMin) {
      const fin = t + duracionMin;

      if (ventana && (t < ventana.start || fin > ventana.end)) continue;

      const chocaConCierre = cierresDelDia.some(
        (c) => c.inicio != null && c.fin != null && solapan(t, fin, c.inicio, c.fin)
      );
      if (chocaConCierre) continue;

      if (ocupadas.some((oc) => solapan(t, fin, oc.start, oc.end))) continue;

      /* Descartar el pasado comparando instantes reales, no horas sueltas */
      const inicioUtc = madridWallToUtc(fecha, t);
      if (inicioUtc.getTime() <= ahora.getTime()) continue;

      slots.push({
        hora: hhmmOfMinutes(t),
        inicioISO: inicioUtc.toISOString(),
        finISO: madridWallToUtc(fecha, fin).toISOString(),
      });
    }
  }

  return slots;
}

/** Minutos de Madrid ocupados por una cita ya existente. */
export function ocupacionDeCita(horaInicio: string, horaFin: string): Ocupacion {
  return {
    start: madridMinutes(new Date(horaInicio)),
    end: madridMinutes(new Date(horaFin)),
  };
}
