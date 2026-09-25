"use client";
/* ============================================================
   Aviso de cookies.
   La decisión se guarda en localStorage; desde el pie y desde la
   página de cookies se puede volver a abrir para cambiarla.
============================================================ */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useWebT } from "./useWebT";

const CLAVE = "bookmy-cookie-consent";

interface Valor { abrir: () => void }
const Ctx = createContext<Valor>({ abrir: () => {} });
export const useCookieBanner = () => useContext(Ctx);

export function CookieBannerProvider({ children }: { children: React.ReactNode }) {
  const { w } = useWebT();
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    let guardada: string | null = null;
    try { guardada = localStorage.getItem(CLAVE); } catch { /* storage bloqueado */ }
    if (guardada) return;
    const id = window.setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(id);
  }, []);

  const cerrar = useCallback(() => {
    setSaliendo(true);
    setVisible(false);
    window.setTimeout(() => setSaliendo(false), 500);
  }, []);

  const decidir = (valor: string) => {
    try { localStorage.setItem(CLAVE, valor); } catch { /* noop */ }
    cerrar();
  };

  const abrir = useCallback(() => { setSaliendo(false); setVisible(true); }, []);

  return (
    <Ctx.Provider value={{ abrir }}>
      {children}
      <div
        className={`cookie-banner ${visible ? "is-visible" : ""} ${saliendo ? "is-leaving" : ""}`}
        role="dialog"
        aria-live="polite"
        aria-label={w("cookie.title")}
      >
        <div className="cookie-box">
          <span className="cookie-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M12 2.5c.3 1.6 1.7 2.8 3.3 2.7-.3 1.7.9 3.3 2.6 3.5-1 1.3-.9 3.2.3 4.4-1.5.6-2.2 2.3-1.7 3.8C14.9 18 13 19.7 12 21.5 6.8 21.5 2.5 17.2 2.5 12S6.8 2.5 12 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="9" cy="10.5" r="1.1" fill="currentColor" /><circle cx="13.5" cy="14.5" r="1.1" fill="currentColor" /><circle cx="9.5" cy="15.5" r=".9" fill="currentColor" /></svg>
          </span>
          <div className="cookie-copy">
            <h4>{w("cookie.title")}</h4>
            <p>{w("cookie.text")}</p>
          </div>
          <div className="cookie-actions">
            <button className="btn btn-dark btn-small" type="button" onClick={() => decidir("essential-only")}>{w("cookie.reject")}</button>
            <button className="btn btn-primary btn-small" type="button" onClick={() => decidir("accepted")}>{w("cookie.accept")}</button>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
