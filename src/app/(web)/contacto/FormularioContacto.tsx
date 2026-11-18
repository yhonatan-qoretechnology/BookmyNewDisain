"use client";
/* ============================================================
   /contacto — el formulario, con la piel nueva
   ------------------------------------------------------------
   El envío NO cambia: sigue yendo a POST /contacto del backend,
   que comprueba el reCAPTCHA v3 y manda el correo. Lo único que
   cambia son las clases, que pasan de las de la web anterior a
   las del rediseño (.su-form, .su-field, .su-done…).

   Esta página no venía en el paquete del rediseño —el original
   enlazaba a bookmy.es/contacto y ahí se acababa—, así que el
   marcado se arma con las piezas que sí trae el diseño para el
   alta, que es el mismo patrón: una columna que explica y una
   tarjeta con el formulario.
============================================================ */
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useWebT } from "@/components/web/useWebT";
import { ContactoApi } from "@/api/modules";
import { usePrecargaRecaptcha } from "@/lib/recaptcha";
import { FUERA, WEB } from "@/lib/web/rutas";

const texto = (d: FormData, k: string) => String(d.get(k) ?? "").trim() || undefined;
const CORREO = "contacto@bookmy.es";

export default function FormularioContacto() {
  usePrecargaRecaptcha();
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
      await ContactoApi.enviar({
        origen: "contacto",
        nombre: texto(datos, "nombre") ?? "",
        correo: texto(datos, "correo") ?? "",
        telefono: texto(datos, "telefono"),
        motivo: texto(datos, "motivo"),
        mensaje: texto(datos, "mensaje"),
        honey: texto(datos, "_honey"),
      });
      setExito(true);
    } catch {
      /* Si el backend no contesta, el mensaje no se pierde: se le
         ofrece el mismo contenido ya escrito en su propio correo. */
      setError(w("contact.error"));
      const cuerpo = encodeURIComponent(
        `Nombre: ${datos.get("nombre")}\nCorreo: ${datos.get("correo")}\n` +
        `Teléfono: ${datos.get("telefono")}\nMotivo: ${datos.get("motivo")}\n\n${datos.get("mensaje")}`,
      );
      setRespaldo(`mailto:${CORREO}?subject=${encodeURIComponent("Nuevo mensaje de contacto Bookmy")}&body=${cuerpo}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="su" aria-labelledby="su-title">
      <div className="su__aura" aria-hidden />
      <div className="wrap su__grid">
        <div className="su__intro">
          <Link className="ph-hero__back" href={WEB.portada} data-reveal>
            <i className="i i-arrow-right flip" aria-hidden />
            {w("contact.back")}
          </Link>

          <h1 className="h-hero su__title" id="su-title" data-split>
            {w("contact.title1")} <span className="mint">{w("contact.title2")}</span>
          </h1>

          <p className="lead" data-reveal style={{ "--i": 4 } as CSSProperties}>{w("contact.text")}</p>

          <ul className="su__perks" data-reveal style={{ "--i": 5 } as CSSProperties}>
            <li>
              <span className="ib ib--sm"><i className="i i-mail" aria-hidden /></span>
              <span><b>{w("contact.infoEmail")}</b><a href={`mailto:${CORREO}`}>{CORREO}</a></span>
            </li>
            <li>
              <span className="ib ib--sm"><i className="i i-message-circle" aria-hidden /></span>
              <span><b>WhatsApp</b><a href={FUERA.whatsapp} target="_blank" rel="noopener">+34 651 026 700</a></span>
            </li>
            <li>
              <span className="ib ib--sm"><i className="i i-log-in" aria-hidden /></span>
              <span><b>{w("nav.panel")}</b><Link href={WEB.login}>{w("panelAccess.eyebrow")}</Link></span>
            </li>
          </ul>
        </div>

        <div className="su__card" data-reveal="rise" style={{ "--i": 3 } as CSSProperties}>
          {exito ? (
            <div className="su-done" role="status">
              <div className="su-done__ic"><i className="i i-check" aria-hidden /></div>
              <h2 className="h-md">{w("contact.successTitle")}</h2>
              <p>{w("contact.successText")}</p>
              <Link className="btn btn--primary btn--lg su-done__cta" href={WEB.portada}>
                {w("contact.successBack")}
              </Link>
            </div>
          ) : (
            <form className="su-form" onSubmit={enviar} noValidate>
              {/* Trampa para robots: un campo que una persona no ve y no
                  rellena nunca. Si llega con algo, el backend lo descarta. */}
              <input type="text" name="_honey" className="su-hp" tabIndex={-1} autoComplete="off" aria-hidden />

              <div className="su-fields">
                <div className="su-field su-field--full">
                  <label htmlFor="c-nombre">{w("contact.name")}</label>
                  <input className="input" id="c-nombre" type="text" name="nombre" required
                         placeholder={w("contact.namePh")} autoComplete="name" />
                </div>
                <div className="su-field">
                  <label htmlFor="c-correo">{w("contact.email")}</label>
                  <input className="input" id="c-correo" type="email" name="correo" required
                         placeholder={w("contact.emailPh")} autoComplete="email" />
                </div>
                <div className="su-field">
                  <label htmlFor="c-tel">{w("contact.phone")}</label>
                  <input className="input" id="c-tel" type="tel" name="telefono"
                         placeholder={w("contact.phonePh")} autoComplete="tel" />
                </div>
                <div className="su-field su-field--full">
                  <label htmlFor="c-motivo">{w("contact.subject")}</label>
                  <select className="input" id="c-motivo" name="motivo" required defaultValue="">
                    <option value="" disabled>{w("contact.subjectSelect")}</option>
                    <option value="Ventas">{w("contact.subjectSales")}</option>
                    <option value="Soporte tecnico">{w("contact.subjectSupport")}</option>
                    <option value="Facturacion">{w("contact.subjectBilling")}</option>
                    <option value="Otro">{w("contact.subjectOther")}</option>
                  </select>
                </div>
                <div className="su-field su-field--full">
                  <label htmlFor="c-mensaje">{w("contact.message")}</label>
                  <textarea className="input" id="c-mensaje" name="mensaje" rows={5} required
                            placeholder={w("contact.messagePh")} />
                </div>
              </div>

              {error && (
                <p className="su-err" role="alert">
                  {error}{" "}
                  {respaldo && (
                    <a href={respaldo}>{locale === "es" ? "Enviar por correo" : "Send by email"}</a>
                  )}
                </p>
              )}

              <button type="submit" className="btn btn--primary btn--lg btn--block su-submit" disabled={enviando}>
                {enviando ? w("contact.submitting") : w("contact.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
