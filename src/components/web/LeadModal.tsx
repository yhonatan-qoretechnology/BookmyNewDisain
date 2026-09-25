"use client";
/* ============================================================
   Modal de solicitud de plan.
   Igual que el de la web estática: envía a formsubmit.co y, si
   ese servicio falla, ofrece el mismo contenido por correo.
   Se abre desde cualquier botón de plan mediante el contexto.
============================================================ */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useWebT } from "./useWebT";

const ENDPOINT = "https://formsubmit.co/ajax/spartansbikers10@gmail.com";
const CORREO = "spartansbikers10@gmail.com";

interface Valor { abrir: (plan?: string) => void }
const Ctx = createContext<Valor>({ abrir: () => {} });
export const useLeadModal = () => useContext(Ctx);

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
  const { w, locale } = useWebT();
  const [abierto, setAbierto] = useState(false);
  const [plan, setPlan] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correoRespaldo, setCorreoRespaldo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const primeroRef = useRef<HTMLInputElement>(null);

  const abrir = useCallback((nombrePlan?: string) => {
    setPlan(nombrePlan || "");
    setExito(false);
    setError(null);
    setCorreoRespaldo(null);
    formRef.current?.reset();
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => setAbierto(false), []);

  /* Bloquea el fondo y devuelve el foco al formulario mientras está abierto */
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primeroRef.current?.focus();
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", escape);
    };
  }, [abierto, cerrar]);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    setCorreoRespaldo(null);
    const datos = new FormData(e.currentTarget);
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: datos });
      if (!res.ok) throw new Error("network");
      setExito(true);
    } catch {
      setError(w("modal.error"));
      const cuerpo = encodeURIComponent(
        `Nombre: ${datos.get("nombre")}\nCorreo: ${datos.get("correo")}\n` +
        `Teléfono: ${datos.get("telefono")}\nPaís: ${datos.get("pais")}\n` +
        `Tipo de empresa: ${datos.get("tipo_empresa")}\nPlan: ${datos.get("plan")}`
      );
      setCorreoRespaldo(`mailto:${CORREO}?subject=${encodeURIComponent("Nueva solicitud Bookmy")}&body=${cuerpo}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Ctx.Provider value={{ abrir }}>
      {children}

      <div
        className={`modal-overlay ${abierto ? "is-open" : ""}`}
        onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
      >
        <div className="modal-box glass" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <button className="modal-close" onClick={cerrar} aria-label={w("modal.close")} type="button">✕</button>

          <div className={`modal-view modal-view-form ${exito ? "is-hidden" : ""}`}>
            <p className="eyebrow"><span className="eyebrow-dot" />{w("modal.eyebrow")}</p>
            <h3 id="modalTitle">{w("modal.title")}</h3>
            <p className="modal-sub">{w("modal.subtitle")}</p>
            {plan && <p className="modal-plan">{w("modal.planPrefix")} {plan}</p>}

            <form ref={formRef} onSubmit={enviar} noValidate={false}>
              <input type="hidden" name="plan" value={plan} readOnly />
              <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
              <input type="hidden" name="_subject" value="Nueva solicitud Bookmy" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />

              <div className="field">
                <label htmlFor="lead-nombre">{w("modal.name")}</label>
                <input id="lead-nombre" ref={primeroRef} type="text" name="nombre" required placeholder={w("modal.namePh")} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="lead-correo">{w("modal.email")}</label>
                <input id="lead-correo" type="email" name="correo" required placeholder={w("modal.emailPh")} autoComplete="email" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="lead-tel">{w("modal.phone")}</label>
                  <input id="lead-tel" type="tel" name="telefono" required placeholder={w("modal.phonePh")} autoComplete="tel" />
                </div>
                <div className="field">
                  <label htmlFor="lead-pais">{w("modal.country")}</label>
                  <input id="lead-pais" type="text" name="pais" required placeholder={w("modal.countryPh")} autoComplete="country-name" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="lead-tipo">{w("modal.business")}</label>
                <select id="lead-tipo" name="tipo_empresa" required defaultValue="">
                  <option value="" disabled>{w("modal.selectOpt")}</option>
                  <option value="Salud">{w("modal.optHealth")}</option>
                  <option value="Estetica">{w("modal.optAesthetics")}</option>
                  <option value="Construccion">{w("modal.optConstruction")}</option>
                  <option value="Tecnologia">{w("modal.optTech")}</option>
                  <option value="Servicios">{w("modal.optServices")}</option>
                  <option value="Otros">{w("modal.optOther")}</option>
                </select>
              </div>

              <button type="submit" className={`btn btn-primary btn-block ${enviando ? "is-loading" : ""}`} disabled={enviando}>
                <span className="btn-text">{w("modal.submit")}</span>
                <span className="btn-spinner" aria-hidden />
              </button>

              {error && (
                <p className="modal-error is-visible" role="alert">
                  {error}{" "}
                  {correoRespaldo && (
                    <a href={correoRespaldo} className="modal-error-link">
                      {locale === "es" ? "Enviar por correo" : "Send by email"}
                    </a>
                  )}
                </p>
              )}
            </form>
          </div>

          <div className={`modal-view modal-view-success ${exito ? "is-active" : ""}`}>
            <div className="success-check">
              <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" /><path className="check-path" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M15 27l7 7 16-16" /></svg>
            </div>
            <h3>{w("modal.successTitle")}</h3>
            <p>{w("modal.successText")}</p>
            <button className="btn btn-dark btn-block" onClick={cerrar} type="button">{w("modal.close")}</button>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
