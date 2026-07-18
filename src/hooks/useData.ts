"use client";
/* ============================================================
   useData — carga de datos asíncrona con recarga
   Un solo patrón para todas las vistas: el fetcher puede venir
   del backend (modo API) o del store en memoria (modo demo);
   la página no distingue el origen.
============================================================ */
import { useCallback, useEffect, useRef, useState } from "react";

export function useData<T>(fetcher: () => Promise<T>, deps: unknown[], initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mySeq === seq.current) setData(result);
    } catch (e) {
      if (mySeq === seq.current) setError(e instanceof Error ? e.message : "Error");
    } finally {
      if (mySeq === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, reload: load };
}
