"use client";
/* ============================================================
   Pie de la web pública
   ------------------------------------------------------------
   Dos pies, uno por mundo. Lo único que cambia de una página a
   otra dentro del mismo mundo es la llamada a la acción de
   arriba, así que va por `cta`: cada página pasa la suya y, si no
   pasa ninguna, se usa la del mundo.

   Los botones con data-cookie-settings y data-assistant-open no
   llevan onClick: los engancha el aviso de cookies y el asistente
   respectivamente, igual que hacían en la web estática. Así el pie
   no necesita conocer a ninguno de los dos.
============================================================ */
import Link from "next/link";
import type { ReactNode } from "react";
import { useWebT } from "./useWebT";
import Marca from "./Marca";
import { FUERA, WEB, type Mundo } from "@/lib/web/rutas";
import { CLAVE_CTA, DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";

/** Las tres formas de llevarse la app, que cierran el mundo APP. */
export function Tiendas({ centradas = false }: { centradas?: boolean }) {
  const { w } = useWebT();
  return (
    <div className={`stores ${centradas ? "stores--center" : ""}`}>
      <a className="store store--solid" href={FUERA.googlePlay} target="_blank" rel="noopener">
        <i className="i i-play" aria-hidden />
        <span><small>{w("comun.tiendas.disponibleEn")}</small><b>{w("comun.pie.googlePlay")}</b></span>
      </a>
      <a className="store" href={FUERA.appStore} target="_blank" rel="noopener">
        <i className="i i-smartphone" aria-hidden />
        <span><small>{w("comun.tiendas.descargalaEn")}</small><b>{w("comun.pie.appStore")}</b></span>
      </a>
      <a className="store store--apk" href={FUERA.apk} download type="application/vnd.android.package-archive">
        <i className="i i-download" aria-hidden />
        <span><small>{w("comun.tiendas.archivoAndroid")}</small><b>{w("comun.tiendas.descargarApk")}</b></span>
      </a>
    </div>
  );
}

export default function SiteFooter({ mundo, cta }: { mundo: Mundo; cta?: ReactNode }) {
  const { w } = useWebT();
  /* El año se pinta aquí y no lo escribe el motor: en el servidor y en
     el cliente es el mismo número, así que no hay desajuste al hidratar
     y la página no enseña un hueco mientras arranca el JavaScript. */
  const anio = new Date().getFullYear();

  return (
    <footer className={`site-footer site-footer--${mundo}`}>
      {cta}

      <div className="wrap f-grid">
        <div className="f-brand">
          <Marca mundo={mundo} etiqueta={w("comun.marca.alt")} />
          <p>{mundo === "app" ? w("comun.pie.appDescripcion") : w("comun.pie.crmDescripcion")}</p>
          <div className="f-social">
            <a href={FUERA.instagram} target="_blank" rel="noopener">Instagram <i className="i i-arrow-up-right" aria-hidden /></a>
            <a href={FUERA.facebook} target="_blank" rel="noopener">Facebook <i className="i i-arrow-up-right" aria-hidden /></a>
            <a href={FUERA.whatsapp} target="_blank" rel="noopener">WhatsApp <i className="i i-arrow-up-right" aria-hidden /></a>
          </div>
        </div>

        {mundo === "app" ? (
          <>
            <div className="f-col">
              <h3>{w("comun.pie.columnaApp")}</h3>
              <ul>
                <li><Link href={WEB.app}>{w("comun.nav.personas")}</Link></li>
                <li><Link href={WEB.appEmpresas}>{w("comun.nav.empresas")}</Link></li>
                <li><Link href={`${WEB.app}#pasos`}>{w("comun.nav.comoReservar")}</Link></li>
                <li><Link href={`${WEB.app}#faq`}>{w("comun.nav.preguntas")}</Link></li>
              </ul>
            </div>
            <div className="f-col">
              <h3>{w("comun.pie.columnaDescargar")}</h3>
              <ul>
                <li><a href={FUERA.googlePlay} target="_blank" rel="noopener">{w("comun.pie.googlePlay")}</a></li>
                <li><a href={FUERA.appStore} target="_blank" rel="noopener">{w("comun.pie.appStore")}</a></li>
                <li><a href={FUERA.apk} download>{w("comun.pie.apk")}</a></li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="f-col">
              <h3>{w("comun.pie.columnaCrm")}</h3>
              <ul>
                <li><Link href={WEB.crm}>{w("comun.nav.elCrm")}</Link></li>
                <li><Link href={WEB.comoFunciona}>{w("comun.nav.comoFunciona")}</Link></li>
                <li><Link href={WEB.asistenteIa}>{w("comun.nav.asistenteIa")}</Link></li>
                <li><Link href={WEB.calculadora}>{w("comun.nav.calculadora")}</Link></li>
              </ul>
            </div>
            <div className="f-col">
              <h3>{w("comun.nav.planes")}</h3>
              <ul>
                <li><Link href={WEB.planBasic}>{w("comun.nav.planBasic")}</Link></li>
                <li><Link href={WEB.planPro}>{w("comun.nav.planPro")}</Link></li>
                <li><Link href={WEB.planes}>{w("comun.nav.compararPlanes")}</Link></li>
                <li><Link href={WEB.crearCuenta}>{w(CLAVE_CTA)}</Link></li>
              </ul>
            </div>
          </>
        )}

        <div className="f-col">
          <h3>{w("comun.pie.derechos")}</h3>
          <ul>
            <li><Link href={WEB.quienesSomos}>{w("comun.nav.quienesSomos")}</Link></li>
            <li><Link href={WEB.contacto}>{w("comun.nav.contacto")}</Link></li>
            <li><Link href={WEB.privacidad}>{w("comun.pie.privacidad")}</Link></li>
            <li><Link href={WEB.cookies}>{w("comun.pie.cookies")}</Link></li>
            <li><button type="button" data-cookie-settings>{w("comun.pie.configurarCookies")}</button></li>
          </ul>
        </div>

        {/* El mundo app invita al CRM y el CRM invita a la app: cada uno
            enseña la puerta del otro, que es de lo que iba el portal. */}
        {mundo === "app" ? (
          <div className="f-biz t-crm">
            <h3>{w("comun.pie.negocioTitulo")}</h3>
            <p>{w(SE_OFRECE_PRUEBA ? "comun.pie.negocioTexto" : "comun.pie.negocioTextoSinPrueba", { dias: DIAS_DE_PRUEBA })}</p>
            <Link className="btn btn--primary btn--sm" href={WEB.crm}>
              {w("comun.pie.negocioCta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="f-biz t-app">
            <h3>{w("comun.pie.appTitulo")}</h3>
            <p>{w("comun.pie.appTexto")}</p>
            <Link className="btn btn--primary btn--sm" href={WEB.app}>
              {w("comun.pie.appCta")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          </div>
        )}
      </div>

      <div className="wrap f-bottom">
        <p>© <span data-year>{anio}</span> {w("comun.pie.copyright")}</p>
        <p>
          <a href="mailto:contacto@bookmy.es">contacto@bookmy.es</a>
          {" · "}
          <button type="button" data-assistant-open>{w("comun.pie.hablarAsistente")}</button>
          {" · "}
          {mundo === "app" ? (
            <Link className="t-crm f-switch" href={WEB.crm}>
              {w("comun.pie.cambiarACrm")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          ) : (
            <Link className="t-app f-switch" href={WEB.app}>
              {w("comun.pie.cambiarAApp")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          )}
        </p>
      </div>

      <div className="f-word" aria-hidden>bookmy</div>
    </footer>
  );
}
