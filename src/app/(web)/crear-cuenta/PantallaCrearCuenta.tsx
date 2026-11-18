"use client";
/* ============================================================
   /crear-cuenta — el alta de un negocio, con la piel nueva
   ------------------------------------------------------------
   El envoltorio es el del diseño nuevo (la sección .su con su
   aura, la columna de motivos y la tarjeta); lo de dentro es el
   asistente de alta DE VERDAD, el mismo que ya estaba: elige país
   del catálogo del backend, acepta código de referido y crea el
   negocio contra la API.

   La página del zip no hacía eso: mandaba un correo pidiendo el
   alta, que alguien tendría que atender a mano. Se queda el
   formulario real y se le pone la piel, que es lo que se decidió.

   Por eso aquí no hay ni un campo: todo lo que se escribe está en
   <SignupWizard>, con sus validaciones y sus textos propios.
============================================================ */
import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import SignupWizard from "@/components/web/SignupWizard";
import { useWebT } from "@/components/web/useWebT";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { FUERA, WEB } from "@/lib/web/rutas";
import crearCuentaEs from "@/i18n/dictionaries/web/crearCuenta.es";
import crearCuentaEn from "@/i18n/dictionaries/web/crearCuenta.en";

/** Los tres motivos de la columna izquierda, con su icono. */
const MOTIVOS = [
  { clave: "todo", icono: "i-zap" },
  { clave: "sinTarjeta", icono: "i-shield" },
  { clave: "acompanamos", icono: "i-headphones" },
] as const;

export default function PantallaCrearCuenta() {
  const { locale } = useWebT();
  const t = locale === "en" ? crearCuentaEn : crearCuentaEs;

  const titulo = SE_OFRECE_PRUEBA ? t.tituloConPrueba : t.tituloSinPrueba;
  const lead = SE_OFRECE_PRUEBA ? t.leadConPrueba : t.leadSinPrueba;
  const dias = (s: string) => s.replace("{dias}", String(DIAS_DE_PRUEBA));

  return (
    <section className="su" aria-labelledby="su-title">
      <div className="su__aura" aria-hidden />
      <div className="wrap su__grid">
        <div className="su__intro">
          <Link className="ph-hero__back" href={WEB.planes} data-reveal>
            <i className="i i-arrow-right flip" aria-hidden />
            {t.volver}
          </Link>

          <h1 className="h-hero su__title" id="su-title" data-split>
            {dias(titulo.antes)}{" "}
            <span className="mint"><span className="nw">{dias(titulo.acento)}</span></span>
          </h1>

          <p className="lead" data-reveal style={{ "--i": 4 } as CSSProperties}>{lead}</p>

          <ul className="su__perks" data-reveal style={{ "--i": 5 } as CSSProperties}>
            {MOTIVOS.map((m) => (
              <li key={m.clave}>
                <span className="ib ib--sm"><i className={`i ${m.icono}`} aria-hidden /></span>
                <span><b>{t.motivos[m.clave].titulo}</b>{t.motivos[m.clave].texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="su__card" data-reveal="rise" style={{ "--i": 3 } as CSSProperties}>
          {/* El asistente lee el plan y el código de referido de la URL con
              useSearchParams, y eso necesita un límite de Suspense para que
              la página se pueda generar estática en el build. */}
          <Suspense fallback={null}>
            <SignupWizard />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/** La llamada que cierra la página, encima del pie. */
export function CtaCrearCuenta() {
  const { locale } = useWebT();
  const t = locale === "en" ? crearCuentaEn : crearCuentaEs;

  return (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {t.cta.tituloAntes} <em>{t.cta.tituloAcento}</em>
        </h2>
        <p className="lead" data-reveal>{t.cta.lead}</p>
        <div className="f-cta__actions" data-reveal style={{ "--i": 1 } as CSSProperties}>
          <a className="btn btn--primary btn--lg" href={FUERA.whatsapp} target="_blank" rel="noopener">
            <i className="i i-message-circle" aria-hidden />
            {t.cta.whatsapp}
          </a>
          {/* Sin onClick: lo engancha el asistente por este atributo. */}
          <button className="btn btn--ghost btn--lg" type="button" data-assistant-open>
            {t.cta.asistente}
          </button>
        </div>
      </div>
    </section>
  );
}
