"use client";
/* ============================================================
   Contacto — mismo formulario que la web estática (formsubmit.co)
   con estados de envío, error con alternativa por correo y aviso
   de éxito accesible.
============================================================ */
import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/web/Reveal";
import { useWebT } from "@/components/web/useWebT";

const ENDPOINT = "https://formsubmit.co/ajax/spartansbikers10@gmail.com";
const CORREO = "spartansbikers10@gmail.com";

export default function ContactoPage() {
  const { w, locale } = useWebT();
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respaldo, setRespaldo] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    setRespaldo(null);
    const datos = new FormData(e.currentTarget);
    try {
      const res = await fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: datos });
      if (!res.ok) throw new Error("network");
      setExito(true);
    } catch {
      setError(w("contact.error"));
      const cuerpo = encodeURIComponent(
        `Nombre: ${datos.get("nombre")}\nCorreo: ${datos.get("correo")}\n` +
        `Teléfono: ${datos.get("telefono")}\nMotivo: ${datos.get("motivo")}\n\n${datos.get("mensaje")}`
      );
      setRespaldo(`mailto:${CORREO}?subject=${encodeURIComponent("Nuevo mensaje de contacto Bookmy")}&body=${cuerpo}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <section className="contact-hero">
        <div className="container">
          <Link href="/" className="contact-back-link">{w("contact.back")}</Link>
          <Reveal as="p" className="eyebrow"><span className="eyebrow-dot" />{w("contact.eyebrow")}</Reveal>
          <Reveal as="h1" className="contact-title">
            <span className="t-white">{w("contact.title1")}</span>{" "}
            <span className="t-accent">{w("contact.title2")}</span>
          </Reveal>
          <Reveal as="p" className="contact-text">{w("contact.text")}</Reveal>
        </div>
      </section>

      <section className="contact-section" id="contactFormSection">
        <div className="container contact-grid">
          {exito ? (
            <div id="contactSuccessWrap" className="contact-form-card contact-success-card glass is-active" role="status">
              <div className="success-check">
                <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2.5" /><path className="check-path" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" d="M15 27l7 7 16-16" /></svg>
              </div>
              <h2>{w("contact.successTitle")}</h2>
              <p>{w("contact.successText")}</p>
              <Link href="/" className="btn btn-dark btn-block">{w("contact.successBack")}</Link>
            </div>
          ) : (
            <Reveal className="contact-form-card glass">
              <h2>{w("contact.formTitle")}</h2>
              <form onSubmit={enviar}>
                <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                <input type="hidden" name="_subject" value="Nuevo mensaje de contacto Bookmy" />
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_template" value="table" />

                <div className="field">
                  <label htmlFor="c-nombre">{w("contact.name")}</label>
                  <input id="c-nombre" type="text" name="nombre" required placeholder={w("contact.namePh")} autoComplete="name" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="c-correo">{w("contact.email")}</label>
                    <input id="c-correo" type="email" name="correo" required placeholder={w("contact.emailPh")} autoComplete="email" />
                  </div>
                  <div className="field">
                    <label htmlFor="c-tel">{w("contact.phone")}</label>
                    <input id="c-tel" type="tel" name="telefono" placeholder={w("contact.phonePh")} autoComplete="tel" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-motivo">{w("contact.subject")}</label>
                  <select id="c-motivo" name="motivo" required defaultValue="">
                    <option value="" disabled>{w("contact.subjectSelect")}</option>
                    <option value="Ventas">{w("contact.subjectSales")}</option>
                    <option value="Soporte tecnico">{w("contact.subjectSupport")}</option>
                    <option value="Facturacion">{w("contact.subjectBilling")}</option>
                    <option value="Otro">{w("contact.subjectOther")}</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="c-mensaje">{w("contact.message")}</label>
                  <textarea id="c-mensaje" name="mensaje" rows={5} required placeholder={w("contact.messagePh")} />
                </div>

                <button type="submit" className={`btn btn-primary btn-block ${enviando ? "is-loading" : ""}`} disabled={enviando}>
                  <span className="btn-text">{w("contact.submit")}</span>
                  <span className="btn-spinner" aria-hidden />
                </button>

                {error && (
                  <p className="modal-error is-visible" role="alert">
                    {error}{" "}
                    {respaldo && (
                      <a href={respaldo} className="modal-error-link">
                        {locale === "es" ? "Enviar por correo" : "Send by email"}
                      </a>
                    )}
                  </p>
                )}
              </form>
            </Reveal>
          )}

          <Reveal as="aside" className="contact-info-card glass">
            <h3>{w("contact.infoTitle")}</h3>
            <a className="contact-info-row" href={`mailto:${CORREO}`}>
              <span className="contact-info-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M4 6.5l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span>
                <strong>{w("contact.infoEmail")}</strong>
                <small>{CORREO}</small>
              </span>
            </a>
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden><path d="M12 21s-7-4.6-9.6-9.1C.7 8.6 2 5 5.4 4.3 7.7 3.9 10 5 12 7c2-2 4.3-3.1 6.6-2.7C22 5 23.3 8.6 21.6 11.9 19 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
              </span>
              <span>
                <strong>{w("contact.infoSocial")}</strong>
                <span className="social-row contact-social-row">
                  <a href="https://www.facebook.com/appbookmy" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden><path d="M14 9h2.5V6H14c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.2l.8-3H14V9.4c0-.2.2-.4.4-.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg></a>
                  <a href="https://www.instagram.com/appbookmy/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.3" /><circle cx="17" cy="7" r="0.9" fill="currentColor" /></svg></a>
                </span>
              </span>
            </div>
            <Link className="contact-info-row" href="/login">
              <span className="contact-info-icon">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden><path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <span>
                <strong>{w("nav.panel")}</strong>
                <small>{w("panelAccess.eyebrow")}</small>
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
