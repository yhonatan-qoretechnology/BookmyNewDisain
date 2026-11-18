"use client";
/* ============================================================
   «Cómo funciona» · el cuerpo de la pantalla
   ------------------------------------------------------------
   Viene de como-funciona.html de la web nueva. El marcado es el
   mismo del original, clase por clase y atributo por atributo:
   data-scene="tunnel" y data-scene="hscroll" son las dos escenas
   fijadas de esta página, data-tabs las pestañas de «para quién»,
   .faq el acordeón de preguntas y data-split / data-reveal /
   data-tilt la aparición de cada bloque. De todos ellos vive
   src/lib/web/motor.ts, que es quien los mueve: si se les cambia
   el nombre, la página se queda quieta.

   Las variables en línea (--k, --i, --v, --h) también son del
   original y también son del motor o del CSS: marcan el orden y
   el sitio de cada cosa, no son decoración.

   Está en un componente de cliente porque los textos salen del
   hook useWebT y la escena necesita el navegador. El page.tsx de
   al lado es de servidor y solo pone los metadatos.
============================================================ */
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import PaginaWeb from "@/components/web/PaginaWeb";
import { useWebT } from "@/components/web/useWebT";
import { WEB } from "@/lib/web/rutas";
import { DIAS_DE_PRUEBA, SE_OFRECE_PRUEBA } from "@/lib/web/oferta";
import { formatearDinero, pais, paisProbable } from "@/lib/web/money";

/* TypeScript no admite propiedades personalizadas dentro de `style`,
   así que el molde se hace aquí una vez y no cuarenta veces abajo. */
const estilo = (v: Record<string, string | number>): CSSProperties => v as CSSProperties;

/* Las tarjetas que se repiten con la misma forma: su clave en el
   diccionario y el icono de icons.css que llevan delante. */
const CLIENTES = [
  { clave: "cli1", icono: "i-smartphone" },
  { clave: "cli2", icono: "i-user-plus" },
  { clave: "cli3", icono: "i-calendar-clock" },
  { clave: "cli4", icono: "i-wallet" },
  { clave: "cli5", icono: "i-badge-check" },
];

const EQUIPO = [
  { clave: "eq1", icono: "i-calendar" },
  { clave: "eq2", icono: "i-id-card" },
  { clave: "eq3", icono: "i-shield" },
  { clave: "eq4", icono: "i-bell" },
];

const TU = [
  { clave: "tu1", icono: "i-grid" },
  { clave: "tu2", icono: "i-map-pin" },
  { clave: "tu3", icono: "i-receipt" },
  { clave: "tu4", icono: "i-sparkles" },
];

const SEGURIDAD = [
  { clave: "seg1", icono: "i-lock" },
  { clave: "seg2", icono: "i-shield" },
  { clave: "seg3", icono: "i-credit-card" },
  { clave: "seg4", icono: "i-badge-check" },
  { clave: "seg5", icono: "i-cloud" },
  { clave: "seg6", icono: "i-globe" },
];

/* Las siete horas del día; la octava tarjeta («Mañana») es distinta
   y va escrita aparte, que lleva su propio botón. */
const HORAS = [1, 2, 3, 4, 5, 6, 7];

export default function ComoFunciona() {
  const { w } = useWebT();

  /* Los precios de ejemplo del segundo paso salen de money.ts, para
     que quien entra desde Bogotá vea pesos y no euros. Se adivina al
     montar y no durante el render: en el servidor no hay navegador,
     así que el HTML saldría con España y el del cliente con otra
     cosa, y React se quejaría de que no coinciden. */
  const [codigoPais, setCodigoPais] = useState("es");
  useEffect(() => {
    setCodigoPais(paisProbable());
  }, []);
  const [precioBajo, precioMedio] = pais(codigoPais).chips;

  /* La promesa de la prueba gratuita está apagada mientras el backend
     no la conceda y los cobros no funcionen (src/lib/web/oferta.ts).
     Cada frase que la mencionaba tiene dos versiones y aquí se elige
     una: los días nunca van escritos, los pone DIAS_DE_PRUEBA. */
  const segunOferta = (conPrueba: string, sinPrueba: string) =>
    SE_OFRECE_PRUEBA ? w(conPrueba, { dias: DIAS_DE_PRUEBA }) : w(sinPrueba);

  const textoCta = segunOferta("comoFunciona.ctaConPrueba", "comoFunciona.ctaSinPrueba");

  /* La llamada a la acción que corona el pie: la pone <PaginaWeb>. */
  const cta = (
    <section className="f-cta" aria-labelledby="f-cta-title">
      <div className="wrap">
        <h2 className="f-cta__title" id="f-cta-title" data-split>
          {w("comoFunciona.ctaTitulo")} <em>{w("comoFunciona.ctaTituloEm")}</em>
        </h2>
        <p className="lead" data-reveal>
          {segunOferta("comoFunciona.ctaLeadConPrueba", "comoFunciona.ctaLeadSinPrueba")}
        </p>
        <div className="f-cta__actions" data-reveal style={estilo({ "--i": 1 })}>
          <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
            {textoCta} <i className="i i-arrow-right" aria-hidden />
          </Link>
          <Link className="btn btn--ghost btn--lg" href={WEB.planes}>
            {w("comoFunciona.ctaPlanes")}
          </Link>
        </div>
      </div>
    </section>
  );

  return (
    <PaginaWeb mundo="crm" pagina="como-funciona" cta={cta}>
      {/* ── Héroe ─────────────────────────────────────────────── */}
      <section className="cf-hero" aria-labelledby="cf-title">
        <div className="cf-hero__tunnel" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <span key={k} style={estilo({ "--k": k })} />
          ))}
        </div>
        <div className="wrap cf-hero__copy">
          <h1 className="h-hero cf-hero__title" id="cf-title" data-split>
            {w("comoFunciona.heroTitulo")} <span className="mint">{w("comoFunciona.heroTituloMint")}</span>
          </h1>
          <p className="lead" data-reveal style={estilo({ "--i": 4 })}>
            {w("comoFunciona.heroLead")}
          </p>
          <div className="cf-hero__cta" data-reveal style={estilo({ "--i": 5 })}>
            <Link className="btn btn--primary btn--lg" href={WEB.crearCuenta}>
              {textoCta} <i className="i i-arrow-right" aria-hidden />
            </Link>
            <button
              className="btn btn--ghost btn--lg"
              type="button"
              data-assistant-ask={w("comoFunciona.heroAsistentePregunta")}
            >
              {w("comoFunciona.heroAsistente")}
            </button>
          </div>
          <span className="cf-hero__hint" aria-hidden>
            <i className="i i-chevron-down" aria-hidden />
          </span>
        </div>
      </section>

      {/* ── El túnel: cinco pasos que vienen hacia ti ─────────── */}
      <section className="tun" data-scene="tunnel" data-gap="1700" aria-label={w("comoFunciona.tunelAria")}>
        <div className="tun__stick">
          <div className="tun__world">
            {[0.5, 1.5, 2.5, 3.5, 4.5].map((k) => (
              <span className="tun__frame" key={k} style={estilo({ "--k": k })} aria-hidden />
            ))}

            {/* Paso 1 · crea tu cuenta */}
            <article className="tun__panel" style={estilo({ "--k": 0 })}>
              <div className="tun__txt">
                <span className="tun__ic" aria-hidden><i className="i i-user-plus" aria-hidden /></span>
                <h2 className="h-lg">{w("comoFunciona.paso1Titulo")}</h2>
                <p>{segunOferta("comoFunciona.paso1ConPrueba", "comoFunciona.paso1SinPrueba")}</p>
              </div>
              <div className="frag tun__ui" aria-hidden>
                <div className="form-mock">
                  <label>
                    {w("comoFunciona.paso1CampoNegocio")}
                    <span>{w("comoFunciona.paso1Negocio")}</span>
                  </label>
                  <label>
                    {w("comoFunciona.paso1CampoTipo")}
                    <span>{w("comoFunciona.paso1Tipo")}</span>
                  </label>
                  <p className="form-mock__check">
                    <i className="i i-check" aria-hidden />
                    {segunOferta("comoFunciona.paso1CheckConPrueba", "comoFunciona.paso1CheckSinPrueba")}
                  </p>
                  <span className="btn btn--primary btn--block">{w("comoFunciona.paso1Boton")}</span>
                </div>
              </div>
            </article>

            {/* Paso 2 · servicios, equipo y sedes */}
            <article className="tun__panel" style={estilo({ "--k": 1 })}>
              <div className="tun__txt">
                <span className="tun__ic" aria-hidden><i className="i i-sliders" aria-hidden /></span>
                <h2 className="h-lg">{w("comoFunciona.paso2Titulo")}</h2>
                <p>{w("comoFunciona.paso2Texto")}</p>
              </div>
              <div className="frag tun__ui" aria-hidden>
                <div className="inv">
                  <div className="inv__row">
                    <span>
                      {w("comoFunciona.paso2Servicio1")}
                      <small>{w("comoFunciona.paso2Servicio1Detalle")}</small>
                    </span>
                    <b>{formatearDinero(precioBajo, codigoPais)}</b>
                    <span className="tag">{w("comoFunciona.paso2Activo")}</span>
                  </div>
                  <div className="inv__row">
                    <span>
                      {w("comoFunciona.paso2Servicio2")}
                      <small>{w("comoFunciona.paso2Servicio2Detalle")}</small>
                    </span>
                    <b>{formatearDinero(precioMedio, codigoPais)}</b>
                    <span className="tag">{w("comoFunciona.paso2Activo")}</span>
                  </div>
                </div>
                <div className="team" style={{ marginTop: 12 }}>
                  <span>
                    <span className="av">{w("comoFunciona.paso2Persona1Inicial")}</span>
                    {w("comoFunciona.paso2Persona1")} <small>{w("comoFunciona.paso2Persona1Horario")}</small>
                  </span>
                  <span>
                    <span className="av av--2">{w("comoFunciona.paso2Persona2Inicial")}</span>
                    {w("comoFunciona.paso2Persona2")} <small>{w("comoFunciona.paso2Persona2Horario")}</small>
                  </span>
                </div>
                <ul className="sedes" style={{ marginTop: 12 }}>
                  <li className="is-on">
                    <i className="i i-map-pin" aria-hidden />
                    <b>{w("comoFunciona.paso2Sede1")}</b>
                    <small>{w("comoFunciona.paso2Sede1Nota")}</small>
                  </li>
                  <li>
                    <i className="i i-map-pin" aria-hidden />
                    <b>{w("comoFunciona.paso2Sede2")}</b>
                    <small>{w("comoFunciona.paso2Sede2Nota")}</small>
                  </li>
                </ul>
              </div>
            </article>

            {/* Paso 3 · comparte tu perfil */}
            <article className="tun__panel" style={estilo({ "--k": 2 })}>
              <div className="tun__txt">
                <span className="tun__ic" aria-hidden><i className="i i-send" aria-hidden /></span>
                <h2 className="h-lg">{w("comoFunciona.paso3Titulo")}</h2>
                <p>{w("comoFunciona.paso3Texto")}</p>
              </div>
              <div className="frag tun__ui" aria-hidden>
                <div className="linkbox">
                  <i className="i i-link" aria-hidden />
                  <span>{w("comoFunciona.paso3Enlace")}</span>
                  <b>{w("comoFunciona.paso3Copiar")}</b>
                </div>
                <div className="share" style={{ marginTop: 12 }}>
                  <span><i className="i i-heart" aria-hidden />{w("comoFunciona.paso3Instagram")}</span>
                  <span><i className="i i-message-circle" aria-hidden />{w("comoFunciona.paso3Whatsapp")}</span>
                  <span><i className="i i-search" aria-hidden />{w("comoFunciona.paso3Google")}</span>
                  <span><i className="i i-globe" aria-hidden />{w("comoFunciona.paso3Web")}</span>
                  <span><i className="i i-smartphone" aria-hidden />{w("comoFunciona.paso3App")}</span>
                </div>
                <div className="toast" style={{ marginTop: 14, whiteSpace: "normal" }}>
                  <span className="ib"><i className="i i-calendar-check" aria-hidden /></span>
                  <div>
                    <b>{w("comoFunciona.paso3Aviso")}</b>
                    {w("comoFunciona.paso3AvisoDetalle")}
                  </div>
                  <span className="tag" style={{ marginLeft: "auto" }}>{w("comoFunciona.paso3Confirmada")}</span>
                </div>
              </div>
            </article>

            {/* Paso 4 · automatiza */}
            <article className="tun__panel" style={estilo({ "--k": 3 })}>
              <div className="tun__txt">
                <span className="tun__ic" aria-hidden><i className="i i-zap" aria-hidden /></span>
                <h2 className="h-lg">{w("comoFunciona.paso4Titulo")}</h2>
                <p>{w("comoFunciona.paso4Texto")}</p>
              </div>
              <div className="frag tun__ui" aria-hidden>
                <ul className="autos">
                  <li>
                    <span><i className="i i-check" aria-hidden />{w("comoFunciona.paso4Auto1")}</span>
                    <i className="tg is-on" />
                  </li>
                  <li>
                    <span><i className="i i-bell" aria-hidden />{w("comoFunciona.paso4Auto2")}</span>
                    <i className="tg is-on" />
                  </li>
                  <li>
                    <span><i className="i i-refresh" aria-hidden />{w("comoFunciona.paso4Auto3")}</span>
                    <i className="tg is-on" />
                  </li>
                  <li>
                    <span>
                      <i className="i i-sparkles" aria-hidden />
                      {w("comoFunciona.paso4Auto4")} <em className="tag tag--lime">{w("comun.nav.nuevo")}</em>
                    </span>
                    <i className="tg is-on" />
                  </li>
                </ul>
              </div>
            </article>

            {/* Paso 5 · mide y crece */}
            <article className="tun__panel" style={estilo({ "--k": 4 })}>
              <div className="tun__txt">
                <span className="tun__ic" aria-hidden><i className="i i-trending-up" aria-hidden /></span>
                <h2 className="h-lg">{w("comoFunciona.paso5Titulo")}</h2>
                <p>{w("comoFunciona.paso5Texto")}</p>
              </div>
              <div className="frag tun__ui" aria-hidden>
                <div className="frag__head">
                  <small>{w("comoFunciona.paso5Ocupacion")}</small>
                  <b>{w("comoFunciona.paso5OcupacionValor")}</b>
                </div>
                <div className="meter-bar" style={estilo({ "--v": "78%" })}><span /></div>
                <div className="frag__head" style={{ marginTop: 18 }}>
                  <small>{w("comoFunciona.paso5Repiten")}</small>
                  <b>{w("comoFunciona.paso5RepitenValor")}</b>
                </div>
                <div className="meter-bar" style={estilo({ "--v": "64%" })}><span /></div>
                <div className="bars" style={{ height: 90, marginTop: 18 }}>
                  {[40, 55, 50, 72, 66, 84, 100].map((h, i) => (
                    <i key={h + "-" + i} style={estilo({ "--h": `${h}%`, "--i": i })} />
                  ))}
                </div>
              </div>
            </article>
          </div>

          <ol className="tun__rail" aria-hidden>
            <li data-k="0" className="is-on">{w("comoFunciona.railCrea")}</li>
            <li data-k="1">{w("comoFunciona.railConfigura")}</li>
            <li data-k="2">{w("comoFunciona.railComparte")}</li>
            <li data-k="3">{w("comoFunciona.railAutomatiza")}</li>
            <li data-k="4">{w("comoFunciona.railCrece")}</li>
          </ol>
        </div>
      </section>

      {/* ── Para quién: pestañas ──────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--center">
            <h2 className="h-xl" data-split>
              {w("comoFunciona.quienTitulo")} <span className="mint">{w("comoFunciona.quienTituloMint")}</span>
            </h2>
          </div>
          <div className="who" data-tabs data-reveal>
            <div className="who__tabs">
              <div className="tabs__list" role="tablist" aria-label={w("comoFunciona.quienAria")}>
                <button role="tab" id="t-cli" aria-controls="p-cli" aria-selected="true" type="button">
                  {w("comoFunciona.quienTabClientes")}
                </button>
                <button role="tab" id="t-eq" aria-controls="p-eq" aria-selected="false" type="button">
                  {w("comoFunciona.quienTabEquipo")}
                </button>
                <button role="tab" id="t-tu" aria-controls="p-tu" aria-selected="false" type="button">
                  {w("comoFunciona.quienTabTu")}
                </button>
                <span className="tabs__ind" aria-hidden />
              </div>
            </div>

            <div className="who__panel" role="tabpanel" id="p-cli" aria-labelledby="t-cli">
              <ol className="who__grid who__grid--5">
                {CLIENTES.map(({ clave, icono }) => (
                  <li key={clave}>
                    <i className={`i ${icono}`} aria-hidden />
                    <h3 className="h-sm">{w(`comoFunciona.${clave}Titulo`)}</h3>
                    <p>{w(`comoFunciona.${clave}Texto`)}</p>
                  </li>
                ))}
              </ol>
              <p className="who__more t-app">
                <Link className="link-arrow" href={WEB.app}>
                  {w("comoFunciona.cliMas")} <i className="i i-arrow-right" aria-hidden />
                </Link>
              </p>
            </div>

            <div className="who__panel" role="tabpanel" id="p-eq" aria-labelledby="t-eq" hidden>
              <ul className="who__grid">
                {EQUIPO.map(({ clave, icono }) => (
                  <li key={clave}>
                    <i className={`i ${icono}`} aria-hidden />
                    <h3 className="h-sm">{w(`comoFunciona.${clave}Titulo`)}</h3>
                    <p>{w(`comoFunciona.${clave}Texto`)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="who__panel" role="tabpanel" id="p-tu" aria-labelledby="t-tu" hidden>
              <ul className="who__grid">
                {TU.map(({ clave, icono }) => (
                  <li key={clave}>
                    <i className={`i ${icono}`} aria-hidden />
                    <h3 className="h-sm">{w(`comoFunciona.${clave}Titulo`)}</h3>
                    <p>{w(`comoFunciona.${clave}Texto`)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Un día con Bookmy: galería horizontal ─────────────── */}
      <section className="hs day" data-scene="hscroll" aria-labelledby="day-title">
        <div className="hs__stick">
          <div className="day__sky" aria-hidden>
            <span className="day__dawn" />
            <span className="day__noon" />
            <span className="day__night" />
          </div>
          <div className="wrap hs__head">
            <h2 className="h-xl" id="day-title" data-split>{w("comoFunciona.diaTitulo")}</h2>
          </div>
          <ol className="hs__track">
            {HORAS.map((n) => (
              <li className="hs__card day__card" key={n}>
                <time>{w(`comoFunciona.dia${n}Hora`)}</time>
                <h3 className="h-md">{w(`comoFunciona.dia${n}Titulo`)}</h3>
                <p>{w(`comoFunciona.dia${n}Texto`)}</p>
              </li>
            ))}
            <li className="hs__card day__card day__card--end">
              <time>{w("comoFunciona.dia8Hora")}</time>
              <h3 className="h-md">{w("comoFunciona.dia8Titulo")}</h3>
              <p>{w("comoFunciona.dia8Texto")}</p>
              <Link className="btn btn--primary" href={WEB.crearCuenta}>
                {textoCta} <i className="i i-arrow-right" aria-hidden />
              </Link>
            </li>
          </ol>
          <div className="hs__bar" aria-hidden><span /></div>
        </div>
      </section>

      {/* ── Cambiar es fácil ──────────────────────────────────── */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head sec-head--split">
            <h2 className="h-lg" data-split>{w("comoFunciona.cambiarTitulo")}</h2>
            <p className="lead" data-reveal>{w("comoFunciona.cambiarLead")}</p>
          </div>
          <div className="aud">
            <article className="aud__card" data-tilt data-reveal>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-rocket" aria-hidden /></span>
              <h3 className="h-md">{w("comoFunciona.cambiar1Titulo")}</h3>
              <p>{w("comoFunciona.cambiar1Texto")}</p>
            </article>
            <article className="aud__card" data-tilt data-reveal style={estilo({ "--i": 1 })}>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-layers" aria-hidden /></span>
              <h3 className="h-md">{w("comoFunciona.cambiar2Titulo")}</h3>
              <p>{segunOferta("comoFunciona.cambiar2ConPrueba", "comoFunciona.cambiar2SinPrueba")}</p>
            </article>
            <article className="aud__card" data-tilt data-reveal style={estilo({ "--i": 2 })}>
              <span className="glare" aria-hidden />
              <span className="feat__lens"><i className="i i-headphones" aria-hidden /></span>
              <h3 className="h-md">{w("comoFunciona.cambiar3Titulo")}</h3>
              <p>{w("comoFunciona.cambiar3Texto")}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Seguridad ─────────────────────────────────────────── */}
      <section className="sec">
        <div className="wrap trust">
          <div className="trust__head">
            <span className="trust__shield" aria-hidden><i className="i i-shield" aria-hidden /></span>
            <h2 className="h-lg" data-split>{w("comoFunciona.segTitulo")}</h2>
            <p className="lead" data-reveal>{w("comoFunciona.segLead")}</p>
            <Link className="link-arrow" href={WEB.privacidad} data-reveal>
              {w("comoFunciona.segPrivacidad")} <i className="i i-arrow-right" aria-hidden />
            </Link>
          </div>
          <ul className="trust__grid">
            {SEGURIDAD.map(({ clave, icono }, i) => (
              /* El retraso se repite cada tres, igual que en el original:
                 la primera de cada terna no lleva --i. */
              <li key={clave} data-reveal style={i % 3 ? estilo({ "--i": i % 3 }) : undefined}>
                <i className={`i ${icono}`} aria-hidden />
                <h3 className="h-sm">{w(`comoFunciona.${clave}Titulo`)}</h3>
                <p>{w(`comoFunciona.${clave}Texto`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Preguntas ─────────────────────────────────────────── */}
      <section className="sec cx-faq" id="faq">
        <div className="wrap cx-faq__grid">
          <div className="cx-faq__head">
            <h2 className="h-lg" data-split>{w("comoFunciona.faqTitulo")}</h2>
          </div>
          {/* El icono de abrir y cerrar, los id y el aria-expanded los
              pone el motor al montarse, igual que en la web estática. */}
          <div className="faq" data-reveal>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq1Pregunta")}</button>
              <div className="faq__a"><div><p>
                {w("comoFunciona.faq1RespuestaA")}
                <Link href={WEB.appEmpresas}>{w("comoFunciona.faq1Enlace")}</Link>
                {w("comoFunciona.faq1RespuestaB")}
              </p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq2Pregunta")}</button>
              <div className="faq__a"><div><p>{w("comoFunciona.faq2Respuesta")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq3Pregunta")}</button>
              <div className="faq__a"><div><p>{w("comoFunciona.faq3Respuesta")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq4Pregunta")}</button>
              <div className="faq__a"><div><p>{w("comoFunciona.faq4Respuesta")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq5Pregunta")}</button>
              <div className="faq__a"><div><p>{w("comoFunciona.faq5Respuesta")}</p></div></div>
            </div>
            <div className="faq__item">
              <button className="faq__q" type="button">{w("comoFunciona.faq6Pregunta")}</button>
              <div className="faq__a"><div><p>
                {w("comoFunciona.faq6RespuestaA")}
                <Link href={WEB.privacidad}>{w("comoFunciona.faq6Enlace")}</Link>
                {w("comoFunciona.faq6RespuestaB")}
              </p></div></div>
            </div>
          </div>
        </div>
      </section>
    </PaginaWeb>
  );
}
