"use client";
/* ============================================================
   BookingContext — estado global del flujo de creación de reservas
   ------------------------------------------------------------
   Guarda empresa, sede, cliente, profesional, servicio, fecha,
   hora y método de pago durante TODO el flujo. Persistido en
   sessionStorage para que la selección sobreviva a navegaciones
   y recargas.

   SRP: este archivo solo gestiona estado; ninguna llamada HTTP.
   DIP: las vistas dependen de esta abstracción, no de storage.
============================================================ */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BookingDraft, SedeOpcion } from "@/models";

const STORAGE_KEY = "bookmy-booking-draft";

const EMPTY: BookingDraft = {
  empresaId: null,
  empresaNombre: null,
  sedeId: null,
  sedeNombre: null,
  sede: null,
  cliente: null,
  profesional: null,
  servicio: null,
  fecha: null,
  slot: null,
  metodoPago: null,
};

/** Pasos del flujo en orden secuencial (la navegación se valida
    contra este orden: no se puede saltar a un paso incompleto) */
export type BookingStep =
  | "sede" | "cliente" | "profesional" | "servicio" | "fecha" | "hora" | "confirmar";
export const BOOKING_STEPS: BookingStep[] = [
  "sede", "cliente", "profesional", "servicio", "fecha", "hora", "confirmar",
];

interface BookingContextValue {
  draft: BookingDraft;
  /** Selección de contexto empresa+sede (módulo Empresas) */
  setEmpresaSede: (e: { empresaId: string; empresaNombre: string; sedeId: string; sedeNombre: string }) => void;
  /** Selección de sede completa dentro del flujo de reservas */
  setSede: (e: { empresaId: string; empresaNombre: string; sede: SedeOpcion }) => void;
  /** Patch parcial; los pasos posteriores dependientes se invalidan aparte */
  patch: (p: Partial<BookingDraft>) => void;
  /** Selecciones en cascada: cambiar un paso limpia los siguientes */
  setCliente: (c: BookingDraft["cliente"]) => void;
  setProfesional: (p: BookingDraft["profesional"]) => void;
  setServicio: (s: BookingDraft["servicio"]) => void;
  setFecha: (f: string | null) => void;
  setSlot: (s: BookingDraft["slot"]) => void;
  /** Limpia el estado de la reserva (conserva solo la empresa activa) */
  reset: () => void;
  /** Validación secuencial: primer paso incompleto del flujo */
  firstIncompleteStep: () => BookingStep;
  /** ¿Se puede entrar al paso dado? (todo lo anterior completo) */
  canEnter: (step: BookingStep) => boolean;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function load(): BookingDraft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<BookingDraft>) };
  } catch {
    return EMPTY;
  }
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(EMPTY);

  /* Hidratación en cliente (evita mismatch SSR) */
  useEffect(() => { setDraft(load()); }, []);

  /* Persistencia: la tarjeta nunca se guarda en storage */
  useEffect(() => {
    try {
      const { card: _card, ...safe } = draft;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch { /* noop */ }
  }, [draft]);

  const patch = useCallback((p: Partial<BookingDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
  }, []);

  const setEmpresaSede = useCallback((e: { empresaId: string; empresaNombre: string; sedeId: string; sedeNombre: string }) => {
    setDraft((d) => {
      /* Cambiar de sede invalida todo el flujo dependiente */
      const sedeCambio = d.sedeId !== e.sedeId;
      return {
        ...d,
        ...e,
        ...(sedeCambio
          ? { sede: null, cliente: d.cliente, profesional: null, servicio: null, fecha: null, slot: null }
          : {}),
      };
    });
  }, []);

  const setSede = useCallback((e: { empresaId: string; empresaNombre: string; sede: SedeOpcion }) => {
    setDraft((d) => {
      const sedeCambio = d.sedeId !== e.sede.id;
      return {
        ...d,
        empresaId: e.empresaId,
        empresaNombre: e.empresaNombre,
        sedeId: e.sede.id,
        sedeNombre: e.sede.nombre,
        sede: e.sede,
        ...(sedeCambio
          ? { profesional: null, servicio: null, fecha: null, slot: null }
          : {}),
      };
    });
  }, []);

  const setCliente = useCallback((cliente: BookingDraft["cliente"]) => {
    setDraft((d) => ({ ...d, cliente }));
  }, []);

  const setProfesional = useCallback((profesional: BookingDraft["profesional"]) => {
    setDraft((d) =>
      d.profesional?.id === profesional?.id
        ? { ...d, profesional }
        : { ...d, profesional, servicio: null, fecha: null, slot: null }
    );
  }, []);

  const setServicio = useCallback((servicio: BookingDraft["servicio"]) => {
    setDraft((d) =>
      d.servicio?.id === servicio?.id
        ? { ...d, servicio }
        : { ...d, servicio, fecha: null, slot: null }
    );
  }, []);

  const setFecha = useCallback((fecha: string | null) => {
    setDraft((d) => (d.fecha === fecha ? d : { ...d, fecha, slot: null }));
  }, []);

  const setSlot = useCallback((slot: BookingDraft["slot"]) => {
    setDraft((d) => ({ ...d, slot }));
  }, []);

  const reset = useCallback(() => {
    setDraft((d) => ({
      ...EMPTY,
      /* La empresa activa pertenece a Administración de Empresas;
         la sede vuelve a elegirse en el primer paso del flujo */
      empresaId: d.empresaId,
      empresaNombre: d.empresaNombre,
    }));
  }, []);

  const firstIncompleteStep = useCallback((): BookingStep => {
    if (!draft.sedeId) return "sede";
    if (!draft.cliente) return "cliente";
    if (!draft.profesional) return "profesional";
    if (!draft.servicio) return "servicio";
    if (!draft.fecha) return "fecha";
    if (!draft.slot) return "hora";
    return "confirmar";
  }, [draft]);

  const canEnter = useCallback(
    (step: BookingStep) =>
      BOOKING_STEPS.indexOf(step) <= BOOKING_STEPS.indexOf(firstIncompleteStep()),
    [firstIncompleteStep]
  );

  const value = useMemo(
    () => ({ draft, setEmpresaSede, setSede, patch, setCliente, setProfesional, setServicio, setFecha, setSlot, reset, firstIncompleteStep, canEnter }),
    [draft, setEmpresaSede, setSede, patch, setCliente, setProfesional, setServicio, setFecha, setSlot, reset, firstIncompleteStep, canEnter]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking debe usarse dentro de <BookingProvider>");
  return ctx;
}
